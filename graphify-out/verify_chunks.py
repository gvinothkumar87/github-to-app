import json
from pathlib import Path

def verify():
    chunks = json.load(open('graphify-out/.graphify_chunks.json'))
    for i, c in enumerate(chunks):
        types = set(t for f, t in c)
        print(f"Chunk {i+1}: {len(c)} files, types: {types}")
        if 'image' in types:
            print(f"  Image: {c[0][0]}")

if __name__ == "__main__":
    verify()
