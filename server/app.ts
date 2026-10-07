import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { getAdminApp } from './firebaseAdmin.js';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { userAccessRouter } from './userAccess.js';

dotenv.config();

const app = express();
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

app.use(express.json({ limit: '10mb' }));
app.use('/api/admin/users', userAccessRouter);

// Lazy initializer for Gemini client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Fina Pyme', timestamp: new Date().toISOString() });
});

// All AI routes require a verified Firebase identity and an active profile.
app.use('/api/ai', async (req, res, next) => {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) { res.status(401).json({ error: 'Inicia sesión para usar el asistente.' }); return; }
  try {
    const adminApp = getAdminApp();
    const identity = await getAuth(adminApp).verifyIdToken(token);
    const databaseId = process.env.FIRESTORE_DATABASE_ID || 'ai-studio-nexuserpsalvador-619c5a84-1f5d-4833-aee7-65b2a99f4a3b';
    const profile = await getFirestore(adminApp, databaseId).doc('users/' + identity.uid).get();
    if (!profile.exists) { res.status(403).json({ error: 'Tu acceso fue revocado o falta migrar el perfil.' }); return; }
    next();
  } catch (error) { res.status(401).json({ error: 'No se pudo verificar tu sesión de Firebase.' }); }
});

// AI Chat Endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, context, chatHistory } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'El mensaje es requerido.' });
    }

    const ai = getAIClient();
    const systemInstruction = `Eres "SivarAI", el Copiloto Financiero, Tributario y Estratégico de SivarFlow ERP para microempresas, startups y emprendedores en El Salvador.
Conoces a profundidad la normativa de El Salvador:
- Ley de Impuesto a la Transferencia de Bienes Muebles y a la Prestación de Servicios (IVA 13%), Retención de IVA (1%), Percepción (1%) y Gran Contribuyente.
- Código Tributario y de Trabajo de El Salvador: ISSS (Laboral 3% con tope $30, Patronal 7.5% con tope $75), AFP (Laboral 7.25%, Patronal 8.75%), INSAFORP (1% empresas >=10 empleados), Retención de Renta del Ministerio de Hacienda (Tablas mensuales y quincenales oficiales, Sujeto Excluido 10% para servicios profesionales).
- Provisiones laborales: Aguinaldo, Vacaciones (con recargo de ley del 30%), e Indemnización proporcional.
- Finanzas para Startups y PyMEs: Flujo de caja real, punto de equilibrio, optimización de capital de trabajo, márgenes de utilidad y fidelización CRM.

Brinda respuestas directas, empáticas, altamente estructuradas con viñetas claras y recomendaciones cuantitativas y prácticas adaptadas a la realidad de negocios en El Salvador.
Contexto actual del ERP de la empresa:
${context ? JSON.stringify(context, null, 2) : 'No se adjuntó contexto'}`;

    const contents = [];
    if (Array.isArray(chatHistory)) {
      for (const msg of chatHistory) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return res.json({ reply: response.text || 'No se pudo generar una respuesta.' });
  } catch (error: any) {
    console.error('Error in /api/ai/chat:', error);
    return res.status(500).json({
      error: error.message || 'Error al conectar con SivarAI Copilot.',
    });
  }
});

