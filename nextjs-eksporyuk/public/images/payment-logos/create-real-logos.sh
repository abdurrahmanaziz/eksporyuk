#!/bin/bash

# Bank Mandiri - Gold wave + blue text
cat > mandiri.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80">
  <rect width="240" height="80" fill="white"/>
  <g transform="translate(20, 15)">
    <path d="M0,25 C5,15 15,15 20,25 C25,35 35,35 40,25" fill="none" stroke="#FFB81C" stroke-width="4"/>
    <path d="M0,35 C5,25 15,25 20,35 C25,45 35,45 40,35" fill="none" stroke="#FFB81C" stroke-width="4"/>
    <text x="55" y="42" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#003087">mandiri</text>
  </g>
</svg>
EOF

# Bank BNI - Orange '46 symbol
cat > bni.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80">
  <rect width="200" height="80" fill="white"/>
  <g transform="translate(15, 15)">
    <circle cx="25" cy="25" r="22" fill="#FF6600"/>
    <text x="15" y="35" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white">46</text>
    <text x="60" y="32" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="#FF6600">BNI</text>
  </g>
</svg>
EOF

# Bank BRI - Blue with yellow accent
cat > bri.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80">
  <rect width="200" height="80" fill="white"/>
  <g transform="translate(15, 15)">
    <rect x="0" y="5" width="45" height="40" rx="5" fill="#003399"/>
    <text x="10" y="33" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white">BRI</text>
    <path d="M0,45 L45,45 L40,50 L5,50 Z" fill="#FFCC00"/>
    <text x="55" y="33" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#003399">Bank BRI</text>
  </g>
</svg>
EOF

# Bank BSI - Green Islamic
cat > bsi.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80">
  <rect width="200" height="80" fill="white"/>
  <g transform="translate(15, 15)">
    <circle cx="20" cy="25" r="18" fill="#009933"/>
    <path d="M20,12 L25,22 L20,18 L15,22 Z" fill="white"/>
    <text x="45" y="28" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#009933">BSI</text>
    <text x="45" y="42" font-family="Arial, sans-serif" font-size="11" fill="#009933">Bank Syariah Indonesia</text>
  </g>
</svg>
EOF

# OVO - Purple
cat > ovo.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80">
  <rect width="200" height="80" fill="white"/>
  <g transform="translate(30, 20)">
    <circle cx="20" cy="20" r="18" fill="#4D2D8B"/>
    <circle cx="50" cy="20" r="18" fill="#4D2D8B"/>
    <text x="95" y="32" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#4D2D8B">OVO</text>
  </g>
</svg>
EOF

# DANA - Blue
cat > dana.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80">
  <rect width="200" height="80" fill="white"/>
  <g transform="translate(20, 15)">
    <circle cx="25" cy="25" r="22" fill="#118EEA"/>
    <path d="M25,15 L30,25 L25,35 L20,25 Z" fill="white"/>
    <text x="60" y="35" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#118EEA">DANA</text>
  </g>
</svg>
EOF

# GoPay - Green
cat > gopay.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80">
  <rect width="200" height="80" fill="white"/>
  <g transform="translate(20, 15)">
    <circle cx="25" cy="25" r="22" fill="#00AA13"/>
    <text x="18" y="33" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white">GO</text>
    <text x="60" y="35" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#00AA13">GoPay</text>
  </g>
</svg>
EOF

# QRIS - Blue to Purple gradient
cat > qris.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80">
  <defs>
    <linearGradient id="qrisGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#118EEA"/>
      <stop offset="100%" style="stop-color:#6B4FBB"/>
    </linearGradient>
  </defs>
  <rect width="200" height="80" fill="white"/>
  <g transform="translate(20, 15)">
    <rect x="0" y="0" width="20" height="20" fill="url(#qrisGrad)"/>
    <rect x="0" y="25" width="20" height="20" fill="url(#qrisGrad)"/>
    <rect x="25" y="0" width="20" height="20" fill="url(#qrisGrad)"/>
    <rect x="25" y="25" width="20" height="20" fill="url(#qrisGrad)"/>
    <text x="60" y="32" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="url(#qrisGrad)">QRIS</text>
  </g>
</svg>
EOF

# Alfamart - Red
cat > alfamart.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80">
  <rect width="240" height="80" fill="white"/>
  <g transform="translate(15, 10)">
    <rect x="0" y="0" width="60" height="60" rx="8" fill="#DC143C"/>
    <text x="10" y="40" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white">Alfa</text>
    <text x="75" y="32" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="#DC143C">alfamart</text>
    <text x="75" y="50" font-family="Arial, sans-serif" font-size="12" fill="#666">minimarket</text>
  </g>
