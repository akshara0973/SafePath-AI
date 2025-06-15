import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
  Circle,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import carImage from '../assets/car.jpg';

const carIcon = new L.Icon({
  iconUrl: carImage,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// 🔴 Define unsafe zones
const unsafeZones = [
  [28.644800, 77.216721], // CP
  [28.704060, 77.102493], // Karol Bagh
  [28.535517, 77.391029], // Noida border
];

// 🛑 Check if location is near unsafe
const isNearUnsafe = ([lat, lng]) => {
  const threshold = 0.005;
  return unsafeZones.some(([ul, ulng]) => (
    Math.abs(lat - ul) < threshold && Math.abs(lng - ulng) < threshold
  ));
};

// Update map bounds
function MapUpdater({ route }) {
  const map = useMap();
  useEffect(() => {
    if (route.length >= 2) {
      map.fitBounds(route);
    }
  }, [route, map]);
  return null;
}

// 🔊 Beep sound on unsafe zone detection
const beep = () => {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime);
  oscillator.connect(audioCtx.destination);
  oscillator.start();
  setTimeout(() => oscillator.stop(), 300);
};

export default function SafeRouteMap() {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [route, setRoute] = useState([]);
  const [carPosition, setCarPosition] = useState(null);
  const [showAlert, setShowAlert] = useState(false);

  const apiKey = '5b3ce3597851110001cf624815a3b2e0f4c2483aba8daae4cfa05912'; // 🔑 Paste your key here

  // 📍 Get coordinates from place name
  const getCoords = async (place) => {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${place}, Delhi`);
    const data = await response.json();
    if (data[0]) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
    return null;
  };

  // 📦 Get route from OpenRouteService
  const handleRoute = async () => {
    const srcCoord = await getCoords(source);
    const destCoord = await getCoords(destination);

    if (!srcCoord || !destCoord) {
      alert('Please enter valid Delhi locations');
      return;
    }

    const body = {
      coordinates: [[srcCoord[1], srcCoord[0]], [destCoord[1], destCoord[0]]],
      format: 'geojson'
    };

    const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (data.features?.[0]) {
      const coords = data.features[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      setRoute(coords);
    } else {
      alert('Could not fetch route');
    }
  };

  // 🚗 Animate car movement
  useEffect(() => {
    if (route.length >= 2) {
      const steps = route.length;
      let i = 0;

      const intervalId = setInterval(() => {
        if (i < steps) {
          const pos = route[i];
          setCarPosition(pos);

          if (isNearUnsafe(pos)) {
            beep();
            setShowAlert(true);
            rerouteAvoidingUnsafe(route[0], route[route.length - 1]);
            clearInterval(intervalId);
            setTimeout(() => setShowAlert(false), 5000);
          }

          i++;
        } else {
          clearInterval(intervalId);
        }
      }, 300);

      return () => clearInterval(intervalId);
    }
  }, [route]);

  // 🔁 Reroute avoiding unsafe zone
  const rerouteAvoidingUnsafe = async (start, end) => {
    const avoidPolygons = {
      type: "MultiPolygon",
      coordinates: unsafeZones.map(([lat, lng]) => [[
        [lng - 0.003, lat - 0.003],
        [lng + 0.003, lat - 0.003],
        [lng + 0.003, lat + 0.003],
        [lng - 0.003, lat + 0.003],
        [lng - 0.003, lat - 0.003]
      ]])
    };

    const body = {
      coordinates: [[start[1], start[0]], [end[1], end[0]]],
      options: { avoid_polygons: avoidPolygons },
      format: 'geojson'
    };

    const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (data.features?.[0]) {
      const newCoords = data.features[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      setRoute(newCoords);
    } else {
      alert('Failed to reroute avoiding unsafe zones.');
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* 🔍 Inputs */}
      <div style={{ marginBottom: '10px' }}>
        <input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Enter Source (e.g. CP)"
        />
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Enter Destination (e.g. AIIMS)"
        />
        <button onClick={handleRoute}>Show Route</button>
      </div>

      {/* 🚨 Alert */}
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
          🚨 Unsafe Zone Detected! Rerouting...
        </div>
      )}

      {/* 🗺️ Map */}
      <MapContainer center={[28.61, 77.23]} zoom={11} style={{ height: '500px', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapUpdater route={route} />

        {/* ❌ Unsafe zones */}
        {unsafeZones.map((pos, idx) => (
          <Circle
            key={idx}
            center={pos}
            radius={400}
            pathOptions={{ color: 'red', fillColor: '#f03', fillOpacity: 0.4 }}
          />
        ))}

        {/* 🔷 Route & car */}
        {route.length >= 2 && (
          <>
            <Polyline positions={route} color="blue" />
            {carPosition && <Marker position={carPosition} icon={carIcon} />}
          </>
        )}
      </MapContainer>
    </div>
  );
}
