import json
from pathlib import Path

def summarize():
    detect_path = Path('graphify-out/.graphify_detect.json')
    detect = json.loads(detect_path.read_text(encoding='utf-16'))
    for cat, files in detect['files'].items():
        print(f"{cat}: {len(files)}")
    print(f"total: {detect['total_files']}")

if __name__ == "__main__":
    summarize()
