import Link from "next/link";
import privacyPolicy from "@/lib/marketing/privacy-policy.json";

type PolicyBlock =
  | { type: "p"; text: string }
  | { type: "list"; heading?: string | null; items: string[] };

type PolicySection = {
  number: number;
  title: string;
  blocks: PolicyBlock[];
};

const { meta, sections } = privacyPolicy as {
  meta: { effectiveDate: string; lastUpdated: string };
  sections: PolicySection[];
};

function isSubheading(text: string) {
  return text.length < 70 && !text.endsWith(".") && !text.includes("  ");
}

function PolicyBlocks({ blocks }: { blocks: PolicyBlock[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        if (block.type === "p") {
          if (isSubheading(block.text)) {
            return (
              <h3
                key={index}
                className="pt-2 text-sm font-semibold text-foreground"
              >
                {block.text}
              </h3>
            );
          }
          return (
            <p key={index} className="text-sm leading-relaxed text-muted">
              {block.text}
            </p>
          );
        }

        return (
          <div key={index} className="space-y-2">
            {block.heading ? (
              <h3 className="text-sm font-semibold text-foreground">
                {block.heading}
              </h3>
            ) : null}
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <p className="text-sm font-medium uppercase tracking-wider text-gold">
        Legal
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-3 text-sm text-muted">
        Effective Date: {meta.effectiveDate}
        <span className="mx-2 text-dim">·</span>
        Last Updated: {meta.lastUpdated}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        This Privacy Policy explains how AARVANTA LTD collects, uses, stores and
        protects personal data when you use Business OS at{" "}
        <span className="text-foreground">os.aarvanta.co</span>.
      </p>

      <nav
        aria-label="Privacy policy contents"
        className="mt-10 rounded-xl border border-border bg-surface-elevated p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Contents
        </p>
        <ol className="mt-3 columns-1 gap-x-8 space-y-1.5 text-sm text-muted sm:columns-2">
          {sections.map((section) => (
            <li key={section.number} className="break-inside-avoid">
              <a
                href={`#section-${section.number}`}
                className="hover:text-gold"
              >
                {section.number}. {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-12 space-y-12">
        {sections.map((section) => (
          <section
            key={section.number}
            id={`section-${section.number}`}
            className="scroll-mt-24"
          >
            <h2 className="text-lg font-semibold text-foreground">
              {section.number}. {section.title}
            </h2>
            <div className="mt-4">
              <PolicyBlocks blocks={section.blocks} />
            </div>
          </section>
        ))}
      </div>

      <div className="mt-14 rounded-xl border border-border bg-surface-elevated p-6">
        <h2 className="text-sm font-semibold text-foreground">
          Contact for privacy requests
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          AARVANTA LTD · Company Number 17217532
          <br />
          195–197 Wood Street, London E17 3NU, United Kingdom
          <br />
          Email:{" "}
          <a href="mailto:admin@aarvanta.co" className="text-gold hover:underline">
            admin@aarvanta.co
          </a>
        </p>
        <Link
          href="/contact"
          className="mt-4 inline-flex text-sm font-medium text-gold hover:underline"
        >
          Go to contact page
        </Link>
      </div>
    </div>
  );
}

export const metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for AARVANTA LTD Business OS — how we collect, use, and protect personal data.",
};
