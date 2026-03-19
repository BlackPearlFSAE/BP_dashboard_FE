import React, { useMemo } from 'react';
import { SessionControl } from '../components/session/SessionControl';
import { useSession } from '../context/SessionContext';
import { useTelemetryStream } from '../hooks/useTelemetryStream';
import { FaultBar } from '../components/pitwall_widget/FaultBar';
import { PowerGauge } from '../components/pitwall_widget/PowerGauge';
import { StatCard } from '../components/pitwall_widget/StatCard';
import { BarGauge } from '../components/pitwall_widget/BarGauge';
import { TrendChart } from '../components/pitwall_widget/TrendChart';
import { GPSTrack } from '../components/pitwall_widget/GPSTrack';
import { Card } from '../components/ui/Card';
import { AlertCircle, Circle, Wifi, WifiOff } from 'lucide-react';

/** Extract the latest value for a given key from data filtered by group(s) */
const useLatest = (data, groups, key) => {
    return useMemo(() => {
        const filtered = data
            .filter(d => {
                const g = d.group || d.original?.data?.group;
                return g && groups.includes(g);
            })
            .sort((a, b) => b.timestamp - a.timestamp);
        const latest = filtered[0];
        return latest ? latest[key] : undefined;
    }, [data, groups, key]);
};

/** Extract latest values for multiple keys from data */
const useLatestMulti = (data, groups, keys) => {
    return useMemo(() => {
        const filtered = data
            .filter(d => {
                const g = d.group || d.original?.data?.group;
                return g && groups.includes(g);
            })
            .sort((a, b) => b.timestamp - a.timestamp);
        const latest = filtered[0];
        if (!latest) return {};
        const result = {};
        keys.forEach(k => { result[k] = latest[k]; });
        return result;
    }, [data, groups, keys]);
};

