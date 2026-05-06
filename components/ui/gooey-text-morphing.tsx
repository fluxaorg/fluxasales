"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface GooeyTextProps {
  texts: string[];
  morphTime?: number;
  cooldownTime?: number;
  className?: string;
  textClassName?: string;
}

export function GooeyText({
  texts,
  morphTime = 1,
  cooldownTime = 0.25,
  className,
  textClassName,
}: GooeyTextProps) {
  const text1Ref = React.useRef<HTMLSpanElement>(null);
  const text2Ref = React.useRef<HTMLSpanElement>(null);

  // Use a stable string key so the effect doesn't restart when the parent
  // re-renders with a new array reference but identical content.
  const textsKey = texts.join("\x00");

  React.useEffect(() => {
    const words = textsKey.split("\x00");
    let textIndex = 0;
    let time = new Date();
    let morph = 0;
    let cooldown = cooldownTime;
    let rafId: number;

    // Show the first word immediately — no blank flash at mount.
    // text2 is the "visible" span during cooldown.
    if (text1Ref.current && text2Ref.current) {
      text2Ref.current.textContent = words[0];
      text2Ref.current.style.opacity = "100%";
      text2Ref.current.style.filter  = "";
      text1Ref.current.textContent   = words[0];
      text1Ref.current.style.opacity = "0%";
      text1Ref.current.style.filter  = "";
    }

    // fraction 0→1: text1 fades OUT, text2 fades IN
    const setMorph = (fraction: number) => {
      if (!text1Ref.current || !text2Ref.current) return;
      const blurOut = Math.min(8 / (1 - fraction + 0.001) - 8, 100);
      const blurIn  = Math.min(8 / (fraction       + 0.001) - 8, 100);
      text1Ref.current.style.filter  = `blur(${blurOut}px)`;
      text1Ref.current.style.opacity = `${Math.pow(1 - fraction, 0.4) * 100}%`;
      text2Ref.current.style.filter  = `blur(${blurIn}px)`;
      text2Ref.current.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;
    };

    function animate() {
      rafId = requestAnimationFrame(animate);
      const now = new Date();
      const dt = (now.getTime() - time.getTime()) / 1000;
      time = now;

      const wasCoolingDown = cooldown > 0;
      cooldown -= dt;

      if (cooldown <= 0) {
        if (wasCoolingDown) {
          // Swap: copy the currently-visible word (text2) into text1 so it
          // can fade out, then load the next word into text2 to fade in.
          // This avoids any visual jump at the transition boundary.
          textIndex = (textIndex + 1) % words.length;
          if (text1Ref.current && text2Ref.current) {
            text1Ref.current.textContent   = text2Ref.current.textContent;
            text1Ref.current.style.opacity = "100%";
            text1Ref.current.style.filter  = "";
            text2Ref.current.textContent   = words[textIndex];
            text2Ref.current.style.opacity = "0%";
            text2Ref.current.style.filter  = "";
          }
          morph = 0;
        }

        morph += dt;
        const fraction = morph / morphTime;

        if (fraction >= 1) {
          // Morph complete — settle and restart cooldown
          if (text1Ref.current && text2Ref.current) {
            text1Ref.current.style.opacity = "0%";
            text1Ref.current.style.filter  = "";
            text2Ref.current.style.opacity = "100%";
            text2Ref.current.style.filter  = "";
          }
          morph    = 0;
          cooldown = cooldownTime;
        } else {
          setMorph(fraction);
        }
      }
      // During cooldown the spans keep their last settled state — no action needed.
    }

    animate();
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textsKey, morphTime, cooldownTime]);

  return (
    <div className={cn("relative", className)}>
      <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
        <defs>
          <filter id="threshold">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 255 -140"
            />
          </filter>
        </defs>
      </svg>

      <div
        className="flex items-center justify-center"
        style={{ filter: "url(#threshold)" }}
      >
        <span
          ref={text1Ref}
          className={cn(
            "absolute inline-block select-none text-center",
            textClassName
          )}
        />
        <span
          ref={text2Ref}
          className={cn(
            "absolute inline-block select-none text-center",
            textClassName
          )}
        />
      </div>
    </div>
  );
}
