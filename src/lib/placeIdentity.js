/** Stable place identity helpers (source_name:source_id). */

export const PLACE_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1523805009345-744881509cbb?w=800";

function isValidImageUrl(url) {
  return typeof url === "string" && url.trim().length > 0 && /^https?:\/\//i.test(url.trim());
}

/** First usable image URL for cards/heroes, with a Nairobi fallback. */
export function getPlaceImage(place) {
  if (!place) return PLACE_IMAGE_FALLBACK;
  const candidates = [
    place.image,
    ...(Array.isArray(place.images) ? place.images : []),
    place.image_url,
  ];
  for (const url of candidates) {
    if (isValidImageUrl(url)) return url.trim();
  }
  return PLACE_IMAGE_FALLBACK;
}

export function getPlaceKey(place) {
  if (!place) return null;
  if (place.place_key) return place.place_key;
  if (place.source_name && place.source_id) {
    return `${String(place.source_name).toLowerCase()}:${place.source_id}`;
  }
  const src = place.sources?.[0];
  if (src?.source_name && src?.source_id) {
    return `${String(src.source_name).toLowerCase()}:${src.source_id}`;
  }
  if (place.slug) return `manual_bootstrap:${place.slug}`;
  if (place.id != null) return String(place.id);
  return null;
}

/** Path segment for /places/:ref — encodes place_key colons safely. */
export function placePath(placeOrKey) {
  const key =
    typeof placeOrKey === "string" || typeof placeOrKey === "number"
      ? String(placeOrKey)
      : getPlaceKey(placeOrKey);
  if (!key) return "/discover";
  return `/places/${encodeURIComponent(key)}`;
}