export const PitwallPage = () => {
    const { data, wsStatus, isStale } = useTelemetryStream();
    const { activeSession, isRecording } = useSession();

    // ── Power & Motor ──
    const powerData = useLatestMulti(data, ['bamo.power'], ['canVoltage', 'canCurrent', 'power']);
    const tempData = useLatestMulti(data, ['bamo.temp'], ['motorTemp', 'controllerTemp']);
    const pedalData = useLatestMulti(data, ['front.elect'], ['APPS', 'BPPS', 'TMP', 'I_SENSE']);

    // ── Battery Health ──
    // Aggregate across all BMU cell groups
    const batteryStats = useMemo(() => {
        const cellGroups = data.filter(d => {
            const g = d.group || d.original?.data?.group;
            return g && g.includes('.cells');
        });
        if (cellGroups.length === 0) return {};

        const latest = cellGroups.sort((a, b) => b.timestamp - a.timestamp)[0];
        // Collect all V_CELL values from latest
        const cellVoltages = [];
        for (let i = 0; i < 10; i++) {
            const v = latest[`V_CELL.${i}`];
            if (typeof v === 'number') cellVoltages.push(v);
        }
        const temps = [];
        for (let i = 0; i < 2; i++) {
            const t = latest[`TEMP_SENSE.${i}`];
            if (typeof t === 'number') temps.push(t);
        }

        return {
            vModule: latest.V_MODULE,
            dv: latest.DV,
            minCell: cellVoltages.length > 0 ? Math.min(...cellVoltages) : undefined,
            maxCell: cellVoltages.length > 0 ? Math.max(...cellVoltages) : undefined,
            maxTemp: temps.length > 0 ? Math.max(...temps) : undefined,
        };
    }, [data]);

    const packCurrent = useLatest(data, ['bamo.power'], 'canCurrent');

    // ── Dynamics ──
    const mechData = useLatestMulti(data, ['front.mech', 'rear.mech'], ['Wheel_RPM_L', 'Wheel_RPM_R', 'STR_Heave_mm', 'STR_Roll_mm']);
    const imuData = useLatestMulti(data, ['rear.odom'], ['imu_accel_x', 'imu_accel_y']);

    const wsStatusColor = {
        connected: 'text-success',
        connecting: 'text-warning',
        disconnected: 'text-red-400'
    }[wsStatus] || 'text-muted';

    const wheelDelta = (mechData.Wheel_RPM_L != null && mechData.Wheel_RPM_R != null)
        ? Math.abs(mechData.Wheel_RPM_L - mechData.Wheel_RPM_R).toFixed(1)
        : undefined;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text tracking-tight">Pitwall</h1>
                    <p className="text-muted text-sm mt-1 font-mono flex items-center gap-2">
                        <span className={`flex items-center gap-1 ${wsStatusColor}`}>
                            {wsStatus === 'connected' ? <Wifi size={14} /> : <WifiOff size={14} />}
                            {wsStatus.toUpperCase()}
                        </span>
                        {isStale && <span className="text-yellow-400">| STALE</span>}
                        <span className="text-muted/50">| {data.length} pts</span>
                    </p>
                </div>
            </div>

            <SessionControl />

            {isRecording && activeSession && (
                <div className="bg-green-500/10 border border-green-500/50 text-green-200 p-3 rounded-lg flex items-center gap-2 text-sm">
                    <Circle size={14} fill="#22c55e" className="text-green-500 animate-pulse" />
                    Recording: <strong>{activeSession.name || activeSession.session_id}</strong>
                </div>
            )}

            {!isRecording && (
                <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-200 p-3 rounded-lg flex items-center gap-2 text-sm">
                    <AlertCircle size={16} />
                    Monitor Mode — data not saved
                </div>
            )}

            {/* ═══ FAULT BAR ═══ */}
            <FaultBar data={data} />

            {/* ═══ MAIN 3-COLUMN GRID ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* ── POWER & MOTOR ── */}
                <Card className="p-4 space-y-4">
                    <h3 className="text-xs font-mono text-muted uppercase tracking-widest border-b border-border pb-2">
                        Power & Motor
                    </h3>

                    <PowerGauge power={powerData.power} maxPower={80} />

                    <div className="grid grid-cols-2 gap-3">
                        <BarGauge label="Motor Temp" value={tempData.motorTemp} max={120} unit="°C" color="bg-red-500" warnThreshold={100} />
                        <BarGauge label="Controller Temp" value={tempData.controllerTemp} max={120} unit="°C" color="bg-orange-500" warnThreshold={90} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <BarGauge label="APPS" value={pedalData.APPS} max={100} unit="%" color="bg-green-500" />
                        <BarGauge label="BPPS" value={pedalData.BPPS} max={100} unit="%" color="bg-red-500" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <StatCard label="Radiator Temp" value={pedalData.TMP} unit="°C" />
                        <StatCard label="Acc. Current" value={pedalData.I_SENSE} unit="A" />
                    </div>
                </Card>

                {/* ── BATTERY HEALTH ── */}
                <Card className="p-4 space-y-4">
                    <h3 className="text-xs font-mono text-muted uppercase tracking-widest border-b border-border pb-2">
                        Battery Health
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                        <StatCard label="Pack Voltage" value={batteryStats.vModule} unit="V" />
                        <StatCard label="Pack Current" value={packCurrent} unit="A" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <StatCard label="Min Cell V" value={batteryStats.minCell} unit="V" />
                        <StatCard label="Max Cell V" value={batteryStats.maxCell} unit="V" />
                    </div>

                    <StatCard
                        label="ΔV (Cell Spread)"
                        value={batteryStats.dv}
                        unit="V"
                        warn={batteryStats.dv > 0.3}
                    />

                    <BarGauge
                        label="Max Cell Temp"
                        value={batteryStats.maxTemp}
                        max={80}
                        unit="°C"
                        color="bg-orange-500"
                        warnThreshold={60}
                    />
                </Card>

                {/* ── DYNAMICS ── */}
                <Card className="p-4 space-y-4">
                    <h3 className="text-xs font-mono text-muted uppercase tracking-widest border-b border-border pb-2">
                        Dynamics
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                        <StatCard label="Wheel RPM L" value={mechData.Wheel_RPM_L} unit="rpm" />
                        <StatCard label="Wheel RPM R" value={mechData.Wheel_RPM_R} unit="rpm" />
                    </div>

                    {wheelDelta !== undefined && (
                        <div className="text-[10px] font-mono text-muted text-center -mt-2">
                            ΔRpm: <span className={`font-bold ${parseFloat(wheelDelta) > 20 ? 'text-yellow-400' : 'text-text'}`}>
                                {wheelDelta}
                            </span>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <StatCard label="Heave" value={mechData.STR_Heave_mm} unit="mm" />
                        <StatCard label="Roll" value={mechData.STR_Roll_mm} unit="mm" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <BarGauge label="Lateral G" value={imuData.imu_accel_y} max={3} unit="g" color="bg-cyan-500" />
                        <BarGauge label="Longitudinal G" value={imuData.imu_accel_x} max={3} unit="g" color="bg-violet-500" />
                    </div>
                </Card>
            </div>

            {/* ═══ BOTTOM ROW: TREND + GPS ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-4 h-[350px]">
                    <TrendChart data={data} />
                </Card>
                <Card className="p-4 h-[350px]">
                    <GPSTrack data={data} />
                </Card>
            </div>
        </div>
    );
};
