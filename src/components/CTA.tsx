import { Link } from "@tanstack/react-router";
import { ArrowRight, Calculator, MessageSquareText } from "lucide-react";

export function CTA({
  title = "What do you need?",
  subtitle = "Price a listed job, or send the details and photos.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="mx-auto my-10 max-w-7xl px-4 lg:px-8">
      <div className="grid overflow-hidden rounded-md border border-white/10 bg-[#15191a] lg:grid-cols-[.75fr_1.25fr]">
        <div className="p-5 sm:p-6">
          <span className="eyebrow">Next step</span>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="grid border-t border-white/10 sm:grid-cols-2 lg:border-l lg:border-t-0">
          <Link
            to="/pricing"
            className="group flex min-h-20 items-center gap-3 border-b border-white/10 px-5 transition hover:bg-electric/[0.05] sm:border-b-0 sm:border-r"
          >
            <Calculator className="h-5 w-5 text-electric" />
            <span className="flex-1 font-semibold">Price Your Job</span>
            <ArrowRight className="h-4 w-4 text-electric transition group-hover:translate-x-1" />
          </Link>
          <Link
            to="/contact"
            className="group flex min-h-20 items-center gap-3 px-5 transition hover:bg-white/[0.03]"
          >
            <MessageSquareText className="h-5 w-5 text-electric" />
            <span className="flex-1 font-semibold">Discuss Your Job</span>
            <ArrowRight className="h-4 w-4 text-electric transition group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
