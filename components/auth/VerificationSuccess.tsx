// components/auth/VerificationSuccess.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    email: string;
    redirectUrl: string;
    redirectDelay: number;
}

export function VerificationSuccess({ email, redirectUrl, redirectDelay }: Props) {
    const router = useRouter();
    const [countdown, setCountdown] = useState(redirectDelay / 1000);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push(redirectUrl);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [router, redirectUrl]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
                <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                <h1 className="mt-4 text-2xl font-bold text-gray-900">
                    Email Verified Successfully!
                </h1>
                <p className="mt-2 text-gray-600">
                    Your email <span className="font-semibold">{email}</span> has been verified.
                </p>
                <p className="mt-4 text-sm text-gray-500">
                    Redirecting to dashboard in {countdown} seconds...
                </p>
                <Button
                    onClick={() => router.push(redirectUrl)}
                    className="mt-6 w-full"
                >
                    Go to Dashboard Now
                </Button>
            </div>
        </div>
    );
}
