// Relative by default (FE & BE served from same origin via nginx/Vite proxy).
// Set VITE_API_URL at build time to override (e.g. Netlify FE → Render BE).
const BASE_URL = import.meta.env.VITE_API_URL ?? "";
export const API_URL = `${BASE_URL}/api/stat/`;
export const SESSION_API_URL = `${BASE_URL}/api/session`;
export const CONFIG_API_URL = `${BASE_URL}/api/config`;
export const STAT_DELETE_URL = `${BASE_URL}/api/stat/delete`;

export const fetchConfig = async () => {
    const response = await fetch(CONFIG_API_URL);
    if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.status}`);
    }
    return await response.json();
};

export const fetchSessions = async (since = null) => {
    const url = since ? `${API_URL}?since=${encodeURIComponent(since)}` : API_URL;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
};

export const deleteStatsByName = async (session_name) => {
    try {
        const response = await fetch(STAT_DELETE_URL, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_name })
        });
        return response.ok;
    } catch (error) {
        console.error("Delete Error:", error);
        return false;
    }
};

export const deleteUnnamedStats = async () => {
    try {
        const response = await fetch(`${BASE_URL}/api/stat/delete-unnamed`, {
            method: 'DELETE'
        });
        return response.ok;
    } catch (error) {
        console.error("Delete Error:", error);
        return false;
    }
};

export const deleteAllStats = async () => {
    try {
        const response = await fetch(`${BASE_URL}/api/stat/delete-all`, {
            method: 'DELETE'
        });
        return response.ok;
    } catch (error) {
        console.error("Delete Error:", error);
        return false;
    }
};

// Session Management API Functions
export const startSession = async (name) => {
    const response = await fetch(`${SESSION_API_URL}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    if (!response.ok) {
        throw new Error(`Failed to start session: ${response.status}`);
    }
    return await response.json();
};

export const stopSession = async (session_id) => {
    const response = await fetch(`${SESSION_API_URL}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id })
    });
    if (!response.ok) {
        throw new Error(`Failed to stop session: ${response.status}`);
    }
    return await response.json();
};

export const getActiveSession = async () => {
    const response = await fetch(`${SESSION_API_URL}/active`);
    if (!response.ok) {
        return null;
    }
    return await response.json();
};

export const getSessionList = async (limit = 50, offset = 0) => {
    const response = await fetch(`${SESSION_API_URL}/list?limit=${limit}&offset=${offset}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch session list: ${response.status}`);
    }
    return await response.json();
};

export const getSessionData = async (session_id, offset = 0, limit = 1000) => {
    const response = await fetch(`${SESSION_API_URL}/${session_id}/data?offset=${offset}&limit=${limit}&normalized=true`);
    if (!response.ok) {
        throw new Error(`Failed to fetch session data: ${response.status}`);
    }
    return await response.json();
};

const PAGE_SIZE = 10000;

/**
 * Fetch all data for a session in paginated batches.
 * @param {string} session_id
 * @param {(loaded: number) => void} [onProgress] - called after each page with total rows loaded so far
 * @returns {Promise<Array>} all normalized rows, sorted by timestamp
 */
export const getAllSessionData = async (session_id, onProgress) => {
    const all = [];
    let offset = 0;
    while (true) {
        const batch = await getSessionData(session_id, offset, PAGE_SIZE);
        all.push(...batch);
        if (onProgress) onProgress(all.length);
        if (batch.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
    }
    all.sort((a, b) => a.timestamp - b.timestamp);
    return all;
};

export const renameSession = async (session_id, name) => {
    const response = await fetch(`${SESSION_API_URL}/${session_id}/rename`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    if (!response.ok) {
        throw new Error(`Failed to rename session: ${response.status}`);
    }
    return await response.json();
};

export const deleteSessionById = async (session_id) => {
    const response = await fetch(`${SESSION_API_URL}/${session_id}`, {
        method: 'DELETE'
    });
    return response.ok;
};

export const deleteAllSessions = async () => {
    const response = await fetch(`${SESSION_API_URL}/delete-all`, {
        method: 'DELETE'
    });
    return response.ok;
};

export const deleteUnnamedSessions = async () => {
    const response = await fetch(`${SESSION_API_URL}/delete-unnamed`, {
        method: 'DELETE'
    });
    return response.ok;
};
