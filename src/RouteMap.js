import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as turf from '@turf/turf';
import Papa from 'papaparse';

// Optionally add a red triangle icon (if using visuals temporarily)
// import redIcon from './red-triangle.png'; // keep only if you want the image icon
// const redLeafletIcon = new L.Icon({ iconUrl: redIcon, iconSize: [25, 25], iconAnchor: [12, 25] });

const centerDelhi = [28.6139, 77.2090];

function SafeRouteMap() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [route, setRoute] = useState([]);
  const [livePos, setLivePos] = useState(centerDelhi);
  const [redZones, setRedZones] = useState([]);

  // 🔔 Load dataset from CSV
  useEffect(() => {
    Papa.parse('/delhi_theft_data.csv', {
      download: true,
      header: true,
      complete: (results) => {
        const highCrimeZones = results.data
          .filter(row => parseInt(row.Crime_Count) >= 25)
          .map(row => [parseFloat(row.Latitude), parseFloat(row.Longitude)]);
        setRedZones(highCrimeZones);
      }
    });
  }, []);

  // 📍 Get user's current location
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLivePos([latitude, longitude]);

        // 🔔 Beep logic if close to any red zone
        redZones.forEach(([lat, lon]) => {
          const distance = turf.distance(
            turf.point([lon, lat]),
            turf.point([longitude, latitude]),
            { units: 'kilometers' }
          );
          if (distance < 0.2) {
            const audio = new Audio('/beep.mp3'); // Place `beep.mp3` in `public` folder
            audio.play();
          }
        });
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [redZones]);

  // 🧭 Route calculation
  const GetRoute = async (start, end) => {
    try {
      const avoidPolygon = turf.buffer(turf.featureCollection(
        redZones.map(([lat, lon]) => turf.point([lon, lat]))
      ), 0.005, { units: 'kilometers' });

      const res = await fetch(`https://api.openrouteservice.org/v2/directions/foot-walking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': '5b3ce3597851110001cf624815a3b2e0f4c2483aba8daae4cfa05912'
        },
        body: JSON.stringify({
          coordinates: [[start[1], start[0]], [end[1], end[0]]],
          options: {
            avoid_polygons: avoidPolygon
          }
        })
      });

      const data = await res.json();

      if (!data.features || !data.features[0]) throw new Error("No route found.");
      return data.features[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]);
    } catch (error) {
      console.error("Route Error:", error);
      alert("Unable to fetch route.");
      return [];
    }
  };

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

        {/* 🔺 You can remove this marker if only using beep */}
        {/* {redZones.map((pos, i) => (
          <Marker key={i} position={pos} icon={redLeafletIcon} />
        ))} */}

        {route.length > 0 && <Polyline positions={route} color='blue' />}
        {livePos && <Marker position={livePos} icon={L.divIcon({ className: 'live-pin', html: '📍', iconSize: [20, 20] })} />}
      </MapContainer>
    </div>
  );
}

export default SafeRouteMap;
