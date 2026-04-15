import { useState, useEffect, useRef } from 'react';
import { createTelemetrySocket } from '../utils/websocket';
import { useTelemetryConfig } from '../context/TelemetryConfigContext';

const STALE_TIMEOUT_MS = 10000;

export const DEFAULT_BUFFER_LIMIT = 500;

export const useTelemetryStream = ({ bufferLimit: bufferLimitProp } = {}) => {
    const config = useTelemetryConfig();
    const bufferLimit = bufferLimitProp ?? config?.bufferLimit ?? DEFAULT_BUFFER_LIMIT;
    const renderInterval = config?.renderInterval ?? 100;

    const [data, setData] = useState([]);
    const [wsStatus, setWsStatus] = useState('connecting');
    const [isStale, setIsStale] = useState(false);

    const bufferRef = useRef([]);
    const dirtyRef = useRef(false);
    const lastMessageRef = useRef(Date.now());
    const bufferLimitRef = useRef(bufferLimit);
    const renderIntervalRef = useRef(renderInterval);

    useEffect(() => { bufferLimitRef.current = bufferLimit; }, [bufferLimit]);
    useEffect(() => { renderIntervalRef.current = renderInterval; }, [renderInterval]);

    useEffect(() => {
        // Throttled render loop — flushes buffer to React state at renderInterval
        let renderTimer = setInterval(() => {
            if (dirtyRef.current) {
                setData([...bufferRef.current]);
                dirtyRef.current = false;
            }
        }, renderIntervalRef.current);

        const staleTimer = setInterval(() => {
            if (Date.now() - lastMessageRef.current > STALE_TIMEOUT_MS) {
                setIsStale(true);
            }
        }, STALE_TIMEOUT_MS);

        const socket = createTelemetrySocket(
            (message) => {
                bufferRef.current = [...bufferRef.current, message].slice(-bufferLimitRef.current);
                dirtyRef.current = true;
                lastMessageRef.current = Date.now();
                setIsStale(false);
            },
            (status) => setWsStatus(status)
        );

        return () => {
            socket.cleanup();
            clearInterval(renderTimer);
            clearInterval(staleTimer);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [renderInterval]); // re-mount when renderInterval changes

    return { data, wsStatus, isStale };
};
