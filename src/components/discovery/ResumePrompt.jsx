import { MOODS, TIME_OPTIONS } from "../../lib/intentDefaults";
import { home } from "../../lib/copy";

function labelForMood(moodId) {
  return MOODS.find((m) => m.id === moodId)?.label || moodId;
}

function labelForTime(minutes) {
  return TIME_OPTIONS.find((t) => t.id === minutes)?.label || null;
}

export default function ResumePrompt({ session, onContinue, onDismiss }) {
  if (!session) return null;

  const summary = home.resume.summary({
    mood: session.mood ? labelForMood(session.mood) : null,
    time: session.time_available_minutes
      ? labelForTime(session.time_available_minutes)
      : null,
    location: session.location || session.q || null,
  });

  return (
    <div className="mb-6 max-w-2xl mx-auto glass-card px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 text-left">
      <div className="flex-1 min-w-0">
        <p className="font-serif text-lg text-kijiji-text">{home.resume.title}</p>
        {summary && <p className="text-muted text-sm mt-1 truncate">{summary}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onDismiss}
          className="px-4 py-2 text-sm text-muted hover:text-kijiji-text transition-colors"
        >
          {home.resume.dismiss}
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="px-5 py-2 text-sm rounded-full bg-kijiji-accent text-kijiji-deep font-medium hover:brightness-110 transition-all"
        >
          {home.resume.continue}
        </button>
      </div>
    </div>
  );
}
