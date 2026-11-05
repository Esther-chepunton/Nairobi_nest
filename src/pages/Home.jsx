import { lazy, Suspense, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import HeroSearchBar from "../components/discovery/HeroSearchBar";
import ResumePrompt from "../components/discovery/ResumePrompt";
import PlaceCarousel from "../components/discovery/PlaceCarousel";
import MoodSelector from "../components/discovery/MoodSelector";
import ItineraryPreview from "../components/discovery/ItineraryPreview";
import Footer from "../components/layout/Footer";
import ScrollReveal from "../components/ui/ScrollReveal";
import {
  getPlaces,
  getBecauseYouLiked,
  getWeather,
  getRecentSearchSession,
  dismissSearchSession,
} from "../lib/api";
import { home } from "../lib/copy";
import { useGeolocation } from "../hooks/useGeolocation";

// Leaflet is heavy; load the map section after the rest of the page.
const MapExploreSection = lazy(() => import("../components/discovery/MapExploreSection"));

export default function Home() {
  const navigate = useNavigate();
  const { location } = useGeolocation();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  const [trending, setTrending] = useState([]);
  const [hiddenGems, setHiddenGems] = useState([]);
  const [allPlaces, setAllPlaces] = useState([]);
  const [becauseYouLiked, setBecauseYouLiked] = useState([]);
  const [weatherNote, setWeatherNote] = useState("");
  const [resumeSession, setResumeSession] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("kijiji_onboarded")) {
      navigate("/onboarding");
    }
  }, [navigate]);

  useEffect(() => {
    getPlaces({ trending: "true" }).then(setTrending).catch(console.error);
    getPlaces({ hidden_gem: "true" }).then(setHiddenGems).catch(console.error);
    getPlaces().then(setAllPlaces).catch(console.error);
    if (localStorage.getItem("userToken")) {
      getBecauseYouLiked().then((d) => setBecauseYouLiked(d.places || [])).catch(() => {});
    }
    getRecentSearchSession().then(setResumeSession).catch(() => setResumeSession(null));
  }, []);

  useEffect(() => {
    getWeather(location.latitude, location.longitude)
      .then((w) => {
        if (w.is_rainy) {
          setWeatherNote(home.weatherRain);
        }
      })
      .catch(() => {});
  }, [location.latitude, location.longitude]);

  const handleResumeContinue = () => {
    if (!resumeSession) return;
    navigate("/results", {
      state: {
        q: resumeSession.q || resumeSession.location || "",
        location: resumeSession.location || resumeSession.q || "Nairobi",
        mood: resumeSession.mood || "peaceful",
        time_available_minutes: resumeSession.time_available_minutes || 180,
        budget_max: resumeSession.budget_max || 5000,
        companions: resumeSession.companions || "solo",
        category: resumeSession.category || "",
        latitude: resumeSession.latitude,
        longitude: resumeSession.longitude,
      },
    });
  };

  const handleResumeDismiss = async () => {
    try {
      await dismissSearchSession();
    } catch {
      /* still hide locally */
    }
    setResumeSession(null);
  };

  return (
    <div className="bg-kijiji-deep">
      <section
        ref={heroRef}
        className="relative min-h-[90vh] flex flex-col justify-end pb-12 overflow-hidden"
      >
        <motion.div className="absolute inset-0 scale-110" style={{ y: heroY }}>
          <img
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600"
            alt=""
            className="w-full h-full object-cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-kijiji-deep via-kijiji-deep/60 to-kijiji-deep/20" />

        <div className="relative z-10 px-4 md:px-8 max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-10"
          >
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-kijiji-text mb-4 leading-tight">
              {home.heroTitle}
            </h1>
            <p className="text-muted text-lg md:text-xl max-w-2xl mx-auto">
              {home.heroSubtitle}
            </p>
            {weatherNote && (
              <p className="text-kijiji-accent text-sm mt-3">{weatherNote}</p>
            )}
          </motion.div>

          {resumeSession ? (
            <ResumePrompt
              session={resumeSession}
              onContinue={handleResumeContinue}
              onDismiss={handleResumeDismiss}
            />
          ) : (
            <HeroSearchBar />
          )}
        </div>
      </section>

      <ScrollReveal>
        <PlaceCarousel title={home.carousels.trending} places={trending} />
      </ScrollReveal>

      {becauseYouLiked.length > 0 && (
        <ScrollReveal>
          <PlaceCarousel title={home.carousels.becauseYouLiked} places={becauseYouLiked} />
        </ScrollReveal>
      )}

      <MoodSelector />
      <Suspense fallback={<div className="h-96" />}>
        <MapExploreSection places={allPlaces} />
      </Suspense>
      <ItineraryPreview />

      <ScrollReveal>
        <PlaceCarousel
          title={home.carousels.hiddenGems}
          places={hiddenGems}
          subtitle={home.carousels.hiddenGemsSubtitle}
        />
      </ScrollReveal>

      <Footer />
    </div>
  );
}
