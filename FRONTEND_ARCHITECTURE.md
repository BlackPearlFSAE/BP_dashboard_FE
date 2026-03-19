# BlackPearl Dashboard — Frontend Architecture

## Tech Stack

- **React 18** with Vite
- **Tailwind CSS v4** (CSS-based theme with `@theme` directive, no `tailwind.config.js`)
- **React Router v6** — SPA with client-side routing
- **Chart.js / react-chartjs-2** — all time-series visualisation
- **date-fns** — timestamp formatting
- **lucide-react** — icon library

---

## Directory Structure

```
src/
├── main.jsx                      # Entry point, wraps App in ErrorBoundary
├── App.jsx                       # Router + providers (Theme, Session)
├── index.css                     # Tailwind imports, CSS custom properties, theme
│
├── pages/                        # Route-level components (one per route)
│   ├── PitwallPage.jsx           # /         Race engineer overview
│   ├── DynamicPage.jsx           # /dynamics  Suspension, wheel, GPS, IMU
│   ├── PowertrainPage.jsx        # /powertrain Motor controller & electrical
│   ├── BatteryPage.jsx           # /battery   BMS cell voltages, temps, faults
│   └── HistoryPage.jsx           # /history   Session playback & export
│
├── components/
│   ├── layout/
│   │   └── MainLayout.jsx        # Sidebar nav + mobile header + content area
│   │
│   ├── ui/                       # Generic reusable primitives
│   │   ├── Card.jsx              # Styled container with glass-morphism
│   │   └── Button.jsx            # Button with variant system (primary/danger/ghost/etc)
│   │
│   ├── pitwall_widget/           # Pitwall-specific dashboard widgets
│   │   ├── FaultBar.jsx          # AMS/IMD/BSPD/HV status indicators
│   │   ├── PowerGauge.jsx        # SVG arc gauge for kW output
│   │   ├── StatCard.jsx          # Single label + value + unit
│   │   ├── BarGauge.jsx          # Horizontal progress bar with warning threshold
│   │   ├── TrendChart.jsx        # Rolling 60s chart with switchable presets
│   │   └── GPSTrack.jsx          # Scatter plot of GPS path, speed-coloured
│   │
│   ├── battery_widget/           # Battery page specialised charts
│   │   ├── BMSCellChart.jsx      # 10-cell voltage time series
│   │   ├── BMSTempChart.jsx      # 2-sensor temperature time series
│   │   └── BMSFaultTable.jsx     # Fault flag status table
│   │
│   ├── session/                  # Session management components
│   │   ├── SessionControl.jsx    # Start/stop recording + name input + timer
│   │   ├── SessionList.jsx       # Browsable list of past sessions with search
│   │   ├── PlaybackControls.jsx  # Time scrubber + play/pause for history review
│   │   └── ExportControls.jsx    # Export session as JSON or CSV
│   │
│   ├── DataGroupPanel.jsx        # ChartSection + TableSection side-by-side, filtered by group
│   ├── ChartSection.jsx          # Generic chart wrapper with topic selector dropdown
│   ├── TableSection.jsx          # Raw data table with topic filter and time sort
│   └── ErrorBoundary.jsx         # React error boundary (wraps entire app)
│
├── constants/
│   ├── dataGroups.js             # DATA_GROUPS config — maps group names to categories
│   └── sensorDisplayNames.js     # SENSOR_DISPLAY_NAMES map + displayName() helper
│
├── hooks/
│   └── useTelemetryStream.js     # WebSocket hook — shared by all live pages
│
├── context/
│   ├── SessionContext.jsx         # Global recording state (start/stop/rename)
│   └── ThemeContext.jsx           # Dark/light mode toggle
│
└── utils/
    ├── api.js                    # All REST API calls (fetch wrappers)
    ├── websocket.js              # WebSocket client with auto-reconnect
    └── dataProcessor.js          # normalizeData(), flattenObject(), scaling config
```

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

## Backend API Summary

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
