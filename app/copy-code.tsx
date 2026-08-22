"use client";

import { useState } from "react";

export function CopyCode({ value }: { value: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  const copy = async () => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 1400);
    } catch {
      setStatus("error");
    }
  };

  return (
    <button className="copy-code" type="button" data-state={status} aria-live="polite" onClick={copy}>
      {status === "copied" ? "Copied" : status === "error" ? "Copy failed, try again" : "Copy"}
    </button>
  );
}
