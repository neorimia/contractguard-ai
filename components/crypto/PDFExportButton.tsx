"use client";

/**
 * PDF Export Button Component
 *
 * Client-side PDF export using browser print API
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { CryptoAudit } from "@/db/schema";
import { HeuristicResult } from "@/lib/services/crypto/types";
import { PDFExportService } from "@/lib/services/crypto/pdf-export.service";

interface PDFExportButtonProps {
  result: CryptoAudit & {
    recommendation?: string;
    heuristicResults?: HeuristicResult[];
  };
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function PDFExportButton({
  result,
  variant = "default",
  size = "default",
  className,
}: PDFExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);

    try {
      const pdfService = new PDFExportService();
      const html = pdfService.getHTMLForPDF({
        audit: result,
        recommendation: result.recommendation,
        heuristicResults: result.heuristicResults,
      });

      // Create a new window with the HTML content
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Please allow popups to export PDF");
        setExporting(false);
        return;
      }

      printWindow.document.write(html);
      printWindow.document.close();

      // Wait for content to load
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Trigger print dialog
      printWindow.print();

      // Close window after print (optional)
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    } catch (error) {
      console.error("PDF export error:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={exporting}
      className={`flex items-center gap-2 ${className} bg-white text-black hover:bg-gray-100 text-xs px-4 py-2 font-semibold whitespace-nowrap `}
    >
      {exporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4" />
          Export PDF
        </>
      )}
    </Button>
  );
}
