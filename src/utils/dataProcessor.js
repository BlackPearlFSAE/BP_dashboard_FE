
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

// Normalize data item to keep group/values structure intact
export const normalizeData = (item) => {
    return {
        id: item.id,
        session_id: item.data?.session_id,
        experiment_id: item.data?.experiment_id,
        group: item.data?.group || 'unknown',
        values: item.data?.values || {},
        timestamp: item.data?.timestamp ?? new Date(item.createdAt).getTime(),
        createdAt: item.createdAt,
        original: item // Keep original just in case
    };
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

// Get all unique groups (topics) from data
export const getAvailableGroups = (data) => {
    const groups = new Set();
    data.forEach(item => {
        if (item.group) groups.add(item.group);
    });
    return Array.from(groups).sort();
};

// Get all value keys available in a specific group
export const getValuesForGroup = (data, group) => {
    const valueKeys = new Set();
    data.forEach(item => {
        if (item.group === group && item.values) {
            Object.keys(item.values).forEach(key => valueKeys.add(key));
        }
    });
    return Array.from(valueKeys).sort();
};

// Get Topic Name safely (for backwards compatibility)
export const getTopicName = (item) => {
    return item?.group ?? item?.data?.topic ?? item?.data?.topic_name ?? 'undefined';
};
