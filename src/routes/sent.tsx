import { createFileRoute } from '@tanstack/react-router';
import { OwnerPage } from '@/components/owner-page';
export const Route = createFileRoute('/sent')({
  head: () => ({ meta: [{ title: 'Sent history | HaMuch Lead Assistant' }, { name: 'description', content: 'Private approved email and SMS history for Sperin Services.' }, { property: 'og:title', content: 'Sent history | HaMuch Lead Assistant' }, { property: 'og:description', content: 'Approved messages and delivery outcomes.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: () => <OwnerPage view="sent" />,
});