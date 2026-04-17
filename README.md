# BlackPearl Dashboard (BP16B) — Frontend

Race-engineer dashboard for the BP16B Formula Student Electric car. Live telemetry, session recording, and history playback — inspired by professional pitwall software, built as an educational reference for student teams.

<p align="center">
  <a href="doc/data-flow.md">Data Flow</a> ·
  <a href="doc/component-patterns.md">Component Patterns</a> ·
  <a href="doc/theming.md">Theming</a> ·
  <a href="doc/sensor-naming.md">Sensor Naming</a> ·
  <a href="../BlackPearl_WS">Backend repo</a>
</p>

![Pitwall](/images/Pitwallsnippet.png)

---

## Tech Stack

- **React 18** with Vite
- **Tailwind CSS v4** (CSS-based theme with `@theme` directive, no `tailwind.config.js`)
- **React Router v6** — SPA with client-side routing
- **Chart.js / react-chartjs-2** — all time-series visualisation
- **date-fns** — timestamp formatting
- **lucide-react** — icon library

## Features

| Live view | Recording | History |
|---|---|---|
| Pitwall overview with gauges, trend, faults | Start / stop / rename sessions from any page | Browsable session list with search |
| Dynamics, Powertrain, Battery pages | Backend handles all DB writes | Time-scrubber playback |
| 10 fps throttled updates, stale detection | [WebSocket](doc/data-flow.md#live-telemetry-websocket) auto-reconnect | Export to JSON or CSV |

## Project Structure

```
BP_dashboard_FE/
├── index.html          # SPA shell — loads from src/main.jsx
├── vite.config.js      # Config Vite build to be for development or production
├── .env.local          # Local env variables (production uses container env)
├── doc/                # Learn more about project
└── src/
    ├── main.jsx        # Entry point
    ├── App.jsx         # Router + top-level context providers
    ├── index.css       # Tailwind imports + CSS custom properties
    ├── pages/          # One component per route
    ├── components/     # Shared and page-specific UI components
    ├── hooks/          # Custom React hooks (WebSocket stream, etc.)
    ├── context/        # React context providers (Session recorder, Theme)
    ├── constants/      # Static config (data group map, sensor display names)
    └── utils/          # API helpers, WebSocket client
```

### `vite.config.js`

Reads `VITE_BACKEND` at dev-server start and sets proxy targets accordingly:

| `VITE_BACKEND` | `/api` target | `/ws` target |
|---|---|---|
| `local` | `http://localhost:3000` | `ws://localhost:3000` |
| _(anything else)_ | `https://blackpearl-ws-8z9a.onrender.com` | `wss://blackpearl-ws-8z9a.onrender.com` |

No code changes needed to switch between local and production — only `.env.local`.

## Routing

All routes are defined in `App.jsx` inside `<MainLayout>`, which provides the persistent sidebar.

| Route | Page | Description |
|-------|------|-------------|
| `/`           | `PitwallPage`    | Race-engineer overview with live gauges |
| `/dynamics`   | `DynamicsPage`   | Suspension, wheel RPM, GPS, IMU data |
| `/powertrain` | `PowertrainPage` | Motor controller, inverter, electrical sensors |
| `/battery`    | `BatteryPage`    | BMS cell voltages, temperatures, faults by BMU |
| `/history`    | `HistoryPage`    | Session list → playback with time scrubber + export |
| `/settings`   | `SettingsPage`   | Render interval, buffer size, dev-only server knobs |
| `*`           | Redirect to `/`  | Catch-all |

## Quick Start

Requires NodeJS 18+.

```bash
npm install         # install all modules
npm run dev         # serves on http://localhost:5173
```

By default the dev server proxies to the deployed backend. To run everything locally, create `.env.local` with `VITE_BACKEND=local` and start the backend server on port 3000. (Websocket TCP Port)

For production I recommend using the free deployment service such as [netlify](https://www.netlify.com/)
For manual deployment I suggest read this document
[Link](Link)

## Learn More
- [Data Flow](/docs/data-flow.md) — WebSocket stream, session recording, history REST
- [Component Patterns](/docs/component-patterns.md) — `DataGroupPanel`, Pitwall widgets, Battery layout
- [Theming](/docs/theming.md) — Tailwind v4 CSS variables and dark/light mode

---

## Future Work

### Role-based Settings (User vs Developer)

The [SettingsPage.jsx](src/pages/SettingsPage.jsx) is split into two tiers; only the first is wired up today:

| Tier | Section | Settings | Storage | Status |
|---|---|---|---|---|
| **User** | Display | `Render Interval`, `Buffer Size` | Browser `localStorage` via `TelemetryConfigContext` | Implemented |
| **Developer** | Developer Settings | `Publish Rate` (server broadcast interval) | Backend `.env` / DB | Read-only placeholder |

The developer tier is currently disabled (greyed out). Planned:

1. Add a login/auth flow so the frontend can identify a user as "developer".
2. Fetch current server config from a new backend endpoint (e.g. `GET /api/config`).
3. Gate the editable inputs behind the dev role; unauthenticated users see the values read-only.
4. Persist changes to the DB (not just `.env`) so they sync across all dashboard tabs and machines.

See TODO markers at [SettingsPage.jsx:97-99](src/pages/SettingsPage.jsx#L97-L99).
