import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaHeart, FaRegHeart } from "react-icons/fa";

import { getPlaceImage } from "../../lib/placeIdentity";

export default function PlaceHero({ place, saved, onSave }) {
  const navigate = useNavigate();
  const image = getPlaceImage(place);

  return (
    <div className="relative h-[50vh] md:h-[60vh]">
      <img src={image} alt={place.name} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-kijiji-deep via-transparent to-kijiji-deep/30" />
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 p-3 rounded-full glass text-kijiji-text"
      >
        <FaArrowLeft />
      </button>
      {onSave && (
        <button
          type="button"
          onClick={onSave}
          className="absolute top-4 right-4 p-3 rounded-full glass text-kijiji-accent"
        >
          {saved ? <FaHeart /> : <FaRegHeart />}
        </button>
      )}
    </div>
  );
}
