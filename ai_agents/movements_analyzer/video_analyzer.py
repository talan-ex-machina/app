import cv2
import numpy as np
from MediaPipeAnalyzer import MediaPipeAnalyzer
from face_analyzer import FaceAnalyzer
from pose_analyzer import PoseAnalyzer
from hand_analyzer import HandAnalyzer
from frame_analyzer import FrameAnalyzer

class VideoAnalyzer:
    """
    Analyseur vidéo principal qui coordonne tous le    print(f"     print(" Métriques temporairement désactivées")
    
    print("\n" + "="*60)
    print(" ANALYSE TERMINÉE AVEC SUCCÈS !")
    print("="*60)

def _sauvegarder_resultats_json(results):avec contact visuel: {len(results['eye_contact'])}")
    print(f" Frames avec expressions: {len(results['facial_expressions'])}")
    
    # === SAUVEGARDE JSON ===pécialisés
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
        
        # Initialiser le FrameAnalyzer avec tous les composants nécessaires
        self.frame_analyzer = FrameAnalyzer(
            self.mediapipe_analyzer.face_mesh,
            self.mediapipe_analyzer.pose,
            self.mediapipe_analyzer.hands,
            self.face_analyzer,
            self.pose_analyzer,
            self.hand_analyzer
        )
        
        print(" VideoAnalyzer initialisé avec tous les analyzers (FrameAnalyzer inclus)")

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

    def _get_raw_landmarks(self, frame):
        """
        Extrait les landmarks bruts de MediaPipe pour l'affichage.
        
        Args:
            frame: Image du frame à analyser (format RGB)
            
        Returns:
            dict: Landmarks bruts pour l'affichage
        """
        landmarks = {
            'face_landmarks': [],
            'hand_landmarks': [],
            'pose_landmarks': []
        }
        
        # Extraire landmarks du visage
        face_results = self.mediapipe_analyzer.face_mesh.process(frame)
        if face_results.multi_face_landmarks:
            h, w = frame.shape[:2]
            for face_landmarks in face_results.multi_face_landmarks:
                landmarks['face_landmarks'] = [
                    (int(lm.x * w), int(lm.y * h)) 
                    for lm in face_landmarks.landmark
                ]
        
        # Extraire landmarks des mains
        hands_results = self.mediapipe_analyzer.hands.process(frame)
        if hands_results.multi_hand_landmarks:
            h, w = frame.shape[:2]
            for hand_landmarks in hands_results.multi_hand_landmarks:
                hand_points = [
                    (int(lm.x * w), int(lm.y * h)) 
                    for lm in hand_landmarks.landmark
                ]
                landmarks['hand_landmarks'].append(hand_points)
        
        # Extraire landmarks de la pose
        pose_results = self.mediapipe_analyzer.pose.process(frame)
        if pose_results.pose_landmarks:
            h, w = frame.shape[:2]
            landmarks['pose_landmarks'] = [
                (int(lm.x * w), int(lm.y * h)) 
                for lm in pose_results.pose_landmarks.landmark
            ]
        
        return landmarks

    def _afficher_resultats_frame(self, frame_results, frame_num):
        """
        Affiche les résultats d'analyse d'une frame en temps réel dans la console.
        
        Args:
            frame_results: Résultats d'analyse pour cette frame
            frame_num: Numéro de la frame
        """
        print(f"\n FRAME {frame_num} ({frame_results['timestamp']:.1f}s)")
        print("─" * 40)
        
        # Afficher les résultats du visage
        if frame_results['face']:
            face = frame_results['face']
            print(f" VISAGE:")
            print(f"  • Inclinaison: {face.get('head_tilt', 0):.1f}°")
            print(f"  • Hochement: {face.get('head_nod', 0):.1f}°")
            print(f"  • Rotation: {face.get('head_turn', 0):.1f}°")
            if face.get('is_smiling'):
                print(f"   •  SOURIT (intensité: {face.get('expression_intensity', 0):.2f})")
            else:
                print(f"   •  Pas de sourire")
        else:
            print(" VISAGE:  Non détecté")
        
        # Afficher les résultats du contact visuel
        if frame_results['eye_contact']:
            eye = frame_results['eye_contact']
            status = " REGARDE" if eye.get('looking_at_camera') else "👁️ DÉTOURNÉ"
            print(f"  REGARD: {status}")
            print(f"   • Direction X: {eye.get('eye_direction_x', 0):.3f}")
            print(f"   • Direction Y: {eye.get('eye_direction_y', 0):.3f}")
        else:
            print(" REGARD:  Non analysé")
        
        # Afficher les résultats de la posture
        if frame_results['pose']:
            pose = frame_results['pose']
            print(f" POSTURE:")
            print(f"   • Inclinaison épaules: {pose.get('shoulder_tilt', 0):.1f}°")
            print(f"   • Largeur épaules: {pose.get('shoulder_width', 0):.3f}")
        else:
            print(" POSTURE:  Non détectée")
        
        # Afficher les résultats des mains
        if frame_results['hands']:
            hands = frame_results['hands']
            print(f" MAINS: {hands.get('hands_detected', 0)} détectée(s)")
            if 'hands_data' in hands and hands['hands_data']:
                for i, hand in enumerate(hands['hands_data']):
                    print(f"   • Main {hand.get('hand', 'Unknown')}: {hand.get('fingers_extended', 0)} doigts - {hand.get('gesture_type', 'Unknown')}")
        else:
            print(" MAINS:  Non détectées")

    def _draw_landmarks(self, frame, landmarks):
        """
        Dessine les landmarks détectés sur le frame vidéo.
        Adapte ce code selon la structure de landmarks.
        """
        # Dessin landmarks visage
        if 'face_landmarks' in landmarks and landmarks['face_landmarks']:
            for pt in landmarks['face_landmarks']:
                x, y = int(pt[0]), int(pt[1])
                cv2.circle(frame, (x, y), 2, (0, 255, 0), -1)
        # Dessin landmarks mains
        if 'hand_landmarks' in landmarks and landmarks['hand_landmarks']:
            for hand in landmarks['hand_landmarks']:
                for pt in hand:
                    x, y = int(pt[0]), int(pt[1])
                    cv2.circle(frame, (x, y), 2, (255, 0, 0), -1)
        # Dessin landmarks pose (corps)
        if 'pose_landmarks' in landmarks and landmarks['pose_landmarks']:
            for pt in landmarks['pose_landmarks']:
                x, y = int(pt[0]), int(pt[1])
                cv2.circle(frame, (x, y), 2, (0, 0, 255), -1)
        return frame

    def analyze_video(self, video_path, skip_frames=20, show_landmarks=False, show_frame_details=False):
        """Analyse complète des mouvements dans la vidéo"""
        try:
            # Afficher le début de l'analyse avec le nom du fichier vidéo
            print(f" Analyse des mouvements vidéo : {video_path}")
            
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
                # Si skip_frames=0, analyser toutes les frames
                if skip_frames == 0 or frame_count % skip_frames == 0:
                    # Convertir le format d'image de BGR (OpenCV) à RGB (MediaPipe)
                    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    
                    # Appeler la méthode d'analyse sur la frame courante
                    frame_results = self._analyze_frame(rgb_frame, frame_count, fps)
                    
                    # Afficher les résultats de cette frame en temps réel si demandé
                    if show_frame_details:
                        self._afficher_resultats_frame(frame_results, frame_count)
                    
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
                    
                    # Affichage vidéo + landmarks si demandé
                    if show_landmarks:
                        # Obtenir les landmarks bruts pour l'affichage
                        raw_landmarks = self._get_raw_landmarks(rgb_frame)
                        # Dessiner les landmarks sur le frame
                        frame_annotated = self._draw_landmarks(frame.copy(), raw_landmarks)
                        cv2.imshow("Analyse Vidéo - Landmarks", frame_annotated)
                        # Quitter en appuyant sur 'q'
                        if cv2.waitKey(1) & 0xFF == ord('q'):
                            break
                    
                    # Afficher la progression de l'analyse tous les 20 frames traitées
                    if processed_frames % 20 == 0:
                        progress = (frame_count / total_frames) * 100
                        print(f"    Progression: {progress:.1f}%")
                
                frame_count += 1    # Incrémenter le compteur de frames lues
            
            # Libérer la ressource vidéo à la fin de l'analyse
            cap.release()
            if show_landmarks:
                cv2.destroyAllWindows()
            
            # Afficher un message de fin et retourner les résultats
            print(f" Analyse vidéo terminée ({processed_frames} frames analysés)")
            return results
            
        except Exception as e:
            # En cas d'erreur, afficher le message et retourner None
            print(f" Erreur d'analyse vidéo : {str(e)}")
            if show_landmarks:
                cv2.destroyAllWindows()
            return None


# Fonction utilitaire pour utiliser facilement le VideoAnalyzer
def analyze_video_file(video_path, skip_frames=0, detailed_output=True, show_landmarks=False, show_frame_details=False, output_folder=None):
    """
    Fonction utilitaire pour analyser une vidéo facilement.
    
    Args:
        video_path (str): Chemin vers le fichier vidéo
        skip_frames (int): Nombre de frames à ignorer entre chaque analyse
        detailed_output (bool): Afficher les résultats détaillés
        show_landmarks (bool): Afficher la vidéo avec landmarks en temps réel
        show_frame_details (bool): Afficher les détails de chaque frame dans la console
        output_folder (str): Dossier de sortie pour les fichiers JSON (optionnel)
        
    Returns:
        dict: Résultats complets de l'analyse ou None en cas d'erreur
    """
    analyzer = VideoAnalyzer()
    results = analyzer.analyze_video(video_path, skip_frames, show_landmarks, show_frame_details)
    
    # Toujours sauvegarder les résultats, même en mode silencieux
    if results:
        _sauvegarder_resultats_json(results, output_folder)
    
    # Afficher le rapport détaillé seulement si demandé
    if results and detailed_output:
        _afficher_resultats_detailles(results, video_path)
    
    return results



def _afficher_resultats_detailles(results, video_path):
    """Affiche les résultats de l'analyse de manière détaillée"""
    
    print("\n" + "="*60)
    print(" ANALYSE VIDÉO DÉTAILLÉE")
    print("="*60)
    print(f" Fichier: {video_path}")
    
    # === MÉTADONNÉES ===
    print("\n" + "="*60)
    print(" MÉTADONNÉES DE LA VIDÉO")
    print("="*60)
    metadata = results['metadata']
    print(f" Durée: {metadata['duration']:.1f} secondes")
    print(f"  FPS: {metadata['fps']:.1f}")
    print(f" Total frames: {metadata['total_frames']}")
    
    # === DÉTECTIONS ===
    print("\n" + "="*60)
    print(" DÉTECTIONS PAR CATÉGORIE")
    print("="*60)
    print(f" Frames avec visage analysé: {len(results['face_analysis'])}")
    print(f" Frames avec posture analysée: {len(results['pose_analysis'])}")
    print(f" Frames avec mains analysées: {len(results['hand_analysis'])}")
    print(f"  Frames avec contact visuel: {len(results['eye_contact'])}")
    print(f" Frames avec expressions: {len(results['facial_expressions'])}")
 

 
    # === SAUVEGARDE JSON ===
    _sauvegarder_resultats_json(results)

