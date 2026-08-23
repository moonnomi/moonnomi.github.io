import type { AnchorHTMLAttributes } from "react";

type StaticLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
};

export function StaticLink({ href, children, ...props }: StaticLinkProps) {
  return <a href={href} {...props}>{children}</a>;
}
