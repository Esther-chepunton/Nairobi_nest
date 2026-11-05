import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { onboarding } from "../lib/copy";

const SLIDES = onboarding.slides.map((slide, i) => ({
  ...slide,
  image: [
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200",
    "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1200",
  ][i],
}));

export default function Onboarding() {
  const navigate = useNavigate();

  const finish = () => {
    localStorage.setItem("kijiji_onboarded", "true");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-kijiji-deep relative overflow-hidden">
      {SLIDES.map((slide, i) => (
        <motion.div
          key={slide.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.3 }}
          className="absolute inset-0"
          style={{ zIndex: SLIDES.length - i }}
        >
          <img src={slide.image} alt="" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-kijiji-deep via-kijiji-deep/70 to-transparent" />
        </motion.div>
      ))}

      <div className="relative z-10 min-h-screen flex flex-col justify-end p-8 pb-16 max-w-lg mx-auto">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-kijiji-accent text-sm font-medium mb-2">{onboarding.eyebrow}</p>
          <h1 className="font-serif text-4xl text-kijiji-text mb-4 leading-tight">
            {SLIDES[SLIDES.length - 1].title}
          </h1>
          <p className="text-muted mb-8">{SLIDES[SLIDES.length - 1].body}</p>

          <div className="space-y-3">
            <button type="button" onClick={finish} className="btn-primary w-full">
              {onboarding.cta.primary}
            </button>
            <button type="button" onClick={() => navigate("/auth")} className="btn-outline w-full">
              {onboarding.cta.secondary}
            </button>
            <button type="button" onClick={finish} className="w-full text-sm text-muted py-2">
              {onboarding.cta.skip}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
