
// Scaling configuration for raw sensor values
// Formula: display_value = raw * scale + offset
const SCALE_CONFIG = {
    // Voltage fields (multiply by 0.02 to get Volts)
    V_MODULE: { scale: 0.02, offset: 0, unit: 'V' },
    V_CELL: { scale: 0.02, offset: 0, unit: 'V' },
    // Temperature fields (multiply by 0.5, subtract 40 to get Celsius)
    TEMP_SENSE: { scale: 0.5, offset: -40, unit: '°C' },
    // Delta voltage (multiply by 0.1 to get Volts)
    DV: { scale: 0.1, offset: 0, unit: 'V' },
};

// Apply scaling to a value based on field name
const applyScaling = (key, value) => {
    // Extract base field name (e.g., "V_CELL" from "V_CELL.0" or "bmu0.cells.V_CELL")
    const baseKey = key.split('.').pop().replace(/\[\d+\]$/, '');
    const config = SCALE_CONFIG[baseKey];

    if (!config) return value;

    // Handle arrays
    if (Array.isArray(value)) {
        return value.map(v => typeof v === 'number' ? v * config.scale + config.offset : v);
    }

    // Handle single numeric values
    if (typeof value === 'number') {
        return value * config.scale + config.offset;
    }

    return value;
};

// Helper to flatten nested objects and apply scaling
export const flattenObject = (obj, prefix = "", res = {}) => {
    for (const key in obj) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (Array.isArray(value)) {
            // Flatten arrays with indexed keys (e.g., V_CELL[0] → V_CELL.0)
            value.forEach((val, idx) => {
                const indexedKey = `${newKey}.${idx}`;
                const scaledVal = applyScaling(key, val);
                res[indexedKey] = scaledVal;
            });
        } else if (value !== null && typeof value === "object") {
            // Recursively flatten nested objects
            flattenObject(value, newKey, res);
        } else {
            // Apply scaling to primitive values
            res[newKey] = applyScaling(key, value);
        }
    }
    return res;
};

// Normalize data item to a standard structure
export const normalizeData = (item) => {
    // Handle new group-based format
    if (item.data?.type === 'data' && item.data?.group) {
        const meta = {
            id: item.id,
            session_id: item.session_id, // Now at top level in Stat model
            timestamp: item.data.timestamp,
            createdAt: item.createdAt,
            original: item
        };

        // Flatten the values object (d or values)
        const payload = item.data.values || item.data.d || {};
        const flatPayload = flattenObject(payload);

        return { ...meta, ...flatPayload };
    }

    // Handle old topic-based format (backward compatibility)
    const meta = {
        id: item.id,
        session_id: item.data?.session_id,
        experiment_id: item.data?.experiment_id,
        topic_name: item.data?.topic_name || item.data?.topic,
        timestamp: item.data?.data?.timestamp ?? item.data?.timestamp ?? new Date(item.createdAt).getTime(),
        createdAt: item.createdAt,
        original: item
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
