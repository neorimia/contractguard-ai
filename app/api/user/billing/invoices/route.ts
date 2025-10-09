/**
 * GET /api/user/billing/invoices
 *
 * Fetch paginated invoice history for authenticated user
 */

import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import { stripeService } from "@/lib/services/stripe.service";
import { AuthService } from "@/lib/services/auth.service";

const authService = new AuthService();

export async function GET(req: NextRequest) {
  try {
    // Auth check
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json(
        { status: "error", error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user from database
    const dbUser = await authService.getUserByStackUserId(user.id);
    if (!dbUser || !dbUser.stripeCustomerId) {
      return NextResponse.json(
        { status: "error", error: "No billing account found" },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const startingAfter = searchParams.get("starting_after") || undefined;

    // Fetch invoices from Stripe
    const invoiceList = await stripeService.listInvoices({
      customerId: dbUser.stripeCustomerId,
      limit,
      startingAfter,
    });

    // Format invoices for response
    const formattedInvoices = invoiceList.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      amountPaid: invoice.amount_paid,
      amountDue: invoice.amount_due,
      currency: invoice.currency,
      created: new Date(invoice.created * 1000).toISOString(),
      periodStart: new Date(invoice.period_start * 1000).toISOString(),
      periodEnd: new Date(invoice.period_end * 1000).toISOString(),
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
      description: invoice.lines.data[0]?.description || "Subscription payment",
    }));

    return NextResponse.json({
      status: "success",
      data: {
        invoices: formattedInvoices,
        hasMore: invoiceList.has_more,
      },
    });
  } catch (error: any) {
    console.error("Invoice fetch error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: "Failed to fetch invoices",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
