import React, { useEffect, useState, useRef } from "react";
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  useJsApiLoader,
} from "@react-google-maps/api";

const unsafeZones = [
  { lat: 28.7041, lng: 77.1025, label: "Snatching hotspot near Connaught Place" },
  { lat: 28.6139, lng: 77.2090, label: "Accident prone: India Gate Circle" },
  // add more unsafe zones here
];

const libraries = ["places"];

const SafeRouteMap = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const alertTriggeredRef = useRef(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "YOUR_GOOGLE_MAPS_API_KEY", // replace with your key
    libraries,
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (pos) => {
          const location = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setUserLocation(location);
          checkUnsafeZones(location);
        },
        (err) => console.error("Location error:", err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const checkUnsafeZones = (currentLoc) => {
    const threshold = 0.002; // approx ~200m

    for (let zone of unsafeZones) {
      const dist = Math.sqrt(
        (zone.lat - currentLoc.lat) ** 2 + (zone.lng - currentLoc.lng) ** 2
      );
      if (dist < threshold && !alertTriggeredRef.current) {
        alertTriggeredRef.current = true;
        const beep = new Audio("/beep.mp4"); // add a beep.mp3 in your public folder
        beep.play();
        alert("Unsafe area ahead: " + zone.label);

        setTimeout(() => {
          alertTriggeredRef.current = false;
        }, 15000); // allow next alert after 15 sec
        break;
      }
    }
  };

  const handleRoute = () => {
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: "Kashmere Gate, Delhi", // change to your source
        destination: "AIIMS, Delhi",   // change to your destination
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK") {
          setDirections(result);
        } else {
          console.error("Directions error: ", status);
        }
      }
    );
  };

  return isLoaded ? (
    <div>
      <button onClick={handleRoute}>Plan Safe Route</button>
      <GoogleMap
        center={userLocation || { lat: 28.6139, lng: 77.2090 }}
        zoom={14}
        mapContainerStyle={{ height: "90vh", width: "100%" }}
      >
        {userLocation && <Marker position={userLocation} />}
        {unsafeZones.map((zone, idx) => (
          <Marker
            key={idx}
            position={{ lat: zone.lat, lng: zone.lng }}
            icon={{
              url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
            }}
          />
        ))}
        {directions && <DirectionsRenderer directions={directions} />}
      </GoogleMap>
    </div>
  ) : (
    <p>Loading Map...</p>
  );
};

export default SafeRouteMap;
