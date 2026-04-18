// Centralized Chart.js registration. Every chart component imports this
// module so the required scales/elements/plugins are registered before the
// first render, regardless of which chart route the user lands on first.
// Chart.js `register` is idempotent, so importing from multiple places
// is safe.
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    TimeSeriesScale,
    LineController,
    ScatterController,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-date-fns';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    TimeSeriesScale,
    LineController,
    ScatterController,
    zoomPlugin,
);

export { ChartJS };
