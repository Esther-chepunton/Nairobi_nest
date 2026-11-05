import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PlaceCard from "../components/discovery/PlaceCard";
import MapComponent from "../components/MapComponent";
import ScrollReveal from "../components/ui/ScrollReveal";
import { apiFetch, saveSearchSession } from "../lib/api";
import { MOODS, TIME_OPTIONS, BUDGET_OPTIONS, NAIROBI_CENTER } from "../lib/intentDefaults";
import { results as resultsCopy, loading } from "../lib/copy";
import { getPlaceKey, placePath } from "../lib/placeIdentity";
import { useGeolocation } from "../hooks/useGeolocation";

function intentKey(intent) {
  return [
    intent.q,
    intent.mood,
    intent.time_available_minutes,
    intent.budget_max,
    intent.companions,
    intent.category,
    Number(intent.latitude).toFixed(4),
    Number(intent.longitude).toFixed(4),
  ].join("|");
}

function hasMapCoords(place) {
  return (
    place?.latitude != null &&
    place?.longitude != null &&
    !Number.isNaN(Number(place.latitude)) &&
    !Number.isNaN(Number(place.longitude))
  );
}

async function fetchRecommendations(intent, signal) {
  const explainRes = await apiFetch("/api/recommendations/explain", {
    method: "POST",
    body: JSON.stringify(intent),
    signal,
  });
  const explainData = await explainRes.json().catch(() => ({}));
  if (explainRes.ok) {
    return {
      places: explainData.places || [],
      summary: explainData.summary || "",
    };
  }

  const fallbackRes = await apiFetch("/api/recommendations", {
    method: "POST",
    body: JSON.stringify(intent),
    signal,
  });
  const fallbackData = await fallbackRes.json().catch(() => ({}));
  if (!fallbackRes.ok) {
    throw new Error(
      fallbackData.error || fallbackData.message || resultsCopy.error
    );
  }
  return { places: fallbackData.places || [], summary: "" };
}

