// App.js
import '@fortawesome/fontawesome-free/css/all.min.css';

import React from 'react';
import SafeRouteMap from './components/SafeRouteMap';

function App() {
  return (
    <div>
      <h2 style={{ textAlign: 'center' }}>SafeRouteAI — Delhi Only</h2>
      <SafeRouteMap />
    </div>
  );
}

export default App;
