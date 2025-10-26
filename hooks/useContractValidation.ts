/**
 * useContractValidation Hook
 *
 * Provides contract address validation for different blockchain types (EVM, Solana)
 * Extracted from CryptoScanInterface to follow single responsibility principle
 */

import { ADDRESS_PATTERNS, SUPPORTED_CHAINS } from "@/lib/constants/scan-limits";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function useContractValidation() {
  /**
   * Validates a contract address based on the selected blockchain
   *
   * @param address - The contract address to validate
   * @param chain - The blockchain network (ethereum, bsc, solana, etc.)
   * @returns ValidationResult with isValid flag and optional error message
   */
  const validateAddress = (
    address: string,
    chain: string
  ): ValidationResult => {
    const trimmedAddress = address.trim();

    // Check for empty address
    if (!trimmedAddress) {
      return {
        isValid: false,
        error: "Please enter a contract address",
      };
    }

    // Find chain configuration
    const selectedChain = SUPPORTED_CHAINS.find((c) => c.value === chain);

    if (!selectedChain) {
      return {
        isValid: false,
        error: "Unsupported blockchain selected",
      };
    }

    // Validate based on chain type
    if (selectedChain.type === "evm") {
      // EVM address validation (0x + 40 hex characters)
      if (!ADDRESS_PATTERNS.EVM.test(trimmedAddress)) {
        return {
          isValid: false,
          error:
            "Invalid EVM contract address format (must be 0x followed by 40 hex characters)",
        };
      }
    } else if (selectedChain.type === "solana") {
      // Solana address validation (base58, 32-44 characters)
      if (!ADDRESS_PATTERNS.SOLANA.test(trimmedAddress)) {
        return {
          isValid: false,
          error:
            "Invalid Solana address format (must be base58 encoded, 32-44 characters)",
        };
      }
    }

    return { isValid: true };
  };

  return { validateAddress };
}