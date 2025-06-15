// SafeRouteMap.js

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as turf from '@turf/turf';

const redIcon = new L.Icon({
  iconUrl: 'red.jpg',
  iconSize: [25, 25],
  iconAnchor: [12, 25],
});

const centerDelhi = [28.6139, 77.2090];
const redZones = [
  [28.6600, 77.2320], // Example unsafe zones
  [28.6500, 77.2500],
  [28.6400, 77.2000],
];

const useCurrentLocation = (setPosition) => {
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [setPosition]);
};

const GetRoute = async (start, end) => {
  try {
    const avoidPolygon = turf.buffer(turf.featureCollection(
      redZones.map(([lat, lon]) => turf.point([lon, lat]))
    ), 0.005, { units: 'kilometers' });

    const res = await fetch(`https://api.openrouteservice.org/v2/directions/foot-walking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'YOUR_API_KEY_HERE'  // 👈 Make sure this is correctly set
      },
      body: JSON.stringify({
        coordinates: [[start[1], start[0]], [end[1], end[0]]],
        options: {
          avoid_polygons: avoidPolygon
        }
      })
    });

    const data = await res.json();

    if (!data.features || !data.features[0]) {
      throw new Error("No route found. Check coordinates or API limits.");
    }

    return data.features[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]);

  } catch (error) {
    console.error("Error fetching route:", error);
    alert("Unable to fetch route. Try again with valid inputs.");
    return [];
  }
};


function SafeRouteMap() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [route, setRoute] = useState([]);
  const [livePos, setLivePos] = useState(centerDelhi);

  useCurrentLocation(setLivePos);

  const handleGetRoute = async () => {
    const locations = {
      shahdara: [28.6771, 77.2893],
      rithala: [28.7208, 77.1079],
      lajpatnagar: [28.5672, 77.2435],
      karolbagh: [28.6514, 77.1906]
    };
    if (start && end && start !== end) {
      const coordinates = await GetRoute(locations[start], locations[end]);
      setRoute(coordinates);
    }
  };

  return (
    <div>
      <h2>🚦 Safe Route Navigator - Delhi</h2>
      <label>Start:</label>
      <select value={start} onChange={(e) => setStart(e.target.value)}>
        <option value=''>Select</option>
        <option value='shahdara'>Shahdara</option>
        <option value='lajpatnagar'>Lajpat Nagar</option>
        <option value='karolbagh'>Karol Bagh</option>
        <option value='rithala'>Rithala</option>
      </select>

      <label>End:</label>
      <select value={end} onChange={(e) => setEnd(e.target.value)}>
        <option value=''>Select</option>
        <option value='shahdara'>Shahdara</option>
        <option value='lajpatnagar'>Lajpat Nagar</option>
        <option value='karolbagh'>Karol Bagh</option>
        <option value='rithala'>Rithala</option>
      </select>

      <button onClick={handleGetRoute}>Show Safe Route</button>

      <MapContainer center={centerDelhi} zoom={12} style={{ height: '600px', width: '100%' }}>
        <TileLayer
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          attribution='&copy; OpenStreetMap contributors'
        />

        {redZones.map((pos, i) => (
          <Marker key={i} position={pos} icon={redIcon} />
        ))}

        {route.length > 0 && <Polyline positions={route} color='blue' />}

        {livePos && <Marker position={livePos} icon={L.divIcon({ className: 'live-pin', html: '📍', iconSize: [20, 20] })} />}
      </MapContainer>
    </div>
  );
}

export default SafeRouteMap;
