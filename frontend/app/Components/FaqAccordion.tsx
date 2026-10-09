export interface FaqAccordionItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqAccordionItem[];
  name: string;
  className?: string;
}

/** Shared FAQ presentation used across landing, detail, and location pages. */
export default function FaqAccordion({
  items,
  name,
  className = "",
}: FaqAccordionProps) {
  return (
    <div className={`mx-auto max-w-4xl space-y-4 ${className}`.trim()}>
      {items.map((item, index) => (
        <details
          key={item.question}
          name={name}
          className="group overflow-hidden rounded-2xl border border-primary-light bg-white shadow-sm transition-all duration-300 open:border-primary/30 open:shadow-lg"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 text-left font-semibold text-primary-dark marker:content-none sm:gap-5 sm:px-7 sm:text-lg [&::-webkit-details-marker]:hidden">
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span className="block w-8 shrink-0 text-left text-sm font-bold leading-6 tabular-nums text-primary sm:leading-7">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="block min-w-0 leading-6 transition-colors group-open:text-primary sm:leading-7">
                {item.question}
              </span>
            </span>
            <span
              aria-hidden="true"
              className="relative h-7 w-7 shrink-0 rounded-full bg-primary-light"
            >
              <span className="absolute left-1/2 top-1/2 h-0.5 w-3 -translate-x-1/2 -translate-y-1/2 bg-primary" />
              <span className="absolute left-1/2 top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-primary transition-transform duration-300 group-open:rotate-90" />
            </span>
          </summary>
          <div className="border-t border-primary-light px-5 py-5 sm:px-7">
            <p className="pl-10 leading-relaxed text-primary-dark/70">
              {item.answer}
            </p>
          </div>
        </details>
      ))}
    </div>
  );
}
