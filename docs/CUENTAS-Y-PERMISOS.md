# Cuentas y permisos

El dueño de la plataforma es `davidinn234@gmail.com`. El portal maestro exige ese correo autenticado y el permiso privado `platformAdmin` de Firebase. El registro público no otorga ese permiso.

## Crear empresas

- Desde el portal maestro: pulsa **Dar de Alta Nuevo Cliente**, completa el negocio y sus credenciales y guarda. Tu sesión sigue siendo la del dueño de la plataforma.
- Desde el enlace de la aplicación: pulsa **Registrar Cuenta**, elige el servicio y crea la cuenta. Entras como gerente de tu propia empresa, o a tus finanzas personales si elegiste ese servicio.

Cada empresa nueva tiene su propia sucursal y caja con saldo cero. No recibe ventas, compras, planillas, clientes ni inventario de otras empresas. Las finanzas personales se identifican por la cuenta de su titular.

## Crear empleados

El gerente entra a **Gestor de Perfiles & Cajeros**, crea un colaborador y selecciona sus accesos. POS y CRM son permisos independientes. El gerente administra únicamente los perfiles de su empresa; cerrar sesión y entrar como empleado no conserva los permisos del gerente. El rol gerente tiene acceso completo a su empresa.

## Consultar registros

El dueño abre **Usuarios** en el portal maestro. Allí aparecen los perfiles de todas las empresas y de finanzas personales, su fecha y el origen de las cuentas nuevas. Si registra alguien mientras el panel está abierto, aparece un aviso. Los registros siguen en el directorio aunque el dueño estuviera desconectado.

El directorio también consulta las identidades de Firebase Authentication. Una identidad sin documento de perfil aparece como **Sin perfil · acceso no habilitado**. Mostrarla no restablece un acceso que pudo haber sido revocado. Sus credenciales no habilitan un ERP hasta asociar un perfil autorizado.

## Datos del dashboard

Marketing usa ventas registradas y el canal indicado en cada cliente. No inventa gasto en anuncios, contactos comerciales ni porcentajes de crecimiento. Los indicadores que necesitan publicidad registrada muestran **Sin registrar**. El simulador conserva ejemplos editables como escenarios y no registra ventas ni egresos automáticamente.

Las contraseñas se administran en Firebase Authentication y no se guardan en perfiles o en el repositorio. Los cambios de las reglas de Firebase se publican por separado del despliegue de Vercel.
