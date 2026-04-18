import { useEffect, useMemo, useRef, useState } from 'react';
import '../chartSetup';
import { Chart as ReactChart } from 'react-chartjs-2';
import { Lock, Unlock } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useStickyYZoom } from './useStickyYZoom';

const DEFAULT_COLORS = ['#FF6b00', '#06b6d4', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6', '#ec4899', '#84cc16'];

const findStartIdx = (data, cutoffMs) => {
    let lo = 0, hi = data.length;
    while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (data[mid].timestamp < cutoffMs) lo = mid + 1;
        else hi = mid;
    }
    return lo;
};

const findEndIdx = (data, playheadMs) => {
    let lo = 0, hi = data.length;
    while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (data[mid].timestamp <= playheadMs) lo = mid + 1;
        else hi = mid;
    }
    return lo;
};

export const TimeSeriesChart = ({
    data = [],
    series = [],
    defaultWindowSec = 30,
    yUnit,
    t0: t0Prop,
    playheadMs,
    height = 'h-[400px]',
}) => {
    const { theme } = useTheme();
    const containerRef = useRef(null);
    const chartRef = useRef(null);
    const t0Ref = useRef(null);
    const [mode, setMode] = useState('autolock');
    const [stickyY, setStickyY] = useStickyYZoom(containerRef, chartRef);

    // Establish t0 once — from prop, or first data point ever seen.
    if (t0Ref.current == null) {
        if (t0Prop != null) t0Ref.current = t0Prop;
        else if (data.length > 0) t0Ref.current = data[0].timestamp;
    }
    const t0 = t0Ref.current;

    // Upper bound of the visible window: playhead in playback mode, else latest data.
    const isPlayback = playheadMs != null;
    const latestMs = isPlayback
        ? playheadMs
        : (data.length > 0 ? data[data.length - 1].timestamp : null);

    // Slice the buffer to what's renderable — always upper-bounded so playback never grows.
    const visible = useMemo(() => {
        if (!data.length || t0 == null || latestMs == null) return [];
        const cutoffMs = mode === 'autolock' ? latestMs - defaultWindowSec * 1000 : null;
        const start = cutoffMs != null ? findStartIdx(data, cutoffMs) : 0;
        const end = isPlayback ? findEndIdx(data, latestMs) : data.length;
        return data.slice(start, end);
    }, [data, mode, latestMs, defaultWindowSec, t0, isPlayback]);

    // Build datasets — one per series entry, with optional group filter.
    const chartData = useMemo(() => {
        if (t0 == null) return { datasets: [] };
        const datasets = series.map((s, i) => {
            const color = s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
            const points = [];
            for (const d of visible) {
                if (s.group && d.group !== s.group) continue;
                const raw = d[s.key];
                if (typeof raw !== 'number') continue;
                const y = s.transform ? s.transform(raw) : raw;
                points.push({ x: (d.timestamp - t0) / 1000, y });
            }
            return {
                label: s.label || s.key,
                data: points,
                borderColor: color,
                backgroundColor: color,
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.2,
                yAxisID: s.yAxisID || 'y',
            };
        }).filter(ds => ds.data.length > 0);
        return { datasets };
    }, [series, visible, t0]);

    // Sticky Y invalidation — if new data in view exceeds sticky range, drop sticky.
    useEffect(() => {
        if (!stickyY) return;
        for (const ds of chartData.datasets) {
            for (const p of ds.data) {
                if (p.y > stickyY.max || p.y < stickyY.min) {
                    setStickyY(null);
                    return;
                }
            }
        }
    }, [chartData, stickyY, setStickyY]);

    // Compute axis bounds.
    const latestRelS = latestMs != null && t0 != null ? (latestMs - t0) / 1000 : 0;
    const xMax = mode === 'autolock' ? latestRelS + defaultWindowSec * 0.05 : undefined;
    const xMin = mode === 'autolock' ? xMax - defaultWindowSec : undefined;

    const textColor = theme === 'dark' ? '#e0e0e0' : '#111827';
    const gridColor = theme === 'dark' ? '#333' : '#e5e7eb';

    const options = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        parsing: false,
        normalized: true,
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
                callbacks: {
                    title: (items) => items.length ? `${items[0].parsed.x.toFixed(2)}s` : '',
                    label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(3)}`,
                },
            },
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'x',
                    onPanStart: () => setMode('free'),
                },
                zoom: {
                    wheel: { enabled: true, modifierKey: null },
                    pinch: { enabled: true },
                    mode: 'x',
                    onZoomStart: ({ event }) => {
                        if (event?.shiftKey) return false; // shift+wheel handled by useStickyYZoom
                        setMode('free');
                        return true;
                    },
                },
            },
        },
        scales: {
            x: {
                type: 'linear',
                min: xMin,
                max: xMax,
                title: { display: true, text: 'Time (s)', color: textColor, font: { size: 10 } },
                ticks: {
                    color: textColor,
                    maxTicksLimit: 8,
                    callback: (v) => `${Number(v).toFixed(1)}s`,
                },
                grid: { color: gridColor },
            },
            y: {
                position: 'left',
                min: stickyY?.min,
                max: stickyY?.max,
                title: yUnit ? { display: true, text: yUnit, color: textColor, font: { size: 10 } } : undefined,
                ticks: { color: textColor },
                grid: { color: gridColor },
            },
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
    }), [textColor, gridColor, theme, xMin, xMax, stickyY, yUnit]);

    const handleAutolock = () => {
        setMode('autolock');
        chartRef.current?.resetZoom?.();
    };

    const locked = mode === 'autolock';

    return (
        <div className={`flex flex-col w-full ${height}`}>
            <div className="flex items-center justify-end gap-2 mb-1">
                {stickyY && (
                    <span className="text-[10px] font-mono text-muted">
                        Y locked · dbl-click to reset
                    </span>
                )}
                <button
                    onClick={handleAutolock}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors ${
                        locked
                            ? 'bg-primary/20 text-primary border-primary/30'
                            : 'text-muted hover:text-text border-border hover:border-primary/40'
                    }`}
                    title={locked ? 'Following latest data' : 'Click to follow latest data'}
                >
                    {locked ? <Lock size={10} /> : <Unlock size={10} />}
                    {locked ? 'LOCKED' : 'AUTOLOCK'}
                </button>
            </div>
            <div ref={containerRef} className="flex-1 min-h-0 relative cursor-crosshair">
                <ReactChart
                    ref={chartRef}
                    type="line"
                    data={chartData}
                    options={options}
                />
            </div>
        </div>
    );
};
