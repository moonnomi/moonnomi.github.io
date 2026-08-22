import type { SiteContent, SiteLink } from "./content";

type LinkKey = keyof SiteContent["links"];

function linkHref(key: LinkKey, link: SiteLink) {
  if (key === "email" && link.url && !link.url.startsWith("mailto:")) {
    return `mailto:${link.url}`;
  }
  return link.url;
}

export function ContentLink({
  linkKey,
  link,
  placeholder = "blank",
}: {
  linkKey: LinkKey;
  link: SiteLink;
  placeholder?: string;
}) {
  if (!link.url) return <span>[{placeholder}]</span>;
  return <a href={linkHref(linkKey, link)}>{link.label}</a>;
}

export function ContentLinks({
  links,
}: {
  links: SiteContent["links"];
}) {
  return (
    <>
      {(Object.entries(links) as Array<[LinkKey, SiteLink]>).map(([key, link]) => (
        <ContentLink key={key} linkKey={key} link={link} placeholder={key} />
      ))}
    </>
  );
}
