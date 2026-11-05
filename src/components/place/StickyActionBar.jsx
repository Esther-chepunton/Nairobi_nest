import { getDirectionsUrl } from "../../lib/api";
import { placeDetail as copy } from "../../lib/copy";

export default function StickyActionBar({ place, onBookGuide }) {
  const directionsUrl = getDirectionsUrl(place.latitude, place.longitude);

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 glass border-t border-white/10 flex gap-3 z-50 md:max-w-lg md:mx-auto md:rounded-t-2xl">
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-outline flex-1 text-center"
      >
        {copy.sticky.directions}
      </a>
      <button type="button" onClick={onBookGuide} className="btn-primary flex-1">
        {copy.sticky.bookGuide}
      </button>
    </div>
  );
}
