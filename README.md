# BlackPearl Dashboard (BP16B) — Frontend
The educational example of how BP16B Dashboard are built. From user's interview and some reference from race engineer pitwall Inspried by xyz
## Tech Stack

- **React 18** with Vite
- **Tailwind CSS v4** (CSS-based theme with `@theme` directive, no `tailwind.config.js`)
- **React Router v6** -> SPA with client-side routing
- **Chart.js / react-chartjs-2** — all time-series visualisation
- **date-fns** — timestamp formatting
- **lucide-react** — icon library

Snippet shot of the page
![Pitwall.png](/asset/Pitwallsnippet.png)

---

## Project Structure

```
BP_dashboard_FE/
├── index.html          # Main page loads content from src/main.jsx
├── vite.config.js      # Vite build config + dev-server proxy (reads VITE_BACKEND)
├── .env.local          # Local env variable (production use docker env variable)
└── src/
    ├── main.jsx        # Entry point
    ├── App.jsx         # Router + top-level providers
    ├── index.css       # Tailwind imports + CSS custom properties
    ├── pages/          # One component per route
    ├── components/     # Shared and page-specific UI components
    ├── hooks/          # Custom React hooks (WebSocket stream, etc.)
    ├── context/        # React context providers (Session, Theme)
    ├── constants/      # Static config (data group map, sensor display names)
    └── utils/          # API helpers, WebSocket client, data processor
```

### `vite.config.js`

Reads `VITE_BACKEND` at dev-server start and sets proxy targets accordingly:

| `VITE_BACKEND` | `/api` target | `/ws` target |
|---|---|---|
| `local` | `http://localhost:3000` | `ws://localhost:3000` |
| _(anything else)_ | `https://blackpearl-ws-8z9a.onrender.com` | `wss://blackpearl-ws-8z9a.onrender.com` |

No code changes needed to switch between local and production — only `.env.local`.

---

## Routing

All routes are defined in `App.jsx` inside `<MainLayout>`, which provides the persistent sidebar.

| Route | Page Component | Description |
|-------|---------------|-------------|
| `/` | `PitwallPage` | Race engineer overview with live gauges |
| `/dynamics` | `DynamicsPage` | Suspension, wheel RPM, GPS, IMU data |
| `/powertrain` | `PowertrainPage` | Motor controller, inverter, electrical sensors |
| `/battery` | `BatteryPage` | BMS cell voltages, temperatures, faults by BMU |
| `/history` | `HistoryPage` | Session list → playback with time scrubber + export |
| `*` | Redirect to `/` | Catch-all |

The sidebar in `MainLayout.jsx` renders `<NavLink>` for each route with active-state styling.

---

## Data Flow

### Live Telemetry (WebSocket)

```
ESP32 Nodes → BlackPearl WS Backend → WebSocket → Frontend
```

1. **`websocket.js`** creates a WebSocket connection to the backend (`/ws?role=dashboard`).
   - Auto-reconnects on disconnect (2s delay).
   - In dev, Vite proxies `/ws` to the backend. In prod, connects to the deployed URL.

2. **`useTelemetryStream` hook** wraps the socket connection.
   - Buffers incoming messages (max 500 points).
   - Throttles React state updates to ~10fps via `setInterval`.
   - Tracks `wsStatus` (connecting/connected/disconnected) and `isStale` (no data for 10s).
   - Used by: `PitwallPage`, `DynamicsPage`, `PowertrainPage`, `BatteryPage`.

3. **Backend sends pre-normalised data** — each message is a flat object with `group`, `timestamp`, and sensor fields.

### Session Recording

Recording is managed through `SessionContext`, which wraps the REST API:

| Action | UI Trigger | API Call | Endpoint |
|--------|-----------|----------|----------|
| Start recording | "START RECORDING" button in `SessionControl` | `POST /api/session/start` | `{ name }` |
| Stop recording | "STOP RECORDING" button in `SessionControl` | `POST /api/session/stop` | `{ session_id }` |
| Rename session | Name input blur in `SessionControl` | `PATCH /api/session/:id/rename` | `{ name }` |
| Check active | On mount (page refresh) | `GET /api/session/active` | — |

When recording is active, the backend stores incoming telemetry to the database. The frontend only controls start/stop — it does not send data.

### History / Playback

`HistoryPage` uses direct API calls (not context) to:

| Action | UI Trigger | API Call |
|--------|-----------|----------|
| Load session list | Page mount | `GET /api/session/list?limit=100` |
| Load session data | Click a session card | `GET /api/session/:id/data?normalized=true` |
| Delete one session | Trash icon on card | `DELETE /api/session/:id` |
| Delete all sessions | "Delete All" button | `DELETE /api/session/delete-all` |
| Delete unnamed sessions | "Delete Unnamed" button | `DELETE /api/session/delete-unnamed` |
| Delete stats by name | Button on card | `DELETE /api/stat/delete` with `{ session_name }` |
| Delete all stats | "Delete All Stats" button | `DELETE /api/stat/delete-all` |
| Delete unnamed stats | "Delete Unnamed Stats" button | `DELETE /api/stat/delete-unnamed` |

