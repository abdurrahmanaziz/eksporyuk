#!/usr/bin/expect -f

set timeout 60
set password "Bismillah.2022"

log_user 1

# SSH with aggressive keepalive to prevent timeout
spawn ssh -v -N -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -o TCPKeepAlive=yes -L 3307:localhost:3306 aziz@103.125.181.47

expect {
    "password:" {
        send "$password\r"
        puts "\n>>> Password sent, waiting for tunnel..."
        exp_continue
    }
    "Permission denied" {
        puts "ERROR: Wrong password"
        exit 1
    }
    "Authenticated to" {
        puts "\n>>> SSH Tunnel established!"
        set timeout -1
        expect eof
    }
    "Local forwarding listening" {
        puts "\n>>> Tunnel ready on port 3307!"
        set timeout -1
        expect eof
    }
    "yes/no" {
        send "yes\r"
        exp_continue
    }
    timeout {
        puts ">>> Tunnel should be running..."
        set timeout -1
        expect eof
    }
    eof {
        puts "Connection closed"
        exit 0
    }
}
