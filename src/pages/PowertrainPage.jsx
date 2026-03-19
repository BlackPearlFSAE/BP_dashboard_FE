import React from 'react';
import { DataGroupPanel } from '../components/DataGroupPanel';
import { useTelemetryStream } from '../hooks/useTelemetryStream';
import { DATA_GROUPS } from '../constants/dataGroups';
import { Wifi, WifiOff } from 'lucide-react';

export const PowertrainPage = () => {
    const { data, wsStatus, isStale } = useTelemetryStream();

    const wsStatusColor = {
        connected: 'text-success',
        connecting: 'text-warning',
        disconnected: 'text-red-400'
    }[wsStatus] || 'text-muted';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-text tracking-tight">Powertrain</h1>
                <p className="text-muted text-sm mt-1 font-mono flex items-center gap-2">
                    Motor controller, inverter & electrical sensors
                    <span className={`flex items-center gap-1 ${wsStatusColor}`}>
                        {wsStatus === 'connected' ? <Wifi size={14} /> : <WifiOff size={14} />}
                        {wsStatus.toUpperCase()}
                    </span>
                    {isStale && <span className="text-yellow-400">| STALE</span>}
                </p>
            </div>

            <DataGroupPanel {...DATA_GROUPS.POWERTRAIN} data={data} />
        </div>
    );
};
