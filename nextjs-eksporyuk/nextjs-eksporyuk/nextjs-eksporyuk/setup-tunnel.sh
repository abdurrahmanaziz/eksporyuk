#!/bin/bash
# Setup SSH Tunnel untuk MySQL WordPress

echo "Setting up SSH tunnel to MySQL..."
echo "Password: Bismillah.2022"
echo ""
echo "Run this command manually in a new terminal:"
echo ""
echo "ssh -L 3307:127.0.0.1:3306 aziz@103.125.181.47 -N"
echo ""
echo "Keep that terminal open, then run:"
echo "node scripts/import-tutor-lms-mysql.js"
