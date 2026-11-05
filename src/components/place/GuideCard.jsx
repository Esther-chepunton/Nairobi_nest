import { Link } from "react-router-dom";

export default function GuideCard({ guide, placeId }) {
  return (
    <Link
      to={`/guides/book?guide_id=${guide.id}${placeId ? `&place_id=${placeId}` : ""}`}
      className="glass-card p-4 flex gap-4 shrink-0 w-72 hover:border-kijiji-accent/40 transition-colors"
    >
      <img
        src={guide.avatar_url}
        alt={guide.name}
        className="w-16 h-16 rounded-full object-cover"
      />
      <div>
        <h3 className="font-serif text-kijiji-text">{guide.name}</h3>
        <p className="text-xs text-kijiji-accent">{guide.specialties?.[0]} Guide</p>
        <div className="flex items-center gap-2 mt-1 text-sm">
          <span className="text-kijiji-accent">★ {guide.rating}</span>
          <span className="text-muted">· KSh {guide.price_per_hour}/hr</span>
        </div>
      </div>
    </Link>
  );
}
