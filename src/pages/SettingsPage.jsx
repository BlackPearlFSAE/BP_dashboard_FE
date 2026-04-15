import { useTelemetryConfig } from '../context/TelemetryConfigContext';

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
                    {/* TODO: fetch actual value from backend config endpoint */}
                    {/* TODO: enable editing when authenticated as dev (role-gated) */}
                    {/* TODO: persist to DB so it syncs across all tabs/machines */}
                    <StepInput
                        value={200}
                        onChange={() => {}}
                        step={50}
                        min={50}
                        max={5000}
                        unit="ms"
                        disabled
                    />
                    <p className="text-xs text-muted italic">
                        Read-only — authenticate as developer to modify.
                    </p>
                </div>
            </section>
        </div>
    );
};
