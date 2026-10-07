import { CvPage, cvMetadata } from "@/components/tools/CvPage";

export const metadata = cvMetadata("stage");

export default function Page() {
  return <CvPage contract="stage" />;
}
