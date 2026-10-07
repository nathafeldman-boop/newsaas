import { CoverLetterPage, coverLetterMetadata } from "@/components/tools/CoverLetterPage";

export const metadata = coverLetterMetadata("alternance");

export default function Page() {
  return <CoverLetterPage contract="alternance" />;
}
