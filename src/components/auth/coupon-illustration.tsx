export function CouponIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Background floating shapes */}
      <circle cx="320" cy="60" r="40" fill="currentColor" opacity="0.04" />
      <circle cx="80" cy="240" r="55" fill="currentColor" opacity="0.03" />
      <circle cx="350" cy="220" r="25" fill="currentColor" opacity="0.05" />

      {/* Main coupon ticket */}
      <g filter="url(#ticket-shadow)">
        <rect x="80" y="90" width="240" height="120" rx="16" fill="white" fillOpacity="0.1" />
        <rect
          x="80.75"
          y="90.75"
          width="238.5"
          height="118.5"
          rx="15.25"
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="1.5"
          strokeDasharray="6 4"
        />

        {/* Left icon section */}
        <rect x="96" y="106" width="56" height="88" rx="12" fill="currentColor" fillOpacity="0.08" />
        <g transform="translate(112, 134)">
          {/* Tag icon */}
          <path
            d="M2 12V4.5C2 3.67 2.67 3 3.5 3H10.5L22 14.5L14.5 22L2 12Z"
            stroke="currentColor"
            strokeOpacity="0.5"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="7" cy="7.5" r="1.5" fill="currentColor" fillOpacity="0.4" />
        </g>

        {/* Ticket perforation */}
        <circle cx="168" cy="90" r="8" fill="#0f1721" />
        <circle cx="168" cy="210" r="8" fill="#0f1721" />
        <line
          x1="168"
          y1="100"
          x2="168"
          y2="200"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="1"
          strokeDasharray="3 5"
        />

        {/* Right content */}
        <rect x="184" y="114" width="60" height="8" rx="4" fill="currentColor" fillOpacity="0.12" />
        <rect x="184" y="132" width="110" height="20" rx="4" fill="currentColor" fillOpacity="0.08" />
        <text
          x="192"
          y="148"
          fill="currentColor"
          fillOpacity="0.45"
          fontSize="18"
          fontWeight="700"
          fontFamily="inherit"
        >
          SAVE 50%
        </text>
        <rect x="184" y="162" width="80" height="6" rx="3" fill="currentColor" fillOpacity="0.06" />
        <rect x="184" y="176" width="50" height="6" rx="3" fill="currentColor" fillOpacity="0.04" />
      </g>

      {/* Floating discount tag - top right */}
      <g transform="translate(280, 50) rotate(12)">
        <rect width="60" height="30" rx="8" fill="currentColor" fillOpacity="0.08" />
        <text
          x="12"
          y="20"
          fill="currentColor"
          fillOpacity="0.3"
          fontSize="12"
          fontWeight="600"
          fontFamily="inherit"
        >
          20%
        </text>
      </g>

      {/* Floating discount tag - bottom left */}
      <g transform="translate(50, 190) rotate(-8)">
        <rect width="50" height="26" rx="7" fill="currentColor" fillOpacity="0.06" />
        <text
          x="10"
          y="18"
          fill="currentColor"
          fillOpacity="0.25"
          fontSize="11"
          fontWeight="600"
          fontFamily="inherit"
        >
          30%
        </text>
      </g>

      {/* Connection lines suggesting marketplace/network */}
      <line
        x1="120"
        y1="60"
        x2="200"
        y2="90"
        stroke="currentColor"
        strokeOpacity="0.06"
        strokeWidth="1"
      />
      <line
        x1="300"
        y1="90"
        x2="340"
        y2="60"
        stroke="currentColor"
        strokeOpacity="0.06"
        strokeWidth="1"
      />
      <line
        x1="100"
        y1="210"
        x2="80"
        y2="240"
        stroke="currentColor"
        strokeOpacity="0.06"
        strokeWidth="1"
      />

      {/* Small dots - connection nodes */}
      <circle cx="120" cy="60" r="3" fill="currentColor" fillOpacity="0.1" />
      <circle cx="300" cy="90" r="3" fill="currentColor" fillOpacity="0.1" />
      <circle cx="100" cy="210" r="3" fill="currentColor" fillOpacity="0.1" />

      {/* Shadow filter */}
      <defs>
        <filter id="ticket-shadow" x="60" y="76" width="280" height="160" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="black" floodOpacity="0.15" />
        </filter>
      </defs>
    </svg>
  );
}
