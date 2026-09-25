import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileBar } from "./MobileBar";
import { WhatsAppButton } from "./WhatsAppButton";
import { QuoteAssistant } from "./QuoteAssistant";

export function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 pb-24 md:pb-0">
        {children}
      </main>
      <Footer />
      <MobileBar />
      <QuoteAssistant />
      <div className="hidden md:block fixed bottom-5 right-5 z-40">
        <WhatsAppButton iconOnly />
      </div>
    </div>
  );
}
