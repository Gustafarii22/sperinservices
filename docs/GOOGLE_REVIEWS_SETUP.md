# Google Business Profile review feed

Updated 2 October 2026.

## What is implemented

Sperin Services now has a server-side Google Business Profile review feed at:

`GET /api/google-reviews`

The public `/reviews` page merges approved Sperin website reviews with Google Business Profile reviews, sorts them by date, and clearly labels the source. Google failures do not take down the Sperin review system.

The feed:

- uses the official Google Business Profile Reviews API;
- refreshes OAuth access tokens server-side;
- fetches the newest 50 reviews ordered by update time;
- exposes only public review fields;
- caches results for 15 minutes and allows CDN stale-while-revalidate;
- returns an empty optional feed when Google has not yet been connected;
- keeps all OAuth credentials server-side.

## Google requirements

The Google Business Profile location must be verified. The Google Cloud project must have access to the Google Business Profile APIs and an OAuth 2.0 client authorised for:

`https://www.googleapis.com/auth/business.manage`

Google OAuth must be granted with offline access so a refresh token is available for server-side syncing.

Official references:

- https://developers.google.com/my-business/content/review-data
- https://developers.google.com/my-business/reference/rest/v4/accounts.locations.reviews/list
- https://developers.google.com/identity/protocols/oauth2/web-server

## Required Vercel Production variables

Do not commit these values to GitHub.

- `GOOGLE_BUSINESS_CLIENT_ID`
- `GOOGLE_BUSINESS_CLIENT_SECRET`
- `GOOGLE_BUSINESS_REFRESH_TOKEN`
- `GOOGLE_BUSINESS_ACCOUNT_ID`
- `GOOGLE_BUSINESS_LOCATION_ID`

The website remains fully functional before these are added. Once all five are present in the Vercel Production environment and a new deployment is made, Google reviews begin appearing automatically.

## Security notes

OAuth credentials never reach the browser. The public endpoint returns only reviewer display name, star rating, review text and timestamps. It does not expose account IDs, location IDs, client credentials, refresh tokens or access tokens.

The existing `Review us on Google` link remains separate and continues to send customers to the Sperin Services Google review form.
