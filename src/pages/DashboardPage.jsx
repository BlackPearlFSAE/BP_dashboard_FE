import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { SessionControl } from '../components/SessionControl';
import { ControlPanel } from '../components/ControlPanel';
import { useSession } from '../context/SessionContext';
import { createTelemetrySocket } from '../utils/websocket';
import { normalizeData } from '../utils/dataProcessor';
import { Cog, Zap, Battery, MapPin, AlertCircle, Circle, Wifi, WifiOff } from 'lucide-react';

const SECTIONS = [
    { to: '/mechanical', icon: Cog, label: 'Mechanical Dynamics', desc: 'Suspension, wheel RPM, heave & roll' },
    { to: '/electrical', icon: Zap, label: 'Electrical & Powertrain', desc: 'Sensors, faults & motor controller' },
    { to: '/bms', icon: Battery, label: 'Battery Management', desc: 'Cell voltages, temps & fault status' },
    { to: '/odometry', icon: MapPin, label: 'Odometry & Navigation', desc: 'GPS positioning & IMU data' },
];

export const DashboardPage = () => {
    const [wsStatus, setWsStatus] = useState('connecting');
    const [dataCount, setDataCount] = useState(0);
    const { activeSession, isRecording } = useSession();
    const dataCountRef = useRef(0);

    useEffect(() => {
        const cleanup = createTelemetrySocket(
            () => {
                dataCountRef.current += 1;
                setDataCount(dataCountRef.current);
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
                <h1 className="text-3xl font-bold text-text tracking-tight">Dashboard</h1>
                <p className="text-muted text-sm mt-1 font-mono flex items-center gap-2">
                    STREAM: <span className={`flex items-center gap-1 ${wsStatusColor}`}>
                        {wsStatus === 'connected' ? <Wifi size={14} /> : <WifiOff size={14} />}
                        {wsStatus.toUpperCase()}
                    </span>
                    {dataCount > 0 && <span className="text-muted/50">| {dataCount} messages received</span>}
                </p>
            </div>

            <SessionControl />

            {isRecording && activeSession && (
                <div className="bg-green-500/10 border border-green-500/50 text-green-200 p-4 rounded-lg flex items-center gap-2">
                    <Circle size={16} fill="#22c55e" className="text-green-500 animate-pulse" />
                    <span>
                        Recording: <strong>{activeSession.name || activeSession.session_id}</strong>
                    </span>
                </div>
            )}

            {!isRecording && (
                <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-200 p-4 rounded-lg flex items-center gap-2">
                    <AlertCircle size={20} />
                    <span>Monitor Mode - Data not saved to session</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SECTIONS.map(({ to, icon: Icon, label, desc }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className="bg-surface border border-border rounded-lg p-6 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <Icon size={24} className="text-primary" />
                            <h2 className="text-xl font-bold text-text group-hover:text-primary transition-colors">{label}</h2>
                        </div>
                        <p className="text-sm text-muted">{desc}</p>
                    </NavLink>
                ))}
            </div>
        </div>
    );
};
