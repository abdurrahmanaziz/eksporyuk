#!/usr/bin/env python3
import subprocess
import os

os.chdir("/Users/abdurrahmanaziz/Herd/eksporyuk")

print("🚀 DEPLOYING FORGOT PASSWORD FIX\n")

# Stage files
print("1️⃣ Staging files...")
subprocess.run(["git", "add", "nextjs-eksporyuk/src/app/api/auth/forgot-password-v2/route.ts"])
subprocess.run(["git", "add", "nextjs-eksporyuk/src/app/auth/reset-password/page.tsx"])
print("✓ Files staged\n")

# Check status
print("2️⃣ Changes to commit:")
result = subprocess.run(["git", "diff", "--cached", "--name-only"], capture_output=True, text=True)
print(result.stdout)

# Commit
print("3️⃣ Creating commit...")
result = subprocess.run([
    "git", "commit", "-m", 
    "Fix: Forgot password link now functional - reset page calls correct v2 endpoint with query parameter token handling"
], capture_output=True, text=True)

if "nothing to commit" in result.stdout or "nothing to commit" in result.stderr:
    print("ℹ️  Nothing new to commit\n")
elif result.returncode == 0:
    print("✅ Commit created\n")
else:
    print(f"⚠️  {result.stderr}\n")

# Push
print("4️⃣ Pushing to main...")
result = subprocess.run(["git", "push", "origin", "main"], capture_output=True, text=True)

if result.returncode == 0:
    print("✅ Push successful!\n")
    print("═" * 80)
    print("✅ DEPLOYMENT COMPLETE!")
    print("═" * 80)
    print("\n🎯 Code is now deployed to production!")
    print("   Live URL: https://app.eksporyuk.com")
    print("   Build time: ~30-60 seconds")
    print("\n📧 Test the fix (after 1-2 minutes):")
    print("   1. Visit: https://app.eksporyuk.com/forgot-password")
    print("   2. Enter registered email")
    print("   3. Check inbox for reset email")
    print("   4. Click reset link - should work now! ✅")
    print("\n" + "═" * 80 + "\n")
else:
    print(f"❌ Push failed: {result.stderr}")
    print("\nTroubleshooting:")
    print("   • Check git config: git config --list")
    print("   • Try manual push: git push origin main")
