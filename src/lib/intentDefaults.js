import {
  FaLeaf,
  FaMountain,
  FaHeart,
  FaUsers,
  FaLandmark,
  FaCamera,
} from "react-icons/fa";

export const MOODS = [
  { id: "peaceful", label: "Quiet & calm", icon: FaLeaf },
  { id: "adventurous", label: "Ready for adventure", icon: FaMountain },
  { id: "romantic", label: "Romantic", icon: FaHeart },
  { id: "family", label: "With the family", icon: FaUsers },
  { id: "local-culture", label: "Deep in culture", icon: FaLandmark },
  { id: "photographer", label: "Chasing light", icon: FaCamera },
];

export const BUDGET_OPTIONS = [
  { id: 500, label: "Up to KSh 500" },
  { id: 2000, label: "Up to KSh 2,000" },
  { id: 5000, label: "Up to KSh 5,000" },
  { id: 10000, label: "Up to KSh 10,000" },
  { id: 999999, label: "No limit" },
];

export const COMPANIONS = [
  { id: "solo", label: "Just me" },
  { id: "couple", label: "The two of us" },
  { id: "family", label: "Family" },
  { id: "friends", label: "Friends" },
];

export const TIME_OPTIONS = [
  { id: 60, label: "An hour" },
  { id: 120, label: "A couple of hours" },
  { id: 180, label: "A few hours" },
  { id: 240, label: "Half a day" },
  { id: 480, label: "All day" },
];

export const CATEGORIES = [
  { id: "trail", label: "Forest trails" },
  { id: "waterfall", label: "Waterfalls" },
  { id: "cafe", label: "Coffee & cafés" },
  { id: "museum", label: "Museums" },
  { id: "market", label: "Markets" },
  { id: "park", label: "Parks" },
  { id: "cultural", label: "Culture" },
  { id: "restaurant", label: "Food & dining" },
];

export const STORIES = [
  {
    title: "10 hidden gems locals don't tell you",
    image: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800",
  },
  {
    title: "Best sunset spots near Nairobi",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
  },
  {
    title: "Rainy day escapes in the city",
    image: "https://images.unsplash.com/photo-1566127444979-b3faf2aee547?w=800",
  },
];

export const SAMPLE_ITINERARY = [
  { time: "8:00 AM", title: "Karura Forest", description: "Morning walk & waterfall" },
  { time: "1:00 PM", title: "Spring Valley Coffee", description: "Quiet lunch & coffee" },
  { time: "6:00 PM", title: "Ngong Hills", description: "Sunset at the ridge" },
];

export const NAIROBI_CENTER = { latitude: -1.286389, longitude: 36.817223 };
