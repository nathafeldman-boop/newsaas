import { SchoolStageGuide, schoolGuideMetadata } from "@/components/schoolStage/SchoolStageGuide";

// Page guide des stages scolaires (18/11), voir components/schoolStage/SchoolStageGuide.tsx.
export const metadata = schoolGuideMetadata("bac_pro");

export default function Page() {
  return <SchoolStageGuide level="bac_pro" />;
}
