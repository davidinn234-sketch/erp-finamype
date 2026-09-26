/**
 * Motor Econométrico de Pronósticos Financieros & Series de Tiempo
 * FINAMIPE SV ERP - República de El Salvador
 * 
 * Implementación formal de:
 * 1. Regresión Lineal por Mínimos Cuadrados Ordinarios (OLS - Ordinary Least Squares)
 * 2. Mínimos Cuadrados con Ajuste Estacional Multiplicativo (El Salvador Business Cycle)
 * 3. Modelo Logarítmico (Curva de Maduración y Rendimientos Marginales Decrecientes)
 * 4. Métricas de Bondad de Ajuste: R² (Coeficiente de Determinación), Pendiente, Intercepto y Error Estándar
 */

export interface TimePoint {
  x: number; // Índice temporal (ej. 1, 2, 3...)
  y: number; // Valor observado (ventas, egresos, flujo, etc.)
  label?: string;
  seasonIndex?: number; // 0 para Enero, 11 para Diciembre
}

export interface OLSResult {
  slope: number; // Pendiente (m)
  intercept: number; // Intersección con el eje Y (b)
  rSquared: number; // R² entre 0 y 1
  correlation: number; // Coeficiente de correlación Pearson (r)
  sse: number; // Suma de Errores al Cuadrado
  standardError: number; // Error estándar de la estimación
  equation: string; // Expresión legible: y = mx + b
  project: (x: number) => number; // Función de proyección lineal
}

export interface SeasonalFactor {
  monthIndex: number; // 0..11
  name: string;
  factor: number; // Multiplicador estacional típico en El Salvador
  description: string;
}

// Factores estacionales empíricos basados en el comportamiento comercial y fiscal en El Salvador:
export const EL_SALVADOR_SEASONAL_FACTORS: SeasonalFactor[] = [
  { monthIndex: 0, name: 'Enero', factor: 0.74, description: 'Cuesta de enero y resaca post-navideña' },
  { monthIndex: 1, name: 'Febrero', factor: 0.82, description: 'Temporada escolar y reactivación' },
  { monthIndex: 2, name: 'Marzo', factor: 0.92, description: 'Cierre de Q1 y preparación de Semana Santa' },
  { monthIndex: 3, name: 'Abril', factor: 0.88, description: 'Declaración anual F-11 de Renta al MH' },
  { monthIndex: 4, name: 'Mayo', factor: 1.08, description: 'Pico comercial por Día de las Madres' },
  { monthIndex: 5, name: 'Junio', factor: 1.14, description: 'Cierre de semestre y pago de anticipos F-07' },
  { monthIndex: 6, name: 'Julio', factor: 1.20, description: 'Mes previo a vacaciones agostinas' },
  { monthIndex: 7, name: 'Agosto', factor: 1.32, description: 'Fiestas Patronales Agostinas de San Salvador' },
  { monthIndex: 8, name: 'Septiembre', factor: 1.16, description: 'Fiestas Patrias y arranque de Q4' },
  { monthIndex: 9, name: 'Octubre', factor: 1.24, description: 'Abastecimiento comercial de fin de año' },
  { monthIndex: 10, name: 'Noviembre', factor: 1.46, description: 'Black Friday y apertura temporada navideña' },
  { monthIndex: 11, name: 'Diciembre', factor: 1.68, description: 'Pico anual por Aguinaldos y Fiestas de Navidad' },
];

/**
 * Calcula la regresión lineal por Mínimos Cuadrados Ordinarios (OLS)
 * Minimizando la suma de los residuos al cuadrado: Σ (y_i - (m*x_i + b))²
 */
