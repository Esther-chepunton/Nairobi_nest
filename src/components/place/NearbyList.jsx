import { Link } from "react-router-dom";
import { placeDetail as copy } from "../../lib/copy";
import { getPlaceKey, placePath } from "../../lib/placeIdentity";

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function NearbyList({ places, originLat, originLon }) {
  if (!places?.length) return null;

  return (
    <ul className="space-y-3">
      {places.map((place) => {
        const dist =
          originLat && originLon && place.latitude && place.longitude
            ? haversineKm(originLat, originLon, place.latitude, place.longitude)
            : null;
        const image = place.image || place.images?.[0];

        return (
          <li key={getPlaceKey(place) || place.id}>
            <Link
              to={placePath(place)}
              className="flex gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <img
                src={image}
                alt=""
                className="w-14 h-14 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm text-kijiji-text font-medium truncate group-hover:text-kijiji-accent transition-colors">
                  {place.name}
                </p>
                <p className="text-xs text-muted truncate">{place.location_name}</p>
                {dist != null && (
                  <p className="text-xs text-kijiji-accent mt-0.5">{copy.distanceKm(dist)}</p>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
