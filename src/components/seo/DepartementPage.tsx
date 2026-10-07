import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProgrammaticPageView, modelMetadata } from "@/components/seo/ProgrammaticPage";
import { resolveDepartementPage } from "@/lib/seo/departementPage";
import { resolveRegionPage } from "@/lib/seo/regionPage";
import type { ContractType } from "@/types/database";

type Props = { type: ContractType; dep: string; metier?: string; pageParam?: string };

export async function departementMetadata({ type, dep, metier, pageParam }: Props): Promise<Metadata> {
  return modelMetadata(await resolveDepartementPage(type, dep, metier), pageParam);
}

export async function DepartementPage({ type, dep, metier, pageParam }: Props) {
  const model = await resolveDepartementPage(type, dep, metier);
  if (!model) notFound();
  return <ProgrammaticPageView model={model} pageParam={pageParam} />;
}

type RegionProps = { type: ContractType; region: string; metier?: string; pageParam?: string };

export async function regionMetadata({ type, region, metier, pageParam }: RegionProps): Promise<Metadata> {
  return modelMetadata(await resolveRegionPage(type, region, metier), pageParam);
}

export async function RegionPage({ type, region, metier, pageParam }: RegionProps) {
  const model = await resolveRegionPage(type, region, metier);
  if (!model) notFound();
  return <ProgrammaticPageView model={model} pageParam={pageParam} />;
}
