import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import { getGuides } from "../lib/api";
import { guides as guidesCopy } from "../lib/copy";
import ScrollReveal from "../components/ui/ScrollReveal";

export default function Guides() {
  const [guides, setGuides] = useState([]);

  useEffect(() => {
    getGuides().then(setGuides).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-kijiji-deep px-4 py-8 md:px-8 pb-12">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <h1 className="font-serif text-3xl text-kijiji-text mb-2">{guidesCopy.title}</h1>
          <p className="text-muted mb-8">{guidesCopy.subtitle}</p>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 gap-4">
          {guides.map((guide, i) => (
            <ScrollReveal key={guide.id} delay={i * 0.05}>
              <Link
                to={`/guides/book?guide_id=${guide.id}`}
                className="glass-card p-5 flex gap-4 hover:border-kijiji-accent/30 transition-all hover:-translate-y-1 block"
              >
                <img
                  src={guide.avatar_url}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover shrink-0"
                />
                <div>
                  <h3 className="font-serif text-lg text-kijiji-text">{guide.name}</h3>
                  <p className="text-xs text-kijiji-accent">{guide.specialties?.join(" · ")}</p>
                  <p className="text-sm text-muted mt-2 line-clamp-2">{guide.bio}</p>
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    <FaStar className="text-kijiji-accent text-xs" />
                    <span>{guide.rating}</span>
                    <span className="text-muted">· KSh {guide.price_per_hour}/hr</span>
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
}
