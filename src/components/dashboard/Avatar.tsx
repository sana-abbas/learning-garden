import { useState } from "react";
import type { ParticipantRow } from "./types";
import { displayName, initials } from "./format";

/** Google profile photo with an initials fallback. */
export function Avatar({ row, size = "md" }: { row: ParticipantRow; size?: "sm" | "md" | "lg" }) {
  const [imgError, setImgError] = useState(false);
  const showImg = !!row.avatar_url && !imgError;
  const sizeClass =
    size === "lg" ? "w-14 h-14 text-lg" : size === "sm" ? "w-9 h-9 text-xs" : "w-11 h-11 text-sm";
  const radiusClass = size === "lg" ? "rounded-2xl" : "rounded-xl";

  return (
    <div className={`${sizeClass} ${radiusClass} overflow-hidden shrink-0 relative`}>
      {showImg ? (
        <img
          src={row.avatar_url!}
          alt={displayName(row)}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center text-white font-semibold ${sizeClass}`}
          style={{
            background: "linear-gradient(135deg, var(--primary), var(--bloom-pink))",
            fontSize: undefined,
          }}
        >
          <span>{initials(row.display_name, row.email)}</span>
        </div>
      )}
    </div>
  );
}
