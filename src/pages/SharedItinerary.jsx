import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getSharedItinerary } from "../lib/api";
import { loading, sharedItinerary as sharedCopy } from "../lib/copy";

export default function SharedItinerary() {
  const { token } = useParams();
  const [itinerary, setItinerary] = useState(null);

  useEffect(() => {
    getSharedItinerary(token).then(setItinerary).catch(console.error);
  }, [token]);

  if (!itinerary) {
    return (
      <div className="min-h-screen bg-kijiji-deep flex items-center justify-center text-muted">
        {loading.sharedItinerary}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kijiji-deep px-4 py-8 md:px-8">
      <div className="max-w-md mx-auto glass-card p-6">
        <p className="text-kijiji-accent text-sm mb-1">{sharedCopy.eyebrow}</p>
        <h1 className="font-serif text-2xl text-kijiji-text mb-4">{itinerary.title}</h1>
        <div className="space-y-4">
          {itinerary.items?.map((item) => (
            <div key={item.id} className="border-l-2 border-kijiji-accent/30 pl-4">
              <p className="text-xs text-kijiji-accent">{item.time_slot}</p>
              <p className="font-serif">{item.place?.name}</p>
              <p className="text-sm text-muted">{item.place?.location_name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
