import { TimeSeriesChart } from '../chart/TimeSeriesChart';

const SERIES = [
    { key: 'TEMP_SENSE.0', label: 'Temperature Sensor 0', color: '#FF6b00' },
    { key: 'TEMP_SENSE.1', label: 'Temperature Sensor 1', color: '#FFA500' },
];

export const BMSTempChart = ({ data }) => (
    <TimeSeriesChart
        data={data}
        series={SERIES}
        defaultWindowSec={30}
        yUnit="Temperature (°C)"
        height="h-[300px]"
    />
);
