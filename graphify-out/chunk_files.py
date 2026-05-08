import json
from pathlib import Path

def chunk_files():
    detect_path = Path('graphify-out/.graphify_detect.json')
    detect = json.loads(detect_path.read_text(encoding='utf-16'))
    
    chunks = []
    current_chunk = []
    
    ignored_dirs = [
        'dist-electron', 'dist-electron_installer', 'dist-mobile', 'android\\app\\src\\main\\assets\\public', 'node_modules', '.git'
    ]
    
    def is_ignored(f):
        rel_path = str(Path(f).relative_to(Path('.').absolute()))
        for d in ignored_dirs:
            if rel_path.startswith(d):
                return True
        if rel_path.endswith('LICENSES.chromium.html'):
            return True
        return False

    # 1. Code files
    for f in detect['files'].get('code', []):
        if is_ignored(f): continue
        rel_path = str(Path(f).relative_to(Path('.').absolute()))
        current_chunk.append((rel_path, 'code'))
        if len(current_chunk) >= 25:
            chunks.append(current_chunk)
            current_chunk = []
    if current_chunk:
        chunks.append(current_chunk)
        current_chunk = []
        
    # 2. Documents
    for f in detect['files'].get('document', []):
        if is_ignored(f): continue
        rel_path = str(Path(f).relative_to(Path('.').absolute()))
        current_chunk.append((rel_path, 'document'))
    if current_chunk:
        chunks.append(current_chunk)
        current_chunk = []
        
    # 3. Images
    relevant_images = []
    for f in detect['files'].get('image', []):
        if is_ignored(f): continue
        rel_path = str(Path(f).relative_to(Path('.').absolute()))
        if 'android\\app\\src\\main\\res' in rel_path:
            continue 
        relevant_images.append(rel_path)
        
    for f in relevant_images:
        chunks.append([(f, 'image')])
        
    print(f"Total chunks: {len(chunks)}")
    # Print total files in chunks
    total_in_chunks = sum(len(c) for c in chunks)
    print(f"Total files in chunks: {total_in_chunks}")
    
    Path('graphify-out/.graphify_chunks.json').write_text(json.dumps(chunks, indent=2))

if __name__ == "__main__":
    chunk_files()
