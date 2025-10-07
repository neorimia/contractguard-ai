// lib/middleware/auth.middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';

/**
 * User data extracted from authenticated request
 */
export interface AuthUser {
    id: number;
    email: string;
    tier: string;
    stackUserId: string;
}

/**
 * Middleware to protect API routes
 * 1. Verify Stack Auth session (via headers from Stack Auth middleware)
 * 2. Sync user if not exists
 * 3. Attach user to request context
 *
 * Note: This assumes Stack Auth middleware has already run and set headers.
 * For actual Stack Auth integration, you'll need to use their SDK's middleware.
 */
export async function authMiddleware(request: NextRequest) {
    try {
        // In production, Stack Auth middleware will set these headers
        // For now, we'll check for Stack Auth session via their SDK
        const stackUserId = request.headers.get('x-stack-user-id');
        const stackEmail = request.headers.get('x-stack-email');

        if (!stackUserId || !stackEmail) {
            return NextResponse.json(
                { error: 'Unauthorized - No valid session', status: 'error' },
                { status: 401 }
            );
        }

        // Get or create app user
        const authService = new AuthService();
        let appUser = await authService.getUserByStackId(stackUserId);

        if (!appUser) {
            // First login - create user
            const firstName = request.headers.get('x-stack-first-name') || undefined;
            const lastName = request.headers.get('x-stack-last-name') || undefined;
            const avatarUrl = request.headers.get('x-stack-avatar-url') || undefined;

            appUser = await authService.syncUser(
                stackUserId,
                stackEmail,
                {
                    firstName,
                    lastName,
                    avatarUrl
                }
            );
        }

        // Update last login
        await authService.updateLastLogin(appUser.id);

        // Attach user to request (via headers for Next.js 15)
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', appUser.id.toString());
        requestHeaders.set('x-user-email', appUser.email);
        requestHeaders.set('x-user-tier', appUser.tier);

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });

    } catch (error) {
        console.error('Auth middleware error:', error);
        return NextResponse.json(
            { error: 'Authentication failed', status: 'error' },
            { status: 401 }
        );
    }
}

/**
 * Helper to get user from request headers
 * Use this in API route handlers after authMiddleware has run
 */
export function getUserFromRequest(request: NextRequest): AuthUser {
    const id = parseInt(request.headers.get('x-user-id') || '0');
    const email = request.headers.get('x-user-email') || '';
    const tier = request.headers.get('x-user-tier') || 'free';
    const stackUserId = request.headers.get('x-stack-user-id') || '';

    if (!id || !email || !stackUserId) {
        throw new Error('User not authenticated');
    }

    return {
        id,
        email,
        tier,
        stackUserId,
    };
}

/**
 * Optional: Simple auth check for API routes without full middleware
 * Use this for quick checks in API handlers
 */
export function requireAuth(request: NextRequest): AuthUser {
    try {
        return getUserFromRequest(request);
    } catch (error) {
        throw new Error('Unauthorized');
    }
}