def _sauvegarder_resultats_json(results, output_folder=None):
    """Sauvegarde les résultats en JSON avec horodatage"""
    import json
    import datetime
    import os
    
    # Créer un nom de fichier avec horodatage
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"resultats_analyse_{timestamp}.json"
    
    # Déterminer le chemin complet
    if output_folder:
        output_file = os.path.join(output_folder, filename)
    else:
        output_file = filename
    
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
        print(" SAUVEGARDE JSON")
        print("="*60)
        print(f" Résultats complets sauvegardés dans: {output_file}")
        
    except Exception as e:
        print("\n" + "="*60)
        print("  ERREUR DE SAUVEGARDE JSON")
        print("="*60)
        print(f" Impossible de sauvegarder: {e}")
        print(" Mais l'analyse est complète et les résultats sont disponibles !")
    
    print("\n" + "="*60)
    print(" ANALYSE TERMINÉE AVEC SUCCÈS !")
    print("="*60)


# Exemple d'utilisation
if __name__ == "__main__":
    # Interface utilisateur interactive
    print(" ANALYSEUR VIDÉO INTERACTIF")
    print("="*50)
    
    # Demander le chemin de la vidéo
    print("\n SÉLECTION DE LA VIDÉO")
    video_path = input("Entrez le chemin de votre vidéo (ou appuyez sur Entrée pour 'test.mp4'): ").strip()
    if not video_path:
        video_path = "test.mp4"
    
    # Vérifier si le fichier existe
    import os
    if not os.path.exists(video_path):
        print(f" Erreur : Le fichier '{video_path}' n'existe pas.")
        print(" Fichiers vidéo disponibles dans le dossier actuel :")
        for file in os.listdir("."):
            if file.endswith(('.mp4', '.avi', '.mov', '.mkv', '.wmv')):
                print(f"   - {file}")
        exit()
    
    # Demander le nombre de frames à ignorer
    print("\n⚡ CONFIGURATION DE L'ANALYSE")
    print(" skip_frames = 0 : analyser toutes les frames (plus lent mais plus précis)")
    print(" skip_frames = 10 : analyser 1 frame sur 10 (plus rapide)")
    print(" skip_frames = 30 : analyser 1 frame sur 30 (très rapide)")
    
    skip_input = input("Entrez le nombre de frames à ignorer (ou appuyez sur Entrée pour 10): ").strip()
    if skip_input.isdigit():
        skip_frames = int(skip_input)
    else:
        skip_frames = 10
    
    # Demander l'affichage de la vidéo
    print("\n AFFICHAGE VIDÉO")
    show_video = input("Voulez-vous voir la vidéo avec landmarks pendant l'analyse ? (o/n, défaut: n): ").strip().lower()
    show_landmarks = show_video.startswith('o') or show_video.startswith('y')
    
    # Demander l'affichage détaillé
    print("\n RAPPORT DÉTAILLÉ")
    detailed = input("Voulez-vous un rapport détaillé ? (o/n, défaut: o): ").strip().lower()
    detailed_output = not (detailed.startswith('n'))
    
    # Demander l'affichage frame par frame
    print("\n AFFICHAGE FRAME PAR FRAME")
    frame_details = input("Voulez-vous voir les détails de chaque frame en temps réel dans la console ? (o/n, défaut: n): ").strip().lower()
    show_frame_details = frame_details.startswith('o') or frame_details.startswith('y')
    
    # Afficher la configuration
    print("\n" + "="*50)
    print(" CONFIGURATION DE L'ANALYSE")
    
    print("="*50)
    print(f" Vidéo : {video_path}")
    
    print(f" Skip frames : {skip_frames}")
    print(f" Affichage vidéo : {' Oui' if show_landmarks else ' Non'}")
    print(f" Rapport détaillé : {' Oui' if detailed_output else ' Non'}")
    print(f" Détails frame par frame : {' Oui' if show_frame_details else ' Non'}")
    
    if show_landmarks:
        print("\n CONTRÔLES VIDÉO :")
        print("   - Appuyez sur 'q' pour arrêter l'analyse")
        print("   - La fenêtre s'appellera 'Analyse Vidéo - Landmarks'")
    
    if show_frame_details:
        print("\n AFFICHAGE CONSOLE :")
        print("   - Chaque frame analysée sera affichée en détail")
        print("   - Cela peut ralentir l'affichage si vous analysez beaucoup de frames")
    
    input("\nAppuyez sur Entrée pour commencer l'analyse...")
    
    print("\n Démarrage de l'analyse vidéo...")
    results = analyze_video_file(video_path, skip_frames, detailed_output, show_landmarks, show_frame_details)
    
    if results:
        print("\n Résultats de l'analyse :")
        print(f"   Durée vidéo: {results['metadata']['duration']:.1f}s")
        print(f"   Frames analysés: {len(results['face_analysis'])}")
    else:
        print(" Échec de l'analyse vidéo")