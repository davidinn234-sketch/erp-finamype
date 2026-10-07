# Migración de acceso seguro y sincronización con Google AI Studio

Esta rama requiere migración coordinada. No fusionar ni desplegar únicamente `firestore.rules`: el código anterior no usa Firebase Authentication y perdería acceso. No se ejecutó ninguna migración ni se cambió el proyecto Firebase real al preparar esta rama.

## Cambios

- Firebase Authentication (correo/contraseña) valida el acceso. Un ID escrito en localStorage ya no inicia sesión. Se elimina el acceso especial por nombre y las contraseñas por defecto.
- Los perfiles públicos no guardan contraseñas. El servidor verifica un ID token y el perfil vigente antes de crear/modificar/revocar cuentas y antes de llamar a Gemini. Los gestores solo administran usuarios de su empresa y no pueden otorgar el rol maestro.
- Firestore deniega accesos anónimos y entre empresas; las consultas se filtran por empresa o dueño. Las finanzas personales son privadas incluso frente al administrador maestro. Una nueva identidad/empresa/rol remonta el contexto para descartar los datos anteriores en memoria.
- La creación de empresa, sucursal y perfil se confirma con un batch; la cuenta Auth se elimina si ese batch falla. Las contraseñas iniciales deben tener 12 caracteres como mínimo. Los formularios no afirman éxito antes de recibir respuesta del servidor.
- Las rutas de IA requieren sesión y tienen un límite por usuario de 20 solicitudes/minuto por instancia. Los formularios de cuentas tienen límites independientes. No se devuelven datos ficticios al fallar el proveedor ni en el navegador.
- El copiloto muestra propuestas para ventas/compras/clientes: ya no inventa un costo, selecciona el primer producto ni escribe la operación automáticamente. El registro se completa en los módulos correspondientes.
- Los gráficos nuevos y el catálogo contable se guardan por empresa; presupuestos/metas personales usan `personal_finance_meta/{uid}`, no el antiguo documento global.
- Se retiene el cache empresarial antiguo solo para recuperación manual y se eliminan sus contraseñas. No se usa para autenticar ni se mezcla automáticamente con otra cuenta. Las opciones de cargar datos demo dejan de sobrescribir el entorno real.

## Antes del cambio

1. Exportar Firestore y exportar el JSON del ERP en **cada dispositivo** con trabajo sin sincronizar. Guardarlos fuera del repositorio. El código antiguo no sincronizaba todos los asientos y personalizaciones; hay que recuperar esos datos por empresa desde las copias antes de dar la migración por finalizada.
2. Probar primero en un proyecto Firebase de pruebas, con una copia autorizada y minimizada de los datos. Revisar la vinculación proyecto/base del cliente y las variables del servidor: deben apuntar al mismo destino. `firebase.json` apunta por defecto a la base nombrada del proyecto actual, no a `(default)`.
3. Habilitar Email/Password en Firebase Authentication; configurar los dominios autorizados del entorno de AI Studio y de la app desplegada.
4. Configurar **solo en el servidor** `FIREBASE_PROJECT_ID` y `FIREBASE_DATABASE_ID`. En Cloud Run usar una identidad de servicio con permisos para Firebase Authentication y Firestore (ADC). Para ejecución administrativa local usar `GOOGLE_APPLICATION_CREDENTIALS` apuntando a un archivo fuera del repositorio. Nunca insertar claves de servicio en React ni variables `VITE_*`.
5. Conservar `GEMINI_API_KEY` en secretos de AI Studio. `GEMINI_MODEL` permite seleccionar un modelo habilitado en el proyecto. No se hizo una llamada real a Gemini en las pruebas.

## Migrar las cuentas

El UID de Firebase Authentication debe ser exactamente el ID histórico del perfil ERP. Así no se rompen las referencias de `userId` existentes. No se vinculan automáticamente cuentas con un correo ya registrado bajo otro UID.

Crear fuera del repositorio un manifiesto revisado por el propietario:

```json
{
  "users": [
    { "id": "ID_HISTORICO_MAESTRO", "email": "propietario@ejemplo.com", "role": "admin_maestro" },
    { "id": "ID_HISTORICO_GERENTE", "email": "gerente@ejemplo.com", "role": "gerente", "companyId": "ID_EMPRESA" }
  ],
  "personalMetaOwnerId": "ID_HISTORICO_GERENTE"
}
```

No copiar ciegamente roles del almacenamiento antiguo: las reglas previas eran públicas. Verificar identidades y empresas manualmente. Incluir todas las cuentas aprobadas. `personalMetaOwnerId` es opcional: solo usarlo si se puede atribuir el antiguo documento de metas a una persona; el resto se recupera manualmente de las copias.

```sh
npm run migrate:auth -- /ruta/privada/manifest.json
```

Ese comando solo prevalida. Durante una ventana de mantenimiento y después de respaldar/cerrar los clientes antiguos:

```sh
npm run migrate:auth -- /ruta/privada/manifest.json --apply
```

La aplicación del manifiesto crea las cuentas que faltan, asigna una contraseña aleatoria nueva a todas las aprobadas, revoca sesiones anteriores, elimina contraseñas en texto plano y **bloquea los perfiles omitidos**. No envía correos. Cada usuario solicita el restablecimiento desde el nuevo login. Verificar que el administrador maestro pueda acceder antes de finalizar mantenimiento. Si el proceso se interrumpe, revisar los registros y volver a ejecutarlo; reejecutarlo vuelve a cambiar las contraseñas.

El autorregistro queda deshabilitado por defecto. Solo habilitar `ALLOW_SELF_REGISTRATION=true` si se desea: las cuentas públicas nuevas nunca pueden elegir una empresa existente, un rol maestro ni activar una suscripción/DTE.

## Desplegar e incorporar a AI Studio

1. Revisar el pull request y realizar la migración/pruebas en el entorno de pruebas.
2. Fusionar a la rama que sigue AI Studio cuando la migración esté preparada.
3. En AI Studio abrir **Configuración → GitHub** y traer los cambios (`pull`). Antes, guardar/sincronizar cualquier edición pendiente y resolver conflictos sin sobrescribir el trabajo existente.
4. En la ventana de mantenimiento, migrar cuentas, aplicar las nuevas reglas a la base **nombrada** correcta y desplegar el cliente/servidor actualizado como un mismo cambio coordinado. No reabrir a usuarios con una mezcla del código viejo y las reglas nuevas.
5. Entrar como maestro y como usuarios de dos empresas; comprobar ventas, consultas, alta/revocación de cuentas, presupuestos y rechazos de acceso cruzado. Recuperar los registros locales pendientes usando una importación revisada por empresa.

Comando de reglas, **solo cuando el operador haya verificado proyecto/base y completado la preparación**:

```sh
npx firebase deploy --only firestore:rules --project ID_PROYECTO_VERIFICADO
```

La rama y el PR no despliegan reglas ni actualizan automáticamente el proyecto abierto en AI Studio. La documentación oficial describe la sincronización bidireccional en https://ai.google.dev/gemini-api/docs/aistudio-build-mode?hl=es.

## Verificación reproducible

```sh
bun install --frozen-lockfile
npm run lint
npm run build
npm run test:security
```

Las pruebas usan únicamente los emuladores Auth/Firestore (`demo-erp-security`), con Java 17+ y puertos locales 8080/9099 libres. Comprueban accesos anónimos, separación por empresa, elevación de privilegios, perfiles deshabilitados, datos personales, creación segura de cuentas, límite de solicitudes y fallos de IA sin resultados fabricados. No verifican el despliegue real, correo real ni Gemini.

## Límites y pendientes

- Este cambio no resuelve la concurrencia de inventario/caja de todas las operaciones: ventas y compras todavía requieren una migración adicional a transacciones atómicas y validación de saldos. No confundir las pruebas de acceso con una auditoría contable completa.
- Los permisos de lectura operativa son por empresa; no hay todavía segregación detallada por sucursal ni por campo. Las escrituras tienen controles por rol, pero las casillas de permisos personalizadas de la interfaz no constituyen una política completa en servidor.
- El límite de IA es en memoria por instancia. Para un despliegue con múltiples instancias debe sustituirse/complementarse con una cuota compartida o protección de gateway.
- Actualizar Auth y el perfil Firestore no es una transacción entre servicios: una interrupción durante edición/revocación puede requerir reintentar y revisar consistencia. El servidor no anuncia éxito si una etapa falla.
- La compilación advierte del tamaño del paquete del frontend; se mantiene como trabajo de rendimiento posterior.
- No volver a reglas públicas para resolver un error de migración. Mantener mantenimiento y restaurar/verificar desde el respaldo sin reabrir los accesos inseguros.
