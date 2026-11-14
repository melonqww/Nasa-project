import { useId, useState } from "react";
import type { Recommendation } from "@ahm/contracts";

import "./recommendation-bar.css";

const SEVERITY_LABEL: Record<Recommendation["severity"], string> = {
  info: "Info",
  check: "Check",
  urgent: "Urgent",
};

interface RecommendationBarProps {
  recommendations: Recommendation[];
}

/**
 * Collapsible guidance row. It expands in place and never becomes a separate
 * route. The text is prepared content from the data source, not generated here.
 */
export function RecommendationBar({ recommendations }: RecommendationBarProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const primary = recommendations[0];

  if (!primary) {
    return (
      <section className="recommendation-bar" aria-label="Recommendations">
        <p className="recommendation-bar__empty">No prepared guidance for the current state.</p>
      </section>
    );
  }

  return (
    <section className="recommendation-bar" aria-label="Recommendations">
      <button
        type="button"
        className="recommendation-bar__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="recommendation-bar__tag" data-severity={primary.severity}>
          {SEVERITY_LABEL[primary.severity]}
        </span>
        <span className="recommendation-bar__title">{primary.title}</span>
        <span className="recommendation-bar__hint">
          {open ? "Hide" : "Open"}
          <span className="recommendation-bar__chevron" data-open={open} aria-hidden="true">
            ⌄
          </span>
        </span>
      </button>

      <div className="recommendation-bar__panel" id={panelId} hidden={!open}>
        {recommendations.map((recommendation) => (
          <article key={recommendation.id} className="recommendation-bar__item">
            {recommendation.title !== primary.title && (
              <h3 className="recommendation-bar__item-title">{recommendation.title}</h3>
            )}
            <p className="recommendation-bar__body">{recommendation.body}</p>
            <p className="recommendation-bar__source">{recommendation.source}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
