"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MagicLinkCodeInputProps {
  onCodeComplete: (code: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  length?: number;
}

export function MagicLinkCodeInput({
  onCodeComplete,
  isLoading = false,
  error = null,
  length = 45,
}: MagicLinkCodeInputProps) {
  const [code, setCode] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Clear code when error occurs
  useEffect(() => {
    if (error) {
      setCode("");
      // Focus input after clearing
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [error]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Remove any non-alphanumeric characters and convert to uppercase
    const cleanedValue = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, length);
    setCode(cleanedValue);

    // Auto-submit when code reaches required length
    if (cleanedValue.length === length) {
      onCodeComplete(cleanedValue);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === length) {
      onCodeComplete(code);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    // Extract alphanumeric characters only and convert to uppercase
    const cleanedValue = pastedText.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, length);
    setCode(cleanedValue);
    
    if (cleanedValue.length === length) {
      onCodeComplete(cleanedValue);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Input
          ref={inputRef}
          type="text"
          inputMode="text"
          maxLength={length}
          value={code}
          onChange={handleChange}
          onPaste={handlePaste}
          disabled={isLoading}
          placeholder={`Enter ${length}-character code`}
          className={`w-full text-center text-base font-mono tracking-wider uppercase ${
            error
              ? "border-red-500 dark:border-red-500"
              : "border-black/20 dark:border-white/20"
          } focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10`}
          aria-label={`Verification code (${length} characters)`}
        />
        <p className="text-xs text-center text-black/60 dark:text-white/60">
          {code.length} / {length} characters
        </p>
      </div>
      
      {isLoading && (
        <div className="flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-black/60 dark:text-white/60" />
        </div>
      )}

      {code.length === length && !isLoading && (
        <Button type="submit" className="w-full">
          Verify code
        </Button>
      )}
    </form>
  );
}

