import { SchoolStageGuide, schoolGuideMetadata } from "@/components/schoolStage/SchoolStageGuide";

// Page guide des stages scolaires (18/11), voir components/schoolStage/SchoolStageGuide.tsx.
export const metadata = schoolGuideMetadata("premiere");

export default function Page() {
  return <SchoolStageGuide level="premiere" />;
}
