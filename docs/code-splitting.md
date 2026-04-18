# Code splitting

This document explains how the frontend bundle is split into multiple chunks,
why each split exists, and what to do (or avoid) when adding new code.

## The problem we were solving

A fresh `npm run build` produced a single JS file of **669 kB** (213 kB gzipped)
and Vite printed a warning that some chunks exceeded the 500 kB limit. The
whole site — every page, every chart, every helper library — was downloaded
before the user could see anything.

Running the bundle visualizer (`stats.html` generated via
`rollup-plugin-visualizer`) showed the breakdown in "rendered" (pre-minify)
bytes:

| Group | Rendered size | Share |
|---|---:|---:|
| `react-dom` | 548 kB | 32% |
| `chart.js` | 369 kB | 21% |
| `date-fns` | 218 kB | 13% |
| `jszip` | 96 kB | 6% |
| `tailwind-merge` | 92 kB | 5% |
| `react-router` | 77 kB | 4% |
| `hammerjs` (transitive via zoom plugin) | 77 kB | 4% |
| app code (`src/*`) | ~140 kB | ~8% |
| other | remainder | |

Chart.js and its peer libraries (zoom plugin, hammerjs, date-fns adapter,
react-chartjs-2) together added up to ~480 kB — larger than react-dom itself —
yet only three of six routes render charts.

## What we changed

### 1. Route-level lazy loading

In [`src/App.jsx`](../src/App.jsx), each page component is imported with
`React.lazy()` and the `<Routes>` subtree is wrapped in `<Suspense>`:

```jsx
const PitwallPage = lazy(() =>
  import('./pages/PitwallPage').then(m => ({ default: m.PitwallPage }))
);
// ...

<Suspense fallback={<RouteFallback />}>
  <Routes>
    <Route path="/" element={<PitwallPage />} />
    {/* ... */}
  </Routes>
</Suspense>
```

The `.then(m => ({ default: m.PitwallPage }))` wrapper is there because
`React.lazy` requires a **default export**, but our pages use named exports.
Rather than editing every page file, we adapt the module shape at the
import site.

Result: Rollup emits one chunk per page (`PitwallPage-*.js`,
`BatteryPage-*.js`, etc.). Each chunk only downloads the first time the user
navigates to that route.

### 2. Manual vendor chunks

In [`vite.config.js`](../vite.config.js), under `build.rollupOptions.output`:

```js
manualChunks: {
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],
  'chart-vendor': [
    'chart.js',
    'react-chartjs-2',
    'chartjs-plugin-zoom',
    'chartjs-adapter-date-fns',
    'hammerjs',
  ],
}
```

Two goals:

- **`react-vendor`** — React, React-DOM, and React Router change rarely. Pinning
  them in their own chunk means the browser cache hit survives across app
  deploys, so repeat visitors only re-download our app code.
- **`chart-vendor`** — The chart ecosystem is large and only used on some
  routes. Since no eager code imports these libraries, Rollup places this
  chunk behind a dynamic import boundary automatically; it loads in parallel
  with the first chart-using page chunk and then stays cached.

## Before and after

| Metric | Before | After |
|---|---:|---:|
| Initial JS (uncompressed) | 669 kB | 245 kB (index + react-vendor) |
| Initial JS (gzipped) | 213 kB | ~80 kB |
| Number of JS chunks | 1 | 13 |
| 500 kB warning | yes | no |

Approximate sizes of the emitted chunks after the change:

| Chunk | Size | Gzip | When it loads |
|---|---:|---:|---|
| `index` | 198 kB | 63 kB | always (app shell, contexts, layout) |
| `react-vendor` | 47 kB | 17 kB | always |
| `chart-vendor` | 243 kB | 80 kB | first chart-using route |
| `HistoryPage` | 138 kB | 44 kB | `/history` |
| `PitwallPage` | 14 kB | 5 kB | `/` |
| `BatteryPage` | 9 kB | 2 kB | `/battery` |
| `SettingsPage` | 4 kB | 2 kB | `/settings` |
| `DynamicPage` | 1 kB | 1 kB | `/dynamics` |
| `PowertrainPage` | 1 kB | 1 kB | `/powertrain` |

