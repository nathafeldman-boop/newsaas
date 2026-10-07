import { CvPage, cvMetadata } from "@/components/tools/CvPage";

export const metadata = cvMetadata("alternance");

export default function Page() {
  return <CvPage contract="alternance" />;
}
