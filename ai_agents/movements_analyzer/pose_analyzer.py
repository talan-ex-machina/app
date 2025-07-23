import numpy as np

class PoseAnalyzer:
    """
    Classe utilitaire pour l'analyse de la posture du haut du corps (épaules, cou, tête)
    à partir des landmarks MediaPipe.
    """

    def analyze(self, pose_landmarks, frame_num, timestamp):
        """
        Analyse la posture du haut du corps pour un frame.

        Args:
            pose_landmarks: Résultat MediaPipe contenant les landmarks du corps.
            frame_num: Numéro du frame.
            timestamp: Timestamp du frame (en secondes).

        Returns:
            dict: Résultats d'analyse de la posture du haut du corps pour ce frame.
        """
        # Extraction des coordonnées (x, y, z) de chaque landmark
        landmarks = [(lm.x, lm.y, lm.z) for lm in pose_landmarks.landmark]
        
        # Points clés du haut du corps
        left_shoulder = landmarks[11]
        right_shoulder = landmarks[12]
        nose = landmarks[0]              # Pointe du nez
        left_ear = landmarks[7]          # Oreille gauche
        right_ear = landmarks[8]         # Oreille droite

        # Calcul de l'inclinaison des épaules ("tilt" en degrés)
        shoulder_tilt = np.arctan2(
            right_shoulder[1] - left_shoulder[1], 
            right_shoulder[0] - left_shoulder[0]
        ) * 180 / np.pi

        # Calcul du centre des épaules (point milieu)
        shoulder_center = (
            (left_shoulder[0] + right_shoulder[0]) / 2,
            (left_shoulder[1] + right_shoulder[1]) / 2
        )

        # Calcul de l'inclinaison latérale de la tête (par rapport au centre des épaules)
        head_tilt = np.arctan2(
            nose[1] - shoulder_center[1], 
            nose[0] - shoulder_center[0]
        ) * 180 / np.pi

        # Calcul de la largeur des épaules (distance euclidienne 2D)
        shoulder_width = np.sqrt(
            (left_shoulder[0] - right_shoulder[0])**2 +
            (left_shoulder[1] - right_shoulder[1])**2
        )

        # Construction du dictionnaire de résultats
        return {
            'frame': frame_num,                  # Numéro du frame analysé
            'timestamp': timestamp,              # Timestamp du frame
            'shoulder_tilt': shoulder_tilt,      # Inclinaison des épaules (°)
            'head_tilt': head_tilt,              # Inclinaison latérale de la tête (°)
            'shoulder_width': shoulder_width,    # Largeur des épaules (unité normalisée)
            'upper_body_confidence': 1.0         # Score de confiance (fixé à 1 ici)
        }