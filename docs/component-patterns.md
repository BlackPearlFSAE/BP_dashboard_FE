# Component Patterns

Three layout patterns cover every page. Pick the one that matches the page's data shape.

---

## DataGroupPanel

Default layout for pages that show many topics from one or more groups — used by Dynamics, Powertrain, and History playback.

```
DataGroupPanel
├── ChartSection   (left)  — time-series chart with topic selector dropdown
└── TableSection   (right) — raw data table with topic filter and time sort
```

`DataGroupPanel` receives a `groups` array (e.g. `['front.mech', 'rear.mech']`) and filters the telemetry stream to only matching groups before passing the subset to its children.

---

## Pitwall Widgets

`PitwallPage` does **not** use `DataGroupPanel`. Instead, it extracts the latest values from the stream using `useLatest()` / `useLatestMulti()` helpers and renders purpose-built widgets:

- `PowerGauge` — SVG arc gauge for kW output
- `BarGauge` — horizontal bar (temps, pedal position) with warning threshold
- `StatCard` — single label + value + unit
- `FaultBar` — AMS / IMD / BSPD / HV status strip
- `TrendChart` — rolling 60 s multi-line chart with switchable presets
- `GPSTrack` — scatter plot of GPS path, coloured by speed

The widget-first layout keeps the race-engineer overview glanceable — no dropdowns, no filtering.

---

## Battery Page

Custom layout with a BMU selector dropdown. Uses specialized `battery_widget/` components that understand the BMS data shape:

- `BMSCellChart` — 10-cell voltage time series
- `BMSTempChart` — 2-sensor temperature time series
- `BMSFaultTable` — fault flag status table

Each BMU renders independently, so switching BMU in the dropdown simply re-mounts the widgets with a different filter key.
