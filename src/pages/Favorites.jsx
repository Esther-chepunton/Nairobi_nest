import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PlaceCard from "../components/discovery/PlaceCard";
import { getFavorites, removeFavorite } from "../lib/api";
import { getPlaceKey } from "../lib/placeIdentity";
import { favorites as favoritesCopy, loading } from "../lib/copy";

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loadingState, setLoadingState] = useState(true);

  useEffect(() => {
    getFavorites()
      .then((data) => setFavorites(data))
      .catch(console.error)
      .finally(() => setLoadingState(false));
  }, []);

  const handleRemove = async (place) => {
    const key = getPlaceKey(place) || place?.id;
    await removeFavorite(key);
    setFavorites((prev) =>
      prev.filter((f) => getPlaceKey(f.place) !== key && f.place?.id !== place?.id)
    );
  };

  if (loadingState) {
    return (
      <div className="min-h-screen bg-kijiji-deep flex items-center justify-center text-muted">
        {loading.favorites}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kijiji-deep px-4 py-8 md:px-8 pb-24">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-serif text-3xl text-kijiji-text mb-2">{favoritesCopy.title}</h1>
        <p className="text-muted mb-8">{favoritesCopy.subtitle}</p>

        {favorites.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-muted mb-4">{favoritesCopy.empty.message}</p>
            <Link to="/discover" className="btn-primary inline-block">
              {favoritesCopy.empty.cta}
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {favorites.map(({ place, place_key: key, saved_at, source_name }) => (
              <div key={key || getPlaceKey(place)} className="space-y-1">
                <PlaceCard
                  place={place}
                  saved
                  onSave={() => handleRemove(place)}
                />
                {(saved_at || source_name) && (
                  <p className="text-xs text-muted px-1">
                    {[
                      source_name ? `Saved from ${source_name}` : null,
                      saved_at ? new Date(saved_at).toLocaleDateString() : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
