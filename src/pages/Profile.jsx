import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { apiFetch, clearSession, getGuideBookings, updatePreferences } from "../lib/api";
import { emptyStates, profile as profileCopy, toast as toastCopy } from "../lib/copy";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [prefs, setPrefs] = useState({ interests: [], budget_range: 3000, travel_style: "explorer" });
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("userData");
    if (stored) setUser(JSON.parse(stored));

    apiFetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.id) {
          setUser(data);
          if (data.preferences) setPrefs((current) => ({ ...current, ...data.preferences }));
        }
      })
      .catch(() => {});

    getGuideBookings().then(setBookings).catch(() => setBookings([]));
  }, []);

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  const savePrefs = async () => {
    try {
      await updatePreferences(prefs);
      toast.success(toastCopy.preferencesSaved);
    } catch {
      toast.error(toastCopy.preferencesFailed);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-kijiji-deep flex flex-col items-center justify-center px-4 pb-24">
        <p className="text-muted mb-4">{emptyStates.profile}</p>
        <Link to="/auth" className="btn-primary">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kijiji-deep px-4 py-8 md:px-8 pb-24">
      <div className="max-w-md mx-auto">
        <h1 className="font-serif text-3xl text-kijiji-text mb-8">{profileCopy.title}</h1>

        <div className="glass-card p-6 mb-6">
          <p className="text-kijiji-text font-medium">{user.name || user.full_name}</p>
          <p className="text-muted text-sm">{user.email}</p>
          {user.favorites_count != null && (
            <p className="text-kijiji-accent text-sm mt-2">
              {profileCopy.savedCount(user.favorites_count)}
            </p>
          )}
        </div>

        <div className="glass-card p-6 mb-6 space-y-4">
          <h2 className="font-serif text-lg text-kijiji-text">{profileCopy.preferences}</h2>
          <div>
            <label className="block text-sm text-muted mb-2">{profileCopy.budgetLabel}</label>
            <input
              type="number"
              value={prefs.budget_range || 3000}
              onChange={(e) => setPrefs({ ...prefs, budget_range: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-2">{profileCopy.travelStyleLabel}</label>
            <select
              value={prefs.travel_style || "explorer"}
              onChange={(e) => setPrefs({ ...prefs, travel_style: e.target.value })}
              className="w-full"
            >
              <option value="explorer">{profileCopy.travelStyles.explorer}</option>
              <option value="relaxed">{profileCopy.travelStyles.relaxed}</option>
              <option value="adventurous">{profileCopy.travelStyles.adventurous}</option>
            </select>
          </div>
          <button type="button" onClick={savePrefs} className="btn-outline w-full">
            {profileCopy.savePreferences}
          </button>
        </div>

        <div className="glass-card p-6 mb-6">
          <h2 className="font-serif text-lg text-kijiji-text mb-3">{profileCopy.bookings.title}</h2>
          {bookings.length === 0 ? (
            <p className="text-muted text-sm">{profileCopy.bookings.empty}</p>
          ) : (
            <ul className="space-y-3">
              {bookings.map((b) => (
                <li key={b.id} className="flex items-start justify-between gap-3 text-sm">
                  <div>
                    <p className="text-kijiji-text">{b.guide?.name || profileCopy.bookings.guide}</p>
                    <p className="text-muted">
                      {b.date} · {b.duration_hours}h{b.place?.name ? ` · ${b.place.name}` : ""}
                    </p>
                    {b.mpesa_receipt && <p className="text-muted">{b.mpesa_receipt}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-kijiji-text">KSh {Number(b.amount).toLocaleString()}</p>
                    <span className={`text-xs ${b.status === "confirmed" ? "text-emerald-300" : b.status === "failed" || b.status === "cancelled" ? "text-red-300" : "text-kijiji-accent"}`}>
                      {profileCopy.bookings.status[b.status] || b.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link to="/favorites" className="btn-outline w-full block text-center mb-3">
          {profileCopy.viewCollection}
        </Link>
        <button type="button" onClick={handleLogout} className="btn-outline w-full text-red-400 border-red-400/30">
          {profileCopy.signOut}
        </button>
      </div>
    </div>
  );
}
