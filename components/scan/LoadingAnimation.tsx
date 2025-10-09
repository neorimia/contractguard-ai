interface LoadingAnimationProps {
  progress: number;
}

export function LoadingAnimation({ progress }: LoadingAnimationProps) {
  return (
    <div className="relative w-6 h-6">
      <svg
        viewBox="0 0 240 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        aria-label={`Loading progress: ${Math.round(progress)}%`}
      >
        <title>Loading Progress Indicator</title>

        <defs>
          <mask id="progress-mask">
            <rect width="240" height="240" fill="black" />
            <circle
              r="120"
              cx="120"
              cy="120"
              fill="white"
              strokeDasharray={`${(progress / 100) * 754}, 754`}
              transform="rotate(-90 120 120)"
            />
          </mask>
        </defs>

        <style>
          {`
            @keyframes rotate-cw {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes rotate-ccw {
              from { transform: rotate(360deg); }
              to { transform: rotate(0deg); }
            }
            .g-spin circle {
              transform-origin: 120px 120px;
            }
            .g-spin circle:nth-child(1) { animation: rotate-cw 8s linear infinite; }
            .g-spin circle:nth-child(2) { animation: rotate-ccw 8s linear infinite; }
            .g-spin circle:nth-child(3) { animation: rotate-cw 8s linear infinite; }
            .g-spin circle:nth-child(4) { animation: rotate-ccw 8s linear infinite; }
            .g-spin circle:nth-child(5) { animation: rotate-cw 8s linear infinite; }
            .g-spin circle:nth-child(6) { animation: rotate-ccw 8s linear infinite; }

            .g-spin circle:nth-child(2n) { animation-delay: 0.2s; }
            .g-spin circle:nth-child(3n) { animation-delay: 0.3s; }
          `}
        </style>

        <g
          className="g-spin"
          strokeWidth="16"
          strokeDasharray="18% 40%"
          mask="url(#progress-mask)"
        >
          <circle r="150" cx="120" cy="120" stroke="#FF2E7E" opacity="0.95" />
          <circle r="130" cx="120" cy="120" stroke="#00E5FF" opacity="0.95" />
          <circle r="110" cx="120" cy="120" stroke="#4ADE80" opacity="0.95" />
          <circle r="90" cx="120" cy="120" stroke="#FFA726" opacity="0.95" />
          <circle r="70" cx="120" cy="120" stroke="#FFEB3B" opacity="0.95" />
          <circle r="50" cx="120" cy="120" stroke="#FF4081" opacity="0.95" />
        </g>
      </svg>
    </div>
  );
}
