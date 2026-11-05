import { Link } from "react-router-dom";
import { STORIES } from "../../lib/intentDefaults";
import { placeDetail as copy } from "../../lib/copy";
import StoryCard from "../discovery/StoryCard";

export default function PlaceSidebar({ guides, placeId }) {
  return (
    <aside className="space-y-8">
      {guides?.length > 0 && (
        <section>
          <h2 className="font-serif text-lg text-kijiji-text mb-4">{copy.sidebar.guides}</h2>
          <div className="space-y-3">
            {guides.slice(0, 3).map((guide) => (
              <Link
                key={guide.id}
                to={`/guides/book?guide_id=${guide.id}&place_id=${placeId}`}
                className="flex gap-3 p-3 rounded-xl glass-card hover:border-kijiji-accent/30 transition-all hover:-translate-y-0.5"
              >
                <img
                  src={guide.avatar_url}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-medium text-kijiji-text">{guide.name}</p>
                  <p className="text-xs text-kijiji-accent">{guide.specialties?.[0]}</p>
                  <p className="text-xs text-muted mt-0.5">
                    ★ {guide.rating} · KSh {guide.price_per_hour}/hr
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-serif text-lg text-kijiji-text mb-4">{copy.sidebar.stories}</h2>
        <div className="space-y-3">
          {STORIES.slice(0, 2).map((story) => (
            <StoryCard key={story.title} story={story} compact />
          ))}
        </div>
      </section>

      <section className="glass-card p-4">
        <h2 className="font-serif text-lg text-kijiji-text mb-2">{copy.sidebar.newsletterTitle}</h2>
        <p className="text-xs text-muted mb-3">{copy.sidebar.newsletterBody}</p>
        <div className="flex gap-2">
          <input placeholder={copy.sidebar.newsletterPlaceholder} className="flex-1 text-sm bg-transparent" />
          <button type="button" className="btn-primary text-xs px-3 py-2">
            {copy.sidebar.newsletterCta}
          </button>
        </div>
      </section>
    </aside>
  );
}
