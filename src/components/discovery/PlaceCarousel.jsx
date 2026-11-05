import PlaceCard from "./PlaceCard";

export default function PlaceCarousel({ title, places, subtitle }) {
  if (!places?.length) return null;

  return (
    <section className="py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="section-title mb-1">{title}</h2>
        {subtitle && <p className="text-muted mb-6">{subtitle}</p>}
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
          {places.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      </div>
    </section>
  );
}
