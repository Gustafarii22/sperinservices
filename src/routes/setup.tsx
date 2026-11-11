import { createFileRoute } from '@tanstack/react-router';
import { OwnerPage } from '@/components/owner-page';
export const Route = createFileRoute('/setup')({
  head: () => ({ meta: [{ title: 'Connections | HaMuch Lead Assistant' }, { name: 'description', content: 'Private Gmail and Twilio configuration for Sperin Services.' }, { property: 'og:title', content: 'Connections | HaMuch Lead Assistant' }, { property: 'og:description', content: 'Owner account connections and safe delivery configuration.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: () => <OwnerPage view="setup" />,
});