import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPlaces } from "../lib/api";
import { map as mapCopy } from "../lib/copy";
import { placePath } from "../lib/placeIdentity";
import MapComponent from "../components/MapComponent";

export default function MapPage() {
  const navigate = useNavigate();
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    getPlaces().then(setPlaces).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-kijiji-deep flex flex-col">
      <div className="px-4 py-4 md:px-8">
        <h1 className="font-serif text-2xl text-kijiji-text">{mapCopy.title}</h1>
        <p className="text-muted text-sm">{mapCopy.subtitle}</p>
      </div>
      <div className="flex-1 px-4 pb-4 md:px-8">
        <div className="h-[calc(100vh-120px)] rounded-2xl overflow-hidden glass-card p-1">
          <MapComponent
            places={places}
            height="100%"
            animatedPins
            onMarkerClick={(p) => navigate(placePath(p))}
          />
        </div>
      </div>
    </div>
  );
}
