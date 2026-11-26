'use client';

interface AnimatedBotanicalBackdropProps {
  variant?: 'hero' | 'section';
}

export default function AnimatedBotanicalBackdrop({
  variant = 'hero',
}: AnimatedBotanicalBackdropProps) {
  if (variant === 'section') {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse 60% 55% at 8% 12%, rgba(134, 239, 172, 0.5) 0%, rgba(220, 252, 231, 0.28) 45%, transparent 78%), radial-gradient(ellipse 55% 55% at 92% 88%, rgba(191, 219, 254, 0.45) 0%, rgba(209, 250, 229, 0.25) 45%, transparent 78%), linear-gradient(135deg, #effcf4 0%, #ffffff 52%, #f0f9ff 100%)',
        }}
      >
        <svg
          className="absolute -left-2 bottom-2 h-56 w-56 text-emerald-700/35 sm:h-64 sm:w-64"
          viewBox="0 0 240 240"
          fill="none"
        >
          <g className="animate-wind-branch-a" style={{ transformOrigin: '20px 220px' }}>
            <path
              d="M20 220 C50 165, 92 120, 156 66"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <g
              className="animate-leaf-flutter-a"
              style={{ transformOrigin: '58px 162px', animationDelay: '-0.6s' }}
            >
              <path
                d="M58 162 C26 144, 22 114, 48 102 C68 114, 72 140, 58 162 Z"
                fill="rgba(34, 197, 94, 0.16)"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            </g>
            <g
              className="animate-leaf-flutter-b"
              style={{ transformOrigin: '96px 124px', animationDelay: '-1.8s' }}
            >
              <path
                d="M96 124 C126 126, 150 106, 142 82 C116 86, 102 104, 96 124 Z"
                fill="rgba(16, 185, 129, 0.16)"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            </g>
            <g
              className="animate-flower-nod"
              style={{ transformOrigin: '152px 68px', animationDelay: '-1.1s' }}
            >
              <g className="animate-corolla-bloom" style={{ transformOrigin: '158px 62px' }}>
                {[0, 72, 144, 216, 288].map((deg) => (
                  <ellipse
                    key={deg}
                    cx="158"
                    cy="48"
                    rx="6"
                    ry="11"
                    transform={`rotate(${deg} 158 62)`}
                    fill="rgba(110, 231, 183, 0.28)"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                ))}
                <circle cx="158" cy="62" r="4.5" fill="rgba(22, 163, 74, 0.45)" />
              </g>
            </g>
          </g>
        </svg>
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Reference-matched luminous gradient: fresh green + crisp white replacing purple, with sky-blue edge */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 68% 66% at 8% 14%, rgba(134, 239, 172, 0.62) 0%, rgba(187, 247, 208, 0.36) 42%, transparent 74%), radial-gradient(ellipse 60% 58% at 92% 18%, rgba(167, 243, 208, 0.56) 0%, rgba(220, 252, 231, 0.3) 44%, transparent 76%), radial-gradient(ellipse 56% 50% at 82% 90%, rgba(191, 219, 254, 0.48) 0%, rgba(220, 252, 231, 0.28) 46%, transparent 78%), linear-gradient(180deg, #ecfdf3 0%, #f8fefb 48%, #ffffff 100%)',
        }}
      />

      {/* TOP-LEFT: Articulated Flowering Branch with Multi-Joint Wind Flex & Fluttering Leaves */}
      <svg
        className="absolute -left-6 -top-2 h-64 w-64 text-emerald-800/55 sm:h-80 sm:w-80 lg:h-96 lg:w-96"
        viewBox="0 0 360 360"
        fill="none"
      >
        <defs>
          <linearGradient id="leafGradTL" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.16" />
          </linearGradient>
          <linearGradient id="petalGradTL" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#86efac" stopOpacity="0.52" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.22" />
          </linearGradient>
        </defs>

        <g className="animate-wind-branch-a" style={{ transformOrigin: '8px 10px' }}>
          {/* Primary curving stem */}
          <path
            d="M8 10 C70 76, 108 156, 132 256"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          {/* Secondary flower arm */}
          <path
            d="M64 78 C114 54, 168 62, 214 102"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Curling botanical tendril */}
          <g
            className="animate-tendril-curl"
            style={{ transformOrigin: '92px 136px', animationDelay: '-1.3s' }}
          >
            <path
              d="M92 136 C126 118, 152 132, 146 154 C140 170, 120 162, 128 148"
              stroke="currentColor"
              strokeWidth="1.35"
              strokeLinecap="round"
            />
          </g>

          {/* Individual veined leaves on separate flutter joints */}
          <g
            className="animate-leaf-flutter-a"
            style={{ transformOrigin: '78px 104px', animationDelay: '-0.3s' }}
          >
            <path
              d="M78 104 C40 112, 18 144, 34 176 C66 168, 86 138, 78 104 Z"
              fill="url(#leafGradTL)"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <path d="M76 108 C58 130, 48 150, 38 170" stroke="currentColor" strokeWidth="1" opacity="0.65" />
          </g>

          <g
            className="animate-leaf-flutter-b"
            style={{ transformOrigin: '104px 162px', animationDelay: '-1.5s' }}
          >
            <path
              d="M104 162 C144 150, 178 168, 178 198 C142 204, 114 186, 104 162 Z"
              fill="url(#leafGradTL)"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <path d="M108 165 C132 174, 152 184, 172 195" stroke="currentColor" strokeWidth="1" opacity="0.65" />
          </g>

          <g
            className="animate-leaf-flutter-a"
            style={{ transformOrigin: '118px 208px', animationDelay: '-2.6s' }}
          >
            <path
              d="M118 208 C76 218, 56 250, 74 276 C104 268, 124 240, 118 208 Z"
              fill="url(#leafGradTL)"
              stroke="currentColor"
              strokeWidth="1.4"
            />
          </g>

          {/* Main nodding 6-petal blossom */}
          <g
            className="animate-flower-nod"
            style={{ transformOrigin: '204px 96px', animationDelay: '-0.7s' }}
          >
            <g className="animate-corolla-bloom" style={{ transformOrigin: '216px 104px' }}>
              {[0, 60, 120, 180, 240, 300].map((angle) => (
                <ellipse
                  key={angle}
                  cx="216"
                  cy="80"
                  rx="10"
                  ry="19"
                  transform={`rotate(${angle} 216 104)`}
                  fill="url(#petalGradTL)"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
              ))}
              <circle cx="216" cy="104" r="7" fill="#16a34a" fillOpacity="0.45" stroke="currentColor" strokeWidth="1.3" />
            </g>
          </g>

          {/* Tip bud flower */}
          <g
            className="animate-flower-nod"
            style={{ transformOrigin: '132px 256px', animationDelay: '-2.1s' }}
          >
            <g className="animate-corolla-bloom" style={{ transformOrigin: '138px 274px', animationDelay: '-1.4s' }}>
              {[0, 90, 180, 270].map((angle) => (
                <ellipse
                  key={angle}
                  cx="138"
                  cy="262"
                  rx="6"
                  ry="11"
                  transform={`rotate(${angle} 138 274)`}
                  fill="rgba(74, 222, 128, 0.34)"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
              ))}
              <circle cx="138" cy="274" r="4.5" fill="#2563eb" fillOpacity="0.45" />
            </g>
          </g>
        </g>
      </svg>

      {/* TOP-RIGHT: Wildflower Spray, Eucalyptus Leaves & Layered Blossoms */}
      <svg
        className="absolute -right-6 top-0 h-64 w-64 text-emerald-800/55 sm:h-88 sm:w-88 lg:h-[400px] lg:w-[400px]"
        viewBox="0 0 380 380"
        fill="none"
      >
        <defs>
          <linearGradient id="leafGradTR" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.16" />
          </linearGradient>
        </defs>

        <g className="animate-wind-branch-b" style={{ transformOrigin: '368px 18px' }}>
          <path
            d="M368 18 C302 52, 248 112, 206 202"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <path
            d="M298 68 C260 40, 214 38, 174 62"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          <g
            className="animate-leaf-flutter-b"
            style={{ transformOrigin: '286px 82px', animationDelay: '-0.4s' }}
          >
            <path
              d="M286 82 C322 88, 344 116, 330 144 C300 140, 278 114, 286 82 Z"
              fill="url(#leafGradTR)"
              stroke="currentColor"
              strokeWidth="1.4"
            />
          </g>

          <g
            className="animate-leaf-flutter-a"
            style={{ transformOrigin: '252px 124px', animationDelay: '-1.6s' }}
          >
            <path
              d="M252 124 C210 112, 180 132, 184 160 C216 168, 244 148, 252 124 Z"
              fill="url(#leafGradTR)"
              stroke="currentColor"
              strokeWidth="1.4"
            />
          </g>

          <g
            className="animate-leaf-flutter-b"
            style={{ transformOrigin: '226px 164px', animationDelay: '-2.5s' }}
          >
            <path
              d="M226 164 C264 176, 280 206, 260 228 C232 218, 218 190, 226 164 Z"
              fill="url(#leafGradTR)"
              stroke="currentColor"
              strokeWidth="1.4"
            />
          </g>

          {/* 8-petal layered blossom */}
          <g
            className="animate-flower-nod"
            style={{ transformOrigin: '182px 60px', animationDelay: '-0.8s' }}
          >
            <g className="animate-corolla-bloom" style={{ transformOrigin: '168px 66px' }}>
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                <ellipse
                  key={angle}
                  cx="168"
                  cy="44"
                  rx="7.5"
                  ry="16"
                  transform={`rotate(${angle} 168 66)`}
                  fill={angle % 90 === 0 ? 'rgba(74, 222, 128, 0.34)' : 'rgba(56, 189, 248, 0.24)'}
                  stroke="currentColor"
                  strokeWidth="1.25"
                />
              ))}
              <circle cx="168" cy="66" r="7" fill="#059669" fillOpacity="0.45" stroke="currentColor" strokeWidth="1.3" />
            </g>
          </g>

          {/* Curling fern tendril below */}
          <g
            className="animate-tendril-curl"
            style={{ transformOrigin: '208px 198px', animationDelay: '-2s' }}
          >
            <path
              d="M208 198 C192 224, 166 230, 160 212 C156 198, 174 194, 180 208"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </g>
        </g>
      </svg>

      {/* BOTTOM-LEFT: Sprouting Wildflower Vine & Dancing Bell Blossoms */}
      <svg
        className="absolute -left-4 bottom-0 h-56 w-64 text-emerald-800/50 sm:h-72 sm:w-80"
        viewBox="0 0 300 260"
        fill="none"
      >
        <g className="animate-wind-branch-a" style={{ transformOrigin: '12px 252px', animationDelay: '-2.2s' }}>
          <path
            d="M12 252 C68 190, 128 152, 214 122"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <g
            className="animate-leaf-flutter-b"
            style={{ transformOrigin: '76px 188px', animationDelay: '-0.5s' }}
          >
            <path
              d="M76 188 C52 150, 62 114, 98 106 C112 138, 102 170, 76 188 Z"
              fill="rgba(52, 211, 153, 0.24)"
              stroke="currentColor"
              strokeWidth="1.4"
            />
          </g>
          <g
            className="animate-leaf-flutter-a"
            style={{ transformOrigin: '128px 158px', animationDelay: '-1.7s' }}
          >
            <path
              d="M128 158 C158 176, 188 168, 198 142 C170 130, 140 138, 128 158 Z"
              fill="rgba(34, 197, 94, 0.24)"
              stroke="currentColor"
              strokeWidth="1.4"
            />
          </g>
          <g
            className="animate-flower-nod"
            style={{ transformOrigin: '206px 124px', animationDelay: '-1.2s' }}
          >
            <g className="animate-corolla-bloom" style={{ transformOrigin: '220px 118px' }}>
              {[0, 72, 144, 216, 288].map((deg) => (
                <ellipse
                  key={deg}
                  cx="220"
                  cy="102"
                  rx="6.5"
                  ry="12"
                  transform={`rotate(${deg} 220 118)`}
                  fill="rgba(110, 231, 183, 0.38)"
                  stroke="currentColor"
                  strokeWidth="1.25"
                />
              ))}
              <circle cx="220" cy="118" r="5" fill="#2563eb" fillOpacity="0.45" />
            </g>
          </g>
        </g>
      </svg>

      {/* BOTTOM-RIGHT: Reference-matched Stipple Seeds + Swaying Meadow Blades & Blossoms */}
      <svg
        className="absolute bottom-0 right-0 h-56 w-72 text-sky-700/45 sm:h-72 sm:w-80"
        viewBox="0 0 300 260"
        fill="none"
      >
        <g className="animate-wind-branch-b" style={{ transformOrigin: '286px 248px', animationDelay: '-1.4s' }}>
          <path
            d="M286 248 C236 188, 188 150, 124 118"
            stroke="#15803d"
            strokeOpacity="0.65"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <g
            className="animate-leaf-flutter-a"
            style={{ transformOrigin: '224px 184px', animationDelay: '-0.8s' }}
          >
            <path
              d="M224 184 C252 154, 248 122, 218 112 C202 140, 206 168, 224 184 Z"
              fill="rgba(52, 211, 153, 0.24)"
              stroke="#15803d"
              strokeOpacity="0.65"
              strokeWidth="1.4"
            />
          </g>
          <g
            className="animate-leaf-flutter-b"
            style={{ transformOrigin: '176px 148px', animationDelay: '-2.1s' }}
          >
            <path
              d="M176 148 C146 164, 118 154, 112 130 C138 118, 164 128, 176 148 Z"
              fill="rgba(56, 189, 248, 0.22)"
              stroke="#0284c7"
              strokeOpacity="0.6"
              strokeWidth="1.4"
            />
          </g>
          <g
            className="animate-tendril-curl"
            style={{ transformOrigin: '124px 118px', animationDelay: '-0.5s' }}
          >
            <circle cx="116" cy="112" r="7" fill="rgba(74, 222, 128, 0.38)" stroke="#15803d" strokeWidth="1.3" />
            <circle cx="132" cy="100" r="5" fill="rgba(56, 189, 248, 0.35)" stroke="#0284c7" strokeWidth="1.2" />
          </g>
        </g>

        {/* Reference-matched rhythmic botanical stipples */}
        {[
          [242, 208],
          [258, 192],
          [272, 206],
          [254, 222],
          [228, 226],
          [206, 216],
          [274, 228],
          [214, 238],
          [242, 242],
          [286, 216],
        ].map(([cx, cy], idx) => (
          <circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r={idx % 2 === 0 ? 3.2 : 2.3}
            fill="currentColor"
            opacity={0.75}
          />
        ))}
      </svg>

      {/* Live Wind-Carried Floating Petals & Leaf Motes */}
      <div
        className="animate-petal-wind-1 absolute left-[12%] top-[22%] h-3.5 w-6 rounded-full border border-emerald-600/35 bg-emerald-300/45"
        style={{ animationDelay: '-1s' }}
      />
      <div
        className="animate-petal-wind-2 absolute right-[16%] top-[20%] h-3 w-5 rounded-full border border-sky-500/35 bg-sky-300/40"
        style={{ animationDelay: '-3.5s' }}
      />
      <div
        className="animate-petal-wind-3 absolute left-[24%] bottom-[22%] h-3 w-5 rounded-full border border-green-600/35 bg-green-300/45"
        style={{ animationDelay: '-2.1s' }}
      />
      <div
        className="animate-petal-wind-1 absolute right-[26%] bottom-[16%] h-3 w-4 rounded-full border border-emerald-600/35 bg-emerald-200/55"
        style={{ animationDelay: '-5.4s' }}
      />
      <div
        className="animate-petal-wind-2 absolute left-[48%] top-[14%] h-2.5 w-4 rounded-full border border-teal-600/30 bg-emerald-300/40"
        style={{ animationDelay: '-4.2s' }}
      />
    </div>
  );
}
