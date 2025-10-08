// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/middleware/auth.middleware';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/user/profile
 * Get current user's profile information
 */
export async function GET(request: NextRequest) {
    try {
        // Get authenticated user
        const user = getUserFromRequest(request);

        if (!user || !user.id) {
            return NextResponse.json(
                { error: 'Unauthorized', status: 'error' },
                { status: 401 }
            );
        }

        // Fetch full user profile from database
        const [userProfile] = await db
            .select()
            .from(users)
            .where(eq(users.id, user.id))
            .limit(1);

        if (!userProfile) {
            return NextResponse.json(
                { error: 'User not found', status: 'error' },
                { status: 404 }
            );
        }

        // Remove sensitive fields before returning
        const { stackUserId, ...safeProfile } = userProfile;

        return NextResponse.json({
            data: safeProfile,
            status: 'success'
        });

    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json(
            { error: 'Failed to fetch profile', status: 'error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/user/profile
 * Update user profile information
 */
export async function PATCH(request: NextRequest) {
    try {
        // Get authenticated user
        const user = getUserFromRequest(request);

        if (!user || !user.id) {
            return NextResponse.json(
                { error: 'Unauthorized', status: 'error' },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { firstName, lastName, avatarUrl } = body;

        // Update user profile
        const [updatedUser] = await db
            .update(users)
            .set({
                firstName: firstName || undefined,
                lastName: lastName || undefined,
                avatarUrl: avatarUrl || undefined,
                updatedAt: new Date(),
            })
            .where(eq(users.id, user.id))
            .returning();

        if (!updatedUser) {
            return NextResponse.json(
                { error: 'User not found', status: 'error' },
                { status: 404 }
            );
        }

        // Remove sensitive fields
        const { stackUserId, ...safeProfile } = updatedUser;

        return NextResponse.json({
            data: safeProfile,
            status: 'success'
        });

    } catch (error) {
        console.error('Error updating user profile:', error);
        return NextResponse.json(
            { error: 'Failed to update profile', status: 'error' },
            { status: 500 }
        );
    }
}
