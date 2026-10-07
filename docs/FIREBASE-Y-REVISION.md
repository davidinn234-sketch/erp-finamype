# Fina Pyme: activar las cuentas privadas

## Estado de activación: 7 de octubre de 2026

Se ejecutó la migración en la base nombrada de `mi-erp-nube`, con respaldo local en `.private-backups` (excluido de Git). Se verificaron cinco perfiles migrados, ninguno con contraseña almacenada, y el permiso protegido de administrador para el correo indicado por el propietario. El documento compartido de metas y presupuestos se conservó sin asignarlo a una persona.

Las reglas **ya están publicadas y verificadas** en la base nombrada. Tras otorgar el propietario el rol `roles/firebaserules.admin`, se ejecutó `scripts/deploy-firestore-rules.mjs --apply --backup-dir .private-backups`. El script respaldó las reglas anteriores, validó la compilación y comprobó que el contenido publicado coincide con el archivo local. Se verificó en Firebase real: acceso sin sesión al perfil denegado (403), acceso del administrador a su perfil permitido (200) y acceso del administrador al documento personal compartido anterior denegado (403). No se cambiaron permisos IAM mediante scripts ni se habilitaron nuevas APIs. La aplicación local responde en el puerto 3000 y sirve el nuevo acceso con restablecimiento de contraseña, sin emuladores. El propietario debe establecer su contraseña mediante ese botón para entrar; la prueba técnica no estableció ni solicitó su contraseña.

Los cambios están en el código local; Firebase tiene los perfiles migrados y las reglas publicadas. Sigue pendiente publicar la nueva aplicación si se utilizará fuera de este equipo. La base utilizada es **ai-studio-nexuserpsalvador-619c5a84-1f5d-4833-aee7-65b2a99f4a3b**, dentro de **mi-erp-nube**; no es la base `(default)`.

## Qué cambia

- El administrador principal crea empresas y usuarios con una contraseña inicial que puede copiar al momento de crear el acceso. El registro público también permite que la persona elija su contraseña. Una dirección con formato de correo no necesita tener un buzón para iniciar sesión; la recuperación por email sí requiere poder recibir mensajes.
- El directorio del administrador incluye **Asignar contraseña**. El servidor valida la sesión y el perfil: el administrador principal administra accesos de la plataforma y un gerente solo los de su empresa. Las contraseñas se actualizan en Authentication, sin guardarse en perfiles ni devolverse desde el servidor. El formulario muestra la contraseña recién elegida para entregarla y la elimina de su estado al cerrar.
- Se recuperaron las contraseñas previamente asignadas de tres cuentas migradas que no tenían contraseña configurada en Authentication. Se conservó la cuenta que ya tenía una contraseña configurada. El script de recuperación `scripts/restore-unconfigured-passwords.mjs` verifica el proyecto, la base y los perfiles; preserva las contraseñas ya configuradas y nunca imprime contraseñas. Las contraseñas recuperadas provienen exclusivamente del respaldo privado; Firestore sigue sin almacenarlas. Las cuentas que no tenían una contraseña válida requieren **Asignar contraseña**.
- La ruta de credenciales del servidor está configurada en `.env` (excluido de Git), con la clave privada fuera del proyecto. La aplicación local se reinició en el puerto 3000 con el nuevo endpoint administrativo. Se verificó contra Firebase real que un acceso anónimo reciba 401 y que el administrador autenticado pueda llegar a la validación de contraseña sin modificarla. Las siete pruebas de navegador y API en emuladores incluyen registro con direcciones ficticias, asignación por gerente y por administrador principal, privacidad entre cuentas y rechazo de cambios fuera de la empresa.

- Firebase Authentication verifica el correo y la contraseña. Los perfiles dejan de guardar contraseñas.
- Cada registro personal pertenece al UID de su propietario. Los presupuestos y metas tienen un documento por UID.
- Cada operación empresarial se consulta por `companyId`. Las reglas impiden cambiar ese propietario o acceder a otra empresa.
- El permiso de administrador de la plataforma se concede mediante la propiedad protegida `platformAdmin` de Authentication. Un gerente administra su empresa; no adquiere acceso a toda la plataforma.
- El cambio de cuenta limpia el estado de la aplicación. Los datos antiguos del navegador no se importan automáticamente.
- Bancos, kardex, partidas, asistencia y otros registros ahora se guardan al editarlos. Cargar datos desde Firebase nunca provoca borrados automáticos.
- Los abonos y transferencias se guardan en transacciones; si falla una parte, la operación completa falla.
- Revertir un abono restaura la deuda y el banco juntos. El pago de planilla tampoco puede ejecutarse dos veces.
- Generar una planilla registra sueldos por pagar; pagarla afecta la cuenta elegida. Las provisiones usan los importes de los empleados, sin repartir porcentajes arbitrarios. Los asientos antiguos deben revisarse antes de liquidarlos con el nuevo mecanismo.
- El kiosko consulta un directorio de asistencia sin salarios, datos fiscales o evaluaciones.
- El asistente requiere una sesión verificada. Cuando falla, no devuelve cifras inventadas ni registra operaciones. Las propuestas se revisan en el módulo correspondiente.

