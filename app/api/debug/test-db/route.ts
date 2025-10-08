// app/api/debug/test-db/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Test 1: Check if database connection works
    const result = await db.execute(sql`SELECT NOW()`);

    // Test 2: Check if users table exists
    const tableCheck = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
    `);

    // Test 3: Count users
    const userCount = await db.select().from(users);

    return NextResponse.json({
      success: true,
      tests: {
        connection: "OK",
        timestamp: result.rows[0],
        usersTableExists: tableCheck.rows.length > 0,
        userCount: userCount.length,
        sampleUser: userCount[0] || null,
      },
    });
  } catch (error: any) {
    console.error("Database test error:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        detail: error.detail,
      },
      { status: 500 }
    );
  }
}
