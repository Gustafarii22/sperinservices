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
export const GOOGLE_REVIEW_URL =
  "https://search.google.com/local/writereview?placeid=ChIJL3jjyAK9cEgRpfDz2qeXROA";
