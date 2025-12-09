import { Header } from "@/components/ui/Header";
import { Navigation } from "@/components/ui/Navigation";

export default function RoutesLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Header />
      <main className="pb-safe">{children}</main>
      <Navigation />
    </div>
  );
}

