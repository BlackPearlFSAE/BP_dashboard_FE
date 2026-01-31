import React, { useState, useEffect, useCallback } from 'react';
import { ControlPanel } from '../components/ControlPanel';
import { Dashboard } from '../components/Dashboard';
import { fetchSessions, deleteAll } from '../utils/api';
import { normalizeData } from '../utils/dataProcessor';

export const DashboardPage = () => {
    const [rawData, setRawData] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [intervalTime, setIntervalTime] = useState(2); // Seconds
    const [isAutoUpdate, setIsAutoUpdate] = useState(true);
    const [uploadStatus, setUploadStatus] = useState('');
    const [debugInfo, setDebugInfo] = useState('Initializing...');
    const [error, setError] = useState(null);

    // Main Data Processing - keep flat list as a single "session" for rendering
    const processAndSetData = useCallback((data) => {
        try {
            // Normalize mapping
            const normalized = data.map(item => normalizeData(item));

            // Create a single synthetic session so UI renders everything together
            const synthetic = {
                key: 'all_0',
                session_id: 'all',
                experiment_id: 'all',
                data: normalized
            };

            setSessions(normalized.length ? [synthetic] : []);
            setRawData(data); // Keep raw for reference or export if needed
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

    // Delete All handler
    const handleDeleteAll = async () => {
        setDebugInfo('Deleting all data...');
        const ok = await deleteAll();
        if (ok) {
            setSessions([]);
            setRawData([]);
            setDebugInfo('All data deleted');
        } else {
            setDebugInfo('Delete all failed');
            alert('Failed to delete all data on server');
        }
    };

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

    // Delete Handler
    const handleDeleteSession = (key) => {
        // Remove from local state immediately for UI responsiveness
        setSessions(prev => prev.filter(s => s.key !== key));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-text tracking-tight">Live Telemetry</h2>
                    <p className="text-muted text-sm mt-1 font-mono">SYSTEM STATUS: <span className={isAutoUpdate ? "text-success" : "text-warning"}>{isAutoUpdate ? 'ONLINE' : 'STANDBY'}</span></p>
                </div>
            </div>

            <ControlPanel
                interval={intervalTime}
                setInterval={setIntervalTime}
                isAutoUpdate={isAutoUpdate}
                setIsAutoUpdate={setIsAutoUpdate}
                onManualUpdate={loadData}
                onFileUpload={handleFileUpload}
                uploadStatus={uploadStatus}
                onDeleteAll={handleDeleteAll}
            />

            {/* Debug Info */}
            <div className="text-xs text-muted/50 font-mono">
                Debug: {debugInfo}
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-lg flex items-center gap-2">
                    <span>⚠️ {error}</span>
                </div>
            )}

            <Dashboard
                sessions={sessions}
                onDeleteSession={handleDeleteSession}
            />
        </div>
    );
};
