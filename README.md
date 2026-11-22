# StudioFlow — Frontend

Gestión de producciones audiovisuales: el productor ve qué está pasando, qué va tarde y qué necesita atención. Se conecta al backend de Spring Boot (`C:\Studio_flow`).

## Puesta en marcha

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc + build de producción
npm run lint     # oxlint
```

### Aplicación de escritorio (Electron)

```bash
npm run desktop:dev   # ventana de escritorio sobre `npm run dev` (arráncalo antes)
npm run desktop       # build de producción en una ventana de escritorio
npm run dist          # instalador de Windows en release/StudioFlow Setup x.y.z.exe
```

La versión empaquetada se sirve desde el origen `app://studioflow`, que debe estar en `CORS_ALLOWED_ORIGINS` del backend. La URL del backend que usa el instalador se toma de `.env.production` al compilar.

Configuración en `.env` (ver `.env.example`). El acceso y el registro usan `/auth/login` y `/auth/register` del backend. Con **Explorar la demo**, en la pantalla de acceso, la app funciona sin backend ni cuenta.

## Pantallas

| Vista | Qué resuelve |
| --- | --- |
| **Producciones** | Portafolio con avance y presupuesto |
| **Resumen** | Métricas, llamado de hoy, plan de rodaje y lo que requiere atención |
| **Calendario** | Mes y hoja de llamado del día; arrastrar una escena la reprograma |
| **Escenas** | Tabla ordenable y tablero kanban, con búsqueda y filtros |
| **Reparto** / **Locaciones** | Carga, próximo llamado y escenas por persona y lugar |
| **Presupuesto** | Comprometido frente a total, coste por día y por locación |
| **Conflictos** | Solapamientos de reparto y traslados de menos de 45 min |
| **Mi agenda** | Vista del actor: próximo llamado y escenas |

`Ctrl K` abre la búsqueda global. La app está disponible en español e inglés, y en tema oscuro y claro.

## Permisos

| | Productor | Director | Equipo técnico | Actor |
| --- | :-: | :-: | :-: | :-: |
| Ver plan de rodaje | ✓ | ✓ | ✓ | Solo su agenda |
| Programar, editar y cambiar estado | ✓ | ✓ | | |
| Eliminar escenas y crear producciones | ✓ | | | |
| Presupuesto y conflictos | ✓ | ✓ | | |

La interfaz solo oculta lo que el rol no puede hacer; quien hace cumplir los permisos es el backend.

## Sistema visual

La interfaz es monocroma a propósito: **el color solo significa estado de rodaje** (`READY`, `DELAYED`, `PROBLEM`, `COMPLETED`), y siempre va acompañado de icono y texto. Los tokens están en `src/index.css`. Usa las utilidades semánticas (`bg-surface`, `text-fg-2`, `border-line`…) en lugar de colores directos.

- **Geist** para la interfaz; **Geist Mono** (`tabular`) solo para horas y números de escena.
- Los componentes base están en `src/components/ui`.

## Estructura

```
src/
├── components/
│   ├── ui/           Botones, campos, menús, modales, toasts
│   ├── layout/       Shell, barra lateral, búsqueda, atención
│   ├── scenes/       Stripboard, hoja de llamado, detalle y formulario de escena
│   └── productions/
├── pages/            Login, producciones, agenda y vistas en production/
├── services/         API, adaptación de DTOs (normalize.ts) y datos de demo
├── store/            Estado con Zustand
├── lib/              Rutas, formato, permisos y reglas de conflicto
└── i18n/             Textos en español e inglés
```

## Límites actuales

- **Sin soporte en el backend todavía:** recuperación de contraseña, equipo técnico, vestuario, archivos adjuntos y coordenadas de locaciones (mapa).
