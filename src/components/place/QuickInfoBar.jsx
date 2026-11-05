import { FaClock, FaMoneyBillWave, FaHiking, FaSun } from "react-icons/fa";
import { placeDetail as copy } from "../../lib/copy";

export default function QuickInfoBar({ place }) {
  const items = [
    { icon: FaClock, label: place.travel_time_from_nairobi || copy.quickInfo.travelTime },
    {
      icon: FaMoneyBillWave,
      label: place.price_min
        ? `KSh ${place.price_min}${place.price_max > place.price_min ? `–${place.price_max}` : ""}`
        : copy.quickInfo.free,
    },
    { icon: FaHiking, label: place.difficulty || copy.quickInfo.difficulty },
    { icon: FaSun, label: place.best_time || copy.quickInfo.bestTime },
  ];

  return (
    <div className="flex flex-wrap gap-4 py-4 border-y border-white/10">
      {items.map(({ icon: Icon, label }) => (
        <div key={label} className="flex items-center gap-2 text-sm">
          <Icon className="text-kijiji-accent shrink-0" />
          <span className="text-kijiji-text">{label}</span>
        </div>
      ))}
    </div>
  );
}