// AI Dynamic Chart Generator Endpoint
app.post('/api/ai/dynamic-chart', async (req, res) => {
  try {
    const { prompt, dataset, companyContext } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'El prompt de análisis es requerido.' });
    }

    const businessData = dataset || companyContext || {};

    const ai = getAIClient();
    const systemInstruction = `Eres un motor experto en Inteligencia Artificial, Business Intelligence y visualización de datos para SivarFlow ERP en El Salvador.
Tu objetivo es analizar la solicitud del usuario (por ejemplo: "ventas mensuales del año 2022", "ventas por departamento", "distribución de clientes por género", "gastos por categoría", "utilidad por trimestre") y los datos de la empresa, y generar un JSON estructurado con la configuración y serie de datos para renderizar un gráfico interactivo.

Debes responder ÚNICAMENTE en JSON con el esquema especificado:
- chartType: Puede ser "bar", "area", "pie", o "line".
- title: Título conciso del gráfico (en español).
- description: Breve descripción analítica de lo que ilustra el gráfico.
- data: Arreglo de objetos con llaves "name" (etiqueta legible en español, ej. 'Enero', 'San Salvador', 'Femenino', 'Q1'), "value" (número principal en dólares o cantidad).
- insights: Arreglo de 2 o 3 viñetas con observaciones clave detectadas en los datos para la toma de decisiones gerenciales.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Solicitud del usuario: "${prompt}"\n\nContexto y datos de la empresa:\n${JSON.stringify(businessData, null, 2)}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chartType: {
              type: Type.STRING,
              description: 'Tipo de gráfico: bar, area, pie, o line',
            },
            title: {
              type: Type.STRING,
              description: 'Título del gráfico',
            },
            description: {
              type: Type.STRING,
              description: 'Explicación analítica del gráfico',
            },
            data: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  value: { type: Type.NUMBER },
                  secondaryValue: { type: Type.NUMBER },
                },
                required: ['name', 'value'],
              },
            },
            insights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['chartType', 'title', 'description', 'data', 'insights'],
        },
      },
    });

    const parsedData = JSON.parse(response.text?.trim() || '{}');
    return res.json(parsedData);
  } catch (error: any) {
    console.error('AI dynamic-chart failed:', error?.message);
    return res.status(503).json({ error: 'El asistente no está disponible. No se registró ninguna operación ni se generaron datos de demostración.' });
  }
});

// Comprehensive AI Copilot & Business Consultant Endpoint
app.post('/api/ai/copilot', async (req, res) => {
  try {
    const { prompt, companyContext } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'El prompt es requerido.' });
    }

    const ai = getAIClient();
    const systemInstruction = `Eres "SivarAI Copilot", el Agente de Inteligencia Artificial y Consultor Empresarial de Élite integrado directamente en SivarFlow ERP (El Salvador).
Tienes facultades completas de AUTOPILOTO OPERATIVO y CONSULTORÍA FINANCIERA ESTRATÉGICA.

Tu misión es clasificar la intención del usuario en una de las siguientes 6 ACCIONES y generar la estructura JSON correspondiente:

1. "REGISTER_SALE": Si el usuario pide registrar una venta, cobrar, emitir factura o DTE.
   - customerName: Nombre del cliente (detectado o "Consumidor Final")
   - customerDuiNit: NIT o DUI detectado o ""
   - items: Arreglo de ítems con { description, quantity, unitPrice }
   - total: Monto total en USD
   - docType: "01" (Factura Consumidor Final) o "03" (Comprobante de Crédito Fiscal CCF)
   - paymentCondition: "contado" o "credito_30"

2. "REGISTER_PURCHASE": Si el usuario pide registrar un gasto, egreso, compra a proveedor o insumos.
   - supplierName: Nombre del proveedor detectado o "Proveedor Varios"
   - documentNumber: Número de factura/factura de compra detectado o correlativo automático
   - docType: "03" (Crédito Fiscal), "14" (Factura Sujeto Excluido) o "05" (Factura de Compra)
   - items: Arreglo de { description, quantity, unitPrice }
   - total: Monto total en USD
   - paymentCondition: "contado" o "credito_30"
   - category: "Materia Prima", "Servicios Básicos", "Papelería & Suministros", "Combustible", "Otros Gastos"

3. "REGISTER_CUSTOMER": Si el usuario pide ingresar o meter un nuevo cliente al sistema.
   - name: Nombre o Razón Social del cliente
   - nit: Número de Identificación Tributaria (NIT / DUI)
   - nrc: Número de Registro de Contribuyente (si aplica, o "")
   - email: Correo electrónico o contacto@ejemplo.com
   - phone: Teléfono (ej. 2222-0000 o 7000-0000)
   - address: Dirección física en El Salvador
   - department: Uno de los 14 departamentos de El Salvador (ej. "San Salvador", "La Libertad", "Santa Ana", "San Miguel")
   - municipality: Municipio de El Salvador
   - customerType: "final" (persona natural) o "contribuyente" (empresa con NRC)

4. "CREATE_CHART": Si el usuario pide crear o visualizar un gráfico nuevo de cualquier métrica.
   - chartType: "bar", "area", "pie" o "line"
   - title: Título del gráfico
   - description: Breve descripción de la visualización
   - data: Arreglo de { name: string, value: number }
   - insights: Arreglo de 2 o 3 observaciones clave

