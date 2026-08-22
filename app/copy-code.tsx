"use client";

import { useState } from "react";

export function CopyCode({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <button className="copy-code" type="button" onClick={copy}>
      {copied ? "copied" : "copy"}
    </button>
  );
}
