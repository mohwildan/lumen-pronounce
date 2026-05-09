with open("extension/content.js", "r") as f:
    text = f.read()

import re
text = re.sub(r'\}ict\[stem\];[\s\S]+?// ── DOM Walker', '} // ── DOM Walker', text)

with open("extension/content.js", "w") as f:
    f.write(text)

