import json
import re

d = json.load(open("extension/pronunciation.json"))

# Phonemes in the dictionary
all_phonemes = set()
for v in d.values():
    tokens = v.split()
    for t in tokens:
        # Remove ghost/silent markers and rhotic modifiers
        clean = re.sub(r'^-r', '', t)
        clean = clean.lstrip('.+')
        if clean in ['-', '--', '']:
            continue
        # Remove stress numbers
        phon = re.sub(r'[012]$', '', clean)
        all_phonemes.add(phon)

print("Unique Phonemes in Dictionary:")
print(sorted(list(all_phonemes)))

