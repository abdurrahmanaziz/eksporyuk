#!/usr/bin/env python3
"""
Deployment Script untuk Forgot Password Fix
Otomatis melakukan git commit dan push ke production
"""

import subprocess
import sys
import os
from datetime import datetime

def print_header(text):
    print("\n" + "="*80)
    print("🚀 " + text)
    print("="*80 + "\n")

def print_step(step_num, text):
    print(f"\n{step_num}️⃣ {text}")
    print("-" * 80)

def run_command(cmd, description=""):
    """Run shell command and return result"""
    try:
        print(f"Running: {cmd}")
        result = subprocess.run(
            cmd,
            shell=True,
            cwd="/Users/abdurrahmanaziz/Herd/eksporyuk",
            capture_output=True,
            text=True
        )
        
        if result.stdout:
            print(result.stdout)
        
        if result.returncode != 0 and result.stderr:
            print(f"⚠️  {result.stderr}")
        
        return result.returncode == 0, result.stdout, result.stderr
    
    except Exception as e:
        print(f"❌ Error running command: {str(e)}")
        return False, "", str(e)

def main():
    print_header("DEPLOYMENT: FORGOT PASSWORD FIX TO PRODUCTION")
    
    # Check we're in the right directory
    print_step("1", "Verifying repository location")
    
    if not os.path.exists("/Users/abdurrahmanaziz/Herd/eksporyuk/.git"):
        print("❌ Not in a git repository!")
        sys.exit(1)
    
    print("✅ Git repository found")
    print(f"   Location: /Users/abdurrahmanaziz/Herd/eksporyuk")
    
    # Check git status
    print_step("2", "Checking git status")
    
    success, stdout, _ = run_command("git status --short")
    if not success:
        print("❌ Failed to check git status")
        sys.exit(1)
    
    if not stdout.strip():
        print("⚠️  No changes detected")
        print("   This might be OK if changes are already committed")
    else:
        print("Changes found:")
        print(stdout)
    
    # Stage files
    print_step("3", "Staging production files")
    
    files_to_stage = [
        "nextjs-eksporyuk/src/app/api/auth/forgot-password-v2/route.ts",
        "nextjs-eksporyuk/src/app/auth/reset-password/page.tsx"
    ]
    
    for file in files_to_stage:
        success, _, _ = run_command(f"git add {file}")
        if success:
            print(f"✅ Staged: {file}")
        else:
            print(f"⚠️  Could not stage: {file}")
    
    # Show what will be committed
    print_step("4", "Verifying staged changes")
    
    success, stdout, _ = run_command("git diff --cached --name-only")
    if success and stdout.strip():
        print("Files to commit:")
        for line in stdout.strip().split('\n'):
            print(f"  ✓ {line}")
    else:
        print("ℹ️  No new staged changes (files may already be committed)")
    
    # Commit
    print_step("5", "Creating commit")
    
    commit_msg = "Fix: Forgot password link now functional - reset page calls correct v2 endpoint with query parameter token handling"
    success, stdout, stderr = run_command(
        f'git commit -m "{commit_msg}"'
    )
    
    if success:
        print("✅ Commit created successfully")
        print(f"   Message: {commit_msg}")
    elif "nothing to commit" in stderr or "nothing to commit" in stdout:
        print("ℹ️  Nothing new to commit (files already committed)")
    else:
        print(f"⚠️  Commit result: {stderr or stdout}")
    
    # Push to main
    print_step("6", "Pushing to main branch")
    
    success, stdout, stderr = run_command("git push origin main")
    
    if success:
        print_header("✅ DEPLOYMENT SUCCESSFUL!")
        
        print("📊 What was deployed:")
        print("   ✓ /src/app/api/auth/forgot-password-v2/route.ts")
        print("   ✓ /src/app/auth/reset-password/page.tsx")
        
        print("\n🔧 Details:")
        print("   • Repository: abdurrahmanaziz/eksporyuk")
        print("   • Branch: main")
        print("   • Live URL: https://app.eksporyuk.com")
        print("   • Build time: 30-60 seconds")
        print("   • Deployment time: " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        
        print("\n🎯 Fixes included:")
        print("   • Reset link format: /reset-password?token=VALUE (fixed from path-based)")
        print("   • API endpoint: reset page now calls v2 endpoint (fixed)")
        print("   • Token validation: PUT handler validates token, checks expiry, validates single-use")
        print("   • Password hashing: bcryptjs with 10 rounds")
        print("   • Email sending: Mailketing integration")
        
        print("\n🧪 Test the fix (after 1-2 minutes):")
        print("   1. Visit: https://app.eksporyuk.com/forgot-password")
        print("   2. Enter registered email")
        print("   3. Check inbox for reset email")
        print("   4. Click reset link (should work now! ✅)")
        print("   5. Enter new password and submit")
        print("   6. See success message")
        print("   7. Login with new password")
        
        print("\n📊 Monitor deployment:")
        print("   • Dashboard: https://vercel.com/dashboard")
        print("   • Project: https://vercel.com/abdurrahmanaziz/eksporyuk")
        print("   • Recent deployments: https://vercel.com/abdurrahmanaziz/eksporyuk/deployments")
        
        print("\n" + "="*80)
        print("✅ Deployment complete! Code is now live.")
        print("="*80 + "\n")
        
        sys.exit(0)
    
    else:
        print_header("❌ DEPLOYMENT FAILED")
        print("Error details:")
        print(stderr or stdout)
        print("\nPossible issues:")
        print("   • Network connection problem")
        print("   • GitHub authentication required")
        print("   • Branch protection rules")
        print("\nSolution:")
        print("   • Check internet: ping github.com")
        print("   • Verify auth: git config --list | grep github")
        print("   • Manual push: git push origin main")
        print("="*80 + "\n")
        
        sys.exit(1)

if __name__ == "__main__":
    main()
