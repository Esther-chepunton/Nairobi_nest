import { useState, useEffect, useCallback } from "react";
import { addFavorite, removeFavorite, checkFavorite } from "../lib/api";
import { getPlaceKey } from "../lib/placeIdentity";

export function useFavorites(placeOrKey) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const isLoggedIn = !!localStorage.getItem("userToken");
  const placeKey =
    typeof placeOrKey === "object" && placeOrKey !== null
      ? getPlaceKey(placeOrKey)
      : placeOrKey;

  useEffect(() => {
    if (!isLoggedIn || !placeKey) return;
    checkFavorite(placeKey).then(setSaved).catch(() => {});
  }, [placeKey, isLoggedIn]);

  const toggle = useCallback(async () => {
    if (!isLoggedIn) return { needsAuth: true };
    setLoading(true);
    try {
      if (saved) {
        await removeFavorite(placeKey);
        setSaved(false);
      } else {
        await addFavorite(
          typeof placeOrKey === "object" && placeOrKey !== null
            ? placeOrKey
            : placeKey
        );
        setSaved(true);
      }
      return { needsAuth: false };
    } finally {
      setLoading(false);
    }
  }, [saved, placeKey, placeOrKey, isLoggedIn]);

  return { saved, loading, toggle, isLoggedIn };
}
