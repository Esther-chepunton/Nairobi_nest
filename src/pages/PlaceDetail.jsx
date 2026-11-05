import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import PlaceHero from "../components/place/PlaceHero";
import QuickInfoBar from "../components/place/QuickInfoBar";
import PlaceStory from "../components/place/PlaceStory";
import PlaceGallery from "../components/place/PlaceGallery";
import SourceAttribution from "../components/place/SourceAttribution";
import StickyActionBar from "../components/place/StickyActionBar";
import NearbyList from "../components/place/NearbyList";
import PlaceSidebar from "../components/place/PlaceSidebar";
import MapComponent from "../components/MapComponent";
import Modal from "../components/Modal";
import ScrollReveal from "../components/ui/ScrollReveal";
import { getPlace, getGuides, markVisited } from "../lib/api";
import { placeDetail as placeCopy, loading } from "../lib/copy";
import { useFavorites } from "../hooks/useFavorites";

export default function PlaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [place, setPlace] = useState(null);
  const [guides, setGuides] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { saved, toggle, isLoggedIn } = useFavorites(place || id);

  useEffect(() => {
    getPlace(decodeURIComponent(id)).then(setPlace).catch(console.error);
    getGuides().then(setGuides).catch(console.error);
  }, [id]);

  useEffect(() => {
    if (isLoggedIn && place) {
      markVisited(place).catch(() => {});
    }
  }, [isLoggedIn, place]);

  const handleSave = async () => {
    const result = await toggle();
    if (result?.needsAuth) setShowAuthModal(true);
  };

  const handleBookGuide = () => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    const ref = place?.place_key || place?.id || id;
    navigate(`/guides/book?place_id=${encodeURIComponent(ref)}`);
  };

  if (!place) {
    return (
      <div className="min-h-screen bg-kijiji-deep flex items-center justify-center text-muted">
        {loading.place}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kijiji-deep pb-28">
      <PlaceHero place={place} saved={saved} onSave={handleSave} />

      <div className="px-4 md:px-8 max-w-7xl mx-auto -mt-8 relative z-10">
        <div className="grid lg:grid-cols-[1fr_340px] gap-10">
          <div>
            <ScrollReveal>
              <h1 className="font-serif text-3xl md:text-4xl text-kijiji-text">{place.name}</h1>
              <p className="text-muted mt-1">{place.location_name}</p>
              <div className="flex items-center gap-2 mt-2 text-sm">
                <FaStar className="text-kijiji-accent" />
                <span className="text-kijiji-text">{place.rating}</span>
                <span className="text-muted">· {placeCopy.highlyRated}</span>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {place.tags?.map((tag) => (
                  <span key={tag} className="tag-pill-outline capitalize">{tag}</span>
                ))}
              </div>

              <QuickInfoBar place={place} />
            </ScrollReveal>

            <ScrollReveal delay={0.05}>
              <PlaceStory place={place} />
              <PlaceGallery images={place.images} />
              <SourceAttribution
                sources={place.sources}
                lastUpdated={place.last_updated}
                confidenceScore={place.confidence_score}
              />
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <section className="py-6">
                <h2 className="font-serif text-xl mb-4">{placeCopy.findYourWay}</h2>
                <div className="rounded-xl overflow-hidden">
                  <MapComponent
                    latitude={place.latitude}
                    longitude={place.longitude}
                    height="220px"
                    animatedPins
                  />
                </div>
              </section>
            </ScrollReveal>

            {place.nearby?.length > 0 && (
              <ScrollReveal delay={0.15} className="lg:hidden py-6">
                <h2 className="font-serif text-xl mb-4">{placeCopy.nearbyDiscoveries}</h2>
                <NearbyList
                  places={place.nearby}
                  originLat={place.latitude}
                  originLon={place.longitude}
                />
              </ScrollReveal>
            )}
          </div>

          <div className="hidden lg:block space-y-8">
            {place.nearby?.length > 0 && (
              <ScrollReveal delay={0.1}>
                <h2 className="font-serif text-lg text-kijiji-text mb-4">{placeCopy.nearbyDiscoveries}</h2>
                <NearbyList
                  places={place.nearby}
                  originLat={place.latitude}
                  originLon={place.longitude}
                />
              </ScrollReveal>
            )}
            <ScrollReveal delay={0.15}>
              <PlaceSidebar guides={guides} placeId={place.id} />
            </ScrollReveal>
          </div>
        </div>

        <div className="lg:hidden mt-8">
          <PlaceSidebar guides={guides} placeId={place.id} />
        </div>
      </div>

      <StickyActionBar place={place} onBookGuide={handleBookGuide} />

      {showAuthModal && (
        <Modal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          message={placeCopy.authModal}
        />
      )}
    </div>
  );
}
