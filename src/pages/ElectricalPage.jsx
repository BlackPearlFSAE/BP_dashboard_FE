import React, { useState, useEffect, useRef } from 'react';
import { DataGroupPanel } from '../components/DataGroupPanel';
import { normalizeData } from '../utils/dataProcessor';
import { createTelemetrySocket } from '../utils/websocket';
import { DATA_GROUPS } from '../constants/dataGroups';
import { Wifi, WifiOff } from 'lucide-react';

export const ElectricalPage = () => {
    const [normalizedData, setNormalizedData] = useState([]);
    const [wsStatus, setWsStatus] = useState('connecting');
    const dataBufferRef = useRef([]);

    useEffect(() => {
        const cleanup = createTelemetrySocket(
            (message) => {
                try {
                    const normalized = normalizeData(message);
                    dataBufferRef.current = [...dataBufferRef.current, normalized].slice(-500);
                    setNormalizedData([...dataBufferRef.current]);
                } catch (err) {
                    console.error('[Electrical] WS Processing Error:', err);
                }
            },
            (status) => setWsStatus(status)
        );
        return cleanup;
    }, []);

    const wsStatusColor = {
        connected: 'text-success',
        connecting: 'text-warning',
        disconnected: 'text-red-400'
    }[wsStatus] || 'text-muted';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-text tracking-tight">Electrical & Powertrain</h1>
                <p className="text-muted text-sm mt-1 font-mono flex items-center gap-2">
                    Sensors, faults & motor controller
                    <span className={`flex items-center gap-1 ${wsStatusColor}`}>
                        {wsStatus === 'connected' ? <Wifi size={14} /> : <WifiOff size={14} />}
                        {wsStatus.toUpperCase()}
                    </span>
                </p>
            </div>

            <DataGroupPanel {...DATA_GROUPS.ELECTRICAL} data={normalizedData} />
        </div>
    );
};
