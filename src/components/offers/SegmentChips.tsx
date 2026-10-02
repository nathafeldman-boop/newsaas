import Link from "next/link";
import type { Segment } from "@/lib/offers/segments";

// N'affiche que les secteurs/villes qui ont assez d'offres pour justifier
// une page dédiée (voir MIN_OFFERS_FOR_SEGMENT_PAGE) -- apparaît/disparaît
// tout seul avec le catalogue, jamais besoin de maintenir une liste à la
// main.
export function SegmentChips({ title, basePath, segments }: { title: string; basePath: string; segments: Segment[] }) {
  if (segments.length === 0) return null;

  return (
    <div className="mt-6">
      <p style={{ fontSize: 12.5, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.03em" }}>
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {segments.slice(0, 12).map((segment) => (
          <Link key={segment.slug} href={`${basePath}/${segment.slug}`} className="tag tag-neutral">
            {segment.label} ({segment.count})
          </Link>
        ))}
      </div>
    </div>
  );
}
