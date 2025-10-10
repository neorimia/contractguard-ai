// lib/services/referral-events.service.ts

import { db } from "@/db";
import {
  referralEvents,
  type NewReferralEvent,
  type ReferralEvent,
} from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import type { ClientInfo } from "@/lib/utils/client-info";

export class ReferralEventsService {
  /**
   * Log referral event
   */
  async logEvent(params: {
    referralId: string;
    event:
      | "landing"
      | "signup"
      | "first_audit"
      | "email_verified"
      | "paid"
      | "payout";
    clientInfo: ClientInfo;
    metadata?: Record<string, any>;
  }): Promise<ReferralEvent> {
    try {
      const { referralId, event, clientInfo, metadata } = params;

      const newEvent: NewReferralEvent = {
        referralId,
        event,
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        fingerprint: clientInfo.fingerprint,
        deviceType: clientInfo.deviceType,
        metadata: {
          referer: clientInfo.referer,
          ...metadata,
        },
      };

      const [createdEvent] = await db
        .insert(referralEvents)
        .values(newEvent)
        .returning();

      console.log(`Referral event logged: ${event} for referral ${referralId}`);

      return createdEvent;
    } catch (error) {
      console.error("Error logging referral event:", error);
      throw new Error("Failed to log referral event");
    }
  }

  /**
   * Get event timeline for referral
   */
  async getEventTimeline(referralId: string): Promise<ReferralEvent[]> {
    try {
      const events = await db
        .select()
        .from(referralEvents)
        .where(eq(referralEvents.referralId, referralId))
        .orderBy(desc(referralEvents.createdAt));

      return events;
    } catch (error) {
      console.error("Error fetching event timeline:", error);
      return [];
    }
  }

  /**
   * Get events by type with optional filters
   */
  async getEventsByType(
    event:
      | "landing"
      | "signup"
      | "first_audit"
      | "email_verified"
      | "paid"
      | "payout",
    filters?: {
      startDate?: Date;
      endDate?: Date;
      referralId?: string;
    }
  ): Promise<ReferralEvent[]> {
    try {
      const conditions = [eq(referralEvents.event, event)];

      if (filters?.startDate) {
        conditions.push(gte(referralEvents.createdAt, filters.startDate));
      }

      if (filters?.endDate) {
        conditions.push(lte(referralEvents.createdAt, filters.endDate));
      }

      if (filters?.referralId) {
        conditions.push(eq(referralEvents.referralId, filters.referralId));
      }

      const events = await db
        .select()
        .from(referralEvents)
        .where(and(...conditions))
        .orderBy(desc(referralEvents.createdAt));

      return events;
    } catch (error) {
      console.error("Error fetching events by type:", error);
      return [];
    }
  }

  /**
   * Get event count by IP address (for fraud detection)
   */
  async getEventCountByIp(
    ip: string,
    event:
      | "landing"
      | "signup"
      | "first_audit"
      | "email_verified"
      | "paid"
      | "payout",
    sinceDate: Date
  ): Promise<number> {
    try {
      const events = await db
        .select()
        .from(referralEvents)
        .where(
          and(
            eq(referralEvents.ip, ip),
            eq(referralEvents.event, event),
            gte(referralEvents.createdAt, sinceDate)
          )
        );

      return events.length;
    } catch (error) {
      console.error("Error getting event count by IP:", error);
      return 0;
    }
  }

  /**
   * Get event count by fingerprint (for fraud detection)
   */
  async getEventCountByFingerprint(
    fingerprint: string,
    event:
      | "landing"
      | "signup"
      | "first_audit"
      | "email_verified"
      | "paid"
      | "payout",
    sinceDate: Date
  ): Promise<number> {
    try {
      const events = await db
        .select()
        .from(referralEvents)
        .where(
          and(
            eq(referralEvents.fingerprint, fingerprint),
            eq(referralEvents.event, event),
            gte(referralEvents.createdAt, sinceDate)
          )
        );

      return events.length;
    } catch (error) {
      console.error("Error getting event count by fingerprint:", error);
      return 0;
    }
  }

  /**
   * Get time between events (for timing analysis)
   */
  async getTimeBetweenEvents(
    referralId: string,
    fromEvent: string,
    toEvent: string
  ): Promise<number | null> {
    try {
      const events = await db
        .select()
        .from(referralEvents)
        .where(eq(referralEvents.referralId, referralId))
        .orderBy(referralEvents.createdAt);

      const fromEventData = events.find((e) => e.event === fromEvent);
      const toEventData = events.find((e) => e.event === toEvent);

      if (
        !fromEventData ||
        !toEventData ||
        !fromEventData.createdAt ||
        !toEventData.createdAt
      ) {
        return null;
      }

      const timeDiff =
        new Date(toEventData.createdAt).getTime() -
        new Date(fromEventData.createdAt).getTime();

      return Math.floor(timeDiff / 1000); // Return seconds
    } catch (error) {
      console.error("Error calculating time between events:", error);
      return null;
    }
  }
}
