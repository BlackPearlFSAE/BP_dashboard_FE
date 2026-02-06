import React from 'react';
import { Cog, MapPin, Zap, Battery } from 'lucide-react';

export const DATA_GROUPS = {
    MECHANICAL: {
        title: 'Mechanical Dynamics',
        groups: ['front.mech', 'rear.mech'],
        icon: <Cog size={24} className="text-primary" />,
        description: 'Vehicle dynamics, drivetrain, and powertrain data'
    },
    ODOMETRY: {
        title: 'Odometry & Navigation',
        groups: ['rear.odom'],
        icon: <MapPin size={24} className="text-primary" />,
        description: 'GPS positioning and IMU sensor data'
    },
    ELECTRICAL: {
        title: 'Electrical Systems',
        groups: ['front.elect', 'front.faults', 'bamo.power', 'bamo.temp'],
        icon: <Zap size={24} className="text-primary" />,
        description: 'Electrical faults and motor controller data'
    },
    BMS: {
        title: 'Battery Management',
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
        icon: <Battery size={24} className="text-primary" />,
        description: 'Battery cell voltages, temperatures, and fault status'
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
