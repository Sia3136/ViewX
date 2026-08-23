import re

path = 'c:/Users/Dell/Documents/Siya/DI1_11_CaseBlitz/backend/src/core/video_manager.py'
with open(path, 'rb') as f:
    content = f.read()

# Replace literal backslash-r at the end of lines
content = re.sub(br'\\r\r?\n', b'\n', content)

# Replace literal backslash-quote with just quote
content = content.replace(br'\"', b'"')

with open(path, 'wb') as f:
    f.write(content)
print("File fixed properly.")
