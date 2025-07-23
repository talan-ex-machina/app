class FrameAnalyzer:
    def __init__(self, face_mesh, pose, hands, face_analyzer, pose_analyzer, hand_analyzer):
        """
        Initialise le FrameAnalyzer avec les modèles MediaPipe et analyzers spécialisés.
        
        Args:
            face_mesh: Instance du modèle MediaPipe FaceMesh
            pose: Instance du modèle MediaPipe Pose
            hands: Instance du modèle MediaPipe Hands
            face_analyzer: Instance de FaceAnalyzer
            pose_analyzer: Instance de PoseAnalyzer
            hand_analyzer: Instance de HandAnalyzer
        """
        self.face_mesh = face_mesh
        self.pose = pose
        self.hands = hands
        self.face_analyzer = face_analyzer
        self.pose_analyzer = pose_analyzer
        self.hand_analyzer = hand_analyzer

    def analyze_frame(self, frame, frame_num, fps):
        """
        Analyse un frame individuel et extrait les informations pertinentes (visage, pose, mains, etc.)

        Args:
            frame: Image du frame à analyser (format compatible MediaPipe)
            frame_num: Numéro du frame dans la vidéo
            fps: Nombre d'images par seconde de la vidéo

        Returns:
            dict: Résultats d'analyse pour ce frame (visage, pose, mains, contact visuel, expressions)
        """
        # Calculer le timestamp du frame dans la vidéo (en secondes)
        timestamp = frame_num / fps if fps > 0 else 0

        # Initialiser la structure de résultats pour ce frame
        frame_results = {
            'frame': frame_num,         # Numéro du frame analysé
            'timestamp': timestamp,     # Temps (en secondes) pour ce frame
            'face': None,               # Résultats d'analyse du visage
            'pose': None,               # Résultats d'analyse de la posture
            'hands': None,              # Résultats d'analyse des mains
            'eye_contact': None,        # Résultat du contact visuel
            'expressions': None         # Résultats des expressions faciales
        }

        # ==== Analyse du visage ====
        # Utilise MediaPipe FaceMesh pour détecter les points du visage
        face_results = self.face_mesh.process(frame)
        if face_results.multi_face_landmarks:
            # Prend le premier visage détecté (si plusieurs)
            face_landmarks = face_results.multi_face_landmarks[0]
            
            # Analyse complète avec FaceAnalyzer - contient TOUT
            face_analysis_complete = self.face_analyzer.analyze(face_landmarks, frame_num, timestamp)
            frame_results['face'] = face_analysis_complete
            
            # Extraire les données spécifiques pour les autres champs
            frame_results['eye_contact'] = {
                'frame': frame_num,
                'timestamp': timestamp,
                'looking_at_camera': face_analysis_complete.get('looking_at_camera', False),
                'eye_direction_x': face_analysis_complete.get('gaze_direction_x', 0),
                'eye_direction_y': face_analysis_complete.get('gaze_direction_y', 0)
            }
            
            frame_results['expressions'] = {
                'frame': frame_num,
                'timestamp': timestamp,
                'is_smiling': face_analysis_complete.get('is_smiling', False),
                'mouth_width': face_analysis_complete.get('mouth_width', 0),
                'mouth_height': face_analysis_complete.get('mouth_height', 0),
                'mouth_curve': face_analysis_complete.get('mouth_curve', 0)
            }

        # ==== Analyse de la posture ====
        # Utilise MediaPipe Pose pour détecter les points du corps
        pose_results = self.pose.process(frame)
        if pose_results.pose_landmarks:
            # Analyse de la posture avec PoseAnalyzer
            frame_results['pose'] = self.pose_analyzer.analyze(pose_results.pose_landmarks, frame_num, timestamp)

        # ==== Analyse des mains ====
        # Utilise MediaPipe Hands pour détecter les mains
        hands_results = self.hands.process(frame)
        if hands_results.multi_hand_landmarks and hands_results.multi_handedness:
            # Analyse des mains avec HandAnalyzer
            frame_results['hands'] = self.hand_analyzer.analyze(
                hands_results.multi_hand_landmarks, 
                hands_results.multi_handedness, 
                frame_num, 
                timestamp
            )

        # Retourne tous les résultats d'analyse pour ce frame
        return frame_results
