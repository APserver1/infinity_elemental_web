# Infinity Elemental

Web en español con Vite, React y TypeScript, conectada al servidor InsForge `https://insforge.cineasta.org`.

## Ejecutar

```sh
npm install
npm run dev
```

Abre http://localhost:5173. La configuración local está en `.env.local` (ignorada por Git). Para otra instalación copia `.env.example` y añade la **clave pública anónima**, nunca la API key administrativa.

```sh
npm run build
npm run preview
```

## Funciones

- Inicio, presentación del juego, galería y comunidad, usando capturas reales de `primeras_imagenes`.
- Registro, inicio/cierre de sesión, verificación por código/enlace y recuperación de contraseña.
- Perfil: nickname único sin distinguir mayúsculas, nombre visible y biografía.
- Descargas y publicaciones de versiones, con notas Markdown y archivos por plataforma.
- `/admin`: edición de borradores/publicaciones, imágenes dentro del texto, portada, carga de archivos y gestión del estado de bugs.
- Soporte: reportes asociados al usuario, pasos de reproducción y capturas privadas.

La integración del nickname con Godot queda preparada en los datos; el juego todavía no consume esta API.

## Administración

La cuenta prevista es `a.pvovapaypal@gmail.com`. Los permisos de la web están en `public.ie_admins`, separados de los privilegios de administración de todo InsForge. Después de crear y confirmar la cuenta propietaria, un operador con acceso al backend puede asignarlos:

```sql
INSERT INTO public.ie_admins(user_id)
SELECT id FROM auth.users WHERE lower(email)='a.pvovapaypal@gmail.com'
ON CONFLICT DO NOTHING;
```

No se concede acceso por ser el primer usuario. El registro de un correo sin verificar tampoco concede privilegios automáticamente. Tras asignar permisos, recarga la página o vuelve a iniciar sesión.

Para publicar: abre `/admin`, crea una versión, escribe título, identificador y descripción, redacta las notas, inserta imágenes y adjunta archivos. Guarda como borrador o elige «Publicada». Si una carga falla, la versión queda en borrador; vuelve a editarla y revisa los archivos antes de publicar. Los archivos del juego y las imágenes editoriales están en buckets públicos: no subas contenido confidencial a esos buckets, incluso en borradores.

## Backend y seguridad

Las migraciones de `backend/` documentan las tablas y políticas instaladas. `001_schema.sql` crea perfiles, administradores, versiones, archivos y bugs. `002_storage.sql` restringe cargas de versiones a administradores y capturas a su propietario/equipo. `003_owner.sql` documenta la identificación de la cuenta propietaria verificada; la activación manual anterior permite completar el alta si el servidor no tiene correo configurado.

Las políticas PostgreSQL se aplican en el servidor. Los usuarios no pueden ascender sus permisos, editar perfiles ajenos, publicar versiones ni leer bugs ajenos. Los borradores no aparecen en consultas públicas. Las capturas de bugs requieren autenticación y se descargan usando el SDK.

El servidor **no tiene SMTP configurado** al momento de construir esta web. Registro y login funcionan con la configuración actual (sin verificación obligatoria); recuperación y envío de códigos requieren configurar SMTP en InsForge. Antes de habilitar enlaces de correo, agrega el dominio real y sus rutas `/login` y `/recuperar` a las URL de redirección permitidas en InsForge.

La API key administrativa se usa solo para herramientas de infraestructura mediante `INSFORGE_API_KEY`; no se incluye en el frontend. El MCP está registrado en la configuración local de Codex. `scripts/backend.mjs` también permite llamar sus herramientas desde terminal.

## Publicar la web

Sirve `dist/` mediante HTTPS. Configura el servidor para resolver las rutas del frontend a `index.html` (por ejemplo `try_files $uri $uri/ /index.html;` en Nginx). Ajusta el límite de archivos/proxy en InsForge si necesitas subir builds grandes. La interfaz permite hasta 500 MB por archivo de versión y 10 MB por imagen; los límites reales del servidor también se aplican.

### Límite de carga del servidor

Se aplicó `backend/004_upload_limit.sql` como propietario PostgreSQL: el máximo de archivos del juego es 500 MB tanto en el formulario como en las políticas del bucket. El parser de transporte usa 501 MB de margen porque corta al alcanzar exactamente su límite; se comprobó una carga de 524.288.000 bytes (500 MB). InsForge 2.3.2 limita su API de configuración a 200 MB, por lo que no uses esa API para sobrescribir el valor ampliado. El middleware lee el límite desde la base de datos para cada carga.

El dominio público pasa por Cloudflare, que rechazó una carga de 110 MB con HTTP 413. Los archivos de más de 90 MB se cargan por HTTPS privado mediante `VITE_INSFORGE_UPLOAD_URL=https://homeserver.tailcdf847.ts.net:8443`. Mantén Tailscale conectado en el equipo del administrador. La ruta privada usa el JWT de la sesión y conserva los permisos de InsForge; no expone una clave administrativa. Las URL guardadas para las descargas usan siempre el dominio público, por lo que los jugadores no necesitan Tailscale. El cliente de carga permite hasta 15 minutos para transferencias grandes.

El servicio privado se configuró con `tailscale serve --bg --https=8443 http://127.0.0.1:7130`. Se puede consultar con `tailscale serve status` y desactivar únicamente esta ruta con `tailscale serve --https=8443 off`; la ruta de Nextcloud en el puerto 443 se conserva.

## Validación realizada

Compilación TypeScript y Vite; navegación y galería; revisión visual en escritorio y móvil; registro y login reales; persistencia del perfil; creación, carga, borrador y publicación de una versión temporal; descarga real; reporte con captura y actualización de estado. Pruebas de aislamiento de perfiles/reportes, protección de administración y privacidad de capturas.

`scripts/smoke.mjs` comprueba navegación y captura pantallas con Playwright. Las otras pruebas de integración en `scripts/` usan cuentas temporales en `.backend/` y escriben en el servidor; ejecútalas solo contra una instancia de prueba o con limpieza posterior.

Threads no permitió consultar automáticamente el perfil durante la implementación. Los textos públicos no inventan registros históricos ni versiones del juego; los avances originales se enlazan a @ap.multiverse.
