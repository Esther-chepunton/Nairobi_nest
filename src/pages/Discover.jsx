import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MOODS, COMPANIONS, TIME_OPTIONS, CATEGORIES, BUDGET_OPTIONS, NAIROBI_CENTER } from "../lib/intentDefaults";
import { discover as discoverCopy } from "../lib/copy";
import { useGeolocation } from "../hooks/useGeolocation";
import CategoryIcon from "../components/ui/CategoryIcon";
import ScrollReveal from "../components/ui/ScrollReveal";

export default function Discover() {
  const navigate = useNavigate();
  const { state: routeState } = useLocation();
  const { location } = useGeolocation();
  const [form, setForm] = useState({
    location: "Nairobi",
    mood: "peaceful",
    time_available_minutes: 180,
    companions: "solo",
    category: "",
    budget_max: 3000,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/results", {
      state: {
        ...form,
        q: form.location,
        latitude: location.latitude || NAIROBI_CENTER.latitude,
        longitude: location.longitude || NAIROBI_CENTER.longitude,
      },
    });
  };

  const showCategories = routeState?.focus === "categories";

  return (
    <div className="min-h-screen bg-kijiji-deep px-4 py-8 md:px-8 pb-12">
      <div className="max-w-xl mx-auto">
        <ScrollReveal>
          <h1 className="font-serif text-3xl text-kijiji-text mb-2">{discoverCopy.title}</h1>
          <p className="text-muted mb-8">{discoverCopy.subtitle}</p>
        </ScrollReveal>

        {showCategories && (
          <ScrollReveal className="mb-8">
            <h2 className="font-serif text-lg text-kijiji-text mb-4">{discoverCopy.browseCategories}</h2>
            <div className="flex flex-wrap gap-4">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    navigate("/results", {
                      state: {
                        category: cat.id,
                        latitude: location.latitude || NAIROBI_CENTER.latitude,
                        longitude: location.longitude || NAIROBI_CENTER.longitude,
                        mood: "peaceful",
                        companions: "solo",
                        time_available_minutes: 180,
                        budget_max: 5000,
                      },
                    })
                  }
                  className="tag-pill-outline hover:bg-kijiji-accent/10 transition-colors"
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </ScrollReveal>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 glass-card p-6">
          <div>
            <label className="block text-sm text-muted mb-2">{discoverCopy.labels.location}</label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-2">{discoverCopy.labels.mood}</label>
            <select
              value={form.mood}
              onChange={(e) => setForm({ ...form, mood: e.target.value })}
              className="w-full"
            >
              {MOODS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-muted mb-2">{discoverCopy.labels.time}</label>
            <select
              value={form.time_available_minutes}
              onChange={(e) => setForm({ ...form, time_available_minutes: parseInt(e.target.value, 10) })}
              className="w-full"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-muted mb-2">{discoverCopy.labels.budget}</label>
            <select
              value={form.budget_max}
              onChange={(e) => setForm({ ...form, budget_max: parseInt(e.target.value, 10) })}
              className="w-full"
            >
              {BUDGET_OPTIONS.map((b) => (
                <option key={b.id} value={b.id}>{b.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-muted mb-2">{discoverCopy.labels.companions}</label>
            <select
              value={form.companions}
              onChange={(e) => setForm({ ...form, companions: e.target.value })}
              className="w-full"
            >
              {COMPANIONS.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-muted mb-2">{discoverCopy.labels.category}</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full"
            >
              <option value="">{discoverCopy.categoryDefault}</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-primary w-full">{discoverCopy.submit}</button>
        </form>
      </div>
    </div>
  );
}
