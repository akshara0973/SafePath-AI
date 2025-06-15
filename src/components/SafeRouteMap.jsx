// SafeRouteMap.js
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

const unsafeZones = [
  [28.6139, 77.2090], // CP
  [28.7041, 77.1025], // West Delhi
];

const route = [
  [28.6139, 77.2090],
  [28.6448, 77.216721],
  [28.7041, 77.1025],
];

const SafeRouteMap = () => {

  useEffect(() => {
    const checkProximity = () => {
      route.forEach(point => {
        unsafeZones.forEach(uz => {
          const dist = L.latLng(point).distanceTo(L.latLng(uz));
          if (dist < 200) { // 200 meters range
            new Audio("/beep.mp4").play(); // Place beep.mp3 in public folder
            alert("⚠️ Unsafe zone ahead!");
          }
        });
      });
    };
    checkProximity();
  }, []);

  return (
    <MapContainer center={[28.6139, 77.2090]} zoom={12} style={{ height: "90vh", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {unsafeZones.map((pos, i) => (
        <Marker key={i} position={pos}></Marker>
      ))}
      <Polyline positions={route} color="red" />
    </MapContainer>
  );
};

export default SafeRouteMap;
