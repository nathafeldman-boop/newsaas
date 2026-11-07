import type { Metadata } from "next";
import { OffersTypePage, offersTypeMetadata } from "@/components/offers/OffersTypePage";
import { parsePageParam } from "@/lib/seo/pagination";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  return offersTypeMetadata("cdi", parsePageParam((await searchParams).page));
}

export default async function CDIOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return <OffersTypePage type="cdi" page={parsePageParam((await searchParams).page)} />;
}
