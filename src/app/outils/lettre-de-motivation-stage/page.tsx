import { CoverLetterPage, coverLetterMetadata } from "@/components/tools/CoverLetterPage";

export const metadata = coverLetterMetadata("stage");

export default function Page() {
  return <CoverLetterPage contract="stage" />;
}
