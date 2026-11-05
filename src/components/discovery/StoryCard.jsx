import { Link } from "react-router-dom";

export default function StoryCard({ story, compact = false }) {
  if (compact) {
    return (
      <div className="relative h-24 rounded-xl overflow-hidden group">
        <img src={story.image} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-kijiji-deep/90 to-transparent" />
        <p className="absolute bottom-2 left-3 right-3 text-xs text-kijiji-text font-serif leading-snug">
          {story.title}
        </p>
      </div>
    );
  }

  return (
    <div className="relative aspect-[16/9] rounded-2xl overflow-hidden group cursor-pointer hover:-translate-y-1 transition-transform duration-300">
      <img
        src={story.image}
        alt={story.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-kijiji-deep via-kijiji-deep/40 to-transparent" />
      <h3 className="absolute bottom-4 left-4 right-4 font-serif text-xl text-kijiji-text">
        {story.title}
      </h3>
    </div>
  );
}

export function StoriesSection() {
  return null;
}
