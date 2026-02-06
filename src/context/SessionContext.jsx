import React, { createContext, useContext, useState, useEffect } from 'react';
import { startSession as startSessionAPI, stopSession as stopSessionAPI, getActiveSession, renameSession as renameSessionAPI } from '../utils/api';

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
    const [activeSession, setActiveSession] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Sync with backend on mount (handles browser refresh during recording)
    useEffect(() => {
        const syncActiveSession = async () => {
            try {
                const session = await getActiveSession();
                if (session) {
                    setActiveSession(session);
                    setIsRecording(true);
                    console.log('[SESSION] Restored active session:', session.session_id);
                }
            } catch (error) {
                console.error('[SESSION] Failed to sync active session:', error);
            } finally {
                setIsLoading(false);
            }
        };

        syncActiveSession();
    }, []);

    const startSession = async (name = null) => {
        try {
            const session = await startSessionAPI(name);
            setActiveSession(session);
            setIsRecording(true);
            console.log('[SESSION] Started:', session.session_id);
            return session;
        } catch (error) {
            console.error('[SESSION] Failed to start:', error);
            throw error;
        }
    };

    const stopSession = async () => {
        if (!activeSession) {
            console.warn('[SESSION] No active session to stop');
            return;
        }

        try {
            const stoppedSession = await stopSessionAPI(activeSession.session_id);
            setActiveSession(null);
            setIsRecording(false);
            console.log('[SESSION] Stopped:', stoppedSession.session_id);
            return stoppedSession;
        } catch (error) {
            console.error('[SESSION] Failed to stop:', error);
            throw error;
        }
    };

    const renameSession = async (session_id, name) => {
        try {
            const updated = await renameSessionAPI(session_id, name);
            if (activeSession && activeSession.session_id === session_id) {
                setActiveSession({ ...activeSession, name: updated.name });
            }
            console.log('[SESSION] Renamed:', session_id, '→', name);
            return updated;
        } catch (error) {
            console.error('[SESSION] Failed to rename:', error);
            throw error;
        }
    };

    return (
        <SessionContext.Provider
            value={{
                activeSession,
                isRecording,
                isLoading,
                startSession,
                stopSession,
                renameSession
            }}
        >
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSession must be used within SessionProvider');
    }
    return context;
};