Playback uses a time slider (`PlaybackControls`) that filters the loaded session data by timestamp to simulate time progression. The filtered subset is passed to `DataGroupPanel` components for visualisation.

Export (`ExportControls`) converts session data client-side to JSON or CSV and triggers a browser download.

---

## Component Patterns

### DataGroupPanel

The standard pattern for Dynamics, Powertrain, and History playback views:

```
DataGroupPanel
├── ChartSection   (left)  — time-series chart with topic selector dropdown
└── TableSection   (right) — raw data table with topic filter and time sort
```

`DataGroupPanel` receives a `groups` array (e.g., `['front.mech', 'rear.mech']`) and filters the data stream to only matching groups before passing to its children.

### Pitwall Widgets

`PitwallPage` does not use `DataGroupPanel`. Instead, it extracts the latest values from the stream using `useLatest()` / `useLatestMulti()` helper functions and renders purpose-built widgets:

- `PowerGauge` — SVG arc for kW
- `BarGauge` — horizontal bar (temps, pedal position)
- `StatCard` — text value with unit
- `FaultBar` — safety status strip
- `TrendChart` — rolling 60s multi-line chart with preset selector
- `GPSTrack` — scatter plot of GPS coordinates

### Battery Page

Custom layout with BMU selector dropdown. Uses specialised `battery_widget/` components that understand the BMS data shape (V_CELL arrays, TEMP_SENSE arrays, fault flags).

---

## Theming

Defined in `index.css` using CSS custom properties:

- `:root` — light mode colours
- `.dark` — dark mode overrides
- `@theme` block maps properties to Tailwind utility classes

Toggle is in the sidebar footer via `ThemeContext.toggleTheme()`.

Key colours: `--color-primary` (orange), `--color-background`, `--color-surface`, `--color-border`, `--color-text`, `--color-muted`.

---

## Sensor Display Names

`constants/sensorDisplayNames.js` maps raw sensor keys to human-readable labels:

```
STR_Heave_mm → Heave_mm
canVoltage   → Motor Voltage
TMP          → Radiator Temp
I_SENSE      → Accumulator Current
```

The `displayName(key)` function is used in `ChartSection` (chart labels, dropdown options) and `TableSection` (raw data values). Unmapped keys fall through unchanged.

---

## Backend -> Frontend API Route table

Base URL: `/api/stat/` and `/api/session/`

### Stat Routes (`/api/stat`)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/` | Fetch stats (optional `?since=` filter) |
| `DELETE` | `/delete` | Delete stats by session name |
| `DELETE` | `/delete-unnamed` | Delete stats with no session name |
| `DELETE` | `/delete-all` | Delete all stats |

### Session Routes (`/api/session`)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/start` | Start recording session |
| `POST` | `/stop` | Stop recording session |
| `GET` | `/active` | Get currently recording session |
| `GET` | `/list` | List sessions (paginated) |
| `GET` | `/:id/data` | Get normalised data for a session |
| `PATCH` | `/:id/rename` | Rename a session |
| `DELETE` | `/:id` | Delete a session |
| `DELETE` | `/delete-all` | Delete all sessions |
| `DELETE` | `/delete-unnamed` | Delete unnamed sessions |

### WebSocket

- Endpoint: `/ws?role=dashboard`
- Backend broadcasts telemetry to all connected dashboard clients.
- Data arrives as JSON with `{ group, timestamp, values }` structure.


<!-- --- -->

<!-- ## Ext. implement GPS Trackmap with API

GPS Track Map — Recommendation Summary
What to Use
Leaflet.js + OpenStreetMap via react-leaflet

Free, no API key required
Same look as the screenshot (OSM tiles, default Leaflet zoom controls)
Polyline for driven route, CircleMarker for live car position
Can color segments by speed using imu_accel_x/y + GPS data
What It Would Replace
The current OdometryPage uses a Chart.js scatter plot for GPS — it has no map background. Leaflet replaces this with a real interactive map.

Key Features (When Implemented)
Feature	Implementation
Driven route	Polyline from gps_lat / gps_lng history
Live car dot	CircleMarker updating per WebSocket frame
Speed coloring	Segment polyline, color by gps_speed
Session replay	Animate dot along stored path with time slider
Auto-follow	map.setView([lat, lng]) on each update
Lateral G & Longitudinal G — Recommendation Summary
Data already exists on the car:

Lateral G → imu_accel_y (convert: divide by 9.81)
Longitudinal G → imu_accel_x (convert: divide by 9.81)
Ideal widget: a G-circle / scatter plot showing the live G envelope (like Strava's cadence dial, but for cornering force).

⚠ NOT IMPLEMENTED YET
GPS Track Map, Lateral G, and Longitudinal G widgets are deferred.

Both areas should be reserved with a placeholder using the existing Card component (/src/components/ui/Card.jsx) — matching the same widget pattern already used in BMSPage.jsx:

<Card className="p-6">
  <h2 className="text-xl font-bold text-text mb-4">GPS Track Map</h2>
  {/* Coming soon */}
</Card>

<Card className="p-6">
  <h2 className="text-xl font-bold text-text mb-4">G-Force</h2>
  {/* Coming soon */}
</Card> -->