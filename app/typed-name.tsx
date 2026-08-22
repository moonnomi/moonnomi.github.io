import type { CSSProperties } from "react";

export function TypedName({ name }: { name: string }) {
  const typingStyle = {
    "--home-name-width": `${Math.max(name.length, 1)}ch`,
    "--home-name-steps": Math.max(name.length, 1),
  } as CSSProperties;

  return (
    <h1 className="home-name">
      <span className="visually-hidden">{name}</span>
      <span className="home-name-stage" style={typingStyle} aria-hidden="true">{name}</span>
    </h1>
  );
}
