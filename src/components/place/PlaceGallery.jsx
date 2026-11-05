import { placeDetail as copy } from "../../lib/copy";

export default function PlaceGallery({ images }) {
  if (!images?.length) return null;
  const display = images.slice(0, 3);
  return (
    <section className="py-6">
      <h2 className="font-serif text-xl mb-4">{copy.sections.inPictures}</h2>
      <div className="grid grid-cols-3 gap-3">
        {display.map((img, i) => (
          <img
            key={i}
            src={img}
            alt=""
            className="w-full aspect-[4/3] object-cover rounded-xl hover:scale-[1.02] transition-transform duration-300"
          />
        ))}
      </div>
    </section>
  );
}
