"use client";

import { useState } from "react";

const GRADIENTS = [
  "from-pink-soft to-lav-deep",
  "from-lav to-pink-soft",
  "from-lav-deep to-pink-soft",
];

/** Image with a soft gradient + initial fallback so a broken URL never breaks a card. */
export function Photo({
  src,
  name,
  className = "",
  draggable = false,
}: {
  src: string;
  name: string;
  className?: string;
  draggable?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={name}
        className={`flex items-center justify-center bg-gradient-to-br font-display text-5xl font-bold text-ink/40 ${
          GRADIENTS[name.length % GRADIENTS.length]
        } ${className}`}
      >
        {name.charAt(0)}
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={name}
      draggable={draggable}
      onError={() => setFailed(true)}
      className={`select-none object-cover ${className}`}
    />
  );
}
