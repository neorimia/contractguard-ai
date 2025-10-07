// app/api/auth/resend-verification/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';
import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_URL!,
    token: process.env.UPSTASH_REDIS_TOKEN!,
});

/**
 * Rate limiting for verification emails (3 per hour)
 */
async function checkVerificationRateLimit(email: string): Promise<boolean> {
    const key = `verification_rate_limit:${email}`;
    const count = await redis.get<number>(key) || 0;

    // Max 3 requests per hour
    if (count >= 3) {
        return false;
    }

    await redis.set(key, count + 1, { ex: 3600 }); // 1 hour expiry
    return true;
}

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email || typeof email !== 'string') {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Rate limiting
        const allowed = await checkVerificationRateLimit(email);
        if (!allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429 }
            );
        }

        const authService = new AuthService();
        await authService.resendVerificationEmail(email);

        return NextResponse.json({
            success: true,
            message: 'Verification email sent',
        });

    } catch (error: any) {
        console.error('Resend verification error:', error);

        // Don't reveal if user exists (security best practice)
        return NextResponse.json({
            success: true,
            message: 'If an account exists, verification email has been sent',
        });
    }
}
