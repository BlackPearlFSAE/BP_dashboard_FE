import React, { useState, useEffect, useCallback } from 'react';
import { fetchSessions } from '../utils/api';
import { Settings, RefreshCw, AlertTriangle, Zap, Thermometer, Check, X, ShieldAlert, ArrowLeft } from 'lucide-react';

const BMU_COUNT = 8;
const FAULT_ROWS = [
    { key: 'OV_WARN', label: 'OV Warn', type: 'warn' },
    { key: 'OV_CRIT', label: 'OV Crit', type: 'crit' },
    { key: 'LV_WARN', label: 'LV Warn', type: 'warn' },
    { key: 'LV_CRIT', label: 'LV Crit', type: 'crit' },
    { key: 'OT_WARN', label: 'OT Warn', type: 'warn' },
    { key: 'OT_CRIT', label: 'OT Crit', type: 'crit' },
    { key: 'ODV_WARN', label: 'DV Warn', type: 'warn' },
    { key: 'ODV_CRIT', label: 'DV Crit', type: 'crit' },
];

export const BMSPage = () => {
    // Structure: { bmu0: { cells: dataObj, faults: dataObj }, ... }
    const [bmuData, setBmuData] = useState({});
    const [lastUpdate, setLastUpdate] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [selectedBmu, setSelectedBmu] = useState(null);

    // Initial state
    useEffect(() => {
        const initial = {};
        for (let i = 0; i < BMU_COUNT; i++) {
            initial[`bmu${i}`] = { cells: null, faults: null };
        }
        setBmuData(initial);
    }, []);

    const processData = useCallback((data) => {
        if (!Array.isArray(data)) return;

        setBmuData(prev => {
            const next = { ...prev };

            let foundAny = false;

            // Sort data by timestamp ascending to process oldest to newest
            const sortedData = [...data].sort((a, b) => (a.data.timestamp || 0) - (b.data.timestamp || 0));

            sortedData.forEach(item => {
                const group = item?.data?.group;
                if (!group || !group.startsWith('bmu')) return;

                const match = group.match(/bmu(\d+)\.(cells?|faults)/);
                if (match) {
                    const bmuIndex = match[1];
                    const type = match[2].startsWith('cell') ? 'cells' : 'faults';
                    const key = `bmu${bmuIndex}`;

                    if (!next[key]) next[key] = { cells: null, faults: null };

                    console.log(`[BMS] Processing ${key} ${type}`, item.data);

                    // Update specific part
                    // Use spread to ensure new object ref if changing
                    next[key] = {
                        ...next[key],
                        [type]: type === 'cells' ? item.data.values : item.data.d
                    };
                    foundAny = true;
                }
            });

            if (foundAny) {
                setLastUpdate(new Date());
                setIsConnected(true);
                return next;
            }
            return prev;
        });
    }, []);

    const loadData = useCallback(async () => {
        try {
            const json = await fetchSessions();
            processData(json);
        } catch (err) {
            console.error("BMS Fetch Error:", err);
            // Don't set isConnected false immediately on one error to avoid flicker, maybe counter?
            // checking "receivedAt" could be better logic but for now simple catch
        }
    }, [processData]);

    // Polling
    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 2000);
        return () => clearInterval(interval);
    }, [loadData]);


    const calculatePackSummary = () => {
        let totalVoltage = 0;
        let minCell = 999;
        let maxCell = -999;
        let maxTemp = -999;
        let connectedCount = 0;
        let faults = 0;

        Object.keys(bmuData).forEach(key => {
            const bmu = bmuData[key];
            if (!bmu?.cells) return;

            connectedCount++;

            // Cells
            if (bmu.cells.V_CELL) {
                bmu.cells.V_CELL.forEach(v => {
                    if (v < minCell) minCell = v;
                    if (v > maxCell) maxCell = v;
                });
            }

            // Voltage Sum (If available or sum cells)
            // Using V_MODULE from input
            if (bmu.cells.V_MODULE) {
                totalVoltage += bmu.cells.V_MODULE;
            }

            // Temps
            if (bmu.cells.TEMP_SENSE) {
                bmu.cells.TEMP_SENSE.forEach(t => {
                    if (t > maxTemp) maxTemp = t;
                });
            }

            // Check Faults existence (simplified check)
            if (bmu.faults) {
                // If any value in faults dict > 0 then it's a fault?
                // Example: OV_CRIT: 0
                Object.values(bmu.faults).forEach(val => {
                    if (typeof val === 'number' && val > 0) faults++; // Simplified: counts every bit set/field > 0 as a 'fault instance'
                });
            }
        });

        // Formatting
        // Assumption: V_MODULE is in cV (centi-volts) or similar based on Prompt 1 analysis (3724 -> 37.24V)
        // Prompt 1 image: 36.0V. Data: 3724. 3724/100 = 37.24V.
        // Prompt 1 data V_CELL: [186...]. 186 * 0.0191 ~= 3.55V.
        const displayTotalVoltage = totalVoltage > 0 ? (totalVoltage / 100).toFixed(1) : "0.0";
        const displayMinCell = minCell !== 999 ? (minCell * 0.0191).toFixed(2) : "0.00";
        const displayMaxCell = maxCell !== -999 ? (maxCell * 0.0191).toFixed(2) : "0.00";
        const packDv = (maxCell !== -999 && minCell !== 999) ? (maxCell - minCell).toFixed(0) : "0"; // Raw units for dV usually

        return {
            totalVoltage: displayTotalVoltage,
            minCell: displayMinCell,
            maxCell: displayMaxCell,
            packDv,
            maxTemp: maxTemp !== -999 ? maxTemp : '--',
            connectedCount,
            faults
        };
    };

    const summary = calculatePackSummary();

    // Render Bit Check
    const checkBit = (value, bitIndex) => {
        return (value >> bitIndex) & 1;
    };

    return (
        <div className="min-h-screen bg-background text-text font-mono p-4 transition-colors duration-300">
            {/* Top Bar */}
            <div className="flex justify-between items-center bg-surface p-3 rounded mb-4 border border-border shadow-sm">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-primary tracking-wider flex items-center gap-2">
                        <Zap className="fill-current" /> BP16B BMS
                    </h1>
                </div>

                <div className="flex items-center gap-6">
                    <div className="bg-green-600 px-4 py-1 rounded text-center font-bold text-white leading-tight shadow-md">
                        AMS<br />OK
                    </div>
                    <div className="text-xs text-muted">
                        <div className="flex gap-2">IF: <span className="text-text font-bold">socketcan</span></div>
                        <div className="flex gap-2">CH: <span className="text-text font-bold">can0</span></div>
                    </div>
                    <div className={`px-4 py-1 rounded font-bold text-white shadow-md transition-all ${isConnected ? 'bg-primary' : 'bg-surfaceHighlight text-muted'}`}>
                        {isConnected ? 'LIVE' : 'OFFLINE'}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
                {/* Main Grid - 8 BMUs */}
                <div className="col-span-12 lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.keys(bmuData).map((key, index) => {
                        const bmu = bmuData[key];
                        const data = bmu?.cells;
                        const hasData = !!data;

                        // Value formatting
                        const vModuleVal = data?.V_MODULE ? (data.V_MODULE / 100).toFixed(1) : "0.0";

                        return (
                            <div
                                key={key}
                                onClick={() => setSelectedBmu({ id: index + 1, ...bmu })}
                                className={`bg-surface border border-border rounded p-3 transition-all cursor-pointer relative group hover:border-primary hover:shadow-[0_0_15px_rgba(255,107,0,0.15)]
                                    ${hasData ? '' : 'opacity-80'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className={`font-bold text-lg ${hasData ? 'text-primary' : 'text-muted'}`}>BMU {index + 1}</h3>
                                    <span className="text-xl font-bold">{vModuleVal}V</span>
                                </div>

                                {/* Cells Grid */}
                                <div className="grid grid-cols-5 gap-y-1 gap-x-2 mb-3 text-sm">
                                    {/* Labels Row 1 */}
                                    {['C1', 'C2', 'C3', 'C4', 'C5'].map(l => (
                                        <div key={l} className="text-[10px] text-muted text-center uppercase">{l}</div>
                                    ))}

                                    {/* Values Row 1 */}
                                    {(data?.V_CELL || Array(5).fill(0)).slice(0, 5).map((v, i) => (
                                        <div key={i} className={`font-bold text-center ${hasData ? 'text-success' : 'text-muted'}`}>
                                            {(v * 0.0191).toFixed(2)}
                                        </div>
                                    ))}

                                    {/* Labels Row 2 */}
                                    {['C6', 'C7', 'C8', 'C9', 'C10'].map(l => (
                                        <div key={l} className="text-[10px] text-muted text-center uppercase mt-2">{l}</div>
                                    ))}

                                    {/* Values Row 2 */}
                                    {(data?.V_CELL || Array(5).fill(0)).slice(5, 10).map((v, i) => (
                                        <div key={i + 5} className={`font-bold text-center ${hasData ? 'text-success' : 'text-muted'}`}>
                                            {(v * 0.0191).toFixed(2)}
                                        </div>
                                    ))}
                                </div>

                                {/* Footer Stats */}
                                <div className="flex gap-4 text-xs text-muted border-t border-border pt-2 mt-2">
                                    <div className="flex gap-1">T1: <span className="text-text font-bold">{data?.TEMP_SENSE?.[0] ?? '--'}C</span></div>
                                    <div className="flex gap-1">T2: <span className="text-text font-bold">{data?.TEMP_SENSE?.[1] ?? '--'}C</span></div>
                                    <div className="flex gap-1">dV: <span className="text-text font-bold">{(data?.DV || 0)}mV</span></div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Sidebar */}
                <div className="col-span-12 lg:col-span-3 space-y-4">
                    <div className="bg-surface p-6 rounded border border-border h-full shadow-sm">
                        <h2 className="text-primary font-bold text-lg mb-6 text-center uppercase tracking-widest border-b border-border pb-4">Pack Summary</h2>

                        <div className="space-y-4 text-sm">
                            {/* Stats Rows */}
                            {[
                                { l: 'Total Voltage', v: summary.totalVoltage, u: 'V' },
                                { l: 'Min Cell', v: summary.minCell, u: 'V' },
                                { l: 'Max Cell', v: summary.maxCell, u: 'V' },
                                { l: 'Pack dV', v: summary.packDv, u: 'mV' },
                                { l: 'Max Temp', v: summary.maxTemp, u: 'C' },
                            ].map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center border-b border-border/50 pb-2 last:border-0">
                                    <span className="text-muted">{item.l}</span>
                                    <span className="font-bold text-lg">{item.v} <span className="text-xs text-muted font-normal">{item.u}</span></span>
                                </div>
                            ))}

                            <div className="flex justify-between items-center bg-surfaceHighlight p-3 rounded mt-4">
                                <span className="text-muted">Connected</span>
                                <span className="font-bold text-text">{summary.connectedCount}/8</span>
                            </div>

                            <div className="flex justify-between items-center bg-surfaceHighlight p-3 rounded">
                                <span className="text-muted">Faults</span>
                                <span className={`font-bold ${summary.faults > 0 ? 'text-red-500' : 'text-success'}`}>{summary.faults}</span>
                            </div>
                        </div>

                        <div className="mt-10">
                            <h3 className="text-xs text-muted uppercase text-center mb-4 tracking-widest">Module Status</h3>
                            <div className="grid grid-cols-4 gap-4 justify-items-center">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="flex flex-col items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full transition-all duration-500 
                                            ${bmuData[`bmu${i}`]?.cells ? 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-surfaceHighlight'}`}
                                        />
                                        <span className="text-[10px] text-muted font-mono">M{i + 1}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedBmu && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedBmu(null)}
                >
                    <div
                        className="bg-surface border border-primary/50 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-border bg-surfaceHighlight/30">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setSelectedBmu(null)} className="flex items-center gap-2 text-muted hover:text-text transition-colors">
                                    <ArrowLeft size={20} /> <span className="text-sm font-bold uppercase">Back</span>
                                </button>
                                <div className="h-6 w-px bg-border mx-2"></div>
                                <h2 className="text-2xl font-bold text-primary">BMU {selectedBmu.id}</h2>
                            </div>
                            <div className="flex items-center gap-2 text-success">
                                <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_currentColor]"></div>
                                <span className="text-sm font-bold uppercase tracking-wider">Connected</span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">

                            {/* Left Col: Voltages & Status */}
                            <div className="lg:col-span-5 space-y-8">
                                <div>
                                    <h3 className="text-primary font-bold text-lg mb-4">Cell Voltages</h3>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                                        <div className="grid grid-cols-5 gap-2 mb-2 text-xs text-muted uppercase tracking-wider font-bold">
                                            {['C1', 'C2', 'C3', 'C4', 'C5'].map(c => <div key={c}>{c}</div>)}
                                        </div>
                                        <div className="grid grid-cols-5 gap-2 mb-2 text-xs text-muted uppercase tracking-wider font-bold">
                                            {['C6', 'C7', 'C8', 'C9', 'C10'].map(c => <div key={c}>{c}</div>)}
                                        </div>

                                        <div className="grid grid-cols-5 gap-2 font-mono font-medium text-success text-lg">
                                            {(selectedBmu.cells?.V_CELL || []).slice(0, 5).map((v, i) => (
                                                <div key={i}>{(v * 0.0191).toFixed(3)}V</div>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-5 gap-2 font-mono font-medium text-success text-lg">
                                            {(selectedBmu.cells?.V_CELL || []).slice(5, 10).map((v, i) => (
                                                <div key={i + 5}>{(v * 0.0191).toFixed(3)}V</div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-primary font-bold text-lg mb-4">Status</h3>
                                    <div className="flex gap-6 items-center text-sm">
                                        <div className="flex items-center gap-2 bg-surfaceHighlight px-3 py-2 rounded">
                                            <Thermometer size={16} className="text-muted" />
                                            <span className="text-muted">Temp 1:</span>
                                            <span className="font-bold text-text text-lg">{selectedBmu.cells?.TEMP_SENSE?.[0]}C</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-surfaceHighlight px-3 py-2 rounded">
                                            <Thermometer size={16} className="text-muted" />
                                            <span className="text-muted">Temp 2:</span>
                                            <span className="font-bold text-text text-lg">{selectedBmu.cells?.TEMP_SENSE?.[1]}C</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-surfaceHighlight px-3 py-2 rounded">
                                            <Zap size={16} className="text-muted" />
                                            <span className="text-muted">dV:</span>
                                            <span className="font-bold text-text text-lg">{selectedBmu.cells?.DV}mV</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Col: Fault Table */}
                            <div className="lg:col-span-7 bg-surfaceHighlight/20 rounded-xl border border-border/50 p-1">
                                <div className="p-4 border-b border-border/50">
                                    <h3 className="text-primary font-bold text-lg">Fault Status</h3>
                                </div>

                                <div className="space-y-1 p-2">
                                    {/* Table Header */}
                                    <div className="grid grid-cols-[100px_repeat(10,1fr)] gap-1 mb-2 items-center">
                                        <div className="text-xs font-bold text-muted uppercase tracking-wider">Fault</div>
                                        {[...Array(10)].map((_, i) => (
                                            <div key={i} className="text-xs text-center text-muted font-bold">C{i + 1}</div>
                                        ))}
                                    </div>

                                    {/* Table Rows */}
                                    {FAULT_ROWS.map((row) => {
                                        const rawValue = selectedBmu.faults?.[row.key] || 0;
                                        return (
                                            <div key={row.key} className="grid grid-cols-[100px_repeat(10,1fr)] gap-1 items-center py-1 hover:bg-surfaceHighlight rounded px-1 transition-colors">
                                                <div className="text-xs font-medium text-text">{row.label}</div>
                                                {[...Array(10)].map((_, colIndex) => {
                                                    const isSet = checkBit(rawValue, colIndex);
                                                    return (
                                                        <div key={colIndex} className="flex justify-center">
                                                            {isSet ? (
                                                                row.type === 'crit' ?
                                                                    <div className="text-red-500 font-bold text-xs">❌</div> : // Or X icon
                                                                    <div className="text-warning font-bold text-xs">⚠️</div>  // Warn
                                                            ) : (
                                                                <Check size={14} className="text-success/30" strokeWidth={3} />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="p-4 flex gap-6 text-xs font-medium border-t border-border/50 mt-2">
                                    <div className="flex items-center gap-2">
                                        <Check size={14} className="text-success" /> <span className="text-success">OK</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-warning text-sm">⚠️</span> <span className="text-warning">Warn</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-red-500 text-sm">❌</span> <span className="text-red-500">Crit</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
