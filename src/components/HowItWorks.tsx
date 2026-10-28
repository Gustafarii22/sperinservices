import { MessageSquareText, ClipboardList, Wrench, ClipboardCheck } from "lucide-react";
export function HowItWorks() {
  return (
    <section className="section-pad bg-muted/60">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <span className="eyebrow">Straightforward from the start</span>
        <h2 className="mt-3 text-3xl sm:text-4xl">How it works</h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: MessageSquareText,
              title: "Tell us about your job",
              text: "Send the details, postcode and a few useful photographs.",
            },
            {
              icon: ClipboardList,
              title: "Receive an estimate or quotation",
              text: "We check the scope and arrange a survey where needed.",
            },
            {
              icon: Wrench,
              title: "Arrange and complete the work",
              text: "Agree the price, timing and access before work starts.",
            },
            {
              icon: ClipboardCheck,
              title: "Testing and handover",
              text: "Testing, certification and documentation where applicable.",
            },
          ].map(({ icon: Icon, title, text }, i) => (
            <li key={title}>
              <div className="flex items-center gap-3">
                <span className="icon-tile">
                  <Icon size={22} />
                </span>
                <span className="text-xs font-semibold text-muted-foreground">0{i + 1}</span>
              </div>
              <h3 className="mt-4 text-lg">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
