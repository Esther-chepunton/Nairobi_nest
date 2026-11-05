import { results as resultsCopy } from "../../lib/copy";

export default function MatchBadge({ score, reasons }) {
  if (!score) return null;
  return (
    <div className="inline-flex flex-col gap-1">
      <span className="tag-pill">{resultsCopy.matchBadge(Math.round(score * 100))}</span>
      {reasons?.length > 0 && (
        <span className="text-xs text-muted">{reasons.join(" · ")}</span>
      )}
    </div>
  );
}
