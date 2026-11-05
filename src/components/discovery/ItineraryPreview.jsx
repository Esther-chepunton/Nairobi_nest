import { Link } from "react-router-dom";
import { FaSun, FaCoffee, FaMoon } from "react-icons/fa";
import { SAMPLE_ITINERARY } from "../../lib/intentDefaults";
import { home } from "../../lib/copy";
import ScrollReveal from "../ui/ScrollReveal";

const ICONS = [FaSun, FaCoffee, FaMoon];

export default function ItineraryPreview() {
  return (
    <section className="py-12 px-4 md:px-8 bg-kijiji-mid">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <h2 className="section-title mb-8">{home.itinerary.title}</h2>
        </ScrollReveal>
        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          <ScrollReveal className="glass-card p-6 md:p-8">
            {SAMPLE_ITINERARY.map((step, i) => {
              const Icon = ICONS[i] || FaSun;
              return (
                <div key={step.title} className="flex gap-4 pb-6 last:pb-0 relative">
                  {i < SAMPLE_ITINERARY.length - 1 && (
                    <div className="absolute left-5 top-10 bottom-0 w-px bg-kijiji-accent/30" />
                  )}
                  <div className="w-10 h-10 rounded-full bg-kijiji-accent/20 flex items-center justify-center shrink-0 z-10 border border-kijiji-accent/30">
                    <Icon className="text-kijiji-accent text-sm" />
                  </div>
                  <div>
                    <p className="text-xs text-kijiji-accent font-medium">{step.time}</p>
                    <h3 className="font-serif text-lg text-kijiji-text">{step.title}</h3>
                    <p className="text-sm text-muted">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </ScrollReveal>

          <ScrollReveal delay={0.1} className="glass-card p-8 flex flex-col justify-center text-center md:text-left">
            <h3 className="font-serif text-2xl text-kijiji-text mb-3">
              {home.itinerary.bodyTitle}
            </h3>
            <p className="text-muted mb-6 leading-relaxed">
              {home.itinerary.body}
            </p>
            <Link to="/itineraries" className="btn-primary inline-block text-center md:self-start">
              {home.itinerary.cta}
            </Link>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
