import { useNavigate } from "react-router-dom";
import MapComponent from "../MapComponent";
import ScrollReveal from "../ui/ScrollReveal";
import GlassCard from "../ui/GlassCard";
import { home } from "../../lib/copy";
import { placePath } from "../../lib/placeIdentity";

export default function MapExploreSection({ places }) {
  const navigate = useNavigate();

  return (
    <section className="py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="flex items-end justify-between mb-6 gap-4">
            <h2 className="section-title">{home.map.title}</h2>
            <button
              type="button"
              onClick={() => navigate("/map")}
              className="btn-outline text-sm shrink-0"
            >
              {home.map.cta}
            </button>
          </div>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <GlassCard className="p-2 overflow-hidden">
            <div className="rounded-xl overflow-hidden h-72 md:h-96">
              <MapComponent
                places={places}
                height="100%"
                animatedPins
                onMarkerClick={(p) => navigate(placePath(p))}
              />
            </div>
          </GlassCard>
        </ScrollReveal>
      </div>
    </section>
  );
}
