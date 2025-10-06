// app/api/share-card/route.tsx
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    const address = searchParams.get('address') || '0x...';
    const riskScore = parseInt(searchParams.get('score') || '50');
    const recommendation = searchParams.get('rec') || 'CAUTION';
    const summary = searchParams.get('summary') || 'Analysis complete';

    const getRiskColor = (score: number) => {
        if (score >= 70) return '#ef4444'; // red
        if (score >= 40) return '#f59e0b'; // orange
        return '#10b981'; // green
    };

    const getRiskLabel = (score: number) => {
        if (score >= 70) return 'HIGH RISK';
        if (score >= 40) return 'MEDIUM RISK';
        return 'LOW RISK';
    };

    const getEmoji = (rec: string) => {
        if (rec === 'AVOID') return '🚫';
        if (rec === 'CAUTION') return '⚠️';
        return '✅';
    };

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #581c87 50%, #1e1b4b 100%)',
                    padding: '60px',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '40px',
                    }}
                >
                    <span style={{ fontSize: '48px', marginRight: '16px' }}>🛡️</span>
                    <h1
                        style={{
                            fontSize: '52px',
                            fontWeight: 'bold',
                            color: 'white',
                        }}
                    >
                        ContractGuard AI
                    </h1>
                </div>

                {/* Main Card */}
                <div
                    style={{
                        display: 'flex',
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '24px',
                        padding: '48px',
                        width: '90%',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                    }}
                >
                    {/* Left Side - Risk Score */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '48px',
                            minWidth: '280px',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '120px',
                                fontWeight: 'bold',
                                color: getRiskColor(riskScore),
                                lineHeight: '1',
                            }}
                        >
                            {riskScore}
                        </div>
                        <div
                            style={{
                                fontSize: '32px',
                                fontWeight: '600',
                                color: '#d1d5db',
                                marginTop: '16px',
                            }}
                        >
                            {getRiskLabel(riskScore)}
                        </div>
                    </div>

                    {/* Right Side - Details */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            flex: 1,
                        }}
                    >
                        {/* Recommendation */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '24px',
                            }}
                        >
              <span style={{ fontSize: '64px', marginRight: '16px' }}>
                {getEmoji(recommendation)}
              </span>
                            <span
                                style={{
                                    fontSize: '48px',
                                    fontWeight: 'bold',
                                    color: 'white',
                                }}
                            >
                {recommendation}
              </span>
                        </div>

                        {/* Summary */}
                        <div
                            style={{
                                fontSize: '24px',
                                color: '#d1d5db',
                                lineHeight: '1.5',
                                marginBottom: '24px',
                            }}
                        >
                            {summary.slice(0, 150)}...
                        </div>

                        {/* Contract Address */}
                        <div
                            style={{
                                fontSize: '18px',
                                color: '#9ca3af',
                                fontFamily: 'monospace',
                            }}
                        >
                            {address.slice(0, 10)}...{address.slice(-8)}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div
                    style={{
                        marginTop: '40px',
                        fontSize: '24px',
                        color: '#9ca3af',
                    }}
                >
                    Scan your contracts at contractguard.ai
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );
}
