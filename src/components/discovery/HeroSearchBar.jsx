import { useNavigate } from "react-router-dom";
import { FaMapMarkerAlt, FaClock, FaUsers, FaSmile, FaWallet, FaSearch } from "react-icons/fa";
import { MOODS, COMPANIONS, TIME_OPTIONS, BUDGET_OPTIONS, NAIROBI_CENTER } from "../../lib/intentDefaults";
import { discover } from "../../lib/copy";
import { useGeolocation } from "../../hooks/useGeolocation";

export default function HeroSearchBar({ className = "" }) {
  const navigate = useNavigate();
  const { location } = useGeolocation();

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    navigate("/results", {
      state: {
        q: form.where.value,
        location: form.where.value,
        mood: form.mood.value,
        time_available_minutes: parseInt(form.time.value, 10),
        budget_max: parseInt(form.budget.value, 10),
        companions: form.people.value,
        latitude: location.latitude || NAIROBI_CENTER.latitude,
        longitude: location.longitude || NAIROBI_CENTER.longitude,
      },
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`glass flex flex-col lg:flex-row items-stretch lg:items-center gap-1 rounded-full p-2 lg:p-1.5 max-w-5xl mx-auto ${className}`}
    >
      <div className="flex-1 flex items-center gap-2 px-4 py-3 lg:py-2 lg:border-r border-white/10 min-w-0">
        <FaMapMarkerAlt className="text-kijiji-accent shrink-0" />
        <input
          name="where"
          placeholder={discover.searchPlaceholder}
          className="w-full bg-transparent border-none outline-none text-sm placeholder:text-muted/70"
          defaultValue="Nairobi"
        />
      </div>
      <div className="flex-1 flex items-center gap-2 px-4 py-3 lg:py-2 lg:border-r border-white/10 min-w-0">
        <FaSmile className="text-kijiji-accent shrink-0" />
        <select name="mood" className="w-full bg-transparent border-none outline-none text-sm cursor-pointer">
          {MOODS.map((m) => (
            <option key={m.id} value={m.id} className="bg-kijiji-card">{m.label}</option>
          ))}
        </select>
      </div>
      <div className="flex-1 flex items-center gap-2 px-4 py-3 lg:py-2 lg:border-r border-white/10 min-w-0">
        <FaClock className="text-kijiji-accent shrink-0" />
        <select name="time" className="w-full bg-transparent border-none outline-none text-sm cursor-pointer">
          {TIME_OPTIONS.map((t) => (
            <option key={t.id} value={t.id} className="bg-kijiji-card">{t.label}</option>
          ))}
        </select>
      </div>
      <div className="flex-1 flex items-center gap-2 px-4 py-3 lg:py-2 lg:border-r border-white/10 min-w-0">
        <FaWallet className="text-kijiji-accent shrink-0" />
        <select name="budget" className="w-full bg-transparent border-none outline-none text-sm cursor-pointer">
          {BUDGET_OPTIONS.map((b) => (
            <option key={b.id} value={b.id} className="bg-kijiji-card">{b.label}</option>
          ))}
        </select>
      </div>
      <div className="flex-1 flex items-center gap-2 px-4 py-3 lg:py-2 min-w-0">
        <FaUsers className="text-kijiji-accent shrink-0" />
        <select name="people" className="w-full bg-transparent border-none outline-none text-sm cursor-pointer">
          {COMPANIONS.map((c) => (
            <option key={c.id} value={c.id} className="bg-kijiji-card">{c.label}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="shrink-0 w-12 h-12 mx-2 rounded-full bg-kijiji-accent text-kijiji-deep flex items-center justify-center hover:brightness-110 transition-all hover:scale-105"
        aria-label={discover.searchAriaLabel}
      >
        <FaSearch />
      </button>
    </form>
  );
}
