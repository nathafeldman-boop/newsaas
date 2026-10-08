import { PublicHeader } from "@/components/nav/PublicHeader";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicHeader />
      {children}
    </>
  );
}
