import React from 'react';

/**
 * A single stat display with label + value + optional unit.
 * Compact for use inside dashboard grid panels.
 */
export const StatCard = ({ label, value, unit, warn, className = '' }) => {
    const displayVal = value !== undefined && value !== null
        ? typeof value === 'number' ? value.toFixed(1) : value
        : '—';

    return (
        <div className={`flex flex-col gap-0.5 ${className}`}>
            <span className="text-[10px] font-mono text-muted uppercase tracking-wider">{label}</span>
            <span className={`text-lg font-bold font-mono tabular-nums ${warn ? 'text-red-400' : 'text-text'}`}>
                {displayVal}
                {unit && <span className="text-xs text-muted ml-0.5">{unit}</span>}
            </span>
        </div>
    );
};
