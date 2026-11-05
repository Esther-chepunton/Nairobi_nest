export default function SourceAttribution({ sources = [], lastUpdated, confidenceScore }) {
  if (!sources?.length && !lastUpdated) return null;

  return (
    <section className="glass-card p-5 space-y-3">
      <h2 className="font-serif text-lg text-kijiji-text">Source &amp; freshness</h2>
      {confidenceScore != null && (
        <p className="text-xs text-muted">
          Confidence score: {Math.round(confidenceScore * 100)}%
        </p>
      )}
      {lastUpdated && (
        <p className="text-xs text-muted">
          Last updated: {new Date(lastUpdated).toLocaleDateString()}
        </p>
      )}
      <ul className="space-y-2">
        {sources.map((src, i) => (
          <li key={`${src.source_name}-${i}`} className="text-sm">
            {src.source_url ? (
              <a
                href={src.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-kijiji-accent hover:underline"
              >
                {src.attribution_text || src.source_name}
              </a>
            ) : (
              <span className="text-muted">{src.attribution_text || src.source_name}</span>
            )}
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted italic">
        Kijiji is a discovery platform — not a booking service. Confirm details with the venue before visiting.
      </p>
    </section>
  );
}
