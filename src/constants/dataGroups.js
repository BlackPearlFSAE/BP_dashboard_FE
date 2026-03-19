export const DATA_GROUPS = {
    DYNAMICS: {
        title: 'Dynamics',
        groups: ['front.mech', 'rear.mech', 'rear.odom'],
        description: 'Suspension, wheel speed, GPS & IMU data'
    },
    POWERTRAIN: {
        title: 'Powertrain',
        groups: ['front.elect', 'front.faults', 'bamo.power', 'bamo.temp'],
        description: 'Motor controller, inverter & electrical sensors'
    },
    BATTERY: {
        title: 'Battery',
        groups: [
            'bmu0.cells', 'bmu0.faults',
            'bmu1.cells', 'bmu1.faults',
            'bmu2.cells', 'bmu2.faults',
            'bmu3.cells', 'bmu3.faults',
            'bmu4.cells', 'bmu4.faults',
            'bmu5.cells', 'bmu5.faults',
            'bmu6.cells', 'bmu6.faults',
            'bmu7.cells', 'bmu7.faults'
        ],
        description: 'Cell voltages, temperatures & fault status'
    }
};

// Helper to get group category
export const getGroupCategory = (groupName) => {
    for (const [key, config] of Object.entries(DATA_GROUPS)) {
        if (config.groups.includes(groupName)) {
            return key;
        }
    }
    return 'UNKNOWN';
};

// Helper to get all BMU numbers
export const BMU_UNITS = ['bmu0', 'bmu1', 'bmu2', 'bmu3', 'bmu4', 'bmu5', 'bmu6', 'bmu7'];
