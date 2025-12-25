import os
import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    
    # Pattern 1: findUnique with userId_courseId composite key
    # Replace with findFirst using AND conditions
    pattern1 = r'(prisma\.userCourseProgress\.)(findUnique)\s*\(\s*\{\s*where\s*:\s*\{\s*userId_courseId\s*:\s*\{\s*userId\s*:\s*([^,]+),\s*courseId\s*:\s*([^}]+)\s*\}\s*\}'
    
    def replace1(m):
        userId = m.group(3).strip()
        courseId = m.group(4).strip()
        return f'{m.group(1)}findFirst({{ where: {{ userId: {userId}, courseId: {courseId} }}'
    
    content = re.sub(pattern1, replace1, content)
    
    # Pattern 2: upsert with userId_courseId
    pattern2 = r'(prisma\.userCourseProgress\.)(upsert)\s*\(\s*\{\s*where\s*:\s*\{\s*userId_courseId\s*:\s*\{\s*userId\s*:\s*([^,]+),\s*courseId\s*:\s*([^}]+)\s*\}\s*\}'
    
    def replace2(m):
        userId = m.group(3).strip()
        courseId = m.group(4).strip()
        # For upsert, we need to use a different approach - findFirst then create/update
        return f'{m.group(1)}upsert({{ where: {{ id: "" }}, // NEEDS_MANUAL_FIX: was userId_courseId'
    
    # Don't auto-fix upsert - too complex, mark for manual review
    
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        return True
    return False

# Find all TypeScript files
api_dir = 'src/app/api'
fixed = []
for root, dirs, files in os.walk(api_dir):
    for f in files:
        if f.endswith('.ts'):
            path = os.path.join(root, f)
            if fix_file(path):
                fixed.append(path)

print(f"Fixed {len(fixed)} files:")
for f in fixed:
    print(f"  - {f}")