5. "BUSINESS_CONSULTANT": Si el usuario hace una consulta estratégica o de decisión de negocio (por ejemplo: evaluar compras por mayor de materia prima con descuento, nuevas contrataciones, créditos bancarios, expansión de sucursal, etc.).
   - feasibilityScore: Número 0 a 100 de viabilidad financiera de la decisión.
   - riskLevel: "bajo", "moderado" o "alto"
   - verdict: Veredicto ejecutivo (ej. "RECOMENDADO CON RESERVAS", "ALTAMENTE SALUDABLE", "NO RECOMENDADO: RIESGO DE ILIQUIDEZ")
   - liquidityImpact: Análisis del impacto en el efectivo disponible y el runway de meses.
   - workingCapitalAnalysis: Análisis de rotación de inventarios, costo de oportunidad y retorno sobre capital de trabajo.
   - actionableSteps: Arreglo de 3 a 4 pasos o condiciones que el empresario debe negociar o ejecutar.

6. "QUERY_ANSWER": Si el usuario hace una pregunta sobre los datos del negocio (ej. "¿cuánto hemos vendido en efectivo este mes?", "¿cuánto hay en Banco Agrícola?").
   - directAnswer: Respuesta clara y directa con las cifras exactas.
   - breakdown: Detalles adicionales o desglose numérico.

Formato de respuesta: Devuelve ÚNICAMENTE un JSON con:
{
  "actionType": "REGISTER_SALE" | "REGISTER_PURCHASE" | "REGISTER_CUSTOMER" | "CREATE_CHART" | "BUSINESS_CONSULTANT" | "QUERY_ANSWER",
  "replyText": "Respuesta conversacional empática y profesional para el usuario explicando lo que hiciste o aconsejaste",
  "saleData": {...}, // Si actionType es REGISTER_SALE
  "purchaseData": {...}, // Si actionType es REGISTER_PURCHASE
  "customerData": {...}, // Si actionType es REGISTER_CUSTOMER
  "chartData": {...}, // Si actionType es CREATE_CHART
  "consultantData": {...}, // Si actionType es BUSINESS_CONSULTANT
  "queryData": {...} // Si actionType es QUERY_ANSWER
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Solicitud del usuario: "${prompt}"\n\nContexto financiero y operativo actual de la empresa:\n${JSON.stringify(companyContext || {}, null, 2)}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('AI copilot failed:', error?.message);
    return res.status(503).json({ error: 'El asistente no está disponible. No se registró ninguna operación ni se generaron datos de demostración.' });
  }
});

// AI Financial Diagnosis Endpoint
app.post('/api/ai/financial-diagnosis', async (req, res) => {
  try {
    const { financialData } = req.body;
    const ai = getAIClient();

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Genera un diagnóstico financiero y recomendaciones estratégicas para este negocio en El Salvador basado en sus métricas actuales:
${JSON.stringify(financialData, null, 2)}`,
      config: {
        systemInstruction: `Eres un director financiero (CFO) virtual para startups y PyMEs en El Salvador.
Analiza la rentabilidad, liquidez en bancos, obligaciones tributarias con el Ministerio de Hacienda (IVA, Pago a Cuenta, ISSS, AFP), costos fijos y punto de equilibrio.
Devuelve un JSON estructurado con:
- healthScore: Número de 0 a 100 de salud financiera.
- statusLabel: "Saludable", "Precaución" o "Riesgo Crítico".
- summary: Resumen ejecutivo de 2 oraciones.
- keyStrengths: Arreglo de 2 o 3 fortalezas detectadas.
- criticalAlerts: Arreglo de alertas o riesgos (ej: cuentas por cobrar vencidas, poco runway, alto costo de planilla).
- recommendations: Arreglo de acciones concretas priorizadas para mejorar el flujo de caja.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            healthScore: { type: Type.NUMBER },
            statusLabel: { type: Type.STRING },
            summary: { type: Type.STRING },
            keyStrengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            criticalAlerts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['healthScore', 'statusLabel', 'summary', 'keyStrengths', 'criticalAlerts', 'recommendations'],
        },
      },
    });

    const diagnosis = JSON.parse(response.text?.trim() || '{}');
    return res.json(diagnosis);
  } catch (error: any) {
    console.error('Error in /api/ai/financial-diagnosis:', error);
    return res.status(500).json({
      error: error.message || 'Error al generar el diagnóstico financiero.',
    });
  }
});


app.use('/api', (_req, res) => res.status(404).json({ error: 'Esta ruta de la aplicación no existe.' }));
export default app;
