import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileBar } from "./MobileBar";

export function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pb-24 lg:pb-0">{children}</main>
      <Footer />
      <MobileBar />
    </div>
  );
}
