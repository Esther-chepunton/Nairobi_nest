import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaBars, FaTimes, FaUser } from "react-icons/fa";
import { NAIROBI_CENTER } from "../../lib/intentDefaults";
import { nav as navCopy } from "../../lib/copy";
import { useGeolocation } from "../../hooks/useGeolocation";

const NAV_ITEMS = [
  { label: navCopy.explore, to: "/discover" },
  { label: navCopy.interests, to: "/discover", state: { focus: "categories" } },
  { label: navCopy.nearMe, action: "nearMe" },
  { label: navCopy.dayPlans, to: "/itineraries", auth: true },
  { label: navCopy.localGuides, to: "/guides" },
  { label: navCopy.saved, to: "/favorites", auth: true },
];

export default function AppShell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { location: geo } = useGeolocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const hideNav = location.pathname === "/onboarding";

  const isLoggedIn = !!localStorage.getItem("userToken");
  const userData = (() => {
    try {
      return JSON.parse(localStorage.getItem("userData") || "{}");
    } catch {
      return {};
    }
  })();

  const isActive = (item) => {
    if (item.action === "nearMe") {
      return location.pathname === "/results" && !!location.state?.nearMe;
    }
    return location.pathname === item.to;
  };

  const handleNav = (item) => {
    setMenuOpen(false);
    if (item.action === "nearMe") {
      // Already viewing Near me — do not re-navigate (avoids Results remount / flash).
      if (location.pathname === "/results" && location.state?.nearMe) {
        return;
      }
      navigate("/results", {
        state: {
          nearMe: true,
          latitude: geo.latitude || NAIROBI_CENTER.latitude,
          longitude: geo.longitude || NAIROBI_CENTER.longitude,
          mood: "peaceful",
          companions: "solo",
          time_available_minutes: 180,
          budget_max: 5000,
        },
      });
      return;
    }
    if (item.auth && !isLoggedIn) {
      sessionStorage.setItem("authRedirect", item.to);
      navigate("/auth");
      return;
    }
    navigate(item.to, item.state ? { state: item.state } : undefined);
  };

  const profileLabel = isLoggedIn ? userData.name || navCopy.you : navCopy.signIn;

  return (
    <div className="min-h-screen bg-kijiji-deep flex flex-col">
      {!hideNav && (
        <header className="sticky top-0 z-50 glass border-b border-white/10 px-4 md:px-8 py-3">
          <div className="max-w-7xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <Link to="/" className="font-serif text-xl text-kijiji-text justify-self-start">
              Kijiji
            </Link>

            <nav className="hidden lg:flex items-center gap-6 text-sm justify-self-center">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNav(item)}
                  className={`transition-colors ${
                    isActive(item) ? "text-kijiji-accent" : "text-muted hover:text-kijiji-text"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3 justify-self-end">
              <Link
                to={isLoggedIn ? "/profile" : "/auth"}
                className="hidden sm:flex items-center gap-2 text-sm text-muted hover:text-kijiji-text"
              >
                <span className="w-9 h-9 rounded-full bg-kijiji-elevated border border-kijiji-accent/30 flex items-center justify-center">
                  <FaUser className="text-kijiji-accent text-sm" />
                </span>
                <span className="hidden md:inline">{profileLabel}</span>
              </Link>
              <button
                type="button"
                className="lg:hidden p-2 text-kijiji-text"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={navCopy.menu}
              >
                {menuOpen ? <FaTimes /> : <FaBars />}
              </button>
            </div>
          </div>

          {menuOpen && (
            <nav className="lg:hidden mt-4 pb-2 flex flex-col gap-1 border-t border-white/10 pt-4">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNav(item)}
                  className={`text-left py-2 px-2 rounded-lg text-sm ${
                    isActive(item) ? "text-kijiji-accent bg-kijiji-elevated/50" : "text-muted"
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <Link
                to={isLoggedIn ? "/profile" : "/auth"}
                onClick={() => setMenuOpen(false)}
                className="py-2 px-2 text-sm text-kijiji-accent"
              >
                {profileLabel}
              </Link>
            </nav>
          )}
        </header>
      )}
      <main className="flex-1">{children}</main>
    </div>
  );
}
