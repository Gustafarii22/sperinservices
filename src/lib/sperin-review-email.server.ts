const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
export function reviewNotification(
  site: string,
  review: { id: string; name: string; rating: number; service: string },
) {
  const url = new URL("/owner-reviews", site);
  url.searchParams.set("review", review.id);
  return {
    subject: "Sperin Services: a customer review is ready to check",
    text: `${review.name} submitted a ${review.rating}/5 review for ${review.service}.\n\nRead and approve: ${url}\n\nThe review is private until you choose Approve & publish.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;color:#202428"><h1 style="font-size:24px">Sperin Services</h1><h2>A review is ready to check</h2><p>${escape(review.name)} submitted a ${review.rating}/5 review for ${escape(review.service)}.</p><p><a href="${escape(url.href)}" style="display:inline-block;background:#007bc4;color:white;padding:14px 20px;text-decoration:none;border-radius:4px">Read &amp; approve review</a></p><p>The review stays private until you choose <strong>Approve &amp; publish</strong>. Opening this email or link does not publish it.</p></div>`,
  };
}
export function ownerCodeEmail(code: string) {
  return {
    subject: "Your Sperin Services owner sign-in code",
    text: `Your Sperin Services sign-in code is ${code}.\n\nEnter it on the owner sign-in page. Do not share this code. If you did not request it, ignore this email.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px"><h1>Sperin Services</h1><h2>Owner sign-in</h2><p>Your one-time sign-in code:</p><p style="font-size:30px;letter-spacing:6px">${escape(code)}</p><p>Enter it on the owner sign-in page. Do not share this code. If you did not request it, ignore this email.</p></div>`,
  };
}
export async function sendSperinEmail(
  to: string,
  content: { subject: string; text: string; html: string },
  idempotencyKey: string,
) {
  const key = process.env.SPERIN_RESEND_API_KEY;
  const from = process.env.SPERIN_EMAIL_FROM;
  if (!key || !from) throw new Error("Sperin Services email has not been configured.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(12000),
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({ from, to: [to], ...content }),
  });
  if (!response.ok) throw new Error("Email could not be sent. Please try again.");
  const result = await response.json();
  if (typeof result.id !== "string") throw new Error("Email provider did not confirm acceptance.");
  return result.id as string;
}
