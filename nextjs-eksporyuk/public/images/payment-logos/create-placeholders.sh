#!/bin/bash

# Create colored placeholder SVG logos for each payment method
# BCA - Blue
echo '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#0066CC"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="32" fill="white" font-family="Arial" font-weight="bold">BCA</text></svg>' > bca.svg

# Mandiri - Yellow/Blue
echo '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#FFB81C"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="24" fill="#003087" font-family="Arial" font-weight="bold">MANDIRI</text></svg>' > mandiri.svg

# BNI - Orange
echo '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#FF6600"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="32" fill="white" font-family="Arial" font-weight="bold">BNI</text></svg>' > bni.svg

# BRI - Blue
echo '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#003399"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="32" fill="white" font-family="Arial" font-weight="bold">BRI</text></svg>' > bri.svg

# BSI - Green
echo '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#009933"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="32" fill="white" font-family="Arial" font-weight="bold">BSI</text></svg>' > bsi.svg

# CIMB - Red
echo '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#CC0000"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="28" fill="white" font-family="Arial" font-weight="bold">CIMB</text></svg>' > cimb.svg

# Permata - Green
echo '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#00AA5B"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-size="20" fill="white" font-family="Arial" font-weight="bold">PERMATA</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-size="18" fill="white" font-family="Arial">BANK</text></svg>' > permata.svg

# Sahabat Sampoerna - Blue
echo '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#0066CC"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="18" fill="white" font-family="Arial" font-weight="bold">SAMPOERNA</text></svg>' > sahabat-sampoerna.svg

# OVO - Purple
echo '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#4D2D8B"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="36" fill="white" font-family="Arial" font-weight="bold">OVO</text></svg>' > ovo.svg

# DANA - Blue
echo '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#118EEA"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="32" fill="white" font-family="Arial" font-weight="bold">DANA</text></svg>' > dana.svg

# GoPay - Green
echo '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#00AA13"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="28" fill="white" font-family="Arial" font-weight="bold">GoPay</text></svg>' > gopay.svg

# LinkAja - Red
echo '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#E32323"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="24" fill="white" font-family="Arial" font-weight="bold">LinkAja</text></svg>' > linkaja.svg

# ShopeePay - Orange
echo '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#EE4D2D"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-size="20" fill="white" font-family="Arial" font-weight="bold">Shopee</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-size="22" fill="white" font-family="Arial" font-weight="bold">Pay</text></svg>' > shopeepay.svg

# AstraPay - Blue
echo '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#0066CC"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-size="20" fill="white" font-family="Arial" font-weight="bold">Astra</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-size="22" fill="white" font-family="Arial" font-weight="bold">Pay</text></svg>' > astrapay.svg

# JeniusPay - Yellow
echo '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#FFB81C"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-size="20" fill="#003087" font-family="Arial" font-weight="bold">Jenius</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-size="22" fill="#003087" font-family="Arial" font-weight="bold">Pay</text></svg>' > jeniuspay.svg

# QRIS - Multi color
echo '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#0066CC;stop-opacity:1" /><stop offset="100%" style="stop-color:#9933CC;stop-opacity:1" /></linearGradient></defs><rect width="120" height="120" fill="url(#grad)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="32" fill="white" font-family="Arial" font-weight="bold">QRIS</text></svg>' > qris.svg

# Alfamart - Red
echo '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#DC143C"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-size="18" fill="white" font-family="Arial" font-weight="bold">ALFA</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-size="20" fill="white" font-family="Arial" font-weight="bold">MART</text></svg>' > alfamart.svg

# Indomaret - Yellow
echo '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#FFD700"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-size="16" fill="#FF0000" font-family="Arial" font-weight="bold">INDOMARET</text></svg>' > indomaret.svg

# Kredivo - Purple
echo '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#6A1B9A"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="24" fill="white" font-family="Arial" font-weight="bold">Kredivo</text></svg>' > kredivo.svg

# Akulaku - Orange
echo '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#FF7043"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="22" fill="white" font-family="Arial" font-weight="bold">Akulaku</text></svg>' > akulaku.svg

echo "SVG placeholders created!"
