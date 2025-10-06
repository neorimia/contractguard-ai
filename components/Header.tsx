"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleToggleMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleToggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <header
        className={`w-full  transition-all duration-300 tracking-tight ${
          isScrolled
            ? "bg-white dark:bg-black shadow-sm"
            : "bg-white dark:bg-black shadow-sm"
        }`}
      >
        <div className="px-6">
          <div className="flex items-center justify-between h-14">
            {/* Left section: Logo and Navigation */}
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="text-lg font-bold text-black dark:text-white hover:text-blue-400 dark:hover:text-blue-600 transition-colors"
                aria-label="ContractGuard AI Home"
              >
                🛡️ContractGuard AI
              </Link>
              <span>/</span>
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-6">
                {["Features", "Pricing", "FAQ"].map((item) => (
                  <Link
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="text-sm font-medium text-black dark:text-white hover:text-blue-400 dark:hover:text-blue-600 transition-colors"
                    aria-label={item}
                  >
                    {item}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right section: Theme Toggle and Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleTheme}
                aria-label="Toggle theme"
                className="text-black dark:text-white hover:text-black dark:hover:text-white transition-colors hover:bg-black/15 dark:hover:bg-white/15 rounded-lg"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="h-8 sm:h-10 px-5 sm:px-6 text-black dark:text-white transition-colors hover:bg-black/15 dark:hover:bg-white/15 rounded-lg"
              >
                Login
              </Button>
              <Button
                size="lg"
                className="h-7 sm:h-9 px-3 sm:px-4 text-white dark:text-black tracking-tight group dark:bg-white/95 bg-black rounded-lg dark:hover:bg-white dark:hover:text-black transition-all duration-300"
              >
                Scan Contract
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleTheme}
                aria-label="Toggle theme"
                className="text-black dark:text-white hover:text-blue-400 dark:hover:text-blue-600 transition-colors"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
              <button
                type="button"
                className="p-2 text-black dark:text-white hover:bg-gray-800 dark:hover:bg-gray-100 rounded-md transition-colors"
                onClick={handleToggleMenu}
                aria-label="Toggle mobile menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-black/5 dark:border-white/5">
              <nav className="flex flex-col gap-3">
                {["Features", "Pricing", "FAQ"].map((item) => (
                  <Link
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="text-sm font-medium text-black dark:text-white hover:text-blue-400 dark:hover:text-blue-600 transition-colors px-2 py-1.5 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item}
                  </Link>
                ))}
                <div className="flex gap-2 mt-2 px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-black dark:text-white hover:text-blue-400 dark:hover:text-blue-600 transition-colors"
                  >
                    Login
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                  >
                    Scan Contract
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}
