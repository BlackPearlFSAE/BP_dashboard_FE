import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { normalizeData } from '../utils/dataProcessor';
import { createTelemetrySocket } from '../utils/websocket';
import { BMU_UNITS } from '../constants/dataGroups';
import { BMSCellChart } from '../components/bms/BMSCellChart';
import { BMSTempChart } from '../components/bms/BMSTempChart';
import { BMSFaultTable } from '../components/bms/BMSFaultTable';
import { TableSection } from '../components/TableSection';

export const BMSPage = () => {
    const [normalizedData, setNormalizedData] = useState([]);
    const [selectedBMU, setSelectedBMU] = useState('bmu0');
    const [isLoading, setIsLoading] = useState(true);
    const dataBufferRef = useRef([]);

    // WebSocket connection for live BMS data
    useEffect(() => {
        const cleanup = createTelemetrySocket(
            (message) => {
                try {
                    const normalized = normalizeData(message);
                    dataBufferRef.current = [...dataBufferRef.current, normalized].slice(-500);
                    setNormalizedData([...dataBufferRef.current]);
                    setIsLoading(false);
                } catch (err) {
                    console.error('[BMS] WS Processing Error:', err);
                }
            },
            () => {}
        );
        return cleanup;
    }, []);

    // Filter BMS data for selected BMU
    const bmuData = useMemo(() => {
        return normalizedData.filter(d => {
            const group = d.original?.data?.group;
            return group && group.startsWith(selectedBMU);
        });
    }, [normalizedData, selectedBMU]);

    const cellsData = useMemo(() => {
        return bmuData.filter(d => d.original?.data?.group?.includes('.cells'));
    }, [bmuData]);

    const faultsData = useMemo(() => {
        return bmuData.filter(d => d.original?.data?.group?.includes('.faults'));
    }, [bmuData]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text">BMS Monitor</h1>
                    <p className="text-sm text-muted mt-1">
                        Battery Management System - Cell Voltages, Temperatures & Faults
                    </p>
                </div>

                <select
                    value={selectedBMU}
                    onChange={e => setSelectedBMU(e.target.value)}
                    className="bg-surface border border-border rounded px-4 py-2 text-text font-mono font-bold focus:border-primary outline-none transition-colors"
                >
                    {BMU_UNITS.map(bmu => (
                        <option key={bmu} value={bmu}>
                            {bmu.toUpperCase()}
                        </option>
                    ))}
                </select>
            </div>

            {isLoading ? (
                <Card className="p-12 text-center">
                    <p className="text-muted">Loading BMS data...</p>
                </Card>
            ) : bmuData.length === 0 ? (
                <Card className="p-12 text-center">
                    <p className="text-muted">No data available for {selectedBMU.toUpperCase()}</p>
                    <p className="text-sm text-muted/70 mt-2">Waiting for telemetry...</p>
                </Card>
            ) : (
                <>
                    {/* Graph Views ABOVE */}
                    <Card className="p-6">
                        <h2 className="text-xl font-bold text-text mb-4 flex items-center gap-2">
                            <span className="text-primary">📊</span>
                            Cell Voltage Chart
                        </h2>
                        <BMSCellChart data={cellsData} />
                    </Card>

                    <Card className="p-6">
                        <h2 className="text-xl font-bold text-text mb-4 flex items-center gap-2">
                            <span className="text-primary">🌡️</span>
                            Temperature Chart
                        </h2>
                        <BMSTempChart data={cellsData} />
                    </Card>

                    {/* Detail Views BELOW */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-bold text-text mb-4">Cell Data</h3>
                            <TableSection data={cellsData} />
                        </Card>

                        <Card className="p-6">
                            <h3 className="text-lg font-bold text-text mb-4">Fault Status</h3>
                            <BMSFaultTable data={faultsData} />
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
};
