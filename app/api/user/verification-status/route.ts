// app/api/user/verification-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, getUserFromRequest } from '@/lib/middleware/auth.middleware';
import { AuthService } from '@/lib/services/auth.service';

export async function GET(request: NextRequest) {
    // Apply auth middleware
    const authResult = await authMiddleware(request);
    if (authResult.status !== 200) return authResult;

    const user = getUserFromRequest(request);

    try {
        const authService = new AuthService();
        const verified = await authService.isEmailVerified(user.id);

        return NextResponse.json({
            verified,
            email: user.email,
        });

    } catch (error) {
        console.error('Error checking verification status:', error);
        return NextResponse.json(
            { error: 'Failed to check verification status' },
            { status: 500 }
        );
    }
}