# Publicar Fina Pyme sin programar

Este proyecto ya está conectado a GitHub y Vercel. Los cambios se trabajan en esta misma carpeta y se envían a la rama de producción para activar el despliegue automático. No necesitas exportar ni copiar el proyecto.

## 1. Preparar Vercel antes de enviar el cambio

1. Entra a Vercel y abre el proyecto que está conectado a este repositorio.
2. Entra en **Settings → Environment Variables**.
3. Agrega **FIREBASE_PROJECT_ID** y pega `mi-erp-nube` como valor.
4. Agrega **FIRESTORE_DATABASE_ID** y pega `ai-studio-nexuserpsalvador-619c5a84-1f5d-4833-aee7-65b2a99f4a3b` como valor.
5. Agrega **FIREBASE_SERVICE_ACCOUNT_JSON**. Su valor es el contenido completo del archivo privado de Firebase que descargaste: abre ese archivo con Bloc de notas, selecciona todo, copia y pega únicamente en este campo de Vercel. Selecciona los entornos Production y Preview y guarda. Esa credencial permite que el servidor asigne contraseñas; la dirección de tu archivo en Descargas no funciona dentro de Vercel.
6. Si quieres activar el asistente de inteligencia artificial, agrega tu clave de Gemini en **GEMINI_API_KEY**. Sin esa clave, el asistente informa que no está disponible; el resto de la app funciona.
7. En **Settings → Build and Deployment**, el framework debe ser **Vite**, la carpeta de salida **dist** y el comando de construcción **npm run build**. Si Vercel muestra valores manuales anteriores distintos, quítalos o actualízalos. El archivo `vercel.json` ya incluye esta configuración y las rutas del servidor.
8. Usa **Node.js 22.x** en la configuración del proyecto. El repositorio también indica esta versión.

Nunca pegues el contenido de la credencial privada en GitHub, un chat, una captura de pantalla o un archivo con nombre que comience por `VITE_`. Vercel debe guardarla como variable del servidor. El archivo `.env.example` contiene indicaciones, no la clave real.

## 2. Enviar los cambios con GitHub Desktop

1. Abre GitHub Desktop y selecciona el repositorio `erp-finamype` en **Current repository**.
2. Si no aparece, usa **File → Add local repository** y selecciona `C:\Users\david\repisotoru clone\erp-finamype`.
3. En **Changes**, verás los archivos modificados y nuevos. La carpeta `exports`, `.env`, `.tools` y `.private-backups` están excluidas; no las agregues manualmente.
4. Escribe en **Summary**: `Mejorar contabilidad, gráficos y pronósticos; preparar Vercel`.
5. Pulsa **Commit to…** (el nombre final corresponde a tu rama actual).
6. Pulsa **Push origin**. Esto envía el código a GitHub. Si trabajas en una rama diferente a la rama de producción de Vercel, se generará una vista previa; la publicación principal requiere integrar esa rama.
7. En Vercel, abre **Deployments** y revisa el despliegue nuevo. Si ya habías enviado el código antes de guardar las variables, usa **Redeploy** después de guardarlas.

Esta guía no significa que ya se haya realizado el envío: la compilación y las pruebas locales se realizan aquí; GitHub y Vercel muestran por separado el estado de publicación.

## 3. Ajustar el dominio en Firebase

1. Copia solamente el dominio del sitio publicado, por ejemplo `tu-proyecto.vercel.app`, sin `https://` ni una ruta al final.
2. En Firebase, abre **Authentication → Configuración → Dominios autorizados**.
3. Pulsa **Agregar dominio**, pega el dominio y guarda. Esto permite los flujos de Google y otros enlaces de autenticación en ese sitio.
4. Si utilizas un dominio propio más adelante, agrégalo también.

Las reglas de aislamiento de cuentas ya fueron preparadas y publicadas durante la activación anterior. No necesitas volver a editar reglas manualmente por estos cambios de gráficos y reportes.

## 4. Comprobar la publicación

- Abre `https://TU-DOMINIO/api/health`. Debe aparecer una respuesta que incluya `status: ok` y `app: Fina Pyme`. Si aparece una página HTML o un error 404, las rutas del servidor no están desplegadas correctamente.
- Entra con tu administrador principal. Crea un usuario de prueba con contraseña inicial y comprueba que el usuario pueda entrar. Un correo ficticio con formato válido funciona; no podrá recibir recuperación por correo.
- Abre Evolución financiera y alterna Barras, Líneas y Área. Si no hay movimientos contables en ese período, debe indicar que no hay registros.
- En Contabilidad, selecciona el período. Imprime Flujo de efectivo, descarga Resumen integral y prueba un libro de IVA. Para guardar PDF, en la ventana de impresión elige **Guardar como PDF**.
- Abre Pronósticos. Si faltan tres meses completos con actividad, activa una base manual y verifica que se identifique como escenario manual.

## Qué falta para operaciones fiscales reales

Los anexos 1, 2 y 3 usan el formato F07 v14 investigado en el manual oficial de julio de 2025. Se validan campos y estructura antes de descargar. No se ha efectuado una presentación en el portal de Hacienda ni se ha comprobado la aceptación de un archivo real de tu empresa. Importaciones, sujeto excluido y otros anexos de retenciones necesitan datos adicionales; no se exportan como si fueran compras locales. La emisión y transmisión de DTE y declaraciones sigue fuera de este prototipo.

La contabilidad incluye diario, mayor, comprobación, resultados, balance, efectivo, cambios del patrimonio, catálogo y notas del resumen. No debe presentarse como una certificación NIIF ni una revisión tributaria completa. Los cierres fiscales con bloqueo de períodos y la aplicación de notas de crédito a una factura original necesitan una implementación adicional antes de usar esos procesos como operación real.

Referencias de configuración: [Vite en Vercel](https://vercel.com/docs/frameworks/frontend/vite), [funciones de Node.js](https://vercel.com/docs/functions/runtimes/node-js), [configuración de Vercel](https://vercel.com/docs/project-configuration/vercel-json).
