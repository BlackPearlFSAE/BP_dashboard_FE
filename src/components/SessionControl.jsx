import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Circle, Square } from 'lucide-react';
import { useSession } from '../context/SessionContext';

export const SessionControl = () => {
    const { activeSession, isRecording, startSession, stopSession, renameSession } = useSession();
    const [sessionName, setSessionName] = useState('');
    const [elapsed, setElapsed] = useState(0);
    const [isStarting, setIsStarting] = useState(false);
    const [isStopping, setIsStopping] = useState(false);

    // Update session name input when active session changes
    useEffect(() => {
        if (activeSession) {
            setSessionName(activeSession.name || '');
        } else {
            setSessionName('');
        }
    }, [activeSession]);

    // Timer for elapsed time display
    useEffect(() => {
        if (!isRecording || !activeSession) {
            setElapsed(0);
            return;
        }

        const startTime = new Date(activeSession.start_time).getTime();
        const updateElapsed = () => {
            const now = Date.now();
            const diff = Math.floor((now - startTime) / 1000); // seconds
            setElapsed(diff);
        };

        updateElapsed();
        const interval = setInterval(updateElapsed, 1000);

        return () => clearInterval(interval);
    }, [isRecording, activeSession]);

    const handleStart = async () => {
        setIsStarting(true);
        try {
            await startSession(sessionName || null);
        } catch (error) {
            console.error('Failed to start session:', error);
            alert('Failed to start recording session. Check console for details.');
        } finally {
            setIsStarting(false);
        }
    };

    const handleStop = async () => {
        if (!window.confirm('Stop recording session?')) return;

        setIsStopping(true);
        try {
            await stopSession();
        } catch (error) {
            console.error('Failed to stop session:', error);
            alert('Failed to stop recording session. Check console for details.');
        } finally {
            setIsStopping(false);
        }
    };

    const handleNameBlur = async () => {
        if (activeSession && sessionName !== activeSession.name) {
            try {
                await renameSession(activeSession.session_id, sessionName);
            } catch (error) {
                console.error('Failed to rename session:', error);
            }
        }
    };

    const formatDuration = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <Card className="p-4 border-l-4 border-l-primary">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {isRecording ? (
                    <>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Circle
                                    size={16}
                                    fill="#ef4444"
                                    className="text-red-500 animate-pulse"
                                />
                            </div>
                            <span className="font-mono font-bold text-red-500 text-lg">
                                REC {formatDuration(elapsed)}
                            </span>
                        </div>

                        <input
                            type="text"
                            value={sessionName}
                            onChange={(e) => setSessionName(e.target.value)}
                            onBlur={handleNameBlur}
                            placeholder="Session name (optional)"
                            className="flex-1 max-w-md bg-surface border border-border rounded px-4 py-2 text-text placeholder-muted focus:border-primary outline-none transition-colors"
                        />

                        <Button
                            variant="danger"
                            onClick={handleStop}
                            disabled={isStopping}
                        >
                            <Square size={18} fill="currentColor" />
                            {isStopping ? 'STOPPING...' : 'STOP RECORDING'}
                        </Button>
                    </>
                ) : (
                    <>
                        <div className="flex-1">
                            <p className="text-sm text-muted mb-2">
                                Session Name (Optional)
                            </p>
                            <input
                                type="text"
                                value={sessionName}
                                onChange={(e) => setSessionName(e.target.value)}
                                placeholder="Enter session name..."
                                className="w-full max-w-md bg-surface border border-border rounded px-4 py-2 text-text placeholder-muted focus:border-primary outline-none transition-colors"
                            />
                        </div>

                        <Button
                            variant="success"
                            onClick={handleStart}
                            disabled={isStarting}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            <Circle size={18} />
                            {isStarting ? 'STARTING...' : 'START RECORDING'}
                        </Button>
                    </>
                )}
            </div>
        </Card>
    );
};
