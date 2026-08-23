function dateFallback(value) {
  const match = String(value ?? "").match(/^(\d{4})\.(\d{2})\.(\d{2})$/);
  if (!match) return 0;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function postRecency(post) {
  const publishedAt = Date.parse(String(post?.publishedAt ?? ""));
  return Number.isFinite(publishedAt) ? publishedAt : dateFallback(post?.date);
}

export function comparePostRecency(left, right) {
  const recencyDifference = postRecency(right) - postRecency(left);
  if (recencyDifference !== 0) return recencyDifference;

  const dateDifference = String(right?.date ?? "").localeCompare(String(left?.date ?? ""));
  if (dateDifference !== 0) return dateDifference;

  return String(left?.slug ?? "").localeCompare(String(right?.slug ?? ""));
}
