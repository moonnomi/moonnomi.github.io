import type { SiteContent, SiteLink } from "./content";

function linkHref(url: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(url) ? `mailto:${url}` : url;
}

export function ContentLink({
  link,
  placeholder = "blank",
}: {
  link: SiteLink;
  placeholder?: string;
}) {
  if (!link.url) return <span>[{placeholder}]</span>;
  return <a href={linkHref(link.url)}>{link.label}</a>;
}

export function ContentLinks({
  links,
}: {
  links: SiteContent["links"];
}) {
  return (
    <>
      {links.map((link, index) => (
        <ContentLink
          key={`${link.label}-${link.url}-${index}`}
          link={link}
          placeholder={link.label.toLowerCase()}
        />
      ))}
    </>
  );
}