</svg>
EOF

# Indomaret - Yellow
cat > indomaret.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80">
  <rect width="240" height="80" fill="white"/>
  <g transform="translate(15, 10)">
    <rect x="0" y="0" width="60" height="60" rx="8" fill="#FFD700"/>
    <text x="8" y="40" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#C41E3A">indo</text>
    <text x="75" y="28" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#FFD700">INDOMARET</text>
    <text x="75" y="48" font-family="Arial, sans-serif" font-size="12" fill="#666">mudah & hemat</text>
  </g>
</svg>
EOF

# LinkAja - Red
cat > linkaja.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80">
  <rect width="200" height="80" fill="white"/>
  <g transform="translate(20, 15)">
    <circle cx="25" cy="25" r="22" fill="#E62129"/>
    <path d="M18,18 L32,18 L25,32 Z" fill="white"/>
    <text x="60" y="35" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#E62129">LinkAja</text>
  </g>
</svg>
EOF

# ShopeePay - Orange
cat > shopeepay.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80">
  <rect width="200" height="80" fill="white"/>
  <g transform="translate(15, 15)">
    <rect x="0" y="0" width="45" height="45" rx="8" fill="#EE4D2D"/>
    <text x="8" y="30" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white">Shop</text>
    <text x="60" y="28" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#EE4D2D">ShopeePay</text>
  </g>
</svg>
EOF

# CIMB Niaga
cat > cimb.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80">
  <rect width="200" height="80" fill="white"/>
  <g transform="translate(15, 15)">
    <rect x="0" y="5" width="45" height="40" rx="5" fill="#A51E1E"/>
    <text x="6" y="33" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white">CIMB</text>
    <text x="55" y="33" font-family="Arial, sans-serif" font-size="22" fill="#A51E1E">CIMB Niaga</text>
  </g>
</svg>
EOF

# Permata Bank - Green
cat > permata.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80">
  <rect width="200" height="80" fill="white"/>
  <g transform="translate(15, 15)">
    <path d="M20,5 L35,20 L20,35 L5,20 Z" fill="#00704A"/>
    <text x="50" y="25" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#00704A">PermataBank</text>
  </g>
</svg>
EOF

# Kredivo - Blue
cat > kredivo.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80">
  <rect width="200" height="80" fill="white"/>
  <g transform="translate(20, 15)">
    <circle cx="20" cy="25" r="18" fill="#3366FF"/>
    <text x="12" y="33" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white">K</text>
    <text x="50" y="35" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#3366FF">Kredivo</text>
  </g>
</svg>
EOF

# Akulaku - Purple
cat > akulaku.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80">
  <rect width="200" height="80" fill="white"/>
  <g transform="translate(20, 15)">
    <circle cx="20" cy="25" r="18" fill="#7B3FF2"/>
    <text x="13" y="33" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white">A</text>
    <text x="50" y="35" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#7B3FF2">Akulaku</text>
  </g>
</svg>
EOF

# AstraPay - Blue
cat > astrapay.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80">
  <rect width="200" height="80" fill="white"/>
  <g transform="translate(15, 15)">
    <path d="M20,10 L30,30 L10,30 Z" fill="#0066CC"/>
    <text x="40" y="28" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#0066CC">AstraPay</text>
  </g>
</svg>
EOF

# Jenius - Orange
cat > jeniuspay.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80">
  <rect width="200" height="80" fill="white"/>
  <g transform="translate(20, 15)">
    <circle cx="20" cy="25" r="18" fill="#FF6B00"/>
    <text x="14" y="33" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white">J</text>
    <text x="50" y="35" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#FF6B00">Jenius</text>
  </g>
</svg>
EOF

# Sahabat Sampoerna - Blue
cat > sahabat-sampoerna.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80">
  <rect width="240" height="80" fill="white"/>
  <g transform="translate(15, 15)">
    <rect x="0" y="5" width="50" height="40" rx="5" fill="#004B87"/>
    <text x="4" y="30" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="white">BANK</text>
    <text x="65" y="25" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#004B87">Sahabat Sampoerna</text>
  </g>
</svg>
EOF

echo "✅ Created 17 high-quality SVG logos with real brand colors"
ls -lh *.svg | wc -l
