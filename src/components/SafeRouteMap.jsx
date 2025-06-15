import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import carImage from '../assets/car.jpg'; // adjust path as needed

// Load car icon
const carIcon = new L.Icon({
  iconUrl: carImage,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// Dummy unsafe locations in Delhi
const unsafeLocations = [
  [28.644800, 77.216721], // CP
  [28.704060, 77.102493], // Karol Bagh
  [28.535517, 77.391029], // Noida border
];

// Check if near unsafe location
const isNearUnsafe = (position) => {
  const threshold = 0.003; // ~300 meters
  return unsafeLocations.some(
    ([lat, lng]) =>
      Math.abs(lat - position[0]) < threshold &&
      Math.abs(lng - position[1]) < threshold
  );
};

// Auto-fit route
function MapUpdater({ route }) {
  const map = useMap();
  useEffect(() => {
    if (route.length === 2) {
      map.fitBounds(route);
    }
  }, [route, map]);
  return null;
}

export default function SafeRouteMap() {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [route, setRoute] = useState([]);
  const [carPosition, setCarPosition] = useState(null);
  const [showAlert, setShowAlert] = useState(false);

  const handleRoute = () => {
    const locations = {
      cp: [28.644800, 77.216721],
      karolbagh: [28.651952, 77.190374],
      rajiv: [28.6330, 77.2197],
      noida: [28.535517, 77.391029],
      aiims: [28.5672, 77.2100],
    };

    const srcCoord = locations[source.toLowerCase()];
    const destCoord = locations[destination.toLowerCase()];

    if (srcCoord && destCoord) {
      setRoute([srcCoord, destCoord]);
    } else {
      alert('Enter valid Delhi locations (cp, karolbagh, rajiv, noida, aiims)');
    }
  };

  useEffect(() => {
    if (route.length === 2) {
      const steps = 100;
      const interval = 200;
      const [start, end] = route;

      const latDiff = (end[0] - start[0]) / steps;
      const lngDiff = (end[1] - start[1]) / steps;

      let i = 0;
      const id = setInterval(() => {
        const nextPos = [start[0] + latDiff * i, start[1] + lngDiff * i];
        setCarPosition(nextPos);

        if (isNearUnsafe(nextPos)) {
          setShowAlert(true);
          setTimeout(() => setShowAlert(false), 5000); // alert disappears after 5s
        }

        i++;
        if (i > steps) clearInterval(id);
      }, interval);

      return () => clearInterval(id);
    }
  }, [route]);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ marginBottom: '10px' }}>
        <input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Enter source (e.g. CP)"
        />
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Enter destination (e.g. Noida)"
        />
        <button onClick={handleRoute}>Show Route</button>
      </div>

      {showAlert && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#e53935',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '8px',
          zIndex: 999,
          fontWeight: 'bold',
          fontSize: '16px',
          boxShadow: '0 0 10px rgba(0,0,0,0.3)'
        }}>
          🚨 Warning: You are in an Unsafe Zone!
        </div>
      )}

      <MapContainer center={[28.644800, 77.216721]} zoom={12} style={{ height: '500px', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {route.length === 2 && (
          <>
            <MapUpdater route={route} />
            <Marker position={route[1]} />
            <Polyline positions={route} color="blue" />
            {carPosition && <Marker position={carPosition} icon={carIcon} />}
          </>
        )}
        {unsafeLocations.map((pos, idx) => (
          <Marker key={idx} position={pos} />
        ))}
      </MapContainer>
    </div>
  );
}
