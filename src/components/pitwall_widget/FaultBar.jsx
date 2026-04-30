import React, { useMemo } from 'react';

const FAULT_SIGNALS = [
    { key: 'AMS_OK', label: 'AMS' },
    { key: 'IMD_OK', label: 'IMD' },
    { key: 'BSPD_OK', label: 'BSPD' },
    { key: 'HV_ON', label: 'HV' },
];

export const FaultBar = ({ data }) => {
    const faultStates = useMemo(() => {
        // Find the latest data point that has fault fields
        const faultData = [...data]
            .filter(d => {
                const group = d.group || d.original?.data?.group;
                return group === 'front.faults';
            })
            .sort((a, b) => b.timestamp - a.timestamp);

        const latest = faultData[0];
        if (!latest) return null;

        return FAULT_SIGNALS.map(({ key, label }) => {
            const val = latest[key];
            // val === 1 (datagen) or true (ESP32) means OK; 0, false, or undefined means fault
            const isOk = val === 1 || val === true;
            return { key, label, isOk, value: val };
        });
    }, [data]);

    if (!faultStates) {
        return (
            <div className="bg-surface/60 border border-border rounded-lg px-4 py-3 flex items-center gap-4">
                <span className="text-xs font-mono text-muted uppercase tracking-wider">FAULTS</span>
                <span className="text-xs text-muted">Waiting for data...</span>
            </div>
        );
    }

    return (
        <div className="bg-surface/60 border border-border rounded-lg px-4 py-3 flex items-center gap-3 flex-wrap">
            <span className="text-xs font-mono text-muted uppercase tracking-wider mr-1">SAFETY</span>
            {faultStates.map(({ key, label, isOk }) => (
                <div
                    key={key}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-xs font-bold tracking-wide transition-all ${
                        isOk
                            ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                    }`}
                >
                    <div className={`w-2 h-2 rounded-full ${isOk ? 'bg-green-400' : 'bg-red-500 animate-pulse'}`} />
                    {label}
                    <span className="text-[10px] opacity-70">{isOk ? 'OK' : 'FAULT'}</span>
                </div>
            ))}
        </div>
    );
};
