# Control de Asistencia: Frontend

Aplicación web (PWA) para que los empleados marquen su ingreso y salida desde el celular, y para que los supervisores vean la asistencia en vivo desde el escritorio.

**Stack:** React 19 · Vite 8 · TypeScript · Tailwind CSS 4 · TanStack Query 5 · React Router 7 · socket.io-client · `vite-plugin-pwa`

> Necesita el backend, que vive en su propio repositorio, **asistencia-backend**. Levántalo primero.

## Requisitos

- Node.js 20 o superior (probado con 22)
- El backend corriendo (por defecto en http://localhost:3000)

## Puesta en marcha

```bash
npm install
cp .env.example .env     # VITE_API_URL=http://localhost:3000
npm run dev              # http://localhost:5173
```

- **Base con el seed:** las credenciales de prueba están en el README del backend, por ejemplo `admin@empresa.com` / `Admin123*`.
- **Base vacía:** la pantalla de login muestra **"Configuración inicial"** para crear el primer administrador.

> La sesión se guarda en `localStorage`, que comparten todas las pestañas del mismo navegador. Para ver al empleado y al supervisor al mismo tiempo, usa una ventana de incógnito u otro navegador.

### Probar en el celular (misma red)

1. Levanta el frontend con `npm run dev -- --host`.
2. Pon `VITE_API_URL=http://<IP-de-tu-PC>:3000` en `.env`.
3. En el backend, agrega `http://<IP-de-tu-PC>:5173` a `CORS_ORIGINS`.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción en `dist/`, con service worker |
| `npm run preview` | Sirve el build localmente (permite instalar la PWA en `localhost`) |
| `npm run typecheck` | Revisión de tipos |
| `npm run generate-pwa-assets` | Regenera los íconos a partir de `public/icon.svg` |

## Variables de entorno

| Variable | Uso |
|---|---|
| `VITE_API_URL` | URL pública del backend (REST y WebSocket). **Se incrusta al hacer el build**: si cambia, hay que volver a construir |

## Funcionalidades

### Empleado (vista pensada para el celular)
- **Marcar:** un botón grande que alterna entre "Marcar ingreso" y "Marcar salida". Muestra el estado actual (Dentro, Fuera o Sin marcar), la última marcación, las horas de hoy (que avanzan solas mientras la jornada está abierta) y avisos de atraso.
- **Historial:** se navega por mes, con el total de horas, los días trabajados, los atrasos y el detalle diario. También marca las jornadas en curso y las que quedaron abiertas.
- **Solicitudes:** desde cualquier marcación se puede pedir una justificación (motivo en texto). Cuando el supervisor la aprueba o la rechaza, el empleado ve un aviso al instante.

### Administrador / supervisor (vista de escritorio)
- **Dashboard en vivo:** contadores, tabla de estado con atraso y "No ha llegado", y un panel de actividad que se actualiza por WebSocket.
- **Empleados:** crear, editar y activar o desactivar. Desactivar a un empleado corta su sesión y su conexión en vivo.
- **Turnos:** hora de entrada, hora de salida y minutos de tolerancia.
- **Justificaciones:** bandeja por estado. Se aprueba o se rechaza con una nota opcional.
- **Reportes:** rango de fechas (con atajos), filtro por empleado, totales, detalle por día y **exportación a Excel** con 3 hojas: Resumen, Detalle por día y Marcaciones.

| Permiso | ADMIN | SUPERVISOR | EMPLOYEE |
|---|:-:|:-:|:-:|
| Marcar y ver lo propio | — | — | ✔ |
| Dashboard, reportes y bandeja de justificaciones | ✔ | ✔ | — |
| Ver empleados y turnos | ✔ | ✔ | — |
| Crear y editar empleados y turnos | ✔ | — | — |

## Cómo se conecta con el backend

- **HTTP** para todas las acciones (login, marcar, aprobar…), con el token JWT en `Authorization: Bearer`.
- **Socket.IO** con el mismo token para recibir avisos en vivo: `attendance:marked`, `justification:created` y `justification:reviewed`. Los avisos solo invalidan las consultas de TanStack Query; al reconectar se vuelve a pedir todo al servidor, porque la base de datos es la fuente de verdad.

## Estructura

```
src/
  lib/             cliente API, utilidades de zona horaria (America/Guayaquil), tipos, QueryClient
  auth/            contexto de sesión y rutas protegidas por rol
  realtime/        proveedor de Socket.IO
  components/      UI accesible (modal con <dialog>, avisos, badges)
  hooks/           consultas y mutaciones (empleado y admin)
  pages/employee/  Marcar · Historial · Solicitudes   (pensado para el celular)
  pages/admin/     Dashboard · Empleados · Turnos · Justificaciones · Reportes · Usuarios   (escritorio)
  pages/InitialSetup.tsx   formulario para crear el primer admin
public/            íconos de la PWA
Dockerfile         build de Vite + nginx para producción
nginx.conf.template  sirve la SPA en el PORT que asigne la plataforma
railway.json       configuración de despliegue en Railway
```

## Despliegue

Ver la guía en el repositorio del backend: `docs/DEPLOY_RAILWAY.md`. En resumen:
- En Railway, crea un servicio desde este repositorio.
- Define `VITE_API_URL=https://<dominio-del-backend>`.
- Genera un dominio público.
