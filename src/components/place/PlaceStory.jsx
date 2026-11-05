import { FaCheck } from "react-icons/fa";
import { placeDetail as copy } from "../../lib/copy";

export default function PlaceStory({ place }) {
  const beforeYouGo = [
    place.travel_time_from_nairobi,
    place.difficulty,
    place.price_min
      ? `KSh ${place.price_min}${place.price_max > place.price_min ? `–${place.price_max}` : ""}`
      : copy.quickInfo.free,
  ].filter(Boolean);

  return (
    <section className="py-6 space-y-6">
      <div>
        <h2 className="font-serif text-xl mb-3">{copy.sections.story}</h2>
        <p className="text-muted leading-relaxed">{place.story || place.description}</p>
      </div>

      {place.highlights?.length > 0 && (
        <div>
          <h2 className="font-serif text-xl mb-3">{copy.sections.whyYoullLoveIt}</h2>
          <ul className="space-y-2">
            {place.highlights.map((item) => (
              <li key={item} className="flex items-center gap-2 text-muted">
                <FaCheck className="text-kijiji-accent shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {beforeYouGo.length > 0 && (
        <div>
          <h2 className="font-serif text-xl mb-3">{copy.sections.beforeYouGo}</h2>
          <ul className="space-y-2">
            {beforeYouGo.map((item) => (
              <li key={item} className="text-sm text-muted pl-4 border-l-2 border-kijiji-accent/30">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {place.best_time && (
        <div>
          <h2 className="font-serif text-xl mb-3">{copy.sections.bestTime}</h2>
          <p className="text-muted">{place.best_time}</p>
        </div>
      )}

      {place.tips?.length > 0 && (
        <div>
          <h2 className="font-serif text-xl mb-3">{copy.sections.localTips}</h2>
          <ul className="space-y-2">
            {place.tips.map((tip) => (
              <li key={tip} className="text-sm text-muted pl-4 border-l-2 border-kijiji-accent/30">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
