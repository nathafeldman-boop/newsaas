import type { Metadata } from "next";
import { OffersTypePage, offersTypeMetadata } from "@/components/offers/OffersTypePage";
import { parsePageParam } from "@/lib/seo/pagination";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  return offersTypeMetadata("cdd", parsePageParam((await searchParams).page));
}

export default async function CDDOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return <OffersTypePage type="cdd" page={parsePageParam((await searchParams).page)} />;
}
