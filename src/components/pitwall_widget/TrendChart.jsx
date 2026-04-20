import { useState } from 'react';
import { TimeSeriesChart } from '../chart/TimeSeriesChart';
import { displayName } from '../../utils/sensorDisplayNames';

const TREND_PRESETS = {
    power: {
        label: 'Power',
        series: [
            { key: 'power',       label: `${displayName('power')} (kW)`, color: '#FF7F11', transform: (w) => w / 1000 },
            { key: 'canVoltage',  label: displayName('canVoltage'),      color: '#06b6d4' },
            { key: 'canCurrent',  label: displayName('canCurrent'),      color: '#f59e0b' },
        ],
    },
    cellV: {
        label: 'Cell V',
        series: [
            { key: 'V_CELL.0', label: 'Cell 0', color: '#ef4444' },
            { key: 'V_CELL.1', label: 'Cell 1', color: '#f97316' },
            { key: 'V_CELL.2', label: 'Cell 2', color: '#eab308' },
            { key: 'V_CELL.3', label: 'Cell 3', color: '#22c55e' },
            { key: 'V_CELL.4', label: 'Cell 4', color: '#06b6d4' },
        ],
    },
    temps: {
        label: 'Temps',
        series: [
            { key: 'motorTemp',      label: displayName('motorTemp'),      color: '#ef4444' },
            { key: 'controllerTemp', label: displayName('controllerTemp'), color: '#f97316' },
            { key: 'TMP',            label: displayName('TMP'),            color: '#eab308' },
        ],
    },
    dynamics: {
        label: 'Dynamics',
        series: [
            { key: 'Wheel_RPM_L', group: 'front.mech', label: 'Front Wheel L (rpm)', color: '#ef4444' },
            { key: 'Wheel_RPM_R', group: 'front.mech', label: 'Front Wheel R (rpm)', color: '#f97316' },
            { key: 'Wheel_RPM_L', group: 'rear.mech',  label: 'Rear Wheel L (rpm)',  color: '#eab308' },
            { key: 'Wheel_RPM_R', group: 'rear.mech',  label: 'Rear Wheel R (rpm)',  color: '#84cc16' },
            { key: 'STR_Heave_mm', group: 'front.mech', label: 'Front Heave (mm)', color: '#06b6d4' },
            { key: 'STR_Roll_mm',  group: 'front.mech', label: 'Front Roll (mm)',  color: '#8b5cf6' },
            { key: 'STR_Heave_mm', group: 'rear.mech',  label: 'Rear Heave (mm)',  color: '#ec4899' },
            { key: 'STR_Roll_mm',  group: 'rear.mech',  label: 'Rear Roll (mm)',   color: '#64748b' },
        ],
    },
};

export const TrendChart = ({ data }) => {
    const [preset, setPreset] = useState('power');
    const { series } = TREND_PRESETS[preset];

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-muted uppercase tracking-wider">TREND</span>
                <div className="flex gap-1">
                    {Object.entries(TREND_PRESETS).map(([key, { label }]) => (
                        <button
                            key={key}
                            onClick={() => setPreset(key)}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                                preset === key
                                    ? 'bg-primary/20 text-primary border border-primary/30'
                                    : 'text-muted hover:text-text border border-transparent'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-1 min-h-0">
                <TimeSeriesChart
                    data={data}
                    series={series}
                    defaultWindowSec={30}
                    height="h-full"
                    key={preset}
                />
            </div>
        </div>
    );
};
