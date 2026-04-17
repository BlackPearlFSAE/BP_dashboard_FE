import { useState, useEffect, useRef, useCallback } from 'react';
import { createTelemetrySocket } from '../utils/websocket';
import { useTelemetryConfig } from '../context/TelemetryConfigContext';

const STALE_TIMEOUT_MS = 10000;
export const DEFAULT_BUFFER_LIMIT = 500;

// --- [CHANGED] 2B: Ring buffer replaces array spread+slice ---
// Original: bufferRef.current = [...bufferRef.current, message].slice(-limit)
// Problem: 2 array allocations per incoming message (~115/sec at 5Hz × 23 groups)
// Fix: O(1) push with zero allocation; toArray() only called at render-tick frequency
class RingBuffer {
    constructor(capacity) {
        this.buf = new Array(capacity);
        this.head = 0;
        this.size = 0;
        this.capacity = capacity;
    }
    push(item) {
        this.buf[this.head] = item;
        this.head = (this.head + 1) % this.capacity;
        if (this.size < this.capacity) this.size++;
    }
    toArray() {
        if (this.size === 0) return [];
        if (this.size < this.capacity) return this.buf.slice(0, this.size);
        // Buffer is full: oldest is at head, wrap around
        return [...this.buf.slice(this.head), ...this.buf.slice(0, this.head)];
    }
    clear() {
        this.head = 0;
        this.size = 0;
    }
}

// Batched Rendering: messages accumulate in a ring buffer (ref, not state),
// and a separate timer flushes to React state at renderInterval.
export const useTelemetryStream = ({ bufferLimit: bufferLimitProp } = {}) => {
    const config = useTelemetryConfig();
    const bufferLimit = bufferLimitProp ?? config?.bufferLimit ?? DEFAULT_BUFFER_LIMIT;
    const renderInterval = config?.renderInterval ?? 100;

    const [data, setData] = useState([]);
    const [wsStatus, setWsStatus] = useState('connecting');
    const [isStale, setIsStale] = useState(false);

    // --- [CHANGED] 2B: Ring buffer instead of plain array ref ---
    // Original: bufferRef = useRef([])
    const bufferRef = useRef(new RingBuffer(bufferLimit));
    const dirtyRef = useRef(false);
    const lastMessageRef = useRef(Date.now());
    const bufferLimitRef = useRef(bufferLimit);
    const renderIntervalRef = useRef(renderInterval);

    // --- [CHANGED] 2D: Track actual render timing for diagnostics ---
    const lastRenderTsRef = useRef(0);
    const renderDeltasRef = useRef([]);
    const msgCountRef = useRef(0);
    const msgRateRef = useRef(0);

    useEffect(() => { bufferLimitRef.current = bufferLimit; }, [bufferLimit]);
    useEffect(() => { renderIntervalRef.current = renderInterval; }, [renderInterval]);

    // Resize ring buffer if bufferLimit changes
    useEffect(() => {
        const old = bufferRef.current;
        if (old.capacity !== bufferLimit) {
            const newBuf = new RingBuffer(bufferLimit);
            const items = old.toArray();
            // Copy tail of old data into new buffer
            const start = Math.max(0, items.length - bufferLimit);
            for (let i = start; i < items.length; i++) newBuf.push(items[i]);
            bufferRef.current = newBuf;
        }
    }, [bufferLimit]);

    // --- [CHANGED] 2A: Stable onMessage callback, independent of renderInterval ---
    // Original: onMessage was defined inline inside the single useEffect
    const onMessage = useCallback((message) => {
        // --- [CHANGED] 2B: ring buffer push instead of spread+slice ---
        // Original: bufferRef.current = [...bufferRef.current, message].slice(-bufferLimitRef.current)
        bufferRef.current.push(message);
        dirtyRef.current = true;
        lastMessageRef.current = Date.now();
        msgCountRef.current++;
        setIsStale(false);
    }, []);

    const onStatus = useCallback((status) => setWsStatus(status), []);

    // --- [CHANGED] 2A: Effect 1 — WebSocket only, deps [] ---
    // Original: one useEffect owned socket + render timer + stale timer with [renderInterval] dep.
    // Problem: changing renderInterval tore down the WebSocket, causing a reconnect gap.
    // Fix: socket lives in its own effect, survives settings changes.
    useEffect(() => {
        const socket = createTelemetrySocket(onMessage, onStatus);

        const staleTimer = setInterval(() => {
            if (Date.now() - lastMessageRef.current > STALE_TIMEOUT_MS) {
                setIsStale(true);
            }
        }, STALE_TIMEOUT_MS);

        return () => {
            socket.cleanup();
            clearInterval(staleTimer);
        };
    }, [onMessage, onStatus]);

    // --- [CHANGED] 2A: Effect 2 — Render timer only, deps [renderInterval] ---
    // Original: render timer was bundled with socket in one effect.
    // Fix: only the setInterval is torn down/recreated when renderInterval changes. No reconnect.
    useEffect(() => {
        const renderTimer = setInterval(() => {
            if (dirtyRef.current) {
                // --- [CHANGED] 2B: toArray() from ring buffer instead of spread copy ---
                // Original: setData([...bufferRef.current])
                setData(bufferRef.current.toArray());
                dirtyRef.current = false;

                // --- [CHANGED] 2D: Measure actual render delta ---
                const now = Date.now();
                if (lastRenderTsRef.current > 0) {
                    const delta = now - lastRenderTsRef.current;
                    const deltas = renderDeltasRef.current;
                    deltas.push(delta);
                    if (deltas.length > 20) deltas.shift(); // rolling window of 20
                }
                lastRenderTsRef.current = now;
            }
        }, renderIntervalRef.current);

        // --- [CHANGED] 2D: Message rate counter (msgs/sec) ---
        const rateTimer = setInterval(() => {
            msgRateRef.current = msgCountRef.current;
            msgCountRef.current = 0;

            // Expose diagnostics on window for console inspection
            const deltas = renderDeltasRef.current;
            const avgDelta = deltas.length > 0
                ? Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length)
                : 0;
            window.__BP_DIAG = {
                configuredRenderInterval: renderIntervalRef.current,
                actualRenderDelta: avgDelta,
                msgPerSec: msgRateRef.current,
                bufferSize: bufferRef.current.size,
                bufferCapacity: bufferRef.current.capacity,
            };
        }, 1000);

        return () => {
            clearInterval(renderTimer);
            clearInterval(rateTimer);
        };
    }, [renderInterval]);

    // --- [CHANGED] 2D: Expose diagnostic stats alongside existing return values ---
    // Original: return { data, wsStatus, isStale }
    return { data, wsStatus, isStale, __diagRef: renderDeltasRef, __msgRateRef: msgRateRef };
};
