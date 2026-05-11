const IMAGE_SRC_RE = /<img[^>]+src=["']([^"']+)["']/i;

function firstString(...values: unknown[]) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0) as string | undefined;
}

export function extractFirstHtmlImage(html?: unknown): string | undefined {
  if (typeof html !== 'string') return undefined;
  const match = html.match(IMAGE_SRC_RE);
  return match?.[1];
}

export function getWpImageUrl(item: any, fallback: string): string {
  return firstString(
    item?.image,
    item?.image_url,
    item?.featured_image,
    item?.featured_image_url,
    item?.featured_media_url,
    item?.thumbnail,
    item?.thumbnail_url,
    item?.media?.url,
    item?._embedded?.['wp:featuredmedia']?.[0]?.source_url,
    item?._embedded?.['wp:featuredmedia']?.[0]?.media_details?.sizes?.large?.source_url,
    item?._embedded?.['wp:featuredmedia']?.[0]?.media_details?.sizes?.medium_large?.source_url,
    extractFirstHtmlImage(item?.content),
    fallback,
  ) ?? fallback;
}
