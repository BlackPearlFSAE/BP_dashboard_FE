import React from 'react';

/**
 * Horizontal bar gauge with label, value, and fill.
 * Used for temps, pedal position, etc.
 */
export const BarGauge = ({ label, value, max = 100, unit = '', color = 'bg-primary', warn, warnThreshold }) => {
    const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
    const isWarn = warn || (warnThreshold && value >= warnThreshold);
    const barColor = isWarn ? 'bg-red-500' : color;

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-muted uppercase tracking-wider">{label}</span>
                <span className={`text-xs font-mono font-bold tabular-nums ${isWarn ? 'text-red-400' : 'text-text'}`}>
                    {value !== undefined && value !== null ? (typeof value === 'number' ? value.toFixed(1) : value) : '—'}
                    {unit && <span className="text-muted ml-0.5">{unit}</span>}
                </span>
            </div>
            <div className="h-2 bg-surface rounded-full overflow-hidden border border-border/50">
                <div
                    className={`h-full ${barColor} rounded-full transition-all duration-300`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
};
