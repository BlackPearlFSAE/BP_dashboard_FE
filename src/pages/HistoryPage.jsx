import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SessionList } from '../components/session/SessionList.jsx';
import { PlaybackControls } from '../components/session/PlaybackControls';
import { ExportControls } from '../components/session/ExportControls';
import { DataGroupPanel } from '../components/DataGroupPanel';
import { getSessionList, getAllSessionData, deleteSessionById, deleteAllSessions, deleteUnnamedSessions, deleteStatsByName, deleteUnnamedStats, deleteAllStats } from '../utils/api';
import { DATA_GROUPS } from '../constants/dataGroups';
import { format } from 'date-fns';

export const HistoryPage = () => {
    const [sessionList, setSessionList] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [sessionData, setSessionData] = useState([]);
    const [currentTime, setCurrentTime] = useState(0); // 0-1 slider value
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadProgress, setLoadProgress] = useState(0);

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

    const handleDeleteUnnamedSessions = async () => {
        if (!window.confirm('Delete all unnamed (null) sessions? This cannot be undone.')) return;
        const success = await deleteUnnamedSessions();
        if (success) {
            setSessionList(prev => prev.filter(s => s.name !== null));
        }
    };

    const handleDeleteStatsBySession = async (sessionName) => {
        if (!window.confirm(`Delete all stats for session "${sessionName}"?`)) return;
        await deleteStatsByName(sessionName);
    };

    const loadSession = async (session_id) => {
        setIsLoading(true);
        setLoadProgress(0);
        try {
            const allData = await getAllSessionData(session_id, (loaded) => {
                setLoadProgress(loaded);
            });
            setSessionData(allData);
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

    const { startMs, endMs } = useMemo(() => {
        if (!selectedSession?.start_time || !selectedSession?.end_time) {
            return { startMs: 0, endMs: 0 };
        }
        return {
            startMs: new Date(selectedSession.start_time).getTime(),
            endMs: new Date(selectedSession.end_time).getTime()
        };
    }, [selectedSession]);

    const playbackData = useMemo(() => {
        if (!sessionData.length) return [];
        const currentTimestamp = startMs + (currentTime * (endMs - startMs));
        // Binary search: find the last index where timestamp <= currentTimestamp
        let lo = 0, hi = sessionData.length;
        while (lo < hi) {
            const mid = (lo + hi) >>> 1;
            if (sessionData[mid].timestamp <= currentTimestamp) lo = mid + 1;
            else hi = mid;
        }
        return sessionData.slice(0, lo);
    }, [sessionData, currentTime, startMs, endMs]);

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
                    onDeleteUnnamedSessions={handleDeleteUnnamedSessions}
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
                            <p className="text-muted">
                                Loading session data...{loadProgress > 0 && ` (${loadProgress.toLocaleString()} rows)`}
                            </p>
                        </Card>
                    ) : (
                        <>
                            {/* Playback Controls */}
                            <PlaybackControls
                                currentTime={currentTime}
                                setCurrentTime={setCurrentTime}
                                isPlaying={isPlaying}
                                setIsPlaying={setIsPlaying}
                                startMs={startMs}
                                endMs={endMs}
                            />

                            {/* Data Visualization */}
                            <div className="space-y-6">
                                <DataGroupPanel {...DATA_GROUPS.DYNAMICS} data={playbackData} />
                                <DataGroupPanel {...DATA_GROUPS.POWERTRAIN} data={playbackData} />
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
