import { createContext, useContext, useState } from 'react';

const DEFAULT_BUFFER_LIMIT = 500;
const LS_RENDER_KEY = 'bp_default_render_interval';
const LS_BUFFER_KEY = 'bp_default_buffer_limit';

const DEFAULT_RENDER_INTERVAL = parseInt(localStorage.getItem(LS_RENDER_KEY)) || 100;
const STORED_BUFFER_LIMIT = parseInt(localStorage.getItem(LS_BUFFER_KEY)) || DEFAULT_BUFFER_LIMIT;

const TelemetryConfigContext = createContext();

export const TelemetryConfigProvider = ({ children }) => {
    const [bufferLimit, _setBufferLimit] = useState(STORED_BUFFER_LIMIT);
    const [renderInterval, _setRenderInterval] = useState(DEFAULT_RENDER_INTERVAL);

    const setBufferLimit = (value) => {
        _setBufferLimit(value);
        localStorage.setItem(LS_BUFFER_KEY, String(value));
    };

    const setRenderInterval = (value) => {
        _setRenderInterval(value);
        localStorage.setItem(LS_RENDER_KEY, String(value));
    };

    return (
        <TelemetryConfigContext.Provider value={{
            bufferLimit, setBufferLimit,
            renderInterval, setRenderInterval,
        }}>
            {children}
        </TelemetryConfigContext.Provider>
    );
};

export const useTelemetryConfig = () => useContext(TelemetryConfigContext);
