import numpy as np

class MovementAnalyzer:
    def _calculate_movement_metrics(self, results):
        """Calcule les métriques globales de mouvement"""
        metrics = {}
        
        # Métriques du contact visuel
        if results.get('eye_contact'):
            eye_contact_frames = [ec for ec in results['eye_contact'] if ec.get('looking_at_camera')]
            total_eye_frames = len(results['eye_contact'])
            metrics['eye_contact_percentage'] = (len(eye_contact_frames) / total_eye_frames * 100) if total_eye_frames > 0 else 0
        
        # Métriques des mouvements de tête
        if results.get('face_analysis'):
            head_tilts = [fa.get('head_tilt', 0) for fa in results['face_analysis']]
            head_nods = [fa.get('head_nod', 0) for fa in results['face_analysis']]
            
            metrics['head_movement'] = {
                'tilt_variance': np.var(head_tilts) if head_tilts else 0,
                'nod_variance': np.var(head_nods) if head_nods else 0,
                'average_tilt': np.mean(head_tilts) if head_tilts else 0
            }
        
        # Métriques des expressions faciales
        if results.get('facial_expressions'):
            smiles = [fe for fe in results['facial_expressions'] if fe.get('is_smiling')]
            total_expression_frames = len(results['facial_expressions'])
            metrics['smile_percentage'] = (len(smiles) / total_expression_frames * 100) if total_expression_frames > 0 else 0
        
        # Métriques des mains
        if results.get('hand_analysis'):
            hand_frames = [ha for ha in results['hand_analysis'] if ha.get('hands_detected', 0) > 0]
            total_frames = len(results['hand_analysis']) if results['hand_analysis'] else len(results.get('pose_analysis', []))
            metrics['hands_visible_percentage'] = (len(hand_frames) / total_frames * 100) if total_frames > 0 else 0
        
        # Métriques de posture
        if results.get('pose_analysis'):
            shoulder_tilts = [pa.get('shoulder_tilt', 0) for pa in results['pose_analysis']]
            body_leans = [pa.get('body_lean', 0) for pa in results['pose_analysis']]
            
            metrics['posture_stability'] = {
                'shoulder_stability': 100 - min(100, np.std(shoulder_tilts) * 10) if shoulder_tilts else 0,
                'body_stability': 100 - min(100, np.std(body_leans) * 10) if body_leans else 0
            }
        
        return metrics
    
    def analyze_performance(self, movement_metrics):
        """Analyse la performance globale - données uniquement sans recommandations"""
        performance_score = 100  # Score neutre pour l'exemple
        
        # Récupération des principaux indicateurs
        eye_contact = movement_metrics.get('eye_contact_percentage', 0)
        head_movement = movement_metrics.get('head_movement', {})
        tilt_var = head_movement.get('tilt_variance', 0)
        smile_percentage = movement_metrics.get('smile_percentage', 0)
        hands_visible = movement_metrics.get('hands_visible_percentage', 0)
        posture = movement_metrics.get('posture_stability', {})
        shoulder_stability = posture.get('shoulder_stability', 0)
        
        return {
            'performance_score': performance_score,
            'recommendations': [],  # Liste vide - pas de recommandations
            'strengths': [],        # Liste vide - pas d'analyse des points forts
            'key_metrics': {
                'eye_contact': eye_contact,
                'smile_rate': smile_percentage,
                'hand_usage': hands_visible,
                'posture_score': shoulder_stability,
                'head_tilt_variance': tilt_var
            }
        }
    
    def _identify_movement_strengths(self, metrics):
        """Identifie les points forts des mouvements - ici désactivé"""
        return []  # Retourne une liste vide