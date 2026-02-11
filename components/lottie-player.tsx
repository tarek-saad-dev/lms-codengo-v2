"use client";

import { useEffect, useRef } from "react";

type LottiePlayerProps = {
  src: string;
  width?: number | string;
  height?: number | string;
  autoplay?: boolean;
  loop?: boolean;
  speed?: number;
  className?: string;
};

/**
 * LottiePlayer Component
 * 
 * Reusable wrapper for @lottiefiles/dotlottie-wc web component.
 * Automatically loads the library script on first use.
 * 
 * @example
 * ```tsx
 * <LottiePlayer
 *   src="https://lottie.host/your-animation-id/file.lottie"
 *   width={300}
 *   height={300}
 *   autoplay
 *   loop
 * />
 * ```
 */
export const LottiePlayer = ({
  src,
  width = 300,
  height = 300,
  autoplay = true,
  loop = true,
  speed = 1,
  className = "",
}: LottiePlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Load the dotlottie-wc script if not already loaded
    const scriptId = "dotlottie-wc-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://unpkg.com/@lottiefiles/dotlottie-wc@0.8.11/dist/dotlottie-wc.js";
      script.type = "module";
      script.async = true;
      document.head.appendChild(script);
    }

    // Create the custom element after script loads
    const createLottieElement = () => {
      if (containerRef.current && !elementRef.current) {
        const lottieElement = document.createElement("dotlottie-wc");
        lottieElement.setAttribute("src", src);
        lottieElement.setAttribute("autoplay", autoplay.toString());
        lottieElement.setAttribute("loop", loop.toString());
        lottieElement.setAttribute("speed", speed.toString());

        // Handle width/height as numbers or strings
        const widthValue = typeof width === "number" ? `${width}px` : width;
        const heightValue = typeof height === "number" ? `${height}px` : height;
        lottieElement.style.width = widthValue;
        lottieElement.style.height = heightValue;

        containerRef.current.appendChild(lottieElement);
        elementRef.current = lottieElement;
      }
    };

    if (script.hasAttribute("data-loaded")) {
      createLottieElement();
    } else {
      script.addEventListener("load", () => {
        script.setAttribute("data-loaded", "true");
        createLottieElement();
      });
    }

    // Cleanup
    return () => {
      const container = containerRef.current;
      const element = elementRef.current;
      if (element && container) {
        container.removeChild(element);
        elementRef.current = null;
      }
    };
  }, [src, width, height, autoplay, loop, speed]);

  return <div ref={containerRef} className={className} />;
};
