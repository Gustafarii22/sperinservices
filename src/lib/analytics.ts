export type EnquiryEvent =
  | "phone_click"
  | "whatsapp_click"
  | "email_click"
  | "calculator_change"
  | "estimate_pdf"
  | "enquiry_success";
export function track(event: EnquiryEvent) {
  try {
    if (localStorage.getItem("sperin-analytics") !== "yes" || navigator.doNotTrack === "1") return;
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* Measurement must never interrupt a customer's task. */
  }
}
