import { createFileRoute } from "@tanstack/react-router";
import { OwnerPage } from '@/components/owner-page';

// The home route ships no og:image, so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: 'Review leads | HaMuch Lead Assistant' }, { name: 'description', content: 'Private Sperin Services lead review and approved email and SMS replies.' }, { property: 'og:title', content: 'Review leads | HaMuch Lead Assistant' }, { property: 'og:description', content: 'Private owner lead review workspace.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: () => <OwnerPage view="leads" />,
});