import { TimeSeriesChart } from '../chart/TimeSeriesChart';

const CELL_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
];

const SERIES = CELL_COLORS.map((color, i) => ({
    key: `V_CELL.${i}`,
    label: `Cell ${i}`,
    color,
}));

export const BMSCellChart = ({ data }) => (
    <TimeSeriesChart
        data={data}
        series={SERIES}
        defaultWindowSec={30}
        yUnit="Voltage (V)"
        height="h-[400px]"
    />
);
