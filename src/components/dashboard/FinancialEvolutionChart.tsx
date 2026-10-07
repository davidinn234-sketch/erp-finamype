import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
export interface EvolutionPoint { label: string; ingresos: number; egresos: number; utilidadNeta: number }
export function FinancialEvolutionChart({ data, type }: { data: EvolutionPoint[]; type: 'bars' | 'lines' | 'area' }) {
  if (!data.some(point => point.ingresos !== 0 || point.egresos !== 0 || point.utilidadNeta !== 0)) return <div className="h-80 flex items-center justify-center text-sm text-slate-500">Sin movimientos registrados en este período.</div>;
  const Chart = type === 'bars' ? BarChart : type === 'lines' ? LineChart : AreaChart;
  const series = [{ key: 'ingresos', name: 'Ingresos', color: '#0f766e' }, { key: 'egresos', name: 'Costos y gastos', color: '#64748b' }, { key: 'utilidadNeta', name: 'Resultado', color: '#059669' }];
  return <div data-testid="financial-evolution" className="w-full min-w-0" style={{ height: 320 }}>
    <ResponsiveContainer key={type} width="100%" height={320} minWidth={0}>
      <Chart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3e8e6" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis width={66} tick={{ fontSize: 11 }} tickFormatter={value => `$${value}`} />
        <Tooltip formatter={value => `$${Number(value).toFixed(2)}`} /><Legend />
        {series.map(series => type === 'bars' ? <Bar key={series.key} dataKey={series.key} name={series.name} fill={series.color} maxBarSize={36} isAnimationActive={false} /> : type === 'lines' ? <Line key={series.key} dataKey={series.key} name={series.name} stroke={series.color} strokeWidth={2} isAnimationActive={false} /> : <Area key={series.key} dataKey={series.key} name={series.name} stroke={series.color} fill={series.color} fillOpacity={0.12} isAnimationActive={false} />)}
      </Chart>
    </ResponsiveContainer>
  </div>;
}
