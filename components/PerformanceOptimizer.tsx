"use client";

import { useEffect } from "react";

// Performance optimization hook for crypto users
export function usePerformanceOptimizations() {
  useEffect(() => {
    // Preload critical resources
    const preloadCriticalResources = () => {
      // Preload blockchain API endpoints
      const criticalAPIs = [
        "https://api.etherscan.io",
        "https://eth-mainnet.alchemyapi.io",
      ];

      criticalAPIs.forEach((api) => {
        const link = document.createElement("link");
        link.rel = "dns-prefetch";
        link.href = api;
        document.head.appendChild(link);
      });
    };

    // Optimize for mobile crypto users
    const optimizeForMobile = () => {
      // Disable zoom on input focus for better mobile UX
      const inputs = document.querySelectorAll(
        'input[type="text"], input[type="search"]'
      );
      inputs.forEach((input) => {
        input.addEventListener("focus", () => {
          const viewport = document.querySelector('meta[name="viewport"]');
          if (viewport) {
            viewport.setAttribute(
              "content",
              "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
            );
          }
        });

        input.addEventListener("blur", () => {
          const viewport = document.querySelector('meta[name="viewport"]');
          if (viewport) {
            viewport.setAttribute(
              "content",
              "width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes"
            );
          }
        });
      });
    };

    // Lazy load non-critical components
    const setupLazyLoading = () => {
      if ("IntersectionObserver" in window) {
        const lazyElements = document.querySelectorAll("[data-lazy]");
        const lazyObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const element = entry.target as HTMLElement;
              element.classList.remove("opacity-0");
              element.classList.add("opacity-100");
              lazyObserver.unobserve(element);
            }
          });
        });

        lazyElements.forEach((element) => {
          lazyObserver.observe(element);
        });
      }
    };

    preloadCriticalResources();
    optimizeForMobile();
    setupLazyLoading();

    // Cleanup
    return () => {
      const inputs = document.querySelectorAll(
        'input[type="text"], input[type="search"]'
      );
      inputs.forEach((input) => {
        input.removeEventListener("focus", () => {});
        input.removeEventListener("blur", () => {});
      });
    };
  }, []);
}

// Performance monitoring component
export function PerformanceMonitor() {
  useEffect(() => {
    // Monitor Core Web Vitals for crypto users
    if (typeof window !== "undefined" && "performance" in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          // Log performance metrics for optimization
          if (entry.entryType === "largest-contentful-paint") {
            console.log("LCP:", entry.startTime);
          }
          if (entry.entryType === "first-input") {
            console.log(
              "FID:",
              (entry as any).processingStart - entry.startTime
            );
          }
          if (entry.entryType === "layout-shift") {
            console.log("CLS:", (entry as any).value);
          }
        });
      });

      observer.observe({
        entryTypes: ["largest-contentful-paint", "first-input", "layout-shift"],
      });

      return () => observer.disconnect();
    }
  }, []);

  return null;
}

// Loading optimization component
export function LoadingOptimizer() {
  useEffect(() => {
    // Optimize loading for crypto users who expect fast results
    const optimizeLoading = () => {
      // Preload critical fonts
      const fontPreload = document.createElement("link");
      fontPreload.rel = "preload";
      fontPreload.href = "/fonts/geist-sans.woff2";
      fontPreload.as = "font";
      fontPreload.type = "font/woff2";
      fontPreload.crossOrigin = "anonymous";
      document.head.appendChild(fontPreload);

      // Preload critical images
      const criticalImages = ["/logo.svg", "/logo-white.svg"];
      criticalImages.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    };

    optimizeLoading();
  }, []);

  return null;
}
