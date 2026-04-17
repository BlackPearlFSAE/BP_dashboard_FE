import { useEffect, useState } from 'react';
import { useTelemetryConfig } from '../context/TelemetryConfigContext';
import { fetchConfig } from '../utils/api';

// --- [CHANGED] 2D: Hook to read live diagnostics from window.__BP_DIAG ---
// Polls the diagnostics object exposed by useTelemetryStream every second
const useLiveDiag = () => {
    const [diag, setDiag] = useState(null);
    useEffect(() => {
        const timer = setInterval(() => {
            if (window.__BP_DIAG) setDiag({ ...window.__BP_DIAG });
        }, 1000);
        return () => clearInterval(timer);
    }, []);
    return diag;
};

const StepInput = ({ value, onChange, step, min, max, unit, disabled }) => {
    const decrement = () => onChange(Math.max(min, value - step));
    const increment = () => onChange(Math.min(max, value + step));

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={decrement}
                disabled={disabled || value <= min}
                className="w-8 h-8 flex items-center justify-center rounded border border-border text-text hover:bg-surfaceHighlight disabled:opacity-30 transition-colors font-mono"
            >
                −
            </button>
            <input
                type="number"
                value={value}
                onChange={e => {
                    const v = parseInt(e.target.value);
                    if (!isNaN(v) && !disabled) onChange(Math.max(min, Math.min(max, v)));
                }}
                disabled={disabled}
                className="w-24 text-center bg-background border border-border rounded px-2 py-1.5 text-text font-mono focus:border-primary outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
                onClick={increment}
                disabled={disabled || value >= max}
                className="w-8 h-8 flex items-center justify-center rounded border border-border text-text hover:bg-surfaceHighlight disabled:opacity-30 transition-colors font-mono"
            >
                +
            </button>
            <span className="text-sm text-muted">{unit}</span>
        </div>
    );
};

export const SettingsPage = () => {
    const { renderInterval, setRenderInterval, bufferLimit, setBufferLimit } = useTelemetryConfig();
    const [backendPublishInterval, setBackendPublishInterval] = useState(null);
    const [configError, setConfigError] = useState(null);
    // --- [CHANGED] 2D: Live diagnostics from useTelemetryStream ---
    const diag = useLiveDiag();

    useEffect(() => {
        fetchConfig()
            .then(cfg => setBackendPublishInterval(cfg.publishInterval))
            .catch(err => setConfigError(err.message));
    }, []);

    return (
        <div className="space-y-10 max-w-xl">
            <div>
                <h1 className="text-3xl font-bold text-text tracking-tight">Settings</h1>
                <p className="text-muted text-sm mt-1">Dashboard configuration</p>
            </div>

            {/* ── Display ── */}
            <section className="space-y-6">
                <h2 className="text-xs font-mono text-muted uppercase tracking-widest border-b border-border pb-2">
                    Display
                </h2>

                <div className="space-y-2">
                    <p className="text-sm font-semibold text-text">Render Interval</p>
                    <p className="text-xs text-muted">
                        How often the charts re-draw with new data. Lower = smoother, higher CPU.
                        Saved to browser storage automatically.
                    </p>
                    <StepInput
                        value={renderInterval}
                        onChange={setRenderInterval}
                        step={50}
                        min={50}
                        max={2000}
                        unit="ms"
                    />
                    {/* --- [CHANGED] 2D: Live actual render rate + explanatory note --- */}
                    {/* Original: no feedback on whether configured interval matches reality */}
                    {diag && (
                        <div className="mt-2 p-2 rounded bg-surface border border-border text-xs font-mono space-y-1">
                            <div className="flex justify-between">
                                <span className="text-muted">Actual render delta</span>
                                <span className="text-text">{diag.actualRenderDelta} ms</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted">Messages/sec</span>
                                <span className="text-text">{diag.msgPerSec}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted">Buffer</span>
                                <span className="text-text">{diag.bufferSize} / {diag.bufferCapacity}</span>
                            </div>
                        </div>
                    )}
                    <p className="text-xs text-muted mt-1">
                        Effective render rate is limited by the data source publish rate
                        {backendPublishInterval != null && ` and the server broadcast interval (${backendPublishInterval} ms)`}.
                        Setting render interval below these values won't produce faster visual updates.
                    </p>
                </div>

                <div className="space-y-2">
                    <p className="text-sm font-semibold text-text">Buffer Size</p>
                    <p className="text-xs text-muted">
                        Max data points kept in memory per chart. Higher = longer scroll-back, more RAM.
                    </p>
                    <StepInput
                        value={bufferLimit}
                        onChange={setBufferLimit}
                        step={100}
                        min={100}
                        max={5000}
                        unit="points"
                    />
                </div>
            </section>

            {/* ── Developer Settings ── */}
            <section className="space-y-6 opacity-60">
                <h2 className="text-xs font-mono text-muted uppercase tracking-widest border-b border-border pb-2">
                    Developer Settings
                </h2>

                <div className="space-y-2">
                    <p className="text-sm font-semibold text-text">Publish Rate</p>
                    <p className="text-xs text-muted">
                        Server-side broadcast rate. Controlled via backend .env — requires dev authentication to change.
                    </p>
                    {/* TODO: enable editing when authenticated as dev (role-gated) */}
                    <StepInput
                        value={backendPublishInterval ?? 0}
                        onChange={() => {}}
                        step={50}
                        min={50}
                        max={5000}
                        unit="ms"
                        disabled
                    />
                    <p className="text-xs text-muted italic">
                        {configError
                            ? `Failed to load: ${configError}`
                            : backendPublishInterval === null
                                ? 'Loading from backend…'
                                : 'Read-only — authenticate as developer to modify.'}
                    </p>
                </div>
            </section>
        </div>
    );
};