export default function Results() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { location } = useGeolocation();
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState("");
  const [loadingState, setLoadingState] = useState(true);
  const [slowLoading, setSlowLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    mood: state?.mood || "peaceful",
    time_available_minutes: state?.time_available_minutes || 180,
    budget_max: state?.budget_max || 5000,
  });
  const lastIntentKey = useRef("");
  const requestId = useRef(0);
  // Device location only matters when the navigation state didn't carry coordinates.
  const geoLatitude = state?.latitude == null ? location.latitude : null;
  const geoLongitude = state?.longitude == null ? location.longitude : null;

  useEffect(() => {
    if (!state) return;
    setFilters({
      mood: state.mood || "peaceful",
      time_available_minutes: state.time_available_minutes || 180,
      budget_max: state.budget_max || 5000,
    });
  }, [state]);

  useEffect(() => {
    const hasStateCoords =
      state?.latitude != null && state?.longitude != null;
    const intent = {
      q: state?.q || state?.location || "",
      location: state?.location || state?.q || "Nairobi",
      latitude: hasStateCoords
        ? state.latitude
        : geoLatitude || NAIROBI_CENTER.latitude,
      longitude: hasStateCoords
        ? state.longitude
        : geoLongitude || NAIROBI_CENTER.longitude,
      mood: filters.mood,
      time_available_minutes: filters.time_available_minutes,
      companions: state?.companions || "solo",
      category: state?.category || "",
      budget_max: filters.budget_max,
    };

    const key = intentKey(intent);
    if (key === lastIntentKey.current) return;
    lastIntentKey.current = key;

    const currentRequest = ++requestId.current;
    const controller = new AbortController();
    const slowTimer = window.setTimeout(() => setSlowLoading(true), 3000);

    setLoadingState(true);
    setSlowLoading(false);
    setError("");
    setResults([]);
    setSummary("");

    saveSearchSession(intent).catch(() => {});

    fetchRecommendations(intent, controller.signal)
      .then((data) => {
        if (currentRequest !== requestId.current) return;
        setResults(data.places || []);
        setSummary(data.summary || "");
      })
      .catch((err) => {
        if (err.name === "AbortError" || currentRequest !== requestId.current) return;
        setError(err.message || resultsCopy.error);
      })
      .finally(() => {
        if (currentRequest !== requestId.current) return;
        window.clearTimeout(slowTimer);
        setSlowLoading(false);
        setLoadingState(false);
      });

    return () => {
      controller.abort();
      window.clearTimeout(slowTimer);
    };
  }, [
    state,
    filters.mood,
    filters.time_available_minutes,
    filters.budget_max,
    geoLatitude,
    geoLongitude,
  ]);

  const places = results.map((r) => r.place).filter(hasMapCoords);

  const handleRetry = () => {
    lastIntentKey.current = "";
    setFilters((prev) => ({ ...prev }));
  };

  if (!state) {
    return (
      <div className="min-h-screen bg-kijiji-deep flex flex-col items-center justify-center px-4 pb-24 text-center">
        <p className="text-muted mb-4">{resultsCopy.empty}</p>
        <Link to="/discover" className="btn-primary">
          Start a search
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kijiji-deep pb-12">
      <div className="px-4 py-6 md:px-8 max-w-7xl mx-auto">
        <ScrollReveal>
          <h1 className="font-serif text-3xl text-kijiji-text mb-2">{resultsCopy.title}</h1>
          {summary && !error && <p className="text-muted mb-6">{summary}</p>}
        </ScrollReveal>

        {loadingState ? (
          <div className="space-y-2">
            <p className="text-muted">{loading.results}</p>
            {slowLoading && (
              <p className="text-sm text-kijiji-accent">{resultsCopy.loadingSlow}</p>
            )}
          </div>
        ) : error ? (
          <div className="glass-card p-8 text-center max-w-lg">
            <p className="text-muted mb-4">{error}</p>
            <button type="button" onClick={handleRetry} className="btn-primary">
              {resultsCopy.retry}
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[240px_1fr] gap-8">
            <aside className="glass-card p-5 h-fit lg:sticky lg:top-24 space-y-4">
              <h2 className="font-serif text-lg text-kijiji-text">{resultsCopy.filters}</h2>
              <div>
                <label className="block text-xs text-muted mb-1">{resultsCopy.filterLabels.mood}</label>
                <select
                  value={filters.mood}
                  onChange={(e) => setFilters({ ...filters, mood: e.target.value })}
                  className="w-full text-sm"
                >
                  {MOODS.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">{resultsCopy.filterLabels.time}</label>
                <select
                  value={filters.time_available_minutes}
                  onChange={(e) =>
                    setFilters({ ...filters, time_available_minutes: parseInt(e.target.value, 10) })
                  }
                  className="w-full text-sm"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">{resultsCopy.filterLabels.budget}</label>
                <select
                  value={filters.budget_max}
                  onChange={(e) =>
                    setFilters({ ...filters, budget_max: parseInt(e.target.value, 10) })
                  }
                  className="w-full text-sm"
                >
                  {BUDGET_OPTIONS.map((b) => (
                    <option key={b.id} value={b.id}>{b.label}</option>
                  ))}
                </select>
              </div>
            </aside>

            <div>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                {results.map(({ place, score, match_reasons }) => (
                  <PlaceCard
                    key={getPlaceKey(place) || place.id}
                    place={place}
                    score={score}
                    matchReasons={match_reasons}
                    showMatch
                    compact
                  />
                ))}
                {results.length === 0 && (
                  <p className="text-muted col-span-full">{resultsCopy.empty}</p>
                )}
              </div>
              {places.length > 0 && (
                <div className="rounded-2xl overflow-hidden h-80 lg:h-96 glass-card p-1">
                  <MapComponent
                    places={places}
                    height="100%"
                    animatedPins
                    onMarkerClick={(p) => navigate(placePath(p))}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
