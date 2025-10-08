"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Menu, X, Sun, Moon, User, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useUser } from "@stackframe/stack";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const user = useUser();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        showUserMenu &&
        !target.closest('[aria-label="User menu"]') &&
        !target.closest(".user-menu-dropdown")
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu]);

  const handleToggleMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleToggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogin = () => {
    router.push("/sign-in");
  };

  const handleSignup = () => {
    router.push("/sign-up");
  };

  const handleScanContract = () => {
    router.push("/chat");
  };

  const handleSignOut = async () => {
    try {
      await user?.signOut();
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
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
                    href={`/#${item.toLowerCase()}`}
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

              {user ? (
                // Logged in - Show user profile and scan button
                <>
                  <Button
                    size="lg"
                    className="h-7 sm:h-9 px-3 sm:px-4 text-white dark:text-black tracking-tight group dark:bg-white/95 bg-black rounded-lg dark:hover:bg-white dark:hover:text-black transition-all duration-300"
                    onClick={() => handleScanContract()}
                  >
                    Scan Contract
                  </Button>

                  {/* User Profile Dropdown */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="text-black dark:text-white hover:text-black dark:hover:text-white transition-colors hover:bg-black/15 dark:hover:bg-white/15 rounded-lg"
                      aria-label="User menu"
                    >
                      {user.profileImageUrl ? (
                        <img
                          src={user.profileImageUrl}
                          alt={user.displayName || "User"}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </Button>

                    {/* Dropdown Menu */}
                    {showUserMenu && (
                      <div className="user-menu-dropdown absolute right-0 mt-2 w-64 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg shadow-lg overflow-hidden z-50">
                        <div className="p-4 border-b border-black/10 dark:border-white/10">
                          <p className="font-semibold text-black dark:text-white">
                            {user.displayName || "User"}
                          </p>
                          <p className="text-sm text-black/60 dark:text-white/60">
                            {user.primaryEmail}
                          </p>
                        </div>
                        <div className="p-2">
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              router.push("/chat");
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors"
                          >
                            Dashboard
                          </button>
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              handleSignOut();
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors flex items-center gap-2"
                          >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                // Not logged in - Show login/signup buttons
                <>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="h-8 sm:h-10 px-5 sm:px-6 text-black dark:text-white transition-colors hover:bg-black/15 dark:hover:bg-white/15 rounded-lg"
                    onClick={() => handleLogin()}
                  >
                    Login
                  </Button>
                  <Button
                    size="lg"
                    className="h-7 sm:h-9 px-3 sm:px-4 text-white dark:text-black tracking-tight group dark:bg-white/95 bg-black rounded-lg dark:hover:bg-white dark:hover:text-black transition-all duration-300"
                    onClick={() => handleSignup()}
                  >
                    Sign Up
                  </Button>
                </>
              )}
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

                {user ? (
                  // Logged in - Show user info and actions
                  <div className="mt-4 px-2 space-y-3">
                    <div className="p-3 bg-black/5 dark:bg-white/5 rounded-md">
                      <p className="font-semibold text-sm text-black dark:text-white">
                        {user.displayName || "User"}
                      </p>
                      <p className="text-xs text-black/60 dark:text-white/60">
                        {user.primaryEmail}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="w-full bg-black dark:bg-white text-white dark:text-black"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleScanContract();
                      }}
                    >
                      Scan Contract
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleSignOut();
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  // Not logged in - Show auth buttons
                  <div className="flex gap-2 mt-2 px-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-black dark:text-white hover:text-blue-400 dark:hover:text-blue-600 transition-colors"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogin();
                      }}
                    >
                      Login
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-black dark:bg-white text-white dark:text-black"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleSignup();
                      }}
                    >
                      Sign Up
                    </Button>
                  </div>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}
