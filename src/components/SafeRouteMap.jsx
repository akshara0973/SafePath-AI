// /components/SafeRouteMap.js
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const unsafeZones = [
  [28.6139, 77.2090], // CP
  [28.7041, 77.1025], // West Delhi
];

const SafeRouteMap = () => {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [route, setRoute] = useState([]);

  // Delhi location search options (basic simulation)
  const locations = {
    'India Gate': [28.6129, 77.2295],
    'Connaught Place': [28.6315, 77.2167],
    'Karol Bagh': [28.6517, 77.1905],
    'Dwarka': [28.5921, 77.0460],
    'Janakpuri': [28.6218, 77.0897],
  };

  const handleRoute = () => {
    if (!locations[source] || !locations[destination]) {
      alert('Please select valid Delhi locations!');
      return;
    }

    const routePath = [locations[source], locations[destination]];
    setRoute(routePath);

    // Check unsafe zones
    routePath.forEach((point) => {
      unsafeZones.forEach((uz) => {
        const dist = L.latLng(point).distanceTo(L.latLng(uz));
        if (dist < 300) {
          new Audio('/beep.mp3').play();
          alert('⚠️ Warning: Unsafe zone near route!');
        }
      });
    });
  };

  return (
    <div>
      <div style={{ margin: '1rem' }}>
        <label>Source: </label>
        <select value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">--Select--</option>
          {Object.keys(locations).map((loc, idx) => (
            <option key={idx} value={loc}>{loc}</option>
          ))}
        </select>

        <label style={{ marginLeft: '1rem' }}>Destination: </label>
        <select value={destination} onChange={(e) => setDestination(e.target.value)}>
          <option value="">--Select--</option>
          {Object.keys(locations).map((loc, idx) => (
            <option key={idx} value={loc}>{loc}</option>
          ))}
        </select>

        <button onClick={handleRoute} style={{ marginLeft: '1rem' }}>
          Show Route
        </button>
      </div>

      <MapContainer center={[28.6139, 77.2090]} zoom={12} style={{ height: '80vh', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {unsafeZones.map((pos, i) => (
          <Marker key={`uz-${i}`} position={pos}></Marker>
        ))}
        {route.map((pos, i) => (
          <Marker key={`r-${i}`} position={pos}></Marker>
        ))}
        {route.length === 2 && <Polyline positions={route} color="blue" />}
      </MapContainer>
    </div>
  );
};

export default SafeRouteMap;
