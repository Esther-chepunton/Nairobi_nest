import { errors as errorCopy } from "./copy";

export const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:10000";

export function getAuthHeaders() {
  const token = localStorage.getItem("userToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function clearSession() {
  localStorage.removeItem("userToken");
  localStorage.removeItem("userData");
}

export async function apiFetch(path, options = {}) {
  const hadToken = !!localStorage.getItem("userToken");
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });
  // Expired or invalid token: drop it and send the user to sign in again,
  // returning them to where they were afterwards.
  if (response.status === 401 && hadToken && !path.startsWith("/api/auth/login")) {
    clearSession();
    if (window.location.pathname !== "/auth") {
      sessionStorage.setItem("authRedirect", window.location.pathname + window.location.search);
      window.location.assign("/auth");
    }
  }
  return response;
}

export async function apiPost(path, body) {
  const response = await apiFetch(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.message || errorCopy.requestFailed);
  }
  return data;
}

export async function apiPatch(path, body) {
  const response = await apiFetch(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.message || errorCopy.requestFailed);
  }
  return data;
}

export async function apiDelete(path) {
  const response = await apiFetch(path, { method: "DELETE" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.message || errorCopy.requestFailed);
  }
  return data;
}

export async function getPlaces(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await apiFetch(`/api/places${qs ? `?${qs}` : ""}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load places");
  return data.places;
}

export async function getPlace(idOrKey) {
  const ref = encodeURIComponent(String(idOrKey));
  const res = await apiFetch(`/api/places/${ref}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || errorCopy.placeNotFound);
  return data;
}

export async function searchPlaces(query, intent = {}) {
  return apiPost("/api/search", { q: query, ...intent });
}

export async function getRecommendations(intent) {
  return apiPost("/api/recommendations", intent);
}

export async function getRecommendationsWithExplain(intent) {
  return apiPost("/api/recommendations/explain", intent);
}

export async function getFavorites() {
  const res = await apiFetch("/api/favorites");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || errorCopy.loadFavorites);
  return data.favorites;
}

export async function addFavorite(placeOrKey, placePayload = null) {
  const body =
    typeof placeOrKey === "object" && placeOrKey !== null
      ? {
          place_key: placeOrKey.place_key || undefined,
          place_id: placeOrKey.id || placeOrKey.legacy_place_id || undefined,
          place: placeOrKey,
        }
      : {
          place_key: String(placeOrKey).includes(":") ? String(placeOrKey) : undefined,
          place_id: String(placeOrKey).includes(":") ? undefined : placeOrKey,
          ...(placePayload ? { place: placePayload } : {}),
        };
  return apiPost("/api/favorites", body);
}

export async function removeFavorite(placeOrKey) {
  const key =
    typeof placeOrKey === "object" && placeOrKey !== null
      ? placeOrKey.place_key || placeOrKey.id
      : placeOrKey;
  return apiDelete(`/api/favorites/${encodeURIComponent(String(key))}`);
}

export async function checkFavorite(placeOrKey) {
  const key =
    typeof placeOrKey === "object" && placeOrKey !== null
      ? placeOrKey.place_key || placeOrKey.id
      : placeOrKey;
  const res = await apiFetch(`/api/favorites/check/${encodeURIComponent(String(key))}`);
  const data = await res.json();
  return data.saved;
}

export async function getGuides(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await apiFetch(`/api/guides${qs ? `?${qs}` : ""}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || errorCopy.loadGuides);
  return data.guides;
}

export async function createGuideBooking(payload) {
  return apiPost("/api/guide-bookings", payload);
}

export async function payGuideMpesa(payload) {
  return apiPost("/api/mpesa-payment", payload);
}

export async function getPaymentStatus(bookingId) {
  const res = await apiFetch(`/api/guide-bookings/${bookingId}/payment-status`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || errorCopy.requestFailed);
  return data;
}

export async function getGuideBookings() {
  const res = await apiFetch("/api/guide-bookings");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || errorCopy.requestFailed);
  return data.bookings || [];
}

export async function getItineraries() {
  const res = await apiFetch("/api/itineraries");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || errorCopy.loadItineraries);
  return data.itineraries;
}

export async function createItinerary(payload) {
  return apiPost("/api/itineraries", payload);
}

export async function addItineraryItem(itineraryId, payload) {
  return apiPost(`/api/itineraries/${itineraryId}/items`, payload);
}

export async function getSharedItinerary(token) {
  const res = await apiFetch(`/api/itineraries/share/${token}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || errorCopy.itineraryNotFound);
  return data;
}

export async function updatePreferences(prefs) {
  return apiPatch("/api/auth/preferences", prefs);
}

export async function markVisited(placeOrKey) {
  if (typeof placeOrKey === "object" && placeOrKey !== null) {
    return apiPost("/api/auth/visited", {
      place_key: placeOrKey.place_key,
      place_id: placeOrKey.id || placeOrKey.legacy_place_id,
    });
  }
  const ref = String(placeOrKey);
  if (ref.includes(":")) {
    return apiPost("/api/auth/visited", { place_key: ref });
  }
  return apiPost("/api/auth/visited", { place_id: placeOrKey });
}

export async function getBecauseYouLiked() {
  const res = await apiFetch("/api/auth/because-you-liked");
  const data = await res.json();
  if (!res.ok) return { places: [], based_on: null };
  return data;
}

export async function getWeather(lat, lon) {
  const res = await apiFetch(`/api/weather?lat=${lat}&lon=${lon}`);
  return res.json();
}

export function getDirectionsUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export async function saveSearchSession(intent) {
  return apiPost("/api/search-sessions", intent);
}

export async function getRecentSearchSession() {
  const res = await apiFetch("/api/search-sessions/recent");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return null;
  return data.session || null;
}

export async function dismissSearchSession() {
  const res = await apiFetch("/api/search-sessions/recent", { method: "DELETE" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || errorCopy.requestFailed);
  }
  return data;
}

export async function claimSearchSession() {
  const res = await apiFetch("/api/search-sessions/claim", { method: "POST" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return null;
  return data.session || null;
}
