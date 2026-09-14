import { createFileRoute, Link } from "@tanstack/react-router";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Sperin Services" },
      {
        name: "description",
        content:
          "How Sperin Services collects, uses and protects personal information.",
      },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <section className="mx-auto max-w-4xl px-4 pb-16 pt-12 lg:px-8">
      <div className="inline-flex items-center gap-2 rounded-full hairline px-3 py-1 text-xs text-electric">
        Privacy
      </div>
      <h1 className="mt-5 text-4xl font-bold sm:text-5xl">
        <span className="gradient-electric-text">Privacy Policy</span>
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Last updated: 14 September 2026
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <PolicySection title="Who we are">
          <p>
            Augustine Sperin, trading as Sperin Services, is responsible for the
            personal information described in this policy. You can contact us at{" "}
            <a className="text-electric underline underline-offset-2" href={`mailto:${SITE.email}`}>
              {SITE.email}
            </a>{" "}
            or{" "}
            <a className="text-electric underline underline-offset-2" href={`tel:${SITE.phone}`}>
              {SITE.phoneDisplay}
            </a>
            .
          </p>
        </PolicySection>

        <PolicySection title="Information we collect">
          <p>
            We may collect your name, telephone number, email address, postcode,
            property or job details, enquiry messages and any photographs or
            documents you choose to send. If you become a customer, we may also
            keep quotation, job, invoice, payment and communication records.
          </p>
        </PolicySection>

        <PolicySection title="How we use your information">
          <p>
            We use your information to respond to enquiries, arrange visits,
            prepare quotes, provide and manage work, communicate with you,
            maintain business and tax records, resolve disputes and meet legal,
            regulatory, insurance and safety obligations.
          </p>
        </PolicySection>

        <PolicySection title="Our lawful bases">
          <p>
            Depending on the circumstances, we process information because it is
            necessary to take steps at your request before entering a contract,
            to perform a contract, to comply with a legal obligation, or for our
            legitimate interests in operating and protecting the business and
            responding to customers.
          </p>
        </PolicySection>

        <PolicySection title="Who we share information with">
          <p>
            We only share information where necessary. This may include website
            form and hosting providers, email and communications providers,
            accountants, payment providers, insurers, professional advisers,
            suitably appointed subcontractors, and public authorities where
            required by law. Website quote requests are processed by FormSubmit
            and forwarded to our business email.
          </p>
        </PolicySection>

        <PolicySection title="International processing">
          <p>
            Some service providers may process information outside the United
            Kingdom. Where this happens, we expect the provider to use a lawful
            transfer mechanism and appropriate safeguards for personal data.
          </p>
        </PolicySection>

        <PolicySection title="How long we keep information">
          <p>
            Enquiries that do not become jobs are normally kept for up to 24
            months so we can respond and refer back to previous discussions.
            Customer, invoice, payment and tax records may be kept for up to six
            years, or longer where the law, a dispute, warranty, insurance or
            safety requirement makes this necessary.
          </p>
        </PolicySection>

        <PolicySection title="Security">
          <p>
            We take reasonable steps to protect personal information and limit
            access to people and service providers who need it for the purposes
            described above. No internet service can be guaranteed completely
            secure.
          </p>
        </PolicySection>

        <PolicySection title="Your rights">
          <p>
            Depending on the circumstances, you may have rights to access,
            correct, erase or restrict your information, object to its use, or
            request a portable copy. You may also complain to the Information
            Commissioner's Office. Contact us first if you would like to exercise
            a right or have a concern.
          </p>
          <p className="mt-3">
            Visit{" "}
            <a
              className="text-electric underline underline-offset-2"
              href="https://ico.org.uk/make-a-complaint/data-protection-complaints/data-protection-complaints/"
              target="_blank"
              rel="noreferrer"
            >
              ico.org.uk
            </a>{" "}
            for information about making a data-protection complaint.
          </p>
        </PolicySection>

        <PolicySection title="Cookies and technical information">
          <p>
            This website does not currently use advertising or analytics
            cookies. Our hosting and security providers may process limited
            technical information, such as IP addresses and request logs, to
            deliver and protect the website.
          </p>
        </PolicySection>

        <PolicySection title="Changes to this policy">
          <p>
            We may update this policy when our services, suppliers or legal
            responsibilities change. The latest version will always be published
            on this page.
          </p>
        </PolicySection>
      </div>

      <div className="mt-10">
        <Link to="/contact" className="text-sm font-semibold text-electric underline underline-offset-4">
          Contact Sperin Services
        </Link>
      </div>
    </section>
  );
}

function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl hairline bg-card/40 p-5 sm:p-6">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
