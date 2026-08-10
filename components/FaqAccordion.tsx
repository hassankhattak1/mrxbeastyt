"use client";

import { useState } from "react";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  faqs: FaqItem[];
}

export default function FaqAccordion({ faqs }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className="glass-card rounded-2xl overflow-hidden transition-all duration-200"
          >
            <button
              type="button"
              onClick={() => toggle(index)}
              aria-expanded={isOpen}
              aria-controls={`faq-answer-${index}`}
              id={`faq-button-${index}`}
              className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-zinc-100 hover:text-red-400 transition focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded-2xl"
            >
              <span className="text-base md:text-lg">{faq.question}</span>
              <span className="shrink-0 w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 transition-transform duration-200">
                <svg
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-red-400" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
            </button>

            {isOpen && (
              <div
                id={`faq-answer-${index}`}
                role="region"
                aria-labelledby={`faq-button-${index}`}
                className="px-5 pb-5 text-zinc-400 text-sm md:text-base leading-relaxed border-t border-zinc-900 pt-3"
              >
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
