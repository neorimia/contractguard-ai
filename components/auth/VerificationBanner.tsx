// components/auth/VerificationBanner.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function VerificationBanner() {
    const [verified, setVerified] = useState<boolean | null>(null);
    const [dismissed, setDismissed] = useState(false);
    const [resending, setResending] = useState(false);

    useEffect(() => {
        // Check verification status
        fetch('/api/user/verification-status')
            .then(res => res.json())
            .then(data => setVerified(data.verified))
            .catch(() => setVerified(true)); // Fail safe
    }, []);

    const handleResend = async () => {
        setResending(true);
        try {
            await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            alert('Verification email sent! Check your inbox.');
        } finally {
            setResending(false);
        }
    };

    if (verified === null || verified === true || dismissed) {
        return null;
    }

    return (
        <div className="relative bg-yellow-50 border-b border-yellow-200 px-4 py-3">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                        Please verify your email address to unlock all features.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleResend}
                        disabled={resending}
                    >
                        {resending ? 'Sending...' : 'Resend Email'}
                    </Button>
                    <button
                        onClick={() => setDismissed(true)}
                        className="text-yellow-600 hover:text-yellow-800"
                        aria-label="Dismiss banner"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
