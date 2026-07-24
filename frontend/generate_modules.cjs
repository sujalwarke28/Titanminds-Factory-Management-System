const fs = require('fs');
const path = require('path');

const adminModules = ['Dashboard', 'FactoryOverview', 'MachineManagement', 'AiAnalytics', 'InfrastructureHealth', 'EnergyAnalytics', 'UserManagement', 'Alerts', 'Reports', 'Settings'];
const managerModules = ['Dashboard', 'FactoryOverview', 'ProductionAnalytics', 'MachineHealth', 'MaintenanceSchedule', 'FinancialInsights', 'Alerts', 'Reports'];
const engineerModules = ['Dashboard', 'MachineDiagnostics', 'LiveTelemetry', 'AiPredictions', 'MaintenanceCenter', 'MachineAnalytics', 'Alerts', 'Reports'];

const template = (name, role) => `import React from 'react';

const ${name} = () => {
  return (
    <div className="animate-fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-8)' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: 'var(--spacing-2)' }}>${name.replace(/([A-Z])/g, ' $1').trim()}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>${role} Portal / ${name.replace(/([A-Z])/g, ' $1').trim()}</p>
        </div>
      </div>
      <div className="glass-panel" style={{ padding: 'var(--spacing-8)', textAlign: 'center', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)' }}>
        <p>This module is currently under construction.</p>
      </div>
    </div>
  );
};

export default ${name};
`;

const generate = (modules, dir, role) => {
  modules.forEach(m => {
    fs.writeFileSync(path.join(__dirname, 'src', 'pages', dir, `${m}.jsx`), template(m, role));
  });
};

generate(adminModules, 'admin', 'Admin');
generate(managerModules, 'manager', 'Manager');
generate(engineerModules, 'engineer', 'Engineer');
console.log('All modules generated successfully.');
