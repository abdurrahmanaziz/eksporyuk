#!/bin/bash
# SSH Tunnel untuk akses database Sejoli

echo "🔒 Creating SSH Tunnel to Sejoli Database..."
echo "============================================"
echo ""
echo "This will create an SSH tunnel to access the remote MySQL database"
echo "Local port 13306 will forward to remote MySQL (3306)"
echo ""

# SSH Tunnel configuration
SSH_HOST="103.125.181.47"
SSH_USER="aziz"
SSH_PASS="Bismillah.2022"
LOCAL_PORT="13306"
REMOTE_HOST="127.0.0.1"
REMOTE_PORT="3306"

echo "SSH Host: $SSH_HOST"
echo "Local Port: $LOCAL_PORT → Remote: $REMOTE_HOST:$REMOTE_PORT"
echo ""
echo "⚠️  NOTE: You'll need to enter SSH password: Bismillah.2022"
echo ""
echo "Keep this terminal open while running migration scripts!"
echo "Press Ctrl+C to close the tunnel when done."
echo ""
echo "Starting tunnel..."
echo ""

# Create SSH tunnel
ssh -N -L ${LOCAL_PORT}:${REMOTE_HOST}:${REMOTE_PORT} ${SSH_USER}@${SSH_HOST}

# If tunnel fails
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ SSH Tunnel failed!"
    echo ""
    echo "Possible solutions:"
    echo "1. Check if SSH password is correct"
    echo "2. Verify SSH access is enabled on server"
    echo "3. Check firewall rules"
    echo ""
    echo "Alternative: Use sshpass for automatic authentication:"
    echo "   brew install sshpass"
    echo "   sshpass -p 'Bismillah.2022' ssh -N -L 13306:127.0.0.1:3306 aziz@103.125.181.47"
fi
