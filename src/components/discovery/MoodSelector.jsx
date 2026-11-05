import { useNavigate } from "react-router-dom";
import { MOODS, NAIROBI_CENTER } from "../../lib/intentDefaults";
import { home } from "../../lib/copy";
import { useGeolocation } from "../../hooks/useGeolocation";
import CategoryIcon from "../ui/CategoryIcon";
import ScrollReveal from "../ui/ScrollReveal";

export default function MoodSelector() {
  const navigate = useNavigate();
  const { location } = useGeolocation();

  const goToResults = (moodId) => {
    navigate("/results", {
      state: {
        mood: moodId,
        location: "Nairobi",
        q: "Nairobi",
        latitude: location.latitude || NAIROBI_CENTER.latitude,
        longitude: location.longitude || NAIROBI_CENTER.longitude,
        companions: "solo",
        time_available_minutes: 180,
        budget_max: 5000,
      },
    });
  };

  return (
    <section className="py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <h2 className="section-title mb-8">{home.moodSelector}</h2>
        </ScrollReveal>
        <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-2 justify-start md:justify-center">
          {MOODS.map((mood, i) => (
            <ScrollReveal key={mood.id} delay={i * 0.05}>
              <CategoryIcon
                icon={mood.icon}
                label={mood.label}
                onClick={() => goToResults(mood.id)}
              />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
