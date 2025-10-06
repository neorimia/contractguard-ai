"use client";

import Link from "next/link";
import { ArrowRight, Github, Twitter, Linkedin } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

const footerLinks = [
    {
        title: "Product",
        links: [
            { name: "Features", href: "#features" },
            { name: "Pricing", href: "#pricing" },
            { name: "Integrations", href: "#integrations" },
            { name: "API", href: "/api" },
        ],
    },
    {
        title: "Company",
        links: [
            { name: "About", href: "/about" },
            { name: "Careers", href: "/careers" },
            { name: "Contact", href: "/contact" },
            { name: "Privacy", href: "/privacy" },
        ],
    },
];

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="sticky bottom-0 w-full mt-auto bg-white dark:bg-black border-t border-black/5 dark:border-white/5 backdrop-blur-md z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex-shrink-0 max-w-xs">
                        <Link
                            href="/"
                            className="text-4xl font-bold tracking-tighter text-black dark:text-white hover:opacity-90 transition-opacity"
                        >
                            ❃ KOKONUT.
                        </Link>
                        <p className="mt-2 text-sm text-black/60 dark:text-white/60">
                            The future of Agents.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-12 lg:gap-16">
                        {footerLinks.map((section) => (
                            <div key={section.title} className="space-y-3">
                                <h3 className="text-sm font-medium text-black dark:text-white">
                                    {section.title}
                                </h3>
                                <ul className="space-y-2">
                                    {section.links.map((link) => (
                                        <li key={link.name}>
                                            <Link
                                                href={link.href}
                                                className="text-sm text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors"
                                            >
                                                {link.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="flex-shrink-0 space-y-3 max-w-xs">
                        <h3 className="text-sm font-medium text-black dark:text-white">
                            Stay updated
                        </h3>
                        <p className="text-sm text-black/60 dark:text-white/60">
                            Subscribe to our newsletter for the latest updates
                            and features.
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 px-3 py-2 text-sm rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20"
                            />
                            <Button
                                size="sm"
                                className="h-9 px-3 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 rounded-lg"
                            >
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-8 pt-5 border-t border-black/5 dark:border-white/5 text-xs text-black/50 dark:text-white/50">
                    <p>© {currentYear} KOKONUT. All rights reserved.</p>
                    <div className="flex gap-4 mt-2 sm:mt-0">
                        <Link
                            href="https://kokonutui.pro/"
                            className="hover:text-black dark:hover:text-white transition-colors"
                        >
                            Terms
                        </Link>
                        <Link
                            href="https://kokonutui.pro/"
                            className="hover:text-black dark:hover:text-white transition-colors"
                        >
                            Privacy
                        </Link>
                        <Link
                            href="https://kokonutui.pro/"
                            className="hover:text-black dark:hover:text-white transition-colors"
                        >
                            Cookies
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
