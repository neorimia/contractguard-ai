"use client";

import { Plus, Minus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";

type FAQ = {
    question: string;
    answer: string;
};

export default function FAQSection() {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const handleToggle = (index: number) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    // FAQ data
    const faqs: FAQ[] = [
        {
            question: "How do AI agents work?",
            answer: "AI agents use advanced machine learning models to automate tasks. They observe, analyze, and take actions based on specific instructions and training data, adapting to changing conditions while working autonomously toward defined goals.",
        },
        {
            question: "Which AI models do you support?",
            answer: "We support leading AI models including OpenAI GPT-4, Anthropic Claude, Google Gemini, Mistral, and Deepseek. This wide range ensures you can select the optimal model for your specific use case and requirements.",
        },
        {
            question: "Can I customize agents for my business?",
            answer: "Yes, our platform enables full customization of AI agents. You can fine-tune models on your proprietary data, define specific behaviors, set operational parameters, and integrate with your existing business systems and workflows.",
        },
        {
            question: "What kind of tasks can agents automate?",
            answer: "AI agents can automate a wide range of tasks including content creation, data analysis, customer support, research, coding assistance, design work, social media management, and much more. The possibilities expand as models improve.",
        },
        {
            question: "How secure is your platform?",
            answer: "Security is our priority. We implement enterprise-grade encryption, role-based access controls, regular security audits, and compliance with industry standards. Enterprise plans offer additional security features including private cloud deployment.",
        },
        {
            question: "Do you offer support for implementation?",
            answer: "Yes, we provide comprehensive support through our documentation, community forums, email support, and dedicated success managers for enterprise customers. We're committed to ensuring you get maximum value from our platform.",
        },
    ];

    return (
        <section
            id="faq"
            className="py-16 sm:py-24 bg-black/95 dark:bg-white/95 mx-2 sm:mx-4 mb-4 rounded-2xl overflow-hidden relative"
        >
            <div className="absolute inset-0 overflow-hidden opacity-10">
                <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-white/30 to-white/5 dark:from-black/30 dark:to-black/5 blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-tr from-white/30 to-white/5 dark:from-black/30 dark:to-black/5 blur-3xl" />
            </div>

            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(to_right,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 relative">
                <div className="text-center space-y-4 mb-10">
                    <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white dark:text-black">
                        FAQ.
                    </h2>
                    <p className="text-sm sm:text-base tracking-tight text-white/60 dark:text-black/60 max-w-2xl mx-auto">
                        Looking for answers? It's here.
                    </p>
                </div>

                <div className="space-y-2.5">
                    {faqs.map((faq, index) => (
                        <motion.div
                            key={`faq-${faq.question
                                .toLowerCase()
                                .replace(/\s+/g, "-")}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.3,
                                delay: index * 0.05,
                            }}
                            className="backdrop-blur-sm border border-white/10 dark:border-black/10 bg-white/[0.03] dark:bg-black/[0.03] rounded-lg overflow-hidden shadow-sm shadow-white/5 dark:shadow-black/5 hover:border-white/15 dark:hover:border-black/15 transition-colors"
                        >
                            <button
                                onClick={() => handleToggle(index)}
                                className="flex items-center justify-between w-full px-5 py-4 text-left"
                                aria-expanded={activeIndex === index}
                                aria-controls={`faq-answer-${index}`}
                                tabIndex={0}
                                onKeyDown={(e) =>
                                    e.key === "Enter" && handleToggle(index)
                                }
                                type="button"
                            >
                                <h3 className="text-base font-medium text-white dark:text-black">
                                    {faq.question}
                                </h3>
                                <div className="flex-shrink-0 ml-4 flex items-center justify-center h-6 w-6 rounded-full bg-white/5 dark:bg-black/5 border border-white/10 dark:border-black/10 transition-colors">
                                    {activeIndex === index ? (
                                        <Minus className="h-3.5 w-3.5 text-white/80 dark:text-black/80" />
                                    ) : (
                                        <Plus className="h-3.5 w-3.5 text-white/80 dark:text-black/80" />
                                    )}
                                </div>
                            </button>

                            <AnimatePresence initial={false}>
                                {activeIndex === index && (
                                    <motion.div
                                        id={`faq-answer-${index}`}
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{
                                            height: "auto",
                                            opacity: 1,
                                            transition: {
                                                height: {
                                                    duration: 0.3,
                                                    ease: "easeInOut",
                                                },
                                                opacity: {
                                                    duration: 0.2,
                                                    delay: 0.1,
                                                },
                                            },
                                        }}
                                        exit={{
                                            height: 0,
                                            opacity: 0,
                                            transition: {
                                                height: {
                                                    duration: 0.3,
                                                    ease: "easeInOut",
                                                },
                                                opacity: { duration: 0.2 },
                                            },
                                        }}
                                    >
                                        <div className="px-5 pb-4">
                                            <div className="w-10 h-px border-t border-dashed border-white/10 dark:border-black/10 mb-3" />
                                            <p className="text-white/70 dark:text-black/70 text-sm">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <h3 className="text-lg font-medium text-white dark:text-black mb-4">
                        Can't find what you're looking for? Email us.
                    </h3>
                    <div className="inline-block">
                        <Button
                            size="sm"
                            className="h-9 px-5 bg-white dark:bg-black text-black dark:text-white rounded-lg border border-white/10 dark:border-black/10 shadow-sm hover:shadow-md hover:bg-white/90 dark:hover:bg-black/90 transition-all duration-200 group"
                        >
                            hi@kokonutui.pro
                            <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
