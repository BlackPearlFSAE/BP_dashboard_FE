// Use relative path for proxy in development, absolute for production if needed
const isDev = import.meta.env.DEV;
export const API_URL = isDev ? "/api/stat/" : "https://mctrl.kmutt.ac.th/ken-api/api/stat/";
export const DELETE_URL = isDev ? "/api/stat/delete-session" : "https://mctrl.kmutt.ac.th/ken-api/api/stat/delete-session";

export const fetchSessions = async () => {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
};

export const deleteSession = async (sessionId, experimentId) => {
    try {
        const response = await fetch(DELETE_URL, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ session_id: sessionId, experiment_id: experimentId })
        });
        return response.ok;
    } catch (error) {
        console.error("Delete Error:", error);
        return false;
    }
};
