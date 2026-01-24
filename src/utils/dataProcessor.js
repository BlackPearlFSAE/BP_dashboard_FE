
// Helper to flatten nested objects
export const flattenObject = (obj, prefix = "", res = {}) => {
    for (const key in obj) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (value !== null && typeof value === "object" && !Array.isArray(value)) {
            flattenObject(value, newKey, res);
        } else {
            res[newKey] = value;
        }
    }
    return res;
};

// Normalize data item to a standard structure
export const normalizeData = (item) => {
    const meta = {
        id: item.id,
        session_id: item.data?.session_id,
        experiment_id: item.data?.experiment_id,
        topic_name: item.data?.topic_name || item.data?.topic,
        timestamp: item.data?.data?.timestamp ?? item.data?.timestamp ?? new Date(item.createdAt).getTime(),
        createdAt: item.createdAt,
        original: item // Keep original just in case
    };

    const payload = item.data?.data ?? {};
    const flatPayload = flattenObject(payload);

    return { ...meta, ...flatPayload };
};

// Group raw data by Session ID and Experiment ID
export const groupDataBySession = (data) => {
    const grouped = {};

    data.forEach((item) => {
        // Correctly access the normalized property (not nested in data)
        const sid = item.session_id;
        const eid = item.experiment_id;

        // Log if missing for debugging
        if (sid === undefined || eid === undefined) {
            console.warn("Missing session/experiment ID:", item);
            return;
        }

        const key = `${sid}_${eid}`;

        if (!grouped[key]) {
            grouped[key] = {
                session_id: sid,
                experiment_id: eid,
                key: key,
                data: []
            };
        }
        grouped[key].data.push(item);
    });

    // Sort by key (or maybe by latest timestamp?)
    // For now return array of sessions sorted by key desc
    return Object.values(grouped).sort((a, b) => b.key.localeCompare(a.key));
};

// Get Topic Name safely
export const getTopicName = (item) => {
    return item?.data?.topic ?? item?.data?.topic_name ?? 'undefined';
};
