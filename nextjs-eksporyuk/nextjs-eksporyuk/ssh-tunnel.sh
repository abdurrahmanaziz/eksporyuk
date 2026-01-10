#!/usr/bin/expect -f

# SSH Tunnel to MySQL production
# Usage: ./ssh-tunnel.sh

set timeout 30

spawn ssh -o StrictHostKeyChecking=no -L 3307:localhost:3306 aziz@103.125.181.47

expect {
    "password:" {
        send "Bismillah.2022\r"
        interact
    }
    timeout {
        puts "Connection timeout"
        exit 1
    }
}
