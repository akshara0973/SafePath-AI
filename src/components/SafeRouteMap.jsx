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
import carImage from '../assets/car.jpg'; // Make sure this path is correct

const carIcon = new L.Icon({
  iconUrl: carImage,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const unsafeZones = [
  [28.6281, 77.2335], // Mandi House
];

const isNearUnsafe = ([lat, lng]) => {
  const threshold = 0.003;
  return unsafeZones.some(([ul, ulng]) =>
    Math.abs(lat - ul) < threshold && Math.abs(lng - ulng) < threshold
  );
};

function MapUpdater({ route }) {
  const map = useMap();
  useEffect(() => {
    if (route.length >= 2) {
      map.fitBounds(route);
    }
  }, [route, map]);
  return null;
}

const beep = () => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = ctx.createOscillator();
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
  oscillator.connect(ctx.destination);
  oscillator.start();
  setTimeout(() => oscillator.stop(), 300);
};

export default function SafeRouteMap() {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [route, setRoute] = useState([]);
  const [reroutedRoute, setReroutedRoute] = useState([]);
  const [carPosition, setCarPosition] = useState(null);
  const [showAlert, setShowAlert] = useState(false);

  const apiKey = '5b3ce3597851110001cf624815a3b2e0f4c2483aba8daae4cfa05912';

  const getCoords = async (place) => {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${place}, Delhi`);
    const data = await res.json();
    return data[0] ? [parseFloat(data[0].lat), parseFloat(data[0].lon)] : null;
  };

  const handleRoute = async () => {
    setReroutedRoute([]);
    const src = await getCoords(source);
    const dest = await getCoords(destination);
    if (!src || !dest) return alert("Enter valid locations");

    const body = {
      coordinates: [[src[1], src[0]], [dest[1], dest[0]]],
      format: 'geojson',
    };

    const res = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (data.features?.[0]) {
      const coords = data.features[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      setRoute(coords);
      animateCar(coords, dest);
    }
  };

  const animateCar = (path, finalDestination) => {
    let i = 0;
    const intervalId = setInterval(() => {
      if (i < path.length) {
        const currentPos = path[i];
        setCarPosition(currentPos);

        if (isNearUnsafe(currentPos)) {
          beep();
          setShowAlert(true);
          clearInterval(intervalId);

          setTimeout(() => setShowAlert(false), 4000);
          rerouteAvoidingUnsafe(currentPos, finalDestination); // ⬅️ Reroute from current position
        }

        i++;
      } else {
        clearInterval(intervalId);
      }
    }, 300);
  };

  const rerouteAvoidingUnsafe = async (start, end) => {
    const avoidPolygons = {
      type: "MultiPolygon",
      coordinates: unsafeZones.map(([lat, lng]) => [[
        [lng - 0.003, lat - 0.003],
        [lng + 0.003, lat - 0.003],
        [lng + 0.003, lat + 0.003],
        [lng - 0.003, lat + 0.003],
        [lng - 0.003, lat - 0.003],
      ]])
    };

    const body = {
      coordinates: [[start[1], start[0]], [end[1], end[0]]],
      options: { avoid_polygons: avoidPolygons },
      format: 'geojson'
    };

    const res = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (data.features?.[0]) {
      const newCoords = data.features[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      setReroutedRoute(newCoords);
      animateCar(newCoords, end); // ⬅️ Continue animation with rerouted path
    } else {
      alert('Reroute failed');
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* 🔍 Search */}
      <div style={{ marginBottom: 10 }}>
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
          top: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#d32f2f',
          color: '#fff',
          padding: '10px 20px',
          borderRadius: '6px',
          fontWeight: 'bold',
          zIndex: 999
        }}>
          🚨 Unsafe Zone Detected near Mandi House! Rerouting...
        </div>
      )}

      {/* 🗺️ Map */}
      <MapContainer center={[28.61, 77.23]} zoom={13} style={{ height: '500px', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapUpdater route={route.length ? route : reroutedRoute} />

        {/* 🔴 Unsafe Zones */}
        {unsafeZones.map((pos, i) => (
          <Circle
            key={i}
            center={pos}
            radius={400}
            pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.3 }}
          />
        ))}

        {/* 🔵 Route Lines */}
        {route.length >= 2 && <Polyline positions={route} color="blue" />}
        {reroutedRoute.length >= 2 && <Polyline positions={reroutedRoute} color="green" />}

        {/* 🚘 Car Marker */}
        {carPosition && <Marker position={carPosition} icon={carIcon} />}
      </MapContainer>
    </div>
  );
}
