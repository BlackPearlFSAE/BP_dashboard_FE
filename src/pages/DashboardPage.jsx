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
import { Battery, AlertCircle, Circle } from 'lucide-react';

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

    // Parse CSV into group-based items matching the dashboard's expected format
    const parseCSV = (text) => {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const items = [];

        lines.slice(1).forEach((line, idx) => {
            const vals = line.split(',').map(v => v.trim());
            const row = {};
            headers.forEach((h, i) => {
                row[h] = vals[i] !== undefined && vals[i] !== '' ? Number(vals[i]) : 0;
            });

            const timestamp = row.UnixTime;
            const dp = row.DataPoint || (idx + 1);

            // Mechanical group: wheel RPM + suspension stroke
            items.push({
                id: `csv_${dp}_mech`,
                session_id: 'csv_import',
                createdAt: new Date().toISOString(),
                data: {
                    type: 'data',
                    group: 'rear.mech',
                    timestamp,
                    values: {
                        Wheel_RPM_Left: row.Wheel_RPM_Left,
                        Wheel_RPM_Right: row.Wheel_RPM_Right,
                        Stroke1_mm: row.Stroke1_mm,
                        Stroke2_mm: row.Stroke2_mm,
                    }
                }
            });

            // Odometry group: GPS + IMU
            items.push({
                id: `csv_${dp}_odom`,
                session_id: 'csv_import',
                createdAt: new Date().toISOString(),
                data: {
                    type: 'data',
                    group: 'rear.odom',
                    timestamp,
                    values: {
                        GPS_Lat: row.GPS_Lat,
                        GPS_Lng: row.GPS_Lng,
                        GPS_Age: row.GPS_Age,
                        GPS_Course: row.GPS_Course,
                        GPS_Speed: row.GPS_Speed,
                        IMU_AccelX: row.IMU_AccelX,
                        IMU_AccelY: row.IMU_AccelY,
                        IMU_AccelZ: row.IMU_AccelZ,
                        IMU_GyroX: row.IMU_GyroX,
                        IMU_GyroY: row.IMU_GyroY,
                        IMU_GyroZ: row.IMU_GyroZ,
                    }
                }
            });
        });

        return items;
    };

    // File Upload Handler
    const handleFileUpload = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                let parsed;
                if (file.name.toLowerCase().endsWith('.csv')) {
                    parsed = parseCSV(e.target.result);
                } else {
                    parsed = JSON.parse(e.target.result);
                    if (!Array.isArray(parsed)) {
                        alert("File must be a JSON Array");
                        return;
                    }
                }

                setIsAutoUpdate(false); // Pause auto update to view file
                processAndSetData(parsed);
                setUploadStatus(`Loaded ${parsed.length} records`);
                setTimeout(() => setUploadStatus(''), 3000);
            } catch (err) {
                console.error(err);
                alert("Invalid file format");
            }
        };
        reader.readAsText(file);
    };

    // Load mock data for testing
    const loadMockData = useCallback(() => {
        const now = Date.now();
        const items = [];
        for (let i = 0; i < 100; i++) {
            const t = now - (100 - i) * 200;
            const angle = (i / 100) * Math.PI * 4;
            items.push({
                id: `mock_${i}_mech`,
                session_id: 'mock',
                createdAt: new Date(t).toISOString(),
                data: {
                    type: 'data', group: 'rear.mech', timestamp: t,
                    values: {
                        Wheel_RPM_Left: Math.max(0, 120 + Math.sin(angle) * 30 + Math.random() * 5),
                        Wheel_RPM_Right: Math.max(0, 118 + Math.sin(angle + 0.1) * 30 + Math.random() * 5),
                        Stroke1_mm: 8.5 + Math.sin(angle * 2) * 1.5 + Math.random() * 0.3,
                        Stroke2_mm: 0.35 + Math.abs(Math.sin(angle * 3)) * 2,
                    }
                }
            });
            items.push({
                id: `mock_${i}_odom`,
                session_id: 'mock',
                createdAt: new Date(t).toISOString(),
                data: {
                    type: 'data', group: 'rear.odom', timestamp: t,
                    values: {
                        GPS_Lat: 13.7563 + i * 0.00005,
                        GPS_Lng: 100.5018 + i * 0.00003,
                        GPS_Age: 0.1 + Math.random() * 0.5,
                        GPS_Course: (angle * 30) % 360,
                        GPS_Speed: 25 + Math.sin(angle) * 5,
                        IMU_AccelX: Math.sin(angle) * 0.5,
                        IMU_AccelY: Math.cos(angle) * 0.3,
                        IMU_AccelZ: 1.0 + Math.random() * 0.02 - 0.01,
                        IMU_GyroX: Math.sin(angle * 2) * 0.2,
                        IMU_GyroY: Math.cos(angle * 2) * 0.15,
                        IMU_GyroZ: Math.sin(angle) * 0.1,
                    }
                }
            });
        }
        setIsAutoUpdate(false);
        processAndSetData(items);
        setUploadStatus('Mock data loaded');
        setTimeout(() => setUploadStatus(''), 3000);
    }, [processAndSetData]);

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
                onLoadMock={loadMockData}
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
