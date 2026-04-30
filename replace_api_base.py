import os
import re

src_dir = r'c:\FYP\grocery-store\src'
api_base_import = "import { API_BASE } from '@/utils/apiBase';"

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'http://localhost:8080' not in content:
        return

    print(f"Processing {file_path}")

    # Add import if missing
    if 'API_BASE' not in content:
        # Add after last import or at top
        import_match = re.search(r'^import .*;?\n', content, re.MULTILINE)
        if import_match:
            # Find the last import line
            all_imports = list(re.finditer(r'^import .*;?\n', content, re.MULTILINE))
            last_import_end = all_imports[-1].end()
            content = content[:last_import_end] + api_base_import + "\n" + content[last_import_end:]
        else:
            # Add at top after "use client" if exists
            use_client_match = re.search(r'^"use client";?\n', content, re.MULTILINE)
            if use_client_match:
                content = content[:use_client_match.end()] + api_base_import + "\n" + content[use_client_match.end():]
            else:
                content = api_base_import + "\n" + content

    # Replace occurrences
    # Case 1: "http://localhost:8080" -> API_BASE (when it's the whole string)
    content = content.replace('"http://localhost:8080"', 'API_BASE')
    content = content.replace("'http://localhost:8080'", 'API_BASE')

    # Case 2: "http://localhost:8080/api/..." -> `${API_BASE}/api/...`
    # Replace starting with quote, ending with quote
    content = re.sub(r'"http://localhost:8080(/[^"]*)"', r'`${API_BASE}\1`', content)
    content = re.sub(r"'http://localhost:8080(/[^']*)'", r'`${API_BASE}\1`', content)

    # Case 3: `http://localhost:8080/api/...` -> `${API_BASE}/api/...`
    content = content.replace('http://localhost:8080', '${API_BASE}')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            process_file(os.path.join(root, file))
