# Cambios de reportes y revisión del ERP

## Gráficos y datos financieros

- El gráfico de evolución vuelve a montar su contenedor al cambiar de Barras a Líneas o Área, mantiene una altura definida y evita animaciones que oculten temporalmente las series.
- Los gráficos vacíos muestran ausencia de registros. Se retiraron cifras de ejemplo y gastos fijos supuestos de los reportes revisados.
- El dashboard corporativo y el histórico financiero muestran partidas asentadas, con categorías del catálogo. El bloque financiero es consolidado de la empresa; no atribuye partidas sin sucursal a una sucursal elegida.
- Los saldos históricos de cuentas por cobrar y pagar se reconstruyen del libro mayor, en vez de mostrar importes inventados.
- Ventas, honorarios, otros ingresos y gastos de planilla generan códigos que corresponden al catálogo. Las partidas automáticas antiguas con códigos incompatibles se interpretan para los reportes sin alterar sus documentos originales y se muestra un aviso.
- La estimación de tesorería a 30, 60 y 90 días cuenta cada vencimiento pendiente una vez; no repite la misma cuenta por cobrar en varios períodos ni agrega ventas o impuestos ficticios.

## Contabilidad comprensible

- Período seleccionable y acceso a resumen, diario, mayor por cuenta, IVA, comprobación, resultados, balance, efectivo, patrimonio y catálogo.
- Las cifras se suman por cuenta exacta y con centavos enteros. El resultado del período se distingue de los saldos acumulados y del dinero cobrado. Una partida de cierre no borra las ventas del estado de resultados.
- El flujo de efectivo separa operación, inversión y financiación; las transferencias internas no generan ingresos ni gastos. Movimientos que mezclan actividades quedan señalados para revisión.
- Imprimir o guardar PDF, descargar CSV para hojas de cálculo y descargar un resumen integral HTML que también se puede imprimir. Incluye identificación del negocio, período, reportes y notas.
- Partidas manuales con cuentas de movimiento, concepto y fecha válidos, sin valores negativos, sin más de dos decimales y con debe y haber iguales y mayores que cero.
- Avisos para cuentas faltantes, partidas descuadradas, correlativos repetidos, balance con diferencias y operaciones sin partida asociada.
- Añadir cuentas y editar sus nombres conservando códigos y grupos de cuentas existentes.

## Libros de IVA y anexos

- Se muestran y se imprimen ventas a contribuyentes, ventas a consumidor final y compras. Las notas de crédito restan en los libros de consulta.
- El resumen preliminar de IVA incluye consumidor final y no presume que la diferencia sea la declaración definitiva.
- Descarga F07 de contribuyentes (20 campos), consumidor final (23 campos) y compras locales (21 campos), separados por punto y coma y sin encabezados. La consulta Excel utiliza otro CSV con títulos legibles.
- Los importes fiscales se muestran antes de retenciones; en consumidor final la venta gravada incluye IVA. Los DTE de consumidor final se agrupan por fecha y clasificación fiscal.
- Un formulario permite completar datos del documento original, identificación, resolución, serie, sello DTE y clasificaciones fiscales. Se bloquea la descarga si faltan datos o se usan documentos no cubiertos por estos anexos.
- El portal de Hacienda se abre para carga manual. No hay envío automático ni aceptación fiscal simulada.

Base investigada: [manual oficial F07 v14 actualizado en julio de 2025](https://transparencia.mh.gob.sv/downloads/pdf/700-DGII-MN-2021-26031.pdf), [cambios a anexos desde enero de 2025](https://www.mh.gob.sv/modificacion-a-los-anexos-de-los-formularios-de-iva-f07-y-pago-a-cuenta-f14-a-partir-del-periodo-tributario-de-enero-2025/). La separación de estados financieros, patrimonio, efectivo y notas se tomó como referencia de [NIIF para PYMES](https://www.ifrs.org/content/dam/ifrs/publications/ifrs-for-smes/english/2025/ifrs-for-smes.pdf?bypass=on); esta implementación no implica cumplimiento completo de esa norma.

## Pronósticos

- Diseño blanco y verde consistente con el dashboard, tarjetas, gráfico y tabla mensual.
- Historial de los últimos 12 meses completos; se requieren al menos tres meses con registros. Los meses sin ventas cuentan como cero en la base reciente.
- Crecimiento, proporción de compras, cobro del mes, pago a proveedores y gastos se muestran como supuestos editables.
- Base manual opcional, identificada como simulación. No se insertan ventas de ejemplo en el historial.
- Horizonte móvil de 3, 6 o 12 meses, sin años fijos. Saldo inicial tomado de las cuentas reales, sin saldo de ejemplo.
- CSV, impresión, PDF y aviso si el escenario deja el efectivo en negativo.
- Las compras se identifican como compras, porque comprar inventario no equivale automáticamente al costo vendido. Se indica qué conceptos no incluye el escenario.

## Preparación de publicación

- Frontend Vite y servidor de accesos/IA separados, con función API y rutas para Vercel.
- Credenciales privadas de Firebase admitidas como variable del servidor en Vercel.
- El servidor compilado queda fuera de `dist`, que es la carpeta pública del sitio.
- Los cambios se envían desde el repositorio existente; secretos, archivos temporales, dependencias instaladas y copias privadas permanecen excluidos de Git.
- El estado de publicación se comprueba en GitHub y Vercel; las pruebas locales por sí solas no confirman que un despliegue externo haya terminado.
