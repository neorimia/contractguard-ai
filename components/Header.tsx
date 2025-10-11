"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Menu,
  X,
  Sun,
  Moon,
  User,
  LogOut,
  MessageCircle,
  CreditCard,
  Gift,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useUser } from "@stackframe/stack";
import Image from "next/image";

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
    router.push("/audit");
  };

  const handleSignOut = async () => {
    try {
      await user?.signOut();
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
      // If sign out fails (e.g., due to refresh token error), force clear session
      try {
        // Clear Stack cookies
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
        });
        // Force reload to clear any cached state
        window.location.href = "/";
      } catch (clearError) {
        console.error("Error clearing session:", clearError);
        // Last resort - just redirect
        window.location.href = "/";
      }
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
                className="text-lg font-bold text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors"
                aria-label="ContractGuard AI Home"
              >
                <Image
                  src={theme === "dark" ? "/icon-white.svg" : "/icon.svg"}
                  alt="ContractGuard AI"
                  width={30}
                  height={30}
                />
              </Link>
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-6">
                {["Features", "Pricing", "FAQ"].map((item) => (
                  <Link
                    key={item}
                    href={`/${item.toLowerCase()}`}
                    className="text-sm font-medium text-black/80 dark:text-white/90 hover:text-black dark:hover:text-white transition-colors"
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
                              router.push("/account");
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors flex items-center gap-2"
                          >
                            <User className="h-4 w-4" />
                            Account Settings
                          </button>
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              router.push("/referrals");
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors flex items-center gap-2"
                          >
                            <Gift className="h-4 w-4" />
                            Referrals
                          </button>
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              router.push("/billing");
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors flex items-center gap-2"
                          >
                            <CreditCard className="h-4 w-4" />
                            Billing
                          </button>
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              router.push("/feedback");
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors flex items-center gap-2"
                          >
                            <MessageCircle className="h-4 w-4" />
                            Feedback
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
                // Not logged in - Show scan button
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-7 sm:h-9 px-3 sm:px-4  rounded-lg transition-all duration-300"
                    onClick={() => handleScanContract()}
                  >
                    Scan Contract
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
                    href={`/${item.toLowerCase()}`}
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
                      className="w-full  bg-black dark:bg-white text-white dark:text-black"
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
                      className="w-full justify-start px-0 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        router.push("/account");
                      }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Account Settings
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start px-0 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        router.push("/referrals");
                      }}
                    >
                      <Gift className="h-4 w-4 mr-2" />
                      Referrals
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start px-0 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        router.push("/billing");
                      }}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Billing
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start px-0 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        router.push("/feedback");
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Feedback
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start px-0 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
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
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleScanContract();
                      }}
                    >
                      Scan Contract
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
