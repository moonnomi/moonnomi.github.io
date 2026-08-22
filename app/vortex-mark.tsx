"use client";

import { useEffect, useRef, useState } from "react";

type VortexMarkProps = {
  animated?: boolean;
  className?: string;
};

const vortexFrames = [
  {
    line: "M133 128 C108 128 77 120 56 101 C35 82 30 52 44 33 C58 15 88 13 108 25 C128 37 138 63 130 85 C123 104 100 111 81 101 C63 92 54 72 61 57 C67 44 84 40 97 49 C109 57 114 74 107 85 C101 95 88 96 79 88 C71 81 69 70 75 63",
  },
  {
    line: "M131 130 C104 127 76 119 54 98 C34 78 31 49 46 31 C62 14 91 15 110 28 C128 41 136 67 127 88 C118 107 96 110 78 99 C61 89 54 68 63 54 C71 42 88 43 99 52 C111 62 112 78 104 88 C97 96 84 94 78 86 C72 78 72 68 77 62",
  },
  {
    line: "M134 127 C110 129 79 121 57 102 C36 84 29 55 43 34 C56 15 87 12 108 24 C129 36 139 61 132 84 C126 105 101 113 81 102 C62 92 53 71 61 55 C68 41 85 40 99 48 C112 57 116 74 109 86 C103 97 89 98 79 90 C70 83 68 71 74 63",
  },
  {
    line: "M132 129 C106 130 76 121 55 100 C34 80 31 50 45 32 C60 14 90 13 110 27 C130 40 137 66 128 87 C120 106 97 111 79 100 C61 90 53 69 62 54 C69 41 87 42 100 51 C112 61 113 78 105 88 C98 97 85 95 78 87 C71 79 71 68 76 62",
  },
  {
    line: "M130 128 C105 126 76 118 55 99 C34 80 29 51 43 32 C57 14 87 13 108 26 C128 39 138 64 130 86 C122 106 99 112 80 101 C62 91 54 70 62 56 C69 43 85 41 98 50 C110 59 114 75 107 86 C100 96 87 96 79 88 C71 80 70 70 75 63",
  },
  {
    line: "M135 129 C109 130 78 121 56 100 C35 80 31 50 46 31 C61 13 91 14 111 27 C130 40 138 66 129 88 C121 107 98 112 79 101 C61 91 53 69 62 54 C70 41 87 42 100 51 C112 60 114 77 106 88 C99 97 85 96 78 87 C71 79 71 68 77 61",
  },
  {
    line: "M131 127 C106 128 77 120 56 101 C35 82 30 53 44 34 C58 15 88 13 109 25 C129 37 139 63 131 85 C124 105 100 112 80 102 C62 92 53 71 61 56 C68 42 85 40 98 49 C111 58 115 75 108 86 C101 97 88 97 79 89 C71 81 69 70 75 62",
  },
];

export function VortexMark({ animated = false, className = "" }: VortexMarkProps) {
  const [frameIndex, setFrameIndex] = useState(animated ? 0 : 2);
  const [playing, setPlaying] = useState(false);
  const markRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!animated) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visibleInViewport = true;

    const syncPlaying = () => {
      setPlaying(
        !motionPreference.matches &&
        visibleInViewport &&
        document.visibilityState === "visible",
      );
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleInViewport = entry.isIntersecting;
        syncPlaying();
      },
      { threshold: 0.2 },
    );

    if (markRef.current) observer.observe(markRef.current);
    motionPreference.addEventListener("change", syncPlaying);
    document.addEventListener("visibilitychange", syncPlaying);
    syncPlaying();

    return () => {
      observer.disconnect();
      motionPreference.removeEventListener("change", syncPlaying);
      document.removeEventListener("visibilitychange", syncPlaying);
    };
  }, [animated]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % vortexFrames.length);
    }, 160);
    return () => window.clearInterval(timer);
  }, [playing]);

  const frame = vortexFrames[frameIndex];
  const classes = [
    "vortex-mark",
    animated ? "vortex-mark--animated" : "vortex-mark--static",
    className,
  ].filter(Boolean).join(" ");

  return (
    <svg
      ref={markRef}
      className={classes}
      viewBox="0 0 160 160"
      aria-hidden="true"
      focusable="false"
    >
      <path
        key={`line-${frameIndex}`}
        className="vortex-mark__line"
        d={frame.line}
        pathLength="100"
      />
    </svg>
  );
}
