import React from 'react';

function App() {
  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      marginTop: '80px'
    }}>
      <h1>🚀 CI/CD Pipeline Demo</h1>
      <p>React app deployed via Jenkins → Docker → SonarQube → Trivy → Amazon EKS</p>
      <p>Built by NM&amp;CO</p>
    </div>
  );
}

export default App;
