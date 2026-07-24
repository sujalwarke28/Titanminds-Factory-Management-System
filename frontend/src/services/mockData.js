export const generateMockData = () => {
  // Utility for time series
  const generateTimeSeries = (points, baseValue, variance) => {
    return Array.from({ length: points }).map((_, i) => ({
      time: new Date(Date.now() - (points - i) * 60000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      value: Number((baseValue + (Math.random() * variance * 2 - variance)).toFixed(2))
    }));
  };

  const generateWeeklyTrend = () => {
    return [
      { day: 'Mon', value: 92 },
      { day: 'Tue', value: 94 },
      { day: 'Wed', value: 91 },
      { day: 'Thu', value: 88 },
      { day: 'Fri', value: 90 },
      { day: 'Sat', value: 93 },
      { day: 'Sun', value: 95 }
    ];
  };

  // --- MANAGER DATA (Business & Operational) ---
  const managerData = {
    factoryKPIs: {
      factoryHealth: 92.5,
      oee: 84.2,
      totalMachines: 150,
      activeMachines: 142,
      todaysFailures: 1,
      activeAnomalies: 4
    },
    financialOverview: {
      estimatedCostSavings: 1250000, // Rs
      predictedDowntimePrevented: 45, // Hours
      scheduledMaintenance: 8
    },
    fleetOverview: {
      healthy: 125,
      warning: 22,
      critical: 3
    },
    healthTrends: {
      fleetHealthTrend: 3.2,
      historicalTrend: generateWeeklyTrend()
    },
    productionOverview: {
      productionVolume: 12450,
      targetAchievement: 98.5
    },
    criticalMachines: [
      { id: 'CNC-104', health: 45, failureProb: 88, rul: 2, status: 'Critical', recommendation: 'Replace Spindle Bearing' },
      { id: 'CNC-082', health: 58, failureProb: 65, rul: 5, status: 'Warning', recommendation: 'Lubricate Z-Axis' },
      { id: 'CNC-119', health: 62, failureProb: 55, rul: 8, status: 'Warning', recommendation: 'Check Coolant System' }
    ]
  };

  // --- ENGINEER DATA (Machine-Specific Diagnostics) ---
  const engineerData = {
    machineOverview: {
      machineId: 'CNC-104',
      healthScore: 45,
      failureProbability: 88,
      machineStatus: 'Critical'
    },
    liveTelemetry: {
      temperature: generateTimeSeries(20, 85, 5), // High temp
      vibration: generateTimeSeries(20, 4.2, 0.8), // High vib
      voltage: generateTimeSeries(20, 415, 2),
      pressure: generateTimeSeries(20, 95, 10), // Low pressure
      rpm: generateTimeSeries(20, 7800, 200),
      flowRate: generateTimeSeries(20, 82, 5)
    },
    predictiveAI: {
      failureProbability: 88,
      rulDays: 2,
      aiConfidence: 96.5
    },
    explainableAI: [
      { name: 'Vibration', weight: 45 },
      { name: 'Temperature', weight: 35 },
      { name: 'Pressure', weight: 12 },
      { name: 'Voltage', weight: 5 },
      { name: 'Other', weight: 3 }
    ],
    maintenanceAnalytics: {
      toolWear: 82.5,
      lifeRemainingHrs: 14,
      estimatedMaintenanceTime: 2.5 // Hours
    },
    recommendations: [
      'Inspect and replace main spindle bearings.',
      'Check coolant pump pressure, currently 15% below threshold.',
      'Reduce machine load by 20% until maintenance is performed.'
    ],
    runtimeAnalytics: {
      runtimeHours: 4200,
      idleTime: 180,
      assetUptime: 96.2
    }
  };

  // --- ADMIN DATA (System Control Panel) ---
  const adminData = {
    systemKPIs: {
      connectedMachines: 150,
      connectedSensors: 450, // 3 per machine
      apiLatency: 42, // ms
      sensorUptime: 99.9
    },
    factoryKPIs: {
      factoryHealth: 92.5,
      oee: 84.2,
      todaysFailures: 1,
      activeAlerts: 7
    },
    aiMetrics: {
      avgConfidence: 94.8,
      predictionAccuracy: 97.2,
      falsePositives: 12,
      falseNegatives: 2
    },
    infrastructureHealth: {
      database: 'Operational',
      api: 'Operational',
      wifi: 'Degraded', // Example
      cloud: 'Operational'
    },
    sensorMonitoring: {
      temperatureSensors: 'Online',
      vibrationSensors: 'Online',
      voltageSensors: 'Online',
      esp32Devices: '1 Offline'
    },
    energyAnalytics: {
      gridPower: 65,
      solarPower: 35,
      consumptionDrift: -2.4
    },
    userManagement: {
      admins: 3,
      managers: 12,
      engineers: 45
    }
  };

  return { managerData, engineerData, adminData };
};

// Simulate API call
export const fetchDashboardData = async () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(generateMockData()), 600);
  });
};
