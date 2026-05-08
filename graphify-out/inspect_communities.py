import json
from pathlib import Path

def label_communities():
    analysis_path = Path('graphify-out/.graphify_analysis.json')
    ast_path = Path('graphify-out/.graphify_ast.json')
    
    if not analysis_path.exists() or not ast_path.exists():
        print("Required files missing")
        return
        
    analysis = json.loads(analysis_path.read_text())
    extraction = json.loads(ast_path.read_text())
    
    id_to_label = {n['id']: n['label'] for n in extraction['nodes']}
    
    labels = {}
    for cid, nodes in analysis['communities'].items():
        node_labels = [id_to_label.get(nid, nid) for nid in nodes[:10]]
        # Heuristic labeling or just print for manual labeling
        # For now, I'll print and then I'll write a dict in the next step
        print(f"Community {cid}: {', '.join(node_labels[:5])}")

if __name__ == "__main__":
    label_communities()
