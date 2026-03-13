import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SessionList } from '../components/SessionList';
import { PlaybackControls } from '../components/PlaybackControls';
import { ExportControls } from '../components/ExportControls';
import { DataGroupPanel } from '../components/DataGroupPanel';
import { getSessionList, getSessionData, deleteSessionById, deleteAllSessions, deleteStatsByName, deleteUnnamedStats, deleteAllStats } from '../utils/api';
import { normalizeData } from '../utils/dataProcessor';
import { DATA_GROUPS } from '../constants/dataGroups';
import { format } from 'date-fns';

export const HistoryPage = () => {
    const [sessionList, setSessionList] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [sessionData, setSessionData] = useState([]);
    const [currentTime, setCurrentTime] = useState(0); // 0-1 slider value
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadSessionList();
    }, []);

    const loadSessionList = async () => {
        setIsLoading(true);
        try {
            const sessions = await getSessionList(100, 0);
            setSessionList(sessions.filter(s => s.status === 'stopped'));
        } catch (error) {
            console.error('[HISTORY] Failed to load session list:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteSession = async (session_id) => {
        const success = await deleteSessionById(session_id);
        if (success) {
            setSessionList(prev => prev.filter(s => s.session_id !== session_id));
        }
    };

    const handleDeleteAll = async () => {
        if (!window.confirm(`Delete all ${sessionList.length} sessions? This cannot be undone.`)) return;
        const success = await deleteAllSessions();
        if (success) {
            setSessionList([]);
        }
    };

    const handleDeleteAllStats = async () => {
        if (!window.confirm('Delete ALL stats from database? This cannot be undone.')) return;
        await deleteAllStats();
    };

    const handleDeleteUnnamedStats = async () => {
        if (!window.confirm('Delete all unnamed (undefined) stats? This cannot be undone.')) return;
        await deleteUnnamedStats();
    };

    const handleDeleteStatsBySession = async (sessionName) => {
        if (!window.confirm(`Delete all stats for session "${sessionName}"?`)) return;
        await deleteStatsByName(sessionName);
    };

    const loadSession = async (session_id) => {
        setIsLoading(true);
        try {
            const data = await getSessionData(session_id, 0, 5000);
            const normalized = data.map(d => normalizeData(d));
            setSessionData(normalized);
            setSelectedSession(sessionList.find(s => s.session_id === session_id));
            setCurrentTime(0);
            setIsPlaying(false);
        } catch (error) {
            console.error('[HISTORY] Failed to load session data:', error);
            alert('Failed to load session data. Check console for details.');
        } finally {
            setIsLoading(false);
        }
    };

    const playbackData = useMemo(() => {
        if (!sessionData.length) return [];

        const timestamps = sessionData.map(d => d.timestamp);
        const minTime = Math.min(...timestamps);
        const maxTime = Math.max(...timestamps);
        const currentTimestamp = minTime + (currentTime * (maxTime - minTime));

        return sessionData.filter(d => d.timestamp <= currentTimestamp);
    }, [sessionData, currentTime]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text">Session History</h1>
                    <p className="text-sm text-muted mt-1">
                        Browse and playback recorded telemetry sessions
                    </p>
                </div>
                {selectedSession && (
                    <Button variant="ghost" onClick={() => {
                        setSelectedSession(null);
                        setSessionData([]);
                        setCurrentTime(0);
                    }}>
                        ← Back to List
                    </Button>
                )}
            </div>

            {!selectedSession ? (
                <SessionList
                    sessions={sessionList}
                    onSelect={loadSession}
                    onDelete={handleDeleteSession}
                    onDeleteAll={handleDeleteAll}
                    onDeleteAllStats={handleDeleteAllStats}
                    onDeleteUnnamedStats={handleDeleteUnnamedStats}
                    onDeleteStatsBySession={handleDeleteStatsBySession}
                    isLoading={isLoading}
                />
            ) : (
                <>
                    {/* Session Header */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-text">
                                    {selectedSession.name || `Session ${selectedSession.session_id.slice(0, 8)}`}
                                </h2>
                                <p className="text-sm text-muted mt-1">
                                    {format(new Date(selectedSession.start_time), 'PPpp')} -
                                    {format(new Date(selectedSession.end_time), 'PPpp')}
                                </p>
                                <p className="text-xs text-muted/70 mt-1 font-mono">
                                    Session ID: {selectedSession.session_id}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-primary">
                                    {selectedSession.data_point_count.toLocaleString()}
                                </div>
                                <div className="text-sm text-muted">data points</div>
                            </div>
                        </div>
                    </Card>

                    {isLoading ? (
                        <Card className="p-12 text-center">
                            <p className="text-muted">Loading session data...</p>
                        </Card>
                    ) : (
                        <>
                            {/* Playback Controls */}
                            <PlaybackControls
                                currentTime={currentTime}
                                setCurrentTime={setCurrentTime}
                                isPlaying={isPlaying}
                                setIsPlaying={setIsPlaying}
                            />

                            {/* Data Visualization */}
                            <div className="space-y-6">
                                <DataGroupPanel {...DATA_GROUPS.MECHANICAL} data={playbackData} />
                                <DataGroupPanel {...DATA_GROUPS.ODOMETRY} data={playbackData} />
                                <DataGroupPanel {...DATA_GROUPS.ELECTRICAL} data={playbackData} />
                            </div>

                            {/* Export Controls */}
                            <ExportControls sessionData={sessionData} session={selectedSession} />
                        </>
                    )}
                </>
            )}
        </div>
    );
};
