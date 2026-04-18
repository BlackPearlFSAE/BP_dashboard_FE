
export const SENSOR_DISPLAY_NAMES = {
    // ── Front Mechanical ──
    STR_Heave_mm:   'Heave_mm',
    STR_Roll_mm:    'Roll_mm',

    // ── Front Electrical ──
    I_SENSE:        'Accumulator Current',
    TMP:            'Radiator Temp',
    APPS:           'APPS_mm',
    BPPS:           'BPPS_mm',

    // ── Front Faults ──
    AMS_OK:         'AMS OK',
    IMD_OK:         'IMD OK',
    HV_ON:          'HV On',
    BSPD_OK:        'BSPD OK',

    // ── Mechanical (same raw keys on both front.mech and rear.mech groups;
    //    consumers differentiate by filtering data.group) ──
    Wheel_RPM_L:    'Wheel RPM Left',
    Wheel_RPM_R:    'Wheel RPM Right',

    // ── Rear Odometry ──
    gps_lat:        'GPS Latitude',
    gps_lng:        'GPS Longitude',
    gps_age:        'GPS Age',
    gps_course:     'GPS Course',
    gps_speed:      'GPS Speed',
    imu_accel_x:    'IMU Accel X',
    imu_accel_y:    'IMU Accel Y',
    imu_accel_z:    'IMU Accel Z',
    imu_gyro_x:     'IMU Gyro X',
    imu_gyro_y:     'IMU Gyro Y',
    imu_gyro_z:     'IMU Gyro Z',

    // ── BAMO Power ──
    canVoltage:         'Motor Voltage',
    canCurrent:         'Motor Current',
    power:              'Power',
    canVoltageValid:    'Motor Voltage Valid',
    canCurrentValid:    'Motor Current Valid',

    // ── BAMO Temp ──
    motorTemp:          'Motor Temp',
    controllerTemp:     'Controller Temp',
    motorTempValid:     'Motor Temp Valid',
    ctrlTempValid:      'Controller Temp Valid',

    // ── BMS ──
    V_MODULE:       'Module Voltage',
    V_CELL:         'Cell Voltage',
    TEMP_SENSE:     'Temp Sense',
    DV:             'Delta Voltage',
};

/**
 * Returns the display name for a raw sensor key.
 * Falls back to the raw key if no mapping exists.
 */
export const displayName = (key) => SENSOR_DISPLAY_NAMES[key] || key;
