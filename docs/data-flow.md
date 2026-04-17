# Data Flow

Three entry points for data into the dashboard: live WebSocket stream, session recording control, and history playback REST.

---

## Live Telemetry (WebSocket)

```
ESP32 Nodes → BlackPearl WS Backend → WebSocket → Frontend
```

1. **`src/utils/websocket.js`** opens a connection to `/ws?role=dashboard`.
   - Auto-reconnects on disconnect (2 s delay).
   - In dev, Vite proxies `/ws` to the local backend. In prod, connects directly to the deployed URL.

2. **`src/hooks/useTelemetryStream.js`** wraps the socket.
   - Buffers incoming messages (max 500 points).
   - Throttles React state updates to ~10 fps via `setInterval`.
   - Tracks `wsStatus` (`connecting` / `connected` / `disconnected`) and `isStale` (no data for 10 s).
   - Shared by `PitwallPage`, `DynamicsPage`, `PowertrainPage`, `BatteryPage`.

3. **Backend sends pre-normalized data** — each message is a flat object with `group`, `timestamp`, and sensor fields. The frontend does no scaling.

---

## Session Recording

Managed through `SessionContext`, which wraps the REST API:

| Action | UI Trigger | API Call | Body |
|--------|-----------|----------|------|
| Start recording | "START RECORDING" button in `SessionControl` | `POST /api/session/start` | `{ name }` |
| Stop recording  | "STOP RECORDING" button in `SessionControl` | `POST /api/session/stop` | `{ session_id }` |
| Rename session  | Name input blur in `SessionControl` | `PATCH /api/session/:id/rename` | `{ name }` |
| Check active    | On mount (page refresh) | `GET /api/session/active` | — |

When recording is active the backend stores incoming telemetry to the database. The frontend only controls start/stop — it does **not** send telemetry.

---

## History / Playback

`HistoryPage` uses direct API calls (not context):

| Action | UI Trigger | API Call |
|--------|-----------|----------|
| Load session list     | Page mount            | `GET /api/session/list?limit=100` |
| Load session data     | Click a session card  | `GET /api/session/:id/data?normalized=true` |
| Delete one session    | Trash icon on card    | `DELETE /api/session/:id` |
| Delete all sessions   | "Delete All" button   | `DELETE /api/session/delete-all` |
| Delete unnamed        | "Delete Unnamed"      | `DELETE /api/session/delete-unnamed` |
| Delete stats by name  | Button on card        | `DELETE /api/stat/delete` with `{ session_name }` |
| Delete all stats      | "Delete All Stats"    | `DELETE /api/stat/delete-all` |
| Delete unnamed stats  | "Delete Unnamed Stats"| `DELETE /api/stat/delete-unnamed` |

Playback uses a time slider (`PlaybackControls`) that filters the loaded session data by timestamp to simulate time progression. The filtered subset is passed to `DataGroupPanel` components for visualization.

Export (`ExportControls`) converts session data client-side to JSON or CSV and triggers a browser download.


# Sensor Display Names

Raw sensor keys coming from the vehicle are terse and not always user-friendly. `src/constants/sensorDisplayNames.js` maps them to human-readable labels.

---

## Mapping

```
STR_Heave_mm → Heave_mm
canVoltage   → Motor Voltage
TMP          → Radiator Temp
I_SENSE      → Accumulator Current
```

The full map is just a plain object — add an entry when a new sensor needs a better label.

---

## Usage

Use the `displayName(key)` helper anywhere a raw key would otherwise appear:

- `ChartSection` — chart legend labels and topic selector dropdown
- `TableSection` — header row for raw data values

Unmapped keys fall through unchanged, so adding a new sensor never breaks the UI — it just shows up under its raw name until someone adds a friendly label.

