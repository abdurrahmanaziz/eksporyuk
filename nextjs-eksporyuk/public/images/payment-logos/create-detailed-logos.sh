#!/bin/bash

# BNI - Detailed with gradient
cat > bni.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100">
  <defs>
    <radialGradient id="bniGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#FF8833;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#FF6600;stop-opacity:1"/>
    </radialGradient>
  </defs>
  
  <rect width="300" height="100" fill="white"/>
  
  <!-- Orange Circle with 46 -->
  <circle cx="45" cy="50" r="32" fill="url(#bniGrad)"/>
  <text x="45" y="60" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle">46</text>
  
  <!-- BNI Text -->
  <text x="95" y="60" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="#FF6600" letter-spacing="2">BNI</text>
</svg>
EOF

# BRI - Detailed with shadow
cat > bri.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 100">
  <defs>
    <linearGradient id="briBlue" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#004499;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#003380;stop-opacity:1"/>
    </linearGradient>
  </defs>
  
  <rect width="320" height="100" fill="white"/>
  
  <!-- Blue Rectangle -->
  <rect x="10" y="20" width="65" height="50" rx="6" fill="url(#briBlue)"/>
  <text x="42" y="55" font-family="Arial, sans-serif" font-size="30" font-weight="bold" fill="white" text-anchor="middle">BRI</text>
  
  <!-- Yellow accent -->
  <path d="M 10,70 L 75,70 L 70,77 L 15,77 Z" fill="#FFCC00"/>
  
  <!-- Bank BRI text -->
  <text x="90" y="52" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#003399">Bank BRI</text>
</svg>
EOF

# BSI - Islamic design
cat > bsi.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 100">
  <defs>
    <linearGradient id="bsiGreen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00AA44;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#008833;stop-opacity:1"/>
    </linearGradient>
  </defs>
  
  <rect width="320" height="100" fill="white"/>
  
  <!-- Green Circle with star -->
  <circle cx="40" cy="50" r="28" fill="url(#bsiGreen)"/>
  <path d="M 40,30 L 44,42 L 56,42 L 46,50 L 50,62 L 40,54 L 30,62 L 34,50 L 24,42 L 36,42 Z" fill="white"/>
  
  <!-- BSI Text -->
  <text x="80" y="48" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#009933">BSI</text>
  <text x="80" y="68" font-family="Arial, sans-serif" font-size="13" fill="#009933">Bank Syariah Indonesia</text>
</svg>
EOF

# OVO - Purple with circles
cat > ovo.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 100">
  <rect width="280" height="100" fill="white"/>
  
  <!-- Two circles for OO -->
  <circle cx="35" cy="50" r="25" fill="#4D2D8B"/>
  <circle cx="75" cy="50" r="25" fill="#4D2D8B"/>
  
  <!-- OVO text -->
  <text x="115" y="62" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="#4D2D8B" letter-spacing="1">OVO</text>
</svg>
EOF

# DANA - Blue with diamond
cat > dana.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100">
  <defs>
    <linearGradient id="danaBlue" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1199FF;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#0077DD;stop-opacity:1"/>
    </linearGradient>
  </defs>
  
  <rect width="300" height="100" fill="white"/>
  
  <!-- Blue Circle with diamond -->
  <circle cx="45" cy="50" r="30" fill="url(#danaBlue)"/>
  <path d="M 45,28 L 54,50 L 45,72 L 36,50 Z" fill="white"/>
  
  <!-- DANA text -->
  <text x="90" y="62" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="#118EEA" letter-spacing="1">DANA</text>
</svg>
EOF

# GoPay - Green
cat > gopay.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100">
  <defs>
    <radialGradient id="gopayGreen" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#00CC22;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#00AA13;stop-opacity:1"/>
    </radialGradient>
  </defs>
  
  <rect width="300" height="100" fill="white"/>
  
  <!-- Green Circle with GO -->
  <circle cx="45" cy="50" r="30" fill="url(#gopayGreen)"/>
  <text x="45" y="58" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">GO</text>
  
  <!-- Pay text -->
  <text x="90" y="62" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#00AA13">GoPay</text>
</svg>
EOF

# QRIS - Gradient QR style
cat > qris.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100">
  <defs>
    <linearGradient id="qrisGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#118EEA;stop-opacity:1"/>
      <stop offset="50%" style="stop-color:#6B4FBB;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#8B3F9B;stop-opacity:1"/>
    </linearGradient>
  </defs>
  
  <rect width="300" height="100" fill="white"/>
  
  <!-- QR-like blocks -->
  <g transform="translate(15, 25)">
    <rect x="0" y="0" width="18" height="18" rx="2" fill="url(#qrisGrad)"/>
    <rect x="22" y="0" width="18" height="18" rx="2" fill="url(#qrisGrad)"/>
    <rect x="0" y="22" width="18" height="18" rx="2" fill="url(#qrisGrad)"/>
    <rect x="22" y="22" width="18" height="18" rx="2" fill="url(#qrisGrad)"/>
    <rect x="44" y="11" width="18" height="18" rx="2" fill="url(#qrisGrad)"/>
  </g>
  
  <!-- QRIS text -->
  <text x="90" y="60" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="url(#qrisGrad)" letter-spacing="2">QRIS</text>
</svg>
EOF

# Alfamart - Red with box
cat > alfamart.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 100">
  <rect width="340" height="100" fill="white"/>
  
  <!-- Red box -->
  <rect x="10" y="15" width="70" height="70" rx="10" fill="#DC143C"/>
  <text x="45" y="60" font-family="Arial, sans-serif" font-size="34" font-weight="bold" fill="white" text-anchor="middle">Alfa</text>
  
  <!-- alfamart text -->
  <text x="95" y="52" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#DC143C">alfamart</text>
  <text x="95" y="72" font-family="Arial, sans-serif" font-size="14" fill="#666">minimarket</text>
</svg>
EOF

# Indomaret - Yellow with red text
cat > indomaret.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100">
  <defs>
    <linearGradient id="indomaretYellow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFEE44;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#FFCC00;stop-opacity:1"/>
    </linearGradient>
  </defs>
  
  <rect width="360" height="100" fill="white"/>
  
  <!-- Yellow box -->
  <rect x="10" y="15" width="70" height="70" rx="10" fill="url(#indomaretYellow)"/>
  <text x="45" y="58" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#C41E3A" text-anchor="middle">indo</text>
  
  <!-- INDOMARET text -->
  <text x="95" y="48" font-family="Arial, sans-serif" font-size="30" font-weight="bold" fill="#FFCC00" letter-spacing="1">INDOMARET</text>
  <text x="95" y="68" font-family="Arial, sans-serif" font-size="13" fill="#666">mudah &amp; hemat</text>
</svg>
EOF

echo "✅ Created 9 detailed high-quality logos"
ls -lh mandiri.svg bni.svg bri.svg bsi.svg ovo.svg dana.svg gopay.svg qris.svg alfamart.svg indomaret.svg
