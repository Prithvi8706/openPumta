import os
import re

files = [
    'server/src/config/passport.ts',
    'server/src/controllers/auth.controller.ts',
    'server/src/controllers/dailyRating.controller.ts',
    'server/src/controllers/export.controller.ts',
    'server/src/controllers/habit.controller.ts',
    'server/src/controllers/stats.controller.ts',
    'server/src/controllers/subject.controller.ts',
    'server/src/controllers/todo.controller.ts',
    'server/src/controllers/user.controller.ts',
    'server/src/middlewares/error.middleware.ts',
    'server/src/routes/auth.route.ts',
    'server/src/routes/dailyRating.route.ts',
    'server/src/routes/export.route.ts',
    'server/src/routes/habit.route.ts',
    'server/src/routes/stats.route.ts',
    'server/src/routes/subject.route.ts',
    'server/src/routes/todo.route.ts',
    'server/src/routes/user.route.ts',
    'server/prisma/prismaClient.ts'
]

def fix_imports(file_path):
    if not os.path.exists(file_path):
        print(f'File not found: {file_path}')
        return
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Matches relative imports/exports that do NOT already end in .js or .json or .css etc.
    # For now, let's just focus on adding .js to paths that don't have an extension.
    
    def replace_func(match):
        prefix = match.group(1)
        path = match.group(2)
        suffix = match.group(3)
        
        # If path already has an extension, don't add .js
        # Common extensions: .js, .json, .ts, .mjs, .cjs
        if re.search(r'\.(js|json|ts|mjs|cjs)$', path):
            return prefix + path + suffix
        
        return prefix + path + '.js' + suffix

    # Pattern for 'from' imports
    new_content = re.sub(r"(from\s+['\"])(\.\.?\/[^'\"]+)(['\"])", replace_func, content)
    
    # Pattern for side-effect imports
    new_content = re.sub(r"(import\s+['\"])(\.\.?\/[^'\"]+)(['\"])", replace_func, new_content)

    if content != new_content:
        with open(file_path, 'w') as f:
            f.write(new_content)
        print(f'Fixed imports in {file_path}')
    else:
        print(f'No changes needed in {file_path}')

for f in files:
    fix_imports(f)
