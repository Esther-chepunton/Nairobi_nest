import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getPlaceKey } from "../lib/placeIdentity";

function createTealIcon(delay = 0) {
  return L.divIcon({
    className: "kijiji-marker-wrap",
    html: `<span class="kijiji-marker" style="animation-delay:${delay}ms"></span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12],
  });
}

function FitBounds({ places }) {
  const map = useMap();
  useEffect(() => {
    const valid = places?.filter(
      (p) => p?.latitude != null && p?.longitude != null
    );
    if (!valid?.length) return;
    const bounds = L.latLngBounds(valid.map((p) => [p.latitude, p.longitude]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
  }, [places, map]);
  return null;
}

export default function MapComponent({
  latitude,
  longitude,
  places = [],
  height = "300px",
  onMarkerClick,
  animatedPins = false,
}) {
  const validPlaces = places.filter(
    (p) => p?.latitude != null && p?.longitude != null
  );

  const center = validPlaces.length
    ? [validPlaces[0].latitude, validPlaces[0].longitude]
    : [latitude || -1.286389, longitude || 36.817223];

  const markers = validPlaces.length
    ? validPlaces
    : latitude && longitude
    ? [{ place_key: "pin", name: "Location", latitude, longitude }]
    : [];

  return (
    <MapContainer
      center={center}
      zoom={11}
      style={{ height, width: "100%", borderRadius: "16px" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {validPlaces.length > 1 && <FitBounds places={validPlaces} />}
      {markers.map((p, i) => (
        <Marker
          key={getPlaceKey(p) || `marker-${i}`}
          position={[p.latitude, p.longitude]}
          icon={animatedPins ? createTealIcon(i * 80) : createTealIcon(0)}
          eventHandlers={{ click: () => onMarkerClick?.(p) }}
        >
          <Popup>
            <span style={{ color: "#0b1414", fontWeight: 500 }}>{p.name}</span>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
