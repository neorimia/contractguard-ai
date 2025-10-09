// app/verify-email-sent/page.tsx
'use client';

import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function VerifyEmailSentPage() {
    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState(false);

    const handleResend = async () => {
        setResending(true);
        try {
            await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            setResent(true);
        } catch (error) {
            console.error('Error resending email:', error);
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
                <Mail className="mx-auto h-16 w-16 text-blue-500" />
                <h1 className="mt-4 text-2xl font-bold text-gray-900">
                    Check Your Email
                </h1>
                <p className="mt-2 text-gray-600">
                    We&apos;ve sent a verification link to your email address.
                    Please click the link to verify your account.
                </p>
                <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                    <p className="font-semibold">Didn&apos;t receive the email?</p>
                    <ul className="mt-2 text-left space-y-1">
                        <li>• Check your spam/junk folder</li>
                        <li>• Make sure you entered the correct email</li>
                        <li>• Wait a few minutes for delivery</li>
                    </ul>
                </div>

                {resent && (
                    <p className="mt-4 text-sm text-green-600">
                        ✓ Verification email sent! Check your inbox.
                    </p>
                )}

                <Button
                    variant="outline"
                    onClick={handleResend}
                    disabled={resending || resent}
                    className="mt-6 w-full"
                >
                    {resending ? 'Sending...' : resent ? 'Email Sent' : 'Resend Verification Email'}
                </Button>
            </div>
        </div>
    );
}
