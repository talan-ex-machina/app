import numpy as np

class HandAnalyzer:
    """
    Classe utilitaire pour l'analyse des mouvements et gestes de la main
    à partir des landmarks MediaPipe.
    """

    def analyze(self, hand_landmarks_list, handedness_list, frame_num, timestamp):
        """
        Analyse détaillée des mouvements de mains pour un frame.

        Args:
            hand_landmarks_list: Liste des landmarks MediaPipe pour chaque main détectée.
            handedness_list: Liste des informations de latéralité ("Left"/"Right") pour chaque main.
            frame_num: Numéro du frame analysé.
            timestamp: Timestamp du frame (en secondes).

        Returns:
            dict: Résultats d'analyse des mains pour ce frame.
        """
        hands_data = []

        # Boucle sur toutes les mains détectées et analyse chaque main séparément
        for hand_landmarks, handedness in zip(hand_landmarks_list, handedness_list):
            hand_label = handedness.classification[0].label  # "Left" ou "Right"
            landmarks = [(lm.x, lm.y, lm.z) for lm in hand_landmarks.landmark]  # Coordonnées (x, y, z) de chaque landmark

            # Récupération des coordonnées séparément pour calculs statistiques
            x_coords = [lm[0] for lm in landmarks]
            y_coords = [lm[1] for lm in landmarks]
            z_coords = [lm[2] for lm in landmarks]

            # Calcul de l'activité (dispersion des points) et de l'étalement de la main dans l'image
            hand_activity = np.std(x_coords) + np.std(y_coords)
            hand_spread = max(x_coords) - min(x_coords) + max(y_coords) - min(y_coords)

            # Points clés (utile pour analyses avancées, pas utilisé ici mais peut servir)
            wrist = landmarks[0]
            thumb_tip = landmarks[4]
            index_tip = landmarks[8]
            middle_tip = landmarks[12]
            ring_tip = landmarks[16]
            pinky_tip = landmarks[20]

            # Analyse du nombre de doigts étendus
            fingers_extended = self._count_extended_fingers(landmarks)
            # Calcul de l'ouverture de la main (distance entre pouce et auriculaire)
            hand_openness = self._calculate_hand_openness(landmarks)
            # Détermination de la zone où se situe la main dans l'image
            comfort_zone = self._analyze_hand_position_zone(np.mean(x_coords), np.mean(y_coords))

            # Ajout des résultats de cette main dans la liste
            hands_data.append({
                'hand': hand_label,                          # Latéralité ("Left" ou "Right")
                'activity_level': hand_activity,             # Niveau de mouvement
                'hand_spread': hand_spread,                  # Amplitude de la main
                'center_x': np.mean(x_coords),               # Position centrale X
                'center_y': np.mean(y_coords),               # Position centrale Y
                'center_z': np.mean(z_coords),               # Position centrale Z
                'landmarks_count': len(landmarks),           # Nombre de points détectés
                'fingers_extended': fingers_extended,        # Nombre de doigts étendus
                'hand_openness': hand_openness,              # Ouverture entre pouce et auriculaire
                'comfort_zone': comfort_zone,                # Zone de la main dans l'image
                'gesture_type': self._classify_hand_gesture(fingers_extended, hand_openness, hand_spread) # Type de geste
            })

        # Construction du résultat global pour le frame
        return {
            'frame': frame_num,                        # Numéro du frame
            'timestamp': timestamp,                    # Temps (en secondes)
            'hands_detected': len(hands_data),         # Nombre de mains détectées
            'hands_data': hands_data,                  # Liste détaillée pour chaque main
            'both_hands_visible': len(hands_data) == 2,# True si deux mains sont visibles
            'gesture_coordination': self._analyze_gesture_coordination(hands_data) # Coordination des gestes entre mains
        }

    @staticmethod
    def _count_extended_fingers(landmarks):
        """
        Compte le nombre de doigts étendus.
        Méthode : le bout du doigt (tip) est plus haut (plus petit en y) que le point MCP (base du doigt).
        """
        finger_tips = [4, 8, 12, 16, 20]
        finger_mcp = [3, 6, 10, 14, 18]
        extended = 0
        for tip, mcp in zip(finger_tips, finger_mcp):
            if landmarks[tip][1] < landmarks[mcp][1]:  # Si le bout du doigt est plus haut que la base
                extended += 1
        return extended

    @staticmethod
    def _calculate_hand_openness(landmarks):
        """
        Calcule l'ouverture de la main (distance euclidienne entre le pouce et l'auriculaire).
        """
        thumb_tip = landmarks[4]
        pinky_tip = landmarks[20]
        span = np.sqrt((thumb_tip[0] - pinky_tip[0]) ** 2 + (thumb_tip[1] - pinky_tip[1]) ** 2)
        return span

    @staticmethod
    def _analyze_hand_position_zone(x, y):
        """
        Détermine la zone où se situe la main dans l'image.
        Zones: comfort_zone, above_head, below_waist, far_left, far_right, extended_zone.
        """
        if 0.3 <= x <= 0.7 and 0.4 <= y <= 0.8:
            return "comfort_zone"
        elif y < 0.3:
            return "above_head"
        elif y > 0.9:
            return "below_waist"
        elif x < 0.2:
            return "far_left"
        elif x > 0.8:
            return "far_right"
        else:
            return "extended_zone"

    @staticmethod
    def _classify_hand_gesture(fingers_extended, hand_openness, hand_spread):
        """
        Détermine le type de geste en fonction des doigts étendus, de l'ouverture et de l'étalement.
        """
        if fingers_extended == 0:
            return "fist"                  # Poing fermé
        elif fingers_extended == 5 and hand_openness > 0.15:
            return "open_palm"             # Paume ouverte
        elif fingers_extended == 1:
            return "pointing"              # Un doigt pointé
        elif fingers_extended == 2:
            return "peace_or_two"          # Signe de paix ou deux doigts
        elif hand_spread > 0.2:
            return "expressive_gesture"    # Geste expressif (main très écartée)
        else:
            return "partial_gesture"       # Autre geste (partiel)

    @staticmethod
    def _analyze_gesture_coordination(hands_data):
        """
        Analyse la coordination des gestes entre les deux mains.
        - synchronized : les deux mains font le même geste
        - independent : gestes différents
        - single_hand : une seule main visible
        - no_hand : aucune main détectée
        """
        if len(hands_data) == 2:
            if hands_data[0]['gesture_type'] == hands_data[1]['gesture_type']:
                return "synchronized"
            else:
                return "independent"
        elif len(hands_data) == 1:
            return "single_hand"
        else:
            return "no_hand"