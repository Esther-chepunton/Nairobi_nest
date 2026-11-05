export default function CategoryIcon({ icon: Icon, label, onClick, active = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2 shrink-0 group"
    >
      <span
        className={`w-16 h-16 rounded-full flex items-center justify-center border transition-all duration-300 group-hover:-translate-y-1 ${
          active
            ? "bg-kijiji-accent/20 border-kijiji-accent shadow-[0_0_20px_rgba(74,132,132,0.4)]"
            : "bg-kijiji-elevated/80 border-white/10 group-hover:border-kijiji-accent/50 group-hover:shadow-[0_0_16px_rgba(74,132,132,0.25)]"
        }`}
      >
        <Icon className={`text-xl ${active ? "text-kijiji-accent" : "text-kijiji-text"}`} />
      </span>
      <span className="text-xs text-muted group-hover:text-kijiji-text text-center max-w-[72px]">
        {label}
      </span>
    </button>
  );
}
