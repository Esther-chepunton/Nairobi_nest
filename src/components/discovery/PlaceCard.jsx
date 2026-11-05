import { Link } from "react-router-dom";
import { FaHeart, FaRegHeart, FaStar } from "react-icons/fa";
import { results as resultsCopy } from "../../lib/copy";
import { getPlaceImage, getPlaceKey, placePath } from "../../lib/placeIdentity";

export default function PlaceCard({
  place,
  score,
  matchReasons,
  onSave,
  saved = false,
  compact = false,
  showMatch = false,
}) {
  const image = getPlaceImage(place);
  const price = place.price_min
    ? resultsCopy.priceFrom(place.price_min)
    : resultsCopy.priceFree;
  const placeKey = getPlaceKey(place);

  return (
    <Link
      to={placePath(place)}
      className={`group block shrink-0 card-hover-lift ${compact ? "w-56" : "w-72"} rounded-2xl overflow-hidden glass-card`}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={place.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-kijiji-deep/80 to-transparent" />
        {onSave && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onSave(placeKey || place);
            }}
            className="absolute top-3 right-3 p-2 rounded-full glass text-kijiji-accent"
          >
            {saved ? <FaHeart /> : <FaRegHeart />}
          </button>
        )}
        {showMatch && score && (
          <span className="absolute top-3 left-3 tag-pill">
            {resultsCopy.matchBadge(Math.round(score * 100))}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-serif text-lg font-semibold text-kijiji-text truncate">{place.name}</h3>
        <p className="text-sm text-muted truncate">{place.location_name}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="flex items-center gap-1 text-sm text-kijiji-accent">
            <FaStar className="text-xs" /> {place.rating}
          </span>
          <span className="text-sm text-muted">{price}</span>
        </div>
        {showMatch && matchReasons?.length > 0 && (
          <p className="text-xs text-muted mt-2 truncate">{matchReasons.join(" · ")}</p>
        )}
      </div>
    </Link>
  );
}
