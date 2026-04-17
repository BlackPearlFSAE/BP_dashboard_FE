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
        // --- [CHANGED] 2C: O(1) latest timestamp instead of O(n) Math.max(...spread) ---
        // Original: Math.max(...data.map(d => d.timestamp))
        // Problem: allocates a full mapped array then spreads into Math.max (stack-overflow risk + O(n))
        // Fix: data arrives chronologically, so last element is the latest
        const now = data.length > 0 ? (data[data.length - 1].timestamp ?? Date.now()) : Date.now();
        const cutoff = now - 60000;
        // --- [CHANGED] 2C: Binary search + slice instead of filter().sort() ---
        // Original: data.filter(d => d.timestamp >= cutoff).sort((a, b) => a.timestamp - b.timestamp)
        // Problem: filter creates a new array, sort mutates + O(n log n) — but data is already chronological
        // Fix: binary search for the cutoff index, then a single slice (O(log n) + O(k) where k = result size)
        let lo = 0, hi = data.length;
        while (lo < hi) {
            const mid = (lo + hi) >>> 1;
            if (data[mid].timestamp < cutoff) lo = mid + 1;
            else hi = mid;
        }
        const recent = data.slice(lo);

        const datasets = keys.map((key, i) => {
            // `power` is on the wire in Watts; convert to kW at the display boundary
            // and plot it against the right-side Y axis.
            const isPower = key === 'power';
            const points = recent
                .filter(d => typeof d[key] === 'number')
                .map(d => ({ x: d.timestamp, y: isPower ? d[key] / 1000 : d[key] }));

            return {
                label: isPower ? `${displayName(key)} (kW)` : displayName(key),
                data: points,
                borderColor: colors[i],
                backgroundColor: colors[i],
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.3,
                yAxisID: isPower ? 'yPower' : 'y',
            };
        }).filter(ds => ds.data.length > 0);

        return { datasets };
    }, [data, keys, colors]);

    const hasPowerSeries = keys.includes('power');

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
                position: 'left',
                ticks: { color: textColor },
                grid: { color: gridColor },
            },
            // Right-side axis for `power` series (kW). Only shown when the Power preset is active.
            yPower: {
                position: 'right',
                display: hasPowerSeries,
                title: { display: hasPowerSeries, text: 'kW', color: textColor, font: { size: 10 } },
                ticks: { color: textColor },
                grid: { drawOnChartArea: false },
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
