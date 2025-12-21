#!/bin/bash
# SSH Tunnel Setup Script
# Connects to production server and creates tunnel on port 3307

echo "🔌 Setting up SSH tunnel to production server..."
echo "Server: 103.125.181.47"
echo "Local Port: 3307"
echo ""

# Kill existing tunnel if any
existing_pid=$(lsof -ti :3307)
if [ ! -z "$existing_pid" ]; then
  echo "⚠️  Found existing process on port 3307 (PID: $existing_pid)"
  echo "   Killing existing process..."
  kill -9 $existing_pid 2>/dev/null
  sleep 1
fi

# Create SSH tunnel with password
echo "🚀 Creating SSH tunnel..."
echo "   You will be prompted for password: Bismillah.2022"
echo ""

ssh -f -N -L 3307:localhost:3306 aziz@103.125.181.47 \
  -o ServerAliveInterval=60 \
  -o ServerAliveCountMax=3 \
  -o StrictHostKeyChecking=no

sleep 2

# Verify tunnel
if lsof -ti :3307 > /dev/null; then
  echo ""
  echo "✅ SSH tunnel successfully created!"
  echo "   MySQL available at: localhost:3307"
  echo ""
  echo "📌 To close tunnel later:"
  echo "   kill -9 \$(lsof -ti :3307)"
  echo ""
else
  echo ""
  echo "❌ Failed to create SSH tunnel"
  echo "   Please check connection and try again"
  exit 1
fi
