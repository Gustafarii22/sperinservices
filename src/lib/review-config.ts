// Publishable key only; privileged keys stay inside the Supabase Edge Function.
export const REVIEW_DATABASE_URL = "https://ooxeuejhuynglawkfwpp.supabase.co";
export const REVIEW_PUBLIC_KEY = "sb_publishable_JJQyThVv42K2ZTxPHKUj7w_VNH-xzQI";
export const REVIEW_OWNER_ID = "7319fcef-63e7-4761-9174-179ecabba17e";
export const REVIEW_FIELDS =
  "id,name,area,service,rating,text,status,reply,created_at,moderated_at";
export type Review = {
  id: string;
  name: string;
  area: string;
  service: string;
  rating: number;
  text: string;
  status: "pending" | "approved" | "rejected";
  reply: string;
  created_at: string;
  moderated_at: string | null;
  job_reference?: string;
};
export const REVIEW_ANON_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9veGV1ZWpodXluZ2xhd2tmd3BwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMjAyMjEsImV4cCI6MjEwNTU5NjIyMX0.e_Y7AGzoAI7vtEpG3RSLNbRGh67fv60QeLKdNqeXOUE";
export const GOOGLE_REVIEW_URL =
  "https://search.google.com/local/writereview?placeid=ChIJL3jjyAK9cEgRpfDz2qeXROA";
