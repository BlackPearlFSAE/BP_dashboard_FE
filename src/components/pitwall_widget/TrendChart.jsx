import React, { useState, useMemo } from 'react';
import { Chart as ReactChart } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext';
import { displayName } from '../../constants/sensorDisplayNames';

const TREND_PRESETS = {
    power: {
        label: 'Power',
        keys: ['power', 'canVoltage', 'canCurrent'],
        colors: ['#FF7F11', '#06b6d4', '#f59e0b'],
    },
    cellV: {
        label: 'Cell V',
        keys: ['V_CELL.0', 'V_CELL.1', 'V_CELL.2', 'V_CELL.3', 'V_CELL.4'],
        colors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4'],
    },
    temps: {
        label: 'Temps',
        keys: ['motorTemp', 'controllerTemp', 'TMP'],
        colors: ['#ef4444', '#f97316', '#eab308'],
    },
    dynamics: {
        label: 'Dynamics',
        keys: ['STR_Heave_mm', 'STR_Roll_mm', 'Wheel_RPM_L', 'Wheel_RPM_R'],
        colors: ['#06b6d4', '#8b5cf6', '#ef4444', '#f97316'],
    },
};

export const TrendChart = ({ data }) => {
    const { theme } = useTheme();
    const [preset, setPreset] = useState('power');

    const { keys, colors } = TREND_PRESETS[preset];

    const chartData = useMemo(() => {
        // Only use last 60s of data
        const now = data.length > 0 ? Math.max(...data.map(d => d.timestamp)) : Date.now();
        const cutoff = now - 60000;
        const recent = data.filter(d => d.timestamp >= cutoff).sort((a, b) => a.timestamp - b.timestamp);

        const datasets = keys.map((key, i) => {
            const points = recent
                .filter(d => typeof d[key] === 'number')
                .map(d => ({ x: d.timestamp, y: d[key] }));

            return {
                label: displayName(key),
                data: points,
                borderColor: colors[i],
                backgroundColor: colors[i],
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.3,
            };
        }).filter(ds => ds.data.length > 0);

        return { datasets };
    }, [data, keys, colors]);

    const textColor = theme === 'dark' ? '#e0e0e0' : '#111827';
    const gridColor = theme === 'dark' ? '#333' : '#e5e7eb';

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: { color: textColor, font: { family: 'Bricolage Grotesque', size: 10 }, boxWidth: 12 },
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
                titleColor: '#FF6b00',
                bodyColor: textColor,
            },
            zoom: {
                pan: { enabled: true, mode: 'x' },
                zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' },
            },
        },
        scales: {
            x: {
                type: 'time',
                time: { displayFormats: { second: 'HH:mm:ss' } },
                ticks: { color: textColor, maxTicksLimit: 6 },
                grid: { color: gridColor },
            },
            y: {
                ticks: { color: textColor },
                grid: { color: gridColor },
            },
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-muted uppercase tracking-wider">TREND (60s)</span>
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
                <ReactChart type="line" data={chartData} options={options} />
            </div>
        </div>
    );
};
