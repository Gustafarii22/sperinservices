import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileBar } from "./MobileBar";
import { WhatsAppButton } from "./WhatsAppButton";

export function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pb-24 md:pb-0">{children}</main>
      <Footer />
      <MobileBar />
      <div className="hidden md:block fixed bottom-5 right-5 z-40">
        <WhatsAppButton size="sm" />
      </div>
    </div>
  );
}