export function calculateOLS(points: TimePoint[]): OLSResult {
  const n = points.length;
  if (n < 2) {
    const defaultVal = points[0]?.y || 0;
    return {
      slope: 0,
      intercept: defaultVal,
      rSquared: 1,
      correlation: 1,
      sse: 0,
      standardError: 0,
      equation: `y = ${defaultVal.toFixed(2)}`,
      project: () => defaultVal,
    };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i++) {
    const { x, y } = points[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) {
    const avgY = sumY / n;
    return {
      slope: 0,
      intercept: avgY,
      rSquared: 0,
      correlation: 0,
      sse: 0,
      standardError: 0,
      equation: `y = ${avgY.toFixed(2)}`,
      project: () => avgY,
    };
  }

  // Pendiente m e Intersección b
  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Cálculo de R² y SSE
  const meanY = sumY / n;
  let ssTot = 0;
  let ssRes = 0;

  for (let i = 0; i < n; i++) {
    const actual = points[i].y;
    const predicted = slope * points[i].x + intercept;
    ssTot += Math.pow(actual - meanY, 2);
    ssRes += Math.pow(actual - predicted, 2);
  }

  const rSquared = ssTot === 0 ? 1 : Math.max(0, Math.min(1, 1 - ssRes / ssTot));
  const correlation = (slope >= 0 ? 1 : -1) * Math.sqrt(rSquared);
  const standardError = n > 2 ? Math.sqrt(ssRes / (n - 2)) : 0;

  const sign = intercept >= 0 ? '+' : '-';
  const absIntercept = Math.abs(intercept);
  const equation = `y = ${slope.toFixed(2)}x ${sign} ${absIntercept.toFixed(2)}`;

  return {
    slope,
    intercept,
    rSquared,
    correlation,
    sse: ssRes,
    standardError,
    equation,
    project: (x: number) => Math.max(0, slope * x + intercept),
  };
}

/**
 * Pronóstico Desestacionalizado con Mínimos Cuadrados (Recomendado por Economistas):
 * 1. Desestacionaliza la serie: Y_desestacionalizada = Y_observada / Factor_estacional
 * 2. Aplica OLS a la serie desestacionalizada para aislar la tendencia de fondo.
 * 3. Re-estacionaliza las proyecciones: Y_proyectada = Tendencia(t) * Factor_estacional(t)
 */
export function calculateDeseasonalizedOLSForecast(
  points: TimePoint[],
  horizonMonths: number = 6
): {
  trendOLS: OLSResult;
  projectedPoints: Array<{ monthIndex: number; x: number; label: string; trendValue: number; seasonalValue: number }>;
} {
  // Desestacionalizar cada punto
  const deseasonalizedPoints: TimePoint[] = points.map((p) => {
    const monthIdx = p.seasonIndex !== undefined ? p.seasonIndex % 12 : (p.x - 1) % 12;
    const factorObj = EL_SALVADOR_SEASONAL_FACTORS[monthIdx] || { factor: 1 };
    return {
      x: p.x,
      y: p.y / factorObj.factor,
      label: p.label,
      seasonIndex: monthIdx,
    };
  });

  // OLS en la tendencia desestacionalizada
  const trendOLS = calculateOLS(deseasonalizedPoints);

  // Generar proyecciones reestacionalizadas
  const lastX = points.length > 0 ? points[points.length - 1].x : 0;
  const projectedPoints = [];

  for (let k = 1; k <= horizonMonths; k++) {
    const futureX = lastX + k;
    const futureMonthIdx = (points[0]?.seasonIndex !== undefined ? (points[0].seasonIndex + futureX - 1) : futureX - 1) % 12;
    const factorObj = EL_SALVADOR_SEASONAL_FACTORS[futureMonthIdx] || {
      monthIndex: futureMonthIdx,
      name: `Mes ${futureMonthIdx + 1}`,
      factor: 1.0,
      description: 'Tendencia base',
    };

    const trendVal = Math.round(trendOLS.project(futureX));
    const seasonalVal = Math.round(trendVal * factorObj.factor);

    projectedPoints.push({
      monthIndex: futureMonthIdx,
      x: futureX,
      label: factorObj.name,
      trendValue: trendVal,
      seasonalValue: seasonalVal,
    });
  }

  return {
    trendOLS,
    projectedPoints,
  };
}

/**
 * Regresión Logarítmica: y = a + b * ln(x)
 * Adecuada para etapas de maduración de mercado y rendimientos decrecientes
 */
export function calculateLogarithmicRegression(points: TimePoint[]): {
  a: number;
  b: number;
  rSquared: number;
  project: (x: number) => number;
} {
  // Transformación x' = ln(x)
  const transformedPoints: TimePoint[] = points.map((p) => ({
    x: Math.log(Math.max(1, p.x)),
    y: p.y,
  }));

  const ols = calculateOLS(transformedPoints);
  return {
    a: ols.intercept,
    b: ols.slope,
    rSquared: ols.rSquared,
    project: (x: number) => Math.max(0, ols.intercept + ols.slope * Math.log(Math.max(1, x))),
  };
}
