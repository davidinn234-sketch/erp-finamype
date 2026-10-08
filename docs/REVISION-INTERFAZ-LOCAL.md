# Revisión local de interfaz

Estos cambios están preparados para revisar en localhost. Su publicación en GitHub, Vercel y cualquier configuración de producción necesita la aprobación del propietario.

- Los accesos de la barra superior abren primero Ventas o Compras y muestran su formulario. Los accesos sin permiso no se ofrecen. Las ventanas de registro aparecen por encima del menú y del encabezado.
- En PC, el menú lateral permite alternar entre etiquetas completas y una columna de iconos. Conserva la preferencia del navegador. En móvil mantiene el menú desplegable con sus etiquetas.
- El POS calcula el espacio disponible a partir de la altura real del encabezado. El carrito y el catálogo tienen desplazamiento interno para mantener visible el cobro. En móvil continúa el desplazamiento vertical normal.
- Los dashboards usan acentos azules, turquesas, ámbar y violetas sobre fondos claros. Sus cifras continúan procediendo de los registros de la empresa.
- El asistente distingue falta de configuración, rechazo de clave, cuota agotada y modelo no disponible. No devuelve errores privados del proveedor al navegador. Su mensaje inicial describe propuestas pendientes de revisión, sin afirmar que registró operaciones.

La copia local necesita `GEMINI_API_KEY` en la configuración privada del servidor para generar respuestas reales. La clave no debe pegarse en el chat ni guardarse en Git. El modelo predeterminado es `gemini-3.8-flash`, configurable con `GEMINI_MODEL`; Google indica que el acceso a Gemini 2.5 está limitado a proyectos que ya lo usaban: [documentación oficial](https://ai.google.dev/gemini-api/docs/deprecations/).

Las pruebas de navegador se ejecutan con Firebase emulado y sin clave de Gemini. Verifican los formularios, la navegación, el tamaño del POS y el error de configuración; no sustituyen la prueba real del proveedor cuando se configure la clave privada.
