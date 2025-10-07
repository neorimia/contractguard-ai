// components/auth/VerificationError.tsx
'use client';

import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface Props {
    error: string;
    message: string;
    showResendButton?: boolean;
    email?: string;
}

export function VerificationError({ error, message, showResendButton, email }: Props) {
    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState(false);

    const handleResend = async () => {
        if (!email) return;

        setResending(true);
        try {
            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                setResent(true);
            }
        } catch (error) {
            console.error('Resend error:', error);
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
                <XCircle className="mx-auto h-16 w-16 text-red-500" />
                <h1 className="mt-4 text-2xl font-bold text-gray-900">
                    Verification Failed
                </h1>
                <p className="mt-2 text-gray-600">{message}</p>

                {showResendButton && !resent && (
                    <Button
                        onClick={handleResend}
                        disabled={resending}
                        className="mt-6 w-full"
                    >
                        {resending ? 'Sending...' : 'Resend Verification Email'}
                    </Button>
                )}

                {resent && (
                    <p className="mt-4 text-sm text-green-600">
                        ✓ Verification email sent! Check your inbox.
                    </p>
                )}

                <Button
                    variant="outline"
                    onClick={() => window.location.href = '/login'}
                    className="mt-4 w-full"
                >
                    Back to Login
                </Button>
            </div>
        </div>
    );
}
