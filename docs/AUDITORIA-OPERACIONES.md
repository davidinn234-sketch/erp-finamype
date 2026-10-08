# Auditoría de ventas, compras e inventario

## Correcciones

- Las ventas y compras esperan la confirmación de Firestore. El documento, el inventario, el kardex y el asiento contable se guardan en una transacción. Las ventas de contado incluyen el ingreso en caja o banco y la actualización del cliente.
- Si falta inventario, la operación completa se rechaza. El ticket sigue abierto para corregirlo; no se anuncia una venta completada ni se imprime un documento que todavía no se guardó.
- Las operaciones simultáneas leen el inventario y los saldos actuales. Se evita que dos cajas descuenten las mismas existencias o sobrescriban el saldo de la cuenta.
- Los renglones repetidos de una compra acumulan sus unidades y su costo antes de guardar el promedio ponderado. Las cantidades fraccionarias conservan hasta seis decimales.
- Los botones de guardar se desactivan mientras se procesa el envío. El POS protege también el atajo F12 y limpia el ticket al cerrar con Escape una venta completada.
- El POS permite elegir la cuenta que recibe el pago y el asiento utiliza esa cuenta. Los clientes creados automáticamente ya no reciben un NIT ficticio.
- Los formularios de abonos esperan el guardado y permanecen abiertos cuando la operación falla.

## Alcance y pendientes

La verificación usa Firebase emulado; no crea ventas de prueba en la base de producción. Las fórmulas tributarias existentes no se modifican en esta revisión.

La auditoría no certifica todo el ERP. Las anulaciones y eliminaciones de documentos mantienen el flujo anterior y requieren una revisión específica de reversión de caja, abonos e inventario. Los correlativos actuales siguen siendo internos del prototipo; su generación a partir de la cantidad de documentos debe sustituirse antes de usar varias cajas como emisor fiscal. La conexión real de Gemini continúa pendiente de configurar y probar la clave privada.
