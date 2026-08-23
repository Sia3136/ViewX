import glob

files = glob.glob('c:/Users/Dell/Documents/Siya/DI1_11_CaseBlitz/backend/**/*.py', recursive=True)
for path in files:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    if r'\"' in content or r'\r' in content:
        print(f'Found literal backslash strings in {path}')
        content = content.replace(r'\"', '"')
        content = content.replace(r'\r', '')
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