## Pasos en Firebase, en este orden

1. Reserva un momento sin personas usando la versión anterior. No deben escribir durante la migración.
2. En Firebase Console → Authentication → Sign-in method, habilita **Correo electrónico/contraseña**. Comprueba también los dominios autorizados para el sitio y para desarrollo local.
3. Configura credenciales administrativas para ejecutar el script de migración. El archivo de credenciales debe permanecer fuera del repositorio y no debe enviarse por chat. En Cloud Run se puede usar la cuenta de servicio con los permisos necesarios. El servidor necesita también estas credenciales para verificar perfiles en los endpoints del asistente.
4. Ejecuta primero `node scripts/migrate-firebase.mjs`. Este modo solo revisa y muestra cantidades; no cambia datos. Si hay correos duplicados, el script se detiene para revisar a quién pertenece cada perfil.
5. Ejecuta la migración con respaldo privado: `node scripts/migrate-firebase.mjs --apply --backup-dir .private-backups --grant-admin --admin-email TU_CORREO_REAL`. El correo debe corresponder a un perfil existente que sea tuyo. La cuenta se crea en Authentication si todavía no existe; no reutiliza las contraseñas inseguras anteriores. El respaldo contiene información privada y debe guardarse con cuidado.
6. Publica **firestore.rules** en la base nombrada indicada arriba. Con Firebase CLI: `firebase deploy --only firestore:rules --project mi-erp-nube`. El archivo `firebase.json` apunta a esa base. No reemplaces accidentalmente las reglas de otra base.
7. Publica o inicia la nueva aplicación y usa **Restablecer contraseña** en el inicio de sesión. Después inicia sesión nuevamente para cargar los permisos de administrador.
8. Comprueba dos cuentas personales y dos empresas antes de permitir el uso real. Revisa los datos recuperados y conserva el respaldo.

Las metas y presupuestos que estaban en el documento compartido `personal_finance_meta/data` se conservan para revisión: no hay una forma fiable de saber a qué persona pertenecían. Los movimientos personales sin propietario reconocible también se conservan sin asignarlos arbitrariamente. Las contraseñas antiguas se eliminan de los perfiles migrados. Las claves DTE que pudieran existir se preservan únicamente en el respaldo; no deben almacenarse en documentos accesibles al navegador.

Si había información que solo estaba guardada en el navegador, hay que recuperarla y verificar su propietario antes de migrarla. Esta versión no carga automáticamente el almacenamiento global anterior. Después de recuperar lo necesario, elimina las claves antiguas `sivarflow_sv_erp_state_v3`, `sivarflow_sv_erp_state_v2`, `contatech_sv_erp_state_v1` y `sivarflow_auth_user` en los navegadores utilizados.

## Pruebas locales

Se usan únicamente el proyecto ficticio `demo-fina-pyme` y los emuladores; no prueban ni alteran el Firebase real. Requieren Java 21 o posterior para Firestore y Chromium de Playwright para el navegador.

- `npm run lint`: revisión de TypeScript.
- `npm run build`: compilación del cliente y servidor.
- `npm run test:rules`: permisos, aislamiento, abonos simultáneos, pagos inválidos, transferencias, reversión de abonos y pago de planilla.
- `npm run test:ui`: cierre de sesión, cambio de cuenta, recarga, registro de cuentas nuevas y protección de la API del asistente.

Para usar los emuladores en desarrollo, configura `VITE_USE_FIREBASE_EMULATORS=true`; el cliente usa el proyecto ficticio y la base local `(default)`. El servidor usa `FIREBASE_PROJECT_ID=demo-fina-pyme`, `FIRESTORE_DATABASE_ID=(default)`, `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099` y `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`. No utilices estas variables al publicar la aplicación real.

## Alcance de esta revisión

Los importes tributarios existentes no se certifican como vigentes. Falta contrastarlos con las fuentes oficiales y casos de ejemplo antes de uso contable real. La transmisión DTE, lectores, impresoras y terminales POS necesitan pruebas independientes; este prototipo no está conectado a Hacienda. El precio y cobro de suscripciones tampoco se activaron.

Las ventas, compras y ediciones generales todavía deben revisarse con casos de negocio completos, especialmente operaciones simultáneas y anulaciones. Sus documentos se guardan, pero no todas esas operaciones múltiples usan una única transacción como los abonos y transferencias. El cambio de catálogo debe mantener las cuentas usadas por los asientos. La migración tiene respaldo y puede volver a ejecutarse; múltiples lotes no equivalen a una transacción global, por lo que se requiere mantener la aplicación anterior cerrada mientras se ejecuta.

Referencias: [autenticación por contraseña](https://firebase.google.com/docs/auth/web/password-auth), [reglas y operaciones atómicas](https://firebase.google.com/docs/firestore/security/rules-conditions), [modelo de Gemini configurable](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash).
