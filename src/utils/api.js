// Use relative path for proxy in development, absolute for production if needed
const isDev = import.meta.env.DEV;
const BASE_URL = isDev ? "" : "https://blackpearl-ws-8z9a.onrender.com";
export const API_URL = `${BASE_URL}/api/stat/`;
export const SESSION_API_URL = `${BASE_URL}/api/session`;
export const STAT_DELETE_URL = `${BASE_URL}/api/stat/delete`;

export const fetchSessions = async () => {
    const response = await fetch(API_URL);
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
    const response = await fetch(`${SESSION_API_URL}/${session_id}/data?offset=${offset}&limit=${limit}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch session data: ${response.status}`);
    }
    return await response.json();
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
