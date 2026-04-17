import React from 'react';

/**
 * Large circular-ish power gauge for kW display.
 * Uses an arc built with SVG.
 */
export const PowerGauge = ({ power, maxPower = 80 }) => {
    // `power` arrives in Watts (V*A from BAMO). Convert to kW here at the display boundary.
    const val = (power ?? 0) / 1000;
    const pct = Math.min(100, Math.max(0, (Math.abs(val) / maxPower) * 100));
    const isRegen = val < 0;

    // SVG arc parameters
    const radius = 60;
    const circumference = Math.PI * radius; // semicircle
    const dashOffset = circumference - (pct / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-1">
            <svg viewBox="0 0 140 80" className="w-full max-w-[200px]">
                {/* Background arc */}
                <path
                    d="M 10 75 A 60 60 0 0 1 130 75"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-border"
                />
                {/* Value arc */}
                <path
                    d="M 10 75 A 60 60 0 0 1 130 75"
                    fill="none"
                    stroke={isRegen ? '#22c55e' : '#FF7F11'}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    className="transition-all duration-300"
                />
                {/* Value text */}
                <text x="70" y="60" textAnchor="middle" className="fill-text font-mono" fontSize="22" fontWeight="bold">
                    {Math.abs(val).toFixed(1)}
                </text>
                <text x="70" y="74" textAnchor="middle" className="fill-muted" fontSize="10">
                    {isRegen ? 'REGEN' : 'kW'}
                </text>
            </svg>
            <span className="text-[10px] font-mono text-muted uppercase tracking-wider">POWER</span>
        </div>
    );
};
