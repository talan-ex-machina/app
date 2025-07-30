import json
import numpy as np
from collections import Counter

def safe_bool(val):
    """Convertit en booléen si possible"""
    if isinstance(val, bool):
        return val
    if isinstance(val, str):
        return val.lower() == "true"
    return False

def summary_for_block(frames):
    summary = {}
    # Collecte les clés présentes
    keys = set()
    for frame in frames:
        keys |= set(frame.keys())
    for key in keys:
        # Ignore les sous-dictionnaires
        if isinstance(frames[0].get(key), dict):
            # Pour face_center par exemple, moyenner chaque coordonnée
            coords = [frame[key] for frame in frames if key in frame and isinstance(frame[key], dict)]
            if coords:
                coord_keys = coords[0].keys()
                summary[key] = {ck: float(np.mean([c[ck] for c in coords if ck in c])) for ck in coord_keys}
            continue
        # Numérique
        values_num = [frame[key] for frame in frames if isinstance(frame.get(key), (int, float))]
        if values_num:
            summary[key] = float(np.mean(values_num))
            continue
        # Booléen
        values_bool = [safe_bool(frame.get(key)) for frame in frames if frame.get(key) is not None and (isinstance(frame.get(key), bool) or (isinstance(frame.get(key), str) and frame.get(key).lower() in ["true","false"]))]
        if values_bool:
            pct_true = float(sum(values_bool) / len(values_bool) * 100)
            summary[key] = f"{pct_true:.0f}%true"
            continue
        # Catégoriel
        values_str = [frame.get(key) for frame in frames if isinstance(frame.get(key), str) and frame.get(key).lower() not in ["true","false"]]
        if values_str:
            total = len(values_str)
            counts = Counter(values_str)
            # Format style "20%category / 80%other"
            summary[key] = " / ".join([f"{(counts[c]/total*100):.0f}%{c}" for c in counts])
    return summary

def main(json_path, output_path):
    with open(json_path, "r") as f:
        data = json.load(f)

    result = {}
    
    print("DIVISION EN 5 GROUPES DES FRAMES ANALYSEES:")
    print("=" * 50)
    
    # Pour chaque bloc, diviser en 5 groupes
    for key in ["face_analysis", "pose_analysis", "hand_analysis", "eye_contact", "facial_expressions"]:
        frames = data.get(key, [])
        
        # Pour hand_analysis, viser hands_data si présent
        if key == "hand_analysis":
            hands_data_all = []
            for hand in frames:
                if hand.get("hands_data"):
                    hands_data_all.extend(hand["hands_data"])
            frames = hands_data_all if hands_data_all else frames
        
        if frames:
            total_frames = len(frames)
            group_size = total_frames // 5
            remainder = total_frames % 5
            
            if total_frames >= 5:
                result[key] = []
                
                # Créer 5 groupes
                for i in range(5):
                    start_idx = i * group_size
                    # Pour les derniers groupes, ajouter les frames restantes
                    if i == 4:  # Dernier groupe
                        end_idx = total_frames
                    else:
                        end_idx = (i + 1) * group_size
                    
                    group_frames = frames[start_idx:end_idx]
                    group_summary = summary_for_block(group_frames)
                    
                    result[key].append({
                        "groupe": f"Groupe_{i+1}",
                        "range": f"frames_{start_idx}-{end_idx-1}",
                        "frames_count": len(group_frames),
                        **group_summary
                    })
                    
                    print(f"{key} - Groupe {i+1}: frames {start_idx}-{end_idx-1} ({len(group_frames)} frames)")
                
            else:
                # Moins de 5 frames, garder tout ensemble
                result[key] = [{
                    "groupe": "Groupe_Unique",
                    "range": f"frames_0-{total_frames-1}",
                    "frames_count": total_frames,
                    **summary_for_block(frames)
                }]
                print(f"{key}: {total_frames} frames (trop peu pour diviser en 5)")
        else:
            result[key] = []
            print(f"{key}: 0 frames")

    # Copie metadata tel quel
    if "metadata" in data:
        result["metadata"] = data["metadata"]
        result["metadata"]["processing_method"] = "division_5_groupes"

    # Créer un nom de fichier avec horodatage si pas spécifié
    if output_path == "resume_structure.json":
        import datetime
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = f"resume_structure_{timestamp}.json"

    with open(output_path, "w") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    
    print(f"\nResume sauvegarde dans: {output_path}")
    print("=" * 50)

if __name__ == "__main__":
    import glob
    import os
    
    # Chercher le fichier d'analyse le plus récent
    analysis_files = glob.glob("resultats_analyse_*.json")
    if analysis_files:
        # Prendre le plus récent
        latest_file = max(analysis_files, key=os.path.getctime)
        print(f" Utilisation du fichier d'analyse: {latest_file}")
    else:
        latest_file = "resultats_analyse_complete.json"
        print(f" Fichier par défaut: {latest_file}")
    
    main(latest_file, "resume_structure.json")