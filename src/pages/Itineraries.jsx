import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getItineraries, createItinerary, addItineraryItem, getFavorites } from "../lib/api";
import { getPlaceKey } from "../lib/placeIdentity";
import { emptyStates, itineraries as itinerariesCopy, loading, toast as toastCopy } from "../lib/copy";

export default function Itineraries() {
  const [itineraries, setItineraries] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loadingState, setLoadingState] = useState(true);

  useEffect(() => {
    Promise.all([getItineraries(), getFavorites()])
      .then(([itins, favs]) => {
        setItineraries(itins);
        setFavorites(favs);
        if (itins.length) setActiveId(itins[0].id);
      })
      .catch(console.error)
      .finally(() => setLoadingState(false));
  }, []);

  const createDay = async () => {
    try {
      const itin = await createItinerary({
        title: itinerariesCopy.defaultTitle,
        date: new Date().toISOString().split("T")[0],
      });
      setItineraries((prev) => [itin, ...prev]);
      setActiveId(itin.id);
      toast.success(toastCopy.dayPlanCreated);
    } catch {
      toast.error(toastCopy.dayPlanFailed);
    }
  };

  const addPlace = async (place, timeSlot) => {
    if (!activeId) return;
    try {
      const updated = await addItineraryItem(activeId, {
        place_key: getPlaceKey(place),
        place_id: place.id || place.legacy_place_id,
        place,
        time_slot: timeSlot,
      });
      setItineraries((prev) => prev.map((i) => (i.id === activeId ? updated : i)));
      toast.success(toastCopy.addedToDay);
    } catch {
      toast.error(toastCopy.addPlaceFailed);
    }
  };

  const active = itineraries.find((i) => i.id === activeId);
  const timeSlots = [
    itinerariesCopy.timeSlots.morning,
    itinerariesCopy.timeSlots.afternoon,
    itinerariesCopy.timeSlots.evening,
  ];

  if (loadingState) {
    return (
      <div className="min-h-screen bg-kijiji-deep flex items-center justify-center text-muted">
        {loading.itineraries}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kijiji-deep px-4 py-8 md:px-8 pb-24">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-3xl text-kijiji-text">{itinerariesCopy.title}</h1>
          <button type="button" onClick={createDay} className="btn-primary text-sm">
            {itinerariesCopy.newDay}
          </button>
        </div>

        {itineraries.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-muted mb-4">{emptyStates.itineraries.message}</p>
            <button type="button" onClick={createDay} className="btn-primary">
              {emptyStates.itineraries.cta}
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar">
              {itineraries.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => setActiveId(i.id)}
                  className={`px-4 py-2 rounded-full text-sm shrink-0 ${
                    activeId === i.id ? "bg-kijiji-accent text-kijiji-deep" : "glass text-muted"
                  }`}
                >
                  {i.title}
                </button>
              ))}
            </div>

            {active && (
              <div className="glass-card p-6 mb-8">
                <h2 className="font-serif text-xl mb-2">{active.title}</h2>
                <p className="text-sm text-muted mb-4">
                  {itinerariesCopy.estBudget(active.total_budget_estimate || 0)}
                </p>
                {active.share_token && (
                  <p className="text-xs text-kijiji-accent mb-4">
                    {itinerariesCopy.share(`${window.location.origin}/itinerary/${active.share_token}`)}
                  </p>
                )}
                <div className="space-y-4">
                  {active.items?.map((item) => (
                    <div key={item.id} className="flex gap-4 border-l-2 border-kijiji-accent/30 pl-4">
                      <div>
                        <p className="text-xs text-kijiji-accent">
                          {item.time_slot || itinerariesCopy.timeSlots.flexible}
                        </p>
                        <p className="font-serif text-kijiji-text">{item.place?.name}</p>
                        <p className="text-sm text-muted">{item.place?.location_name}</p>
                      </div>
                    </div>
                  ))}
                  {(!active.items || active.items.length === 0) && (
                    <p className="text-muted text-sm">{emptyStates.itineraryNoStops}</p>
                  )}
                </div>
              </div>
            )}

            {favorites.length > 0 && (
              <div>
                <h3 className="font-serif text-lg mb-4">{itinerariesCopy.addFromSaved}</h3>
                <div className="space-y-3">
                  {favorites.map(({ place }) => (
                    <div key={getPlaceKey(place) || place.id} className="glass-card p-4 flex items-center justify-between">
                      <div>
                        <p className="text-kijiji-text">{place.name}</p>
                        <p className="text-sm text-muted">{place.location_name}</p>
                      </div>
                      <div className="flex gap-2">
                        {timeSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => addPlace(place, slot)}
                            className="text-xs btn-outline px-2 py-1"
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}                </div>
              </div>
            )}
          </>
        )}

        <Link to="/favorites" className="block text-center text-kijiji-accent text-sm mt-8">
          {itinerariesCopy.manageSaved}
        </Link>
      </div>
    </div>
  );
}