## What to do when adding code

- **New page component** — add it as another `lazy()` entry in `App.jsx`. No
  build config needed; Rollup emits a chunk for it automatically.
- **New shared component used on many pages** — import it normally. It will
  be placed in whichever chunk actually needs it (or the common `index`
  chunk if multiple lazy chunks reference it).
- **New heavy third-party library** — decide whether it is needed on first
  paint. If yes, and it's a shared framework-level dep, add it to
  `react-vendor`. If it's a feature library (a new charting lib, a PDF
  exporter, a rich-text editor), lazy-load it at the feature site with
  `await import('the-lib')` inside an event handler, or put it in a new
  manual vendor group in `vite.config.js`.
- **Barrel / deep imports** — always prefer named imports
  (`import { format } from 'date-fns'`) over namespace imports
  (`import * as dateFns from 'date-fns'`). The latter defeats tree-shaking.

## Gotcha: Chart.js registration

Chart.js uses a global, one-time registration model: you import the scales,
elements, controllers, and plugins you need and call `ChartJS.register(...)`
once before any chart renders.

Before code-splitting, `ChartSection.jsx` called `register` at module load, and
because `HistoryPage` (which imports `ChartSection`) was in the initial
bundle, registration always happened on boot. Other chart components
(`TrendChart`, `GPSTrack`, BMS charts) relied on this implicit global state.

After splitting, `ChartSection` only loads on `/history`. A user opening `/`
first would see `TrendChart` try to render against an unregistered Chart.js
and crash.

The fix is [`src/components/chartSetup.js`](../src/components/chartSetup.js) — a
side-effect module that performs the registration once. Every chart
component imports it (`import './chartSetup'` or `import '../chartSetup'`).
`ChartJS.register` is idempotent, so multiple imports are harmless, and
Rollup dedupes the module.

**When adding a new chart that uses a scale/controller/plugin not yet in
`chartSetup.js`, add it there** — don't register it locally in the
component, or you'll reintroduce the same fragility.

## Potential next steps

These were identified but **not** done in this change — they weren't needed to
kill the 500 kB warning, and doing them now would be premature optimisation.

1. **`HistoryPage` is 138 kB on its own.** Most of this is `date-fns`
   utilities used for history filtering / formatting. If the page feels slow
   to open, audit the imports and consider switching the chart time adapter
   to `chartjs-adapter-dayjs-4` (~6 kB) to remove `date-fns` from
   `chart-vendor` as well.
2. **`jszip` (96 kB)** is only used for the export flow. When that feature is
   added back in, load it dynamically at click time:
   `const JSZip = (await import('jszip')).default`.
3. **`tailwind-merge` (92 kB rendered)** is surprisingly heavy for a
   dashboard. Audit whether every usage really needs it vs. plain `clsx`.
4. **Preloading**. If a route consistently feels laggy on first open,
   trigger its chunk eagerly on hover of the sidebar link
   (`onMouseEnter={() => import('./pages/X')}`). Don't do this blindly —
   it defeats the point of splitting.

## How to re-measure

```bash
# Install the visualizer once:
npm i -D rollup-plugin-visualizer

# Add to vite.config.js plugins array:
#   import { visualizer } from 'rollup-plugin-visualizer'
#   plugins: [react(), tailwindcss(), visualizer({ filename: 'stats.html' })]

npm run build          # regenerates dist/* and stats.html
open stats.html        # interactive treemap of the bundle
```

Compare chunk sizes in the build output against the table above. If the
`index` chunk creeps back over ~250 kB, something large was pulled in
eagerly — find the offending import and lazy-load it.
