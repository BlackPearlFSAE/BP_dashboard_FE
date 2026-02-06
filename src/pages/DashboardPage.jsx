import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ControlPanel } from '../components/ControlPanel';
import { SessionControl } from '../components/SessionControl';
import { DataGroupPanel } from '../components/DataGroupPanel';
import { fetchSessions } from '../utils/api';
import { normalizeData } from '../utils/dataProcessor';
import { DATA_GROUPS } from '../constants/dataGroups';
import { useSession } from '../context/SessionContext';
import { Button } from '../components/ui/Button';
import { Battery, AlertCircle } from 'lucide-react';

export const DashboardPage = () => {
    const [normalizedData, setNormalizedData] = useState([]);
    const [intervalTime, setIntervalTime] = useState(2); // Seconds
    const [isAutoUpdate, setIsAutoUpdate] = useState(true);
    const [uploadStatus, setUploadStatus] = useState('');
    const [debugInfo, setDebugInfo] = useState('Initializing...');
    const [error, setError] = useState(null);
    const { activeSession, isRecording } = useSession();

    // Main Data Processing (no grouping by session, just normalize)
    const processAndSetData = useCallback((data) => {
        try {
            // Normalize mapping only
            const normalized = data.map(item => normalizeData(item));
            setNormalizedData(normalized);
            setError(null);
        } catch (err) {
            console.error("Processing Error:", err);
            setError("Failed to process data: " + err.message);
        }
    }, []);

    // Fetch Function
    const loadData = useCallback(async () => {
        try {
            setDebugInfo('Fetching...');
            const json = await fetchSessions();
            setDebugInfo(`Fetched: ${Array.isArray(json) ? json.length : typeof json} items`);

            if (Array.isArray(json)) {
                processAndSetData(json);
            } else {
                console.warn("API returned non-array:", json);
                if (!json) setError("API returned no data (null/undefined)");
            }
        } catch (err) {
            console.error("Load Error:", err);
            setError("Connection Error: " + err.message);
            setDebugInfo('Error: ' + err.message);
        }
    }, [processAndSetData]);

    // Auto Update Loop
    useEffect(() => {
        let timer;
        if (isAutoUpdate) {
            loadData(); // Initial immediate load
            timer = setInterval(loadData, intervalTime * 1000);
        }
        return () => clearInterval(timer);
    }, [isAutoUpdate, intervalTime, loadData]);

    // File Upload Handler
    const handleFileUpload = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target.result);
                if (!Array.isArray(parsed)) {
                    alert("File must be a JSON Array");
                    return;
                }

                // Validation check similar to original
                const valid = parsed.every(item => item.data && item.data.session_id !== undefined);
                if (!valid) {
                    alert("Invalid JSON structure (missing session_id)"); // Relaxed check
                }

                setIsAutoUpdate(false); // Pause auto update to view file
                processAndSetData(parsed);
                setUploadStatus(`Loaded ${parsed.length} records`);
                setTimeout(() => setUploadStatus(''), 3000);
            } catch (err) {
                console.error(err);
                alert("Invalid JSON File");
            }
        };
        reader.readAsText(file);
    };

    // Get BMS summary data
    const bmsData = normalizedData.filter(d => {
        const group = d.original?.data?.group;
        return group && group.startsWith('bmu');
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-text tracking-tight">Live Telemetry</h2>
                    <p className="text-muted text-sm mt-1 font-mono">
                        SYSTEM STATUS: <span className={isAutoUpdate ? "text-success" : "text-warning"}>
                            {isAutoUpdate ? 'ONLINE' : 'STANDBY'}
                        </span>
                    </p>
                </div>
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

            <ControlPanel
                interval={intervalTime}
                setInterval={setIntervalTime}
                isAutoUpdate={isAutoUpdate}
                setIsAutoUpdate={setIsAutoUpdate}
                onManualUpdate={loadData}
                onFileUpload={handleFileUpload}
                uploadStatus={uploadStatus}
            />

            {/* Debug Info */}
            <div className="text-xs text-muted/50 font-mono">
                Debug: {debugInfo} | Total data points: {normalizedData.length}
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-lg flex items-center gap-2">
                    <span>⚠️ {error}</span>
                </div>
            )}

            {/* Data Group Panels */}
            <div className="space-y-6">
                <DataGroupPanel {...DATA_GROUPS.MECHANICAL} data={normalizedData} />
                <DataGroupPanel {...DATA_GROUPS.ODOMETRY} data={normalizedData} />
                <DataGroupPanel {...DATA_GROUPS.ELECTRICAL} data={normalizedData} />

                {/* BMS Summary Card */}
                <div className="bg-surface border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Battery size={24} className="text-primary" />
                            <div>
                                <h2 className="text-2xl font-bold text-text">Battery Management System</h2>
                                <p className="text-sm text-muted mt-1">
                                    {bmsData.length} BMS data points
                                </p>
                            </div>
                        </div>
                        <Link to="/bms">
                            <Button variant="primary">
                                Open Full BMS View →
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
