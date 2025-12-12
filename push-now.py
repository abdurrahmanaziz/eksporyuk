#!/usr/bin/env python3
"""
Direct Git Push to GitHub
Melakukan git add, commit, dan push secara otomatis
"""

import subprocess
import sys
import os
from datetime import datetime

def run_cmd(cmd):
    """Execute shell command"""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            cwd="/Users/abdurrahmanaziz/Herd/eksporyuk",
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.returncode == 0, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return False, "", "Command timeout"
    except Exception as e:
        return False, "", str(e)

def main():
    print("\n" + "="*80)
    print("🚀 PUSHING TO GITHUB")
    print("="*80 + "\n")
    
    os.chdir("/Users/abdurrahmanaziz/Herd/eksporyuk")
    
    # Step 1: Check status
    print("1️⃣ Checking git status...")
    success, stdout, stderr = run_cmd("git status --short")
    if stdout.strip():
        print("Changes found:")
        print(stdout)
    else:
        print("✓ No uncommitted changes")
    print()
    
    # Step 2: Stage files
    print("2️⃣ Staging files...")
    run_cmd("git add nextjs-eksporyuk/src/app/api/auth/forgot-password-v2/route.ts")
    run_cmd("git add nextjs-eksporyuk/src/app/auth/reset-password/page.tsx")
    print("✓ Files staged\n")
    
    # Step 3: Show what will be committed
    print("3️⃣ Files to commit:")
    success, stdout, _ = run_cmd("git diff --cached --name-only")
    if stdout.strip():
        for line in stdout.strip().split('\n'):
            print(f"   • {line}")
    print()
    
    # Step 4: Commit
    print("4️⃣ Creating commit...")
    commit_msg = "Fix: Forgot password link now functional - reset page calls correct v2 endpoint with query parameter token handling"
    success, stdout, stderr = run_cmd(f'git commit -m "{commit_msg}"')
    
    if success:
        print("✅ Commit created")
    elif "nothing to commit" in stderr or "nothing to commit" in stdout:
        print("ℹ️ Nothing new to commit")
    else:
        print(f"⚠️ {stderr}")
    print()
    
    # Step 5: Push
    print("5️⃣ Pushing to GitHub...")
    success, stdout, stderr = run_cmd("git push origin main")
    
    if success:
        print("✅ Push successful!")
        print("\n" + "="*80)
        print("✅ DEPLOYMENT STARTED ON VERCEL!")
        print("="*80)
        print("\n📊 What happened:")
        print("   ✓ Code pushed to GitHub main branch")
        print("   ✓ Vercel webhook triggered")
        print("   ✓ Build process started (30-60 seconds)")
        print("\n🔗 Monitor progress:")
        print("   Dashboard: https://vercel.com/dashboard")
        print("   Project: https://vercel.com/abdurrahmanaziz/eksporyuk")
        print("   Deployments: https://vercel.com/abdurrahmanaziz/eksporyuk/deployments")
        print("\n🧪 Test after 2 minutes:")
        print("   1. Visit: https://app.eksporyuk.com/forgot-password")
        print("   2. Enter email")
        print("   3. Check inbox for reset email")
        print("   4. Click reset link (should work now! ✅)")
        print("\n" + "="*80 + "\n")
        return 0
    else:
        print(f"❌ Push failed: {stderr}")
        print("\nTroubleshooting:")
        print("   • Check connection: ping github.com")
        print("   • Check auth: git config --list | grep github")
        print("   • Try manual: git push origin main")
        return 1

if __name__ == "__main__":
    sys.exit(main())
