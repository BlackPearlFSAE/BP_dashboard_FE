import React, { useMemo } from 'react';
import { format } from 'date-fns';

export const BMSFaultTable = ({ data }) => {
    const faults = useMemo(() => {
        if (!data || data.length === 0) return [];

        return data.map(d => ({
            timestamp: d.timestamp,
            OV_WARN: !!(d.OV_WARN),
            OV_CRIT: !!(d.OV_CRIT),
            LV_WARN: !!(d.LV_WARN),
            LV_CRIT: !!(d.LV_CRIT),
            OT_WARN: !!(d.OT_WARN),
            OT_CRIT: !!(d.OT_CRIT),
            ODV_WARN: !!(d.ODV_WARN),
            ODV_CRIT: !!(d.ODV_CRIT),
            connected: d.connected !== undefined ? d.connected : true
        })).reverse(); // Show most recent first
    }, [data]);

    const getFaultStatus = (warn, crit) => {
        if (crit) return { text: 'CRIT', className: 'text-red-500 font-bold' };
        if (warn) return { text: 'WARN', className: 'text-yellow-500 font-bold' };
        return { text: 'OK', className: 'text-green-500' };
    };

    if (faults.length === 0) {
        return (
            <div className="text-center py-8 text-muted">
                <p>No fault data available</p>
            </div>
        );
    }

    return (
        <div className="overflow-auto max-h-[400px]">
            <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface border-b border-border">
                    <tr>
                        <th className="text-left p-2 font-bold text-text">Time</th>
                        <th className="text-center p-2 font-bold text-text">Over Voltage</th>
                        <th className="text-center p-2 font-bold text-text">Low Voltage</th>
                        <th className="text-center p-2 font-bold text-text">Over Temp</th>
                        <th className="text-center p-2 font-bold text-text">Delta V</th>
                        <th className="text-center p-2 font-bold text-text">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {faults.map((f, idx) => {
                        const ovStatus = getFaultStatus(f.OV_WARN, f.OV_CRIT);
                        const lvStatus = getFaultStatus(f.LV_WARN, f.LV_CRIT);
                        const otStatus = getFaultStatus(f.OT_WARN, f.OT_CRIT);
                        const odvStatus = getFaultStatus(f.ODV_WARN, f.ODV_CRIT);

                        return (
                            <tr key={idx} className="border-b border-border/50 hover:bg-surface/50">
                                <td className="p-2 font-mono text-xs text-muted">
                                    {format(f.timestamp, 'HH:mm:ss')}
                                </td>
                                <td className={`text-center p-2 ${ovStatus.className}`}>
                                    {ovStatus.text}
                                </td>
                                <td className={`text-center p-2 ${lvStatus.className}`}>
                                    {lvStatus.text}
                                </td>
                                <td className={`text-center p-2 ${otStatus.className}`}>
                                    {otStatus.text}
                                </td>
                                <td className={`text-center p-2 ${odvStatus.className}`}>
                                    {odvStatus.text}
                                </td>
                                <td className="text-center p-2">
                                    {f.connected ? (
                                        <span className="text-green-500">●</span>
                                    ) : (
                                        <span className="text-red-500">●</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {faults.length === 0 && (
                <div className="text-center py-4 text-muted text-sm">
                    No fault records
                </div>
            )}
        </div>
    );
};
