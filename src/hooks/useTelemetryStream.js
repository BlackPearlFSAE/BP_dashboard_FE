import { useState, useEffect, useRef, useCallback } from 'react';
import { createTelemetrySocket } from '../utils/websocket';

const BUFFER_LIMIT = 500;
const RENDER_INTERVAL_MS = 100; // ~10fps max render rate
const STALE_TIMEOUT_MS = 10000; // clear charts after 10s of no data

export const useTelemetryStream = () => {
    const [data, setData] = useState([]);
    const [wsStatus, setWsStatus] = useState('connecting');
    const [isStale, setIsStale] = useState(false);
    const bufferRef = useRef([]);
    const dirtyRef = useRef(false);
    const lastMessageRef = useRef(Date.now());
    const renderTimerRef = useRef(null);
    const staleTimerRef = useRef(null);

    useEffect(() => {
        // Throttled render loop — only flushes buffer to state at fixed interval
        renderTimerRef.current = setInterval(() => {
            if (dirtyRef.current) {
                setData([...bufferRef.current]);
                dirtyRef.current = false;
            }
        }, RENDER_INTERVAL_MS);

        // Stale data check
        staleTimerRef.current = setInterval(() => {
            if (Date.now() - lastMessageRef.current > STALE_TIMEOUT_MS) {
                setIsStale(true);
            }
        }, STALE_TIMEOUT_MS);

        const cleanup = createTelemetrySocket(
            (message) => {
                // Backend sends pre-normalized data — push directly into buffer
                bufferRef.current = [...bufferRef.current, message].slice(-BUFFER_LIMIT);
                dirtyRef.current = true;
                lastMessageRef.current = Date.now();
                setIsStale(false);
            },
            (status) => setWsStatus(status)
        );

        return () => {
            cleanup();
            clearInterval(renderTimerRef.current);
            clearInterval(staleTimerRef.current);
        };
    }, []);

    return { data, wsStatus, isStale };
};
