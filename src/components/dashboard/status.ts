/**
 * Lifecycle status → colour token.
 *
 * Only the four statuses that actually occur get a hue; see the note on
 * --status-* in styles.css for why a fifth broke the dark-mode contrast gate.
 * Everything else (Applied, Accepted, Declined, or anything added in Notion
 * later) renders as the textured neutral, which reads as "not in the
 * programme" rather than as a peer category.
 */
export function statusStyle(status: string | null | undefined): {
  color: string;
  textured: boolean;
} {
  switch (status) {
    case "Enrolled":
      return { color: "var(--status-enrolled)", textured: false };
    case "Paused":
      return { color: "var(--status-paused)", textured: false };
    case "Graduated":
      return { color: "var(--status-graduated)", textured: false };
    case "Offboarded":
      return { color: "var(--status-offboarded)", textured: false };
    default:
      return { color: "var(--status-other)", textured: true };
  }
}
