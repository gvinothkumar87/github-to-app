import sys
import json
from graphify.extract import collect_files, extract
from pathlib import Path

def run():
    code_files = []
    detect_path = Path('graphify-out/.graphify_detect.json')
    if not detect_path.exists():
        print("Detection file not found")
        return
        
    detect = json.loads(detect_path.read_text(encoding='utf-16'))
    for f in detect.get('files', {}).get('code', []):
        path = Path(f)
        if path.is_dir():
            code_files.extend(collect_files(path))
        else:
            code_files.append(path)
            
    if code_files:
        print(f"Extracting AST from {len(code_files)} files...")
        result = extract(code_files, cache_root=Path('.'))
        Path('graphify-out/.graphify_ast.json').write_text(json.dumps(result, indent=2))
        print(f"AST: {len(result['nodes'])} nodes, {len(result['edges'])} edges")
    else:
        Path('graphify-out/.graphify_ast.json').write_text(json.dumps({'nodes':[],'edges':[],'input_tokens':0,'output_tokens':0}))
        print("No code files - skipping AST extraction")

if __name__ == "__main__":
    run()
