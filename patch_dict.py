import json

dict_path = "extension/pronunciation.json"
with open(dict_path, 'r') as f:
    d = json.load(f)

patches = {
    "optimization": "AA1 P .T IH .M AX .Z EY1 .SH AX AX N",
    "optimizations": "AA1 P .T IH .M AX .Z EY1 .SH AX AX N Z",
    "recomposition": "R IY2 .K AA0 M .P AX .Z IH1 .SH AX AX N",
    "recompositions": "R IY2 .K AA0 M .P AX .Z IH1 .SH AX AX N Z",
    "stylizer": "S T AY1 .L AY0 .Z ER -rER",
    "stylizers": "S T AY1 .L AY0 .Z ER -rER Z",
    "chatgpt": "CH AE1 T .JH IY .P IY .T IY",
    "claude": "K L AO1 D -",
    "openai": "OW1 P EH N .EY1 AY",
    "youtube": "Y UW1 .T UW B -",
    "tiktok": "T IH1 K .T AA0 K",
    "increment": "IH1 N K R AH0 M EH0 N T",
    "increments": "IH1 N K R AH0 M EH0 N T S",
    "incremental": "IH1 N K R AH0 M EH1 N T AH0 L",
    "incrementally": "IH1 N K R AH0 M EH1 N T AH0 L - IY0",
    "incrementing": "IH1 N K R AH0 M EH0 N T IH0 NG -",
    "incremented": "IH1 N K R AH0 M EH0 N T IH0 D",
}

d.update(patches)

with open(dict_path, 'w') as f:
    json.dump(d, f, separators=(',', ':'))

print("Dictionary patched.")
