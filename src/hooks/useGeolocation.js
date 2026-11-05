import { useState, useEffect } from "react";
import { NAIROBI_CENTER } from "../lib/intentDefaults";

export function useGeolocation() {
  const [location, setLocation] = useState(NAIROBI_CENTER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLoading(false);
      },
      () => setLoading(false),
      { timeout: 8000 }
    );
  }, []);

  return { location, loading };
}
