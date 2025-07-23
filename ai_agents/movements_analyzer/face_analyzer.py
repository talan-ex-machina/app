import numpy as np

class FaceAnalyzer:
    """
    Analyse complète du visage : orientation, contact visuel, symétrie, distance yeux, expression faciale (sourire, froncement, surprise, etc.).
    """

    def analyze(self, face_landmarks, frame_num, timestamp):
        """
        Analyse toutes les métriques du visage pour un frame.

        Args:
            face_landmarks: Les landmarks MediaPipe du visage détecté.
            frame_num: Numéro du frame.
            timestamp: Timestamp du frame (en secondes).

        Returns:
            dict: Toutes les métriques extraites du visage et des expressions.
        """
        # Récupère tous les points du visage détectés
        landmarks = [(lm.x, lm.y, lm.z) for lm in face_landmarks.landmark]

        # ---------- Points clés pour le visage ----------
        nose_tip = landmarks[1]
        chin = landmarks[175]
        left_ear = landmarks[234]
        right_ear = landmarks[454]
        forehead = landmarks[10]

        # ---------- Points clés pour les yeux ----------
        left_eye_center = landmarks[468]
        right_eye_center = landmarks[473]
        left_eye_inner = landmarks[133]
        left_eye_outer = landmarks[33]
        right_eye_inner = landmarks[362]
        right_eye_outer = landmarks[263]

        # ---------- Orientation de la tête ----------
        head_tilt = np.arctan2(right_ear[1] - left_ear[1], right_ear[0] - left_ear[0]) * 180 / np.pi
        head_nod = np.arctan2(chin[1] - nose_tip[1], chin[2] - nose_tip[2]) * 180 / np.pi
        head_turn = np.arctan2(nose_tip[0] - 0.5, nose_tip[2]) * 180 / np.pi

        # ---------- Symétrie faciale ----------
        left_cheek = landmarks[116]
        right_cheek = landmarks[345]
        facial_symmetry = abs(left_cheek[0] - 0.5) - abs(right_cheek[0] - 0.5)

        # ---------- Distance entre les coins extérieurs des yeux ----------
        eye_distance = np.sqrt(
            (left_eye_outer[0] - right_eye_outer[0])**2 +
            (left_eye_outer[1] - right_eye_outer[1])**2
        )

        # ---------- Contact visuel ----------
        eye_level = (left_eye_center[1] + right_eye_center[1]) / 2
        eye_center_x = (left_eye_center[0] + right_eye_center[0]) / 2
        left_eye_height = abs(landmarks[145][1] - landmarks[159][1])
        right_eye_height = abs(landmarks[374][1] - landmarks[386][1])
        eye_openness = (left_eye_height + right_eye_height) / 2

        gaze_x = eye_center_x - 0.5
        gaze_y = eye_level - 0.4
        gaze_distance = np.sqrt(gaze_x**2 + gaze_y**2)

        excellent_contact = gaze_distance < 0.05
        good_contact = gaze_distance < 0.1
        acceptable_contact = gaze_distance < 0.15

        # ---------- Expression faciale ----------
        # Points clés de la bouche
        mouth_left = landmarks[61]
        mouth_right = landmarks[291]
        mouth_top = landmarks[13]
        mouth_bottom = landmarks[14]
        upper_lip = landmarks[12]
        lower_lip = landmarks[15]

        # Points des sourcils
        left_eyebrow_inner = landmarks[70]
        left_eyebrow_outer = landmarks[107]
        right_eyebrow_inner = landmarks[300]
        right_eyebrow_outer = landmarks[336]

        # Calculs géométriques de la bouche
        mouth_width = abs(mouth_right[0] - mouth_left[0])
        mouth_height = abs(mouth_bottom[1] - mouth_top[1])
        lip_separation = abs(upper_lip[1] - lower_lip[1])

        # Analyse courbure de la bouche
        left_mouth_corner = landmarks[308]
        right_mouth_corner = landmarks[78]
        mouth_corners_height = (left_mouth_corner[1] + right_mouth_corner[1]) / 2
        mouth_curve = mouth_top[1] - mouth_corners_height

        genuine_smile = mouth_curve < -0.015 and lip_separation > 0.01
        slight_smile = -0.015 <= mouth_curve < -0.005
        neutral = abs(mouth_curve) <= 0.005
        frown = mouth_curve > 0.005

        # Hauteur des sourcils
        eyebrow_height = (left_eyebrow_inner[1] + right_eyebrow_inner[1]) / 2
        eyebrow_raised = eyebrow_height < 0.3

        # ---------- Construction du dictionnaire de résultats ----------
        return {
            'frame': frame_num,
            'timestamp': timestamp,
            'face_detected': True,
            'confidence': 1.0,
            'face_center': {'x': nose_tip[0], 'y': nose_tip[1]},

            # Orientation de la tête
            'head_tilt': head_tilt,
            'head_nod': head_nod,
            'head_turn': head_turn,
            'orientation_category': self._categorize_head_orientation(head_tilt, head_nod, head_turn),

            # Symétrie et forme
            'facial_symmetry': facial_symmetry,
            'eye_distance': eye_distance,

            # Contact visuel
            'eye_level': eye_level,
            'gaze_direction_x': gaze_x,
            'gaze_direction_y': gaze_y,
            'gaze_distance': gaze_distance,
            'eye_openness': eye_openness,
            'looking_at_camera': excellent_contact,
            'good_eye_contact': good_contact,
            'acceptable_eye_contact': acceptable_contact,
            'contact_quality': self._categorize_eye_contact(gaze_distance, eye_openness),

            # Expressions faciales
            'mouth_width': mouth_width,
            'mouth_height': mouth_height,
            'lip_separation': lip_separation,
            'mouth_curve': mouth_curve,
            'is_smiling': genuine_smile or slight_smile,
            'genuine_smile': genuine_smile,
            'slight_smile': slight_smile,
            'neutral_expression': neutral,
            'frowning': frown,
            'eyebrow_raised': eyebrow_raised,
            'mouth_openness': mouth_height / mouth_width if mouth_width > 0 else 0,
            'expression_intensity': abs(mouth_curve) + (lip_separation * 2),
            'expression_category': self._categorize_expression(
                genuine_smile, slight_smile, neutral, frown, eyebrow_raised
            )
        }

    def _categorize_head_orientation(self, tilt, nod, turn):
        if abs(tilt) < 5 and abs(nod) < 5 and abs(turn) < 10:
            return "frontal_stable"
        elif abs(tilt) > 15:
            return "tilt_excessive"
        elif abs(nod) > 15:
            return "nod_excessive"
        elif abs(turn) > 20:
            return "turn_excessive"
        else:
            return "natural_movement"

    def _categorize_eye_contact(self, gaze_distance, eye_openness):
        if eye_openness < 0.01:
            return "eyes_closed"
        elif gaze_distance < 0.05:
            return "excellent"
        elif gaze_distance < 0.1:
            return "good"
        elif gaze_distance < 0.15:
            return "acceptable"
        else:
            return "poor"

    def _categorize_expression(self, genuine_smile, slight_smile, neutral, frown, eyebrow_raised):
        if genuine_smile:
            return "genuine_smile"
        elif slight_smile:
            return "slight_smile"
        elif frown:
            if eyebrow_raised:
                return "concerned"
            else:
                return "frown"
        elif eyebrow_raised:
            return "surprised"
        elif neutral:
            return "neutral"
        else:
            return "unclear"