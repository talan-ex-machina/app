import cv2
import numpy as np
from MediaPipeAnalyzer import MediaPipeAnalyzer
from face_analyzer import FaceAnalyzer
from pose_analyzer import PoseAnalyzer
from hand_analyzer import HandAnalyzer
from movement_analyzer import MovementAnalyzer
from frame_analyzer import FrameAnalyzer

class VideoAnalyzer:
    """
    Analyseur vidéo principal qui coordonne tous les analyzers spécialisés
    pour une analyse complète des mouvements et expressions.
    """
    
    def __init__(self):
        """Initialise tous les analyzers nécessaires"""
        # Initialiser MediaPipe
        self.mediapipe_analyzer = MediaPipeAnalyzer()
        
        # Initialiser les analyzers spécialisés
        self.face_analyzer = FaceAnalyzer()
        self.pose_analyzer = PoseAnalyzer()
        self.hand_analyzer = HandAnalyzer()
        self.movement_analyzer = MovementAnalyzer()
        
        # Initialiser le FrameAnalyzer avec tous les composants nécessaires
        self.frame_analyzer = FrameAnalyzer(
            self.mediapipe_analyzer.face_mesh,
            self.mediapipe_analyzer.pose,
            self.mediapipe_analyzer.hands,
            self.face_analyzer,
            self.pose_analyzer,
            self.hand_analyzer
        )
        
        print("✅ VideoAnalyzer initialisé avec tous les analyzers (y compris FrameAnalyzer)")
    
    def _analyze_frame(self, frame, frame_num, fps):
        """
        Analyse un frame individuel en utilisant le FrameAnalyzer.
        
        Args:
            frame: Image du frame à analyser (format RGB)
            frame_num: Numéro du frame dans la vidéo
            fps: Nombre d'images par seconde de la vidéo
            
        Returns:
            dict: Résultats d'analyse pour ce frame
        """
        # Déléguer l'analyse au FrameAnalyzer
        return self.frame_analyzer.analyze_frame(frame, frame_num, fps)
    
    def _calculate_movement_metrics(self, results):
        """Délègue le calcul des métriques au MovementAnalyzer"""
        return self.movement_analyzer._calculate_movement_metrics(results)

    def analyze_video(self, video_path, skip_frames=20):
        """Analyse complète des mouvements dans la vidéo"""
        try:
            # Afficher le début de l'analyse avec le nom du fichier vidéo
            print(f"🔄 Analyse des mouvements vidéo : {video_path}")
            
            # Ouvrir la vidéo à analyser avec OpenCV
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                # Si la vidéo ne s'ouvre pas, lever une erreur
                raise IOError("Impossible d'ouvrir la vidéo")
            
            # Récupérer les propriétés principales de la vidéo : fps et nombre de frames
            fps = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            # Initialiser la structure de résultats pour stocker les données analysées
            results = {
                'face_analysis': [],        # Résultats d'analyse du visage
                'pose_analysis': [],        # Résultats d'analyse de la posture
                'hand_analysis': [],        # Résultats d'analyse des mains
                'eye_contact': [],          # Résultats du contact visuel
                'facial_expressions': [],   # Résultats des expressions faciales
                'metadata': {               # Métadonnées sur la vidéo
                    'fps': fps,
                    'total_frames': total_frames,
                    'duration': total_frames / fps if fps > 0 else 0
                }
            }
            
            frame_count = 0         # Compteur de frames lues
            processed_frames = 0    # Compteur de frames effectivement analysées
            
            # Boucle principale : lire les frames une par une
            while cap.isOpened():
                ret, frame = cap.read()    # Lire la prochaine frame
                if not ret:
                    # Si aucune frame n'est lue (fin de vidéo), sortir de la boucle
                    break
                
                # Pour accélérer l'analyse, ne traiter qu'une frame tous les skip_frames
                if frame_count % skip_frames == 0:
                    # Convertir le format d'image de BGR (OpenCV) à RGB (MediaPipe)
                    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    
                    # Appeler la méthode d'analyse sur la frame courante
                    frame_results = self._analyze_frame(rgb_frame, frame_count, fps)
                    
                    # Stocker les résultats de chaque type d'analyse si présents
                    if frame_results['face']:
                        results['face_analysis'].append(frame_results['face'])
                    if frame_results['pose']:
                        results['pose_analysis'].append(frame_results['pose'])
                    if frame_results['hands']:
                        results['hand_analysis'].append(frame_results['hands'])
                    if frame_results['eye_contact'] is not None:
                        results['eye_contact'].append(frame_results['eye_contact'])
                    if frame_results['expressions']:
                        results['facial_expressions'].append(frame_results['expressions'])
                    
                    processed_frames += 1  # Incrémenter le compteur des frames traitées
                    
                    # Afficher la progression de l'analyse tous les 20 frames traitées
                    if processed_frames % 20 == 0:
                        progress = (frame_count / total_frames) * 100
                        print(f"   📊 Progression: {progress:.1f}%")
                
                frame_count += 1    # Incrémenter le compteur de frames lues
            
            # Libérer la ressource vidéo à la fin de l'analyse
            cap.release()
            
            # Calculer les métriques globales des mouvements à partir des résultats
            movement_metrics = self._calculate_movement_metrics(results)
            results['movement_metrics'] = movement_metrics
            
            # Afficher un message de fin et retourner les résultats
            print(f"✅ Analyse vidéo terminée ({processed_frames} frames analysés)")
            return results
            
        except Exception as e:
            # En cas d'erreur, afficher le message et retourner None
            print(f"❌ Erreur d'analyse vidéo : {str(e)}")
            return None


# Fonction utilitaire pour utiliser facilement le VideoAnalyzer
def analyze_video_file(video_path, skip_frames=20, detailed_output=True):
    """
    Fonction utilitaire pour analyser une vidéo facilement.
    
    Args:
        video_path (str): Chemin vers le fichier vidéo
        skip_frames (int): Nombre de frames à ignorer entre chaque analyse
        detailed_output (bool): Afficher les résultats détaillés
        
    Returns:
        dict: Résultats complets de l'analyse ou None en cas d'erreur
    """
    analyzer = VideoAnalyzer()
    results = analyzer.analyze_video(video_path, skip_frames)
    
    if results and detailed_output:
        _afficher_resultats_detailles(results, video_path)
    
    return results

def _afficher_resultats_detailles(results, video_path):
    """Affiche les résultats de l'analyse de manière détaillée"""
    
    print("\n" + "="*60)
    print("🎬 ANALYSE VIDÉO DÉTAILLÉE")
    print("="*60)
    print(f"📂 Fichier: {video_path}")
    
    # === MÉTADONNÉES ===
    print("\n" + "="*60)
    print("📹 MÉTADONNÉES DE LA VIDÉO")
    print("="*60)
    metadata = results['metadata']
    print(f"⏱️  Durée: {metadata['duration']:.1f} secondes")
    print(f"🎞️  FPS: {metadata['fps']:.1f}")
    print(f"📊 Total frames: {metadata['total_frames']}")
    
    # === DÉTECTIONS ===
    print("\n" + "="*60)
    print("🔍 DÉTECTIONS PAR CATÉGORIE")
    print("="*60)
    print(f"👤 Frames avec visage analysé: {len(results['face_analysis'])}")
    print(f"🏃 Frames avec posture analysée: {len(results['pose_analysis'])}")
    print(f"✋ Frames avec mains analysées: {len(results['hand_analysis'])}")
    print(f"👁️  Frames avec contact visuel: {len(results['eye_contact'])}")
    print(f"😊 Frames avec expressions: {len(results['facial_expressions'])}")
    
    # === MÉTRIQUES GLOBALES ===
    if 'movement_metrics' in results:
        print("\n" + "="*60)
        print("📊 MÉTRIQUES COMPORTEMENTALES GLOBALES")
        print("="*60)
        metrics = results['movement_metrics']
        
        if 'eye_contact_percentage' in metrics:
            print(f"👁️  Contact visuel: {metrics['eye_contact_percentage']:.1f}%")
        
        if 'smile_percentage' in metrics:
            print(f"😊 Pourcentage de sourires: {metrics['smile_percentage']:.1f}%")
        
        if 'hands_visible_percentage' in metrics:
            print(f"✋ Mains visibles: {metrics['hands_visible_percentage']:.1f}%")
        
        if 'head_movement' in metrics:
            head = metrics['head_movement']
            print(f"🔄 Variabilité inclinaison tête: {head.get('tilt_variance', 0):.2f}")
            print(f"📐 Inclinaison moyenne: {head.get('average_tilt', 0):.2f}°")
        
        if 'posture_stability' in metrics:
            posture = metrics['posture_stability']
            print(f"🏃 Stabilité épaules: {posture.get('shoulder_stability', 0):.1f}/100")
            print(f"🧍 Stabilité corps: {posture.get('body_stability', 0):.1f}/100")
    
    # === ÉCHANTILLON DE DONNÉES ===
    print("\n" + "="*60)
    print("📋 ÉCHANTILLON DE DONNÉES FRAME PAR FRAME")
    print("="*60)
    
    # Montrer les premiers résultats détaillés
    if results['face_analysis']:
        print("\n🔸 ANALYSE DU VISAGE (5 premiers frames):")
        for i, face in enumerate(results['face_analysis'][:5]):
            print(f"  📍 Frame {face['frame']} ({face['timestamp']:.1f}s):")
            print(f"     • Inclinaison tête: {face.get('head_tilt', 'N/A'):.1f}°")
            print(f"     • Hochement: {face.get('head_nod', 'N/A'):.1f}°")
            print(f"     • Rotation: {face.get('head_turn', 'N/A'):.1f}°")
            if face.get('is_smiling'):
                print(f"     • 😊 SOURIT (intensité: {face.get('expression_intensity', 0):.2f})")
    
    if results['eye_contact']:
        print("\n🔸 CONTACT VISUEL (5 premiers frames):")
        for i, eye in enumerate(results['eye_contact'][:5]):
            status = "👁️  REGARDE" if eye.get('looking_at_camera') else "👁️  DÉTOURNÉ"
            print(f"  📍 Frame {eye['frame']}: {status}")
            print(f"     • Direction X: {eye.get('eye_direction_x', 0):.3f}")
            print(f"     • Direction Y: {eye.get('eye_direction_y', 0):.3f}")
    
    if results['pose_analysis']:
        print("\n🔸 ANALYSE POSTURALE (5 premiers frames):")
        for i, pose in enumerate(results['pose_analysis'][:5]):
            print(f"  📍 Frame {pose['frame']}:")
            print(f"     • Inclinaison épaules: {pose.get('shoulder_tilt', 0):.1f}°")
            print(f"     • Largeur épaules: {pose.get('shoulder_width', 0):.3f}")
    
    if results['hand_analysis']:
        print("\n🔸 ANALYSE DES MAINS (5 premiers frames):")
        for i, hands in enumerate(results['hand_analysis'][:5]):
            print(f"  📍 Frame {hands['frame']}:")
            print(f"     • Mains détectées: {hands.get('hands_detected', 0)}")
            if 'hands_data' in hands and hands['hands_data']:
                for j, hand in enumerate(hands['hands_data']):
                    print(f"     • Main {hand.get('hand', 'Unknown')}: {hand.get('fingers_extended', 0)} doigts - {hand.get('gesture_type', 'Unknown')}")
    
    # === SAUVEGARDE JSON ===
    _sauvegarder_resultats_json(results)

def _sauvegarder_resultats_json(results):
    """Sauvegarde les résultats en JSON"""
    import json
    
    output_file = "resultats_analyse_complete.json"
    
    # Fonction pour convertir les types non-JSON en types compatibles
    def convert_for_json(obj):
        if isinstance(obj, (bool, int, float, str, type(None))):
            return obj
        elif isinstance(obj, dict):
            return {k: convert_for_json(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [convert_for_json(item) for item in obj]
        else:
            return str(obj)  # Convertir tout le reste en string
    
    try:
        # Convertir les résultats pour JSON
        json_compatible_results = convert_for_json(results)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(json_compatible_results, f, indent=2, ensure_ascii=False)
        
        print("\n" + "="*60)
        print("💾 SAUVEGARDE JSON")
        print("="*60)
        print(f"📁 Résultats complets sauvegardés dans: {output_file}")
        
    except Exception as e:
        print("\n" + "="*60)
        print("⚠️  ERREUR DE SAUVEGARDE JSON")
        print("="*60)
        print(f"❌ Impossible de sauvegarder: {e}")
        print("✅ Mais l'analyse est complète et les résultats sont disponibles !")
    
    print("\n" + "="*60)
    print("✅ ANALYSE TERMINÉE AVEC SUCCÈS !")
    print("="*60)


# Exemple d'utilisation
if __name__ == "__main__":
    # Exemple d'utilisation du VideoAnalyzer
    video_path = "test.mp4"  # Remplacer par le chemin de votre vidéo
    
    print("🚀 Démarrage de l'analyse vidéo...")
    results = analyze_video_file(video_path, skip_frames=30)
    
    if results:
        print("\n📈 Résultats de l'analyse :")
        print(f"   Durée vidéo: {results['metadata']['duration']:.1f}s")
        print(f"   Frames analysés: {len(results['face_analysis'])}")
        
        if 'movement_metrics' in results:
            metrics = results['movement_metrics']
            if 'eye_contact_percentage' in metrics:
                print(f"   Contact visuel: {metrics['eye_contact_percentage']:.1f}%")
            if 'smile_percentage' in metrics:
                print(f"   Sourires: {metrics['smile_percentage']:.1f}%")
    else:
        print("❌ Échec de l'analyse vidéo")