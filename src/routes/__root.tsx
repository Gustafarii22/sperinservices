import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { SiteLayout } from "@/components/SiteLayout";
import { SITE } from "@/lib/site";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="font-mono text-sm text-electric">404 / NOT FOUND</div>
        <h1 className="mt-4 text-5xl font-bold">That page has moved.</h1>
        <p className="mt-3 text-sm text-muted-foreground">Use the main navigation or go back to the Sperin Services homepage.</p>
        <Link to="/" className="button-primary mt-6">Go home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="font-mono text-sm text-electric">SITE ERROR</div>
        <h1 className="mt-4 text-4xl font-bold">This page did not load correctly.</h1>
        <p className="mt-3 text-sm text-muted-foreground">Try the page again or return to the homepage.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="button-primary">Try again</button>
          <a href="/" className="button-secondary">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Sperin Services | Electrical Contractors, Birmingham & West Midlands" },
      { name: "description", content: "Domestic and commercial electrical work across Birmingham and the West Midlands. Rewires, consumer units, EICRs, EV charging, lighting, access control, maintenance and remedials." },
      { name: "author", content: "Sperin Services" },
      { name: "theme-color", content: "#090d12" },
      { property: "og:title", content: "Sperin Services | Electrical Contractors" },
      { property: "og:description", content: "Electrical work for homes, businesses and commercial premises across Birmingham and the West Midlands." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE.url },
      { property: "og:image", content: `${SITE.url}/sperin-logo.png` },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:image", content: `${SITE.url}/sperin-logo.png` },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/sperin-logo.png" },
      { rel: "apple-touch-icon", href: "/sperin-logo.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return <html lang="en"><head><HeadContent /></head><body>{children}<Scripts /></body></html>;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return <QueryClientProvider client={queryClient}><SiteLayout><Outlet /></SiteLayout></QueryClientProvider>;
}
