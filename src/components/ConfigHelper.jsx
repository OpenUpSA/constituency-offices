import React, { useState } from 'react';

const ConfigHelper = ({ onClose }) => {
  const [showConfig, setShowConfig] = useState(false);

  return (
    <div className="config-helper">
      <div className="config-card">
        <h3>🔧 NocoDB Configuration</h3>
        
        <p>To connect to your NocoDB database, update the <code>.env</code> file with your configuration:</p>
        
        <div className="config-example">
          <h4>Example .env configuration:</h4>
          <pre>{`VITE_NOCODB_API_URL=http://localhost:8080
VITE_NOCODB_API_TOKEN=your-api-token-here
VITE_NOCODB_BASE_ID=your-base-id-here
VITE_NOCODB_TABLE_ID=your-table-id-here`}</pre>
        </div>

        <div className="config-steps">
          <h4>Setup Steps:</h4>
          <ol>
            <li>Start your NocoDB instance</li>
            <li>Create a new project/base</li>
            <li>Create a table with columns: name, latitude, longitude, address, type</li>
            <li>Generate an API token in NocoDB settings</li>
            <li>Copy the Base ID and Table ID from the URL</li>
            <li>Update the .env file with your values</li>
            <li>Restart the development server</li>
          </ol>
        </div>

        <div className="config-note">
          <p><strong>Note:</strong> The app will use mock data if NocoDB is not configured.</p>
        </div>

        <button onClick={onClose} className="close-btn">
          Got it!
        </button>
      </div>
    </div>
  );
};

export default ConfigHelper;
