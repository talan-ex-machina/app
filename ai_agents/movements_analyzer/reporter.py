import google.generativeai as genai
import json
import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib.colors import HexColor
from reportlab.lib.units import inch


API_KEY = "AIzaSyA34Pv0jIWHZDxtYP1mIt5_qUM6vn8kHTU"

genai.configure(api_key=API_KEY)



model = genai.GenerativeModel("gemini-1.5-flash")

# Charge le JSON statistiques (le plus récent)
import glob
import os

def find_latest_resume_file():
    """Trouve le fichier resume_structure.json le plus récent dans tous les dossiers d'analyse"""
    # Chercher dans tous les dossiers analyse_*
    all_resume_files = []
    
    # Chercher dans le répertoire courant
    current_dir_files = glob.glob("resume_structure*.json")
    all_resume_files.extend(current_dir_files)
    
    # Chercher dans les dossiers analyse_*
    analysis_dirs = glob.glob("analyse_*")
    for dir_name in analysis_dirs:
        pattern = os.path.join(dir_name, "resume_structure*.json")
        dir_files = glob.glob(pattern)
        all_resume_files.extend(dir_files)
    
    if all_resume_files:
        # Prendre le plus récent basé sur la date de modification
        latest_resume = max(all_resume_files, key=os.path.getctime)
        print(f"✅ Utilisation du resume: {latest_resume}")
        return latest_resume
    else:
        # Fallback vers le fichier par défaut
        fallback_file = "resume_structure.json"
        print(f"⚠️ Aucun fichier resume trouvé, tentative: {fallback_file}")
        return fallback_file

def load_analysis_data():
    """Charge les données d'analyse avec gestion d'erreurs"""
    try:
        latest_resume = find_latest_resume_file()
        
        if not os.path.exists(latest_resume):
            raise FileNotFoundError(f"Fichier introuvable: {latest_resume}")
            
        with open(latest_resume, "r", encoding='utf-8') as f:
            stats = json.load(f)
            print(f"✅ Données chargées: {len(stats)} sections")
            return stats
            
    except FileNotFoundError as e:
        print(f"❌ ERREUR: {e}")
        print("💡 Assurez-vous d'avoir exécuté data.py avant reporter.py")
        return None
    except json.JSONDecodeError as e:
        print(f"❌ ERREUR JSON: {e}")
        print("💡 Le fichier JSON est corrompu")
        return None
    except Exception as e:
        print(f"❌ ERREUR inattendue: {e}")
        return None

# Charger les données d'analyse seulement si exécuté directement
if __name__ == "__main__":
    stats = load_analysis_data()
    if not stats:
        print("❌ Impossible de continuer sans données d'analyse")
        exit(1)
else:
    # Quand importé comme module, ne pas exécuter le code principal
    stats = None

# Analyse des données pour créer un prompt plus détaillé
def analyze_data_structure(data):
    analysis = {}
    
    # Analyse temporelle avec les 5 groupes
    def analyze_group_evolution(category_data):
        if not category_data:
            return {}
        
        evolution = {}
        for i, group in enumerate(category_data):
            group_name = f"groupe_{i+1}"
            evolution[group_name] = {
                "range": group.get('range', ''),
                "frames_count": group.get('frames_count', 0),
                "confidence": group.get('confidence', 0),
                "timestamp": group.get('timestamp', 0)
            }
        return evolution
    
    # Analyse des expressions faciales avec évolution temporelle
    if 'face_analysis' in data and data['face_analysis']:
        face_groups = data['face_analysis']
        analysis['facial_expressions'] = {
            'evolution': analyze_group_evolution(face_groups),
            'overall_patterns': {},
            'critical_moments': []
        }
        
        # Analyse des patterns globaux
        avg_confidence = sum(g.get('confidence', 0) for g in face_groups) / len(face_groups)
        avg_smile = sum(g.get('is_smiling', 0) for g in face_groups) / len(face_groups)
        avg_eye_openness = sum(g.get('eye_openness', 0) for g in face_groups) / len(face_groups)
        
        analysis['facial_expressions']['overall_patterns'] = {
            'avg_confidence': avg_confidence,
            'smile_consistency': avg_smile,
            'eye_alertness': avg_eye_openness,
            'expression_variety': len(set(g.get('expression_category', '').split('/')[0].split('%')[-1] for g in face_groups))
        }
        
        # Identifier les moments critiques
        for i, group in enumerate(face_groups):
            confidence = group.get('confidence', 0)
            smile = group.get('is_smiling', 0)
            eye_contact = group.get('good_eye_contact', '0%true')
            
            if confidence < 0.8 or '0%true' in eye_contact:
                analysis['facial_expressions']['critical_moments'].append({
                    'group': i+1,
                    'issue': 'low_confidence' if confidence < 0.8 else 'no_eye_contact',
                    'range': group.get('range', ''),
                    'severity': 'high' if confidence < 0.5 else 'medium'
                })
    
    # Analyse du contact visuel avec tendances
    if 'eye_contact' in data and data['eye_contact']:
        eye_groups = data['eye_contact']
        analysis['gaze_analysis'] = {
            'evolution': analyze_group_evolution(eye_groups),
            'consistency_score': 0,
            'direction_stability': {},
            'engagement_level': 'low'
        }
        
        # Calculer la consistance du regard
        good_contact_scores = []
        for group in eye_groups:
            # Extraire le pourcentage de bon contact visuel
            contact_str = group.get('good_eye_contact', '0%true')
            if '%true' in contact_str:
                pct = int(contact_str.split('%')[0])
                good_contact_scores.append(pct)
        
        if good_contact_scores:
            analysis['gaze_analysis']['consistency_score'] = sum(good_contact_scores) / len(good_contact_scores)
            if analysis['gaze_analysis']['consistency_score'] > 70:
                analysis['gaze_analysis']['engagement_level'] = 'high'
            elif analysis['gaze_analysis']['consistency_score'] > 30:
                analysis['gaze_analysis']['engagement_level'] = 'medium'
    
    # Analyse de la posture avec stabilité
    if 'pose_analysis' in data and data['pose_analysis']:
        pose_groups = data['pose_analysis']
        analysis['body_language'] = {
            'evolution': analyze_group_evolution(pose_groups),
            'stability_metrics': {},
            'energy_level': 'neutral'
        }
        
        # Calculer les métriques de stabilité
        head_tilts = [abs(g.get('head_tilt', 0)) for g in pose_groups]
        shoulder_tilts = [abs(g.get('shoulder_tilt', 0)) for g in pose_groups]
        
        if head_tilts:
            analysis['body_language']['stability_metrics'] = {
                'head_stability': max(head_tilts) - min(head_tilts),
                'avg_head_tilt': sum(head_tilts) / len(head_tilts),
                'posture_consistency': 100 - (max(head_tilts) - min(head_tilts)) * 2
            }
    
    # Analyse des gestes avec activité
    if 'hand_analysis' in data and data['hand_analysis']:
        hand_groups = data['hand_analysis']
        analysis['gesture_dynamics'] = {
            'evolution': analyze_group_evolution(hand_groups),
            'activity_patterns': {},
            'communication_style': 'passive'
        }
        
        # Analyser les patterns d'activité
        activity_levels = [g.get('activity_level', 0) for g in hand_groups]
        if activity_levels:
            avg_activity = sum(activity_levels) / len(activity_levels)
            analysis['gesture_dynamics']['activity_patterns'] = {
                'average_activity': avg_activity,
                'peak_activity': max(activity_levels),
                'consistency': 100 - (max(activity_levels) - min(activity_levels)) * 50
            }
            
            if avg_activity > 0.7:
                analysis['gesture_dynamics']['communication_style'] = 'very_active'
            elif avg_activity > 0.4:
                analysis['gesture_dynamics']['communication_style'] = 'active'
            elif avg_activity > 0.2:
                analysis['gesture_dynamics']['communication_style'] = 'moderate'
    
    # Métadonnées enrichies
    metadata = data.get('metadata', {})
    analysis['session_context'] = {
        'duration': metadata.get('duration', 0),
        'total_frames': metadata.get('total_frames', 0),
        'fps': metadata.get('fps', 0),
        'processing_method': metadata.get('processing_method', 'unknown'),
        'analysis_depth': 'comprehensive_5_groups'
    }
    
    return analysis

# Exécuter seulement si appelé directement, pas lors d'un import
if __name__ == "__main__":
    detailed_analysis = analyze_data_structure(stats)

    # Prépare le prompt optimisé avec analyse temporelle
    prompt = f"""
Tu es un expert en communication non verbale et analyse comportementale. Analyse cette session de {stats.get('metadata', {}).get('duration', 'N/A')}s divisée en 5 segments temporels.

CONTEXTE DE LA SESSION :
- Durée : {detailed_analysis.get('session_context', {}).get('duration', 'N/A')} secondes
- Méthode d'analyse : {detailed_analysis.get('session_context', {}).get('processing_method', 'N/A')}
- Profondeur : Analyse segmentée en 5 groupes temporels

ANALYSE TEMPORELLE DÉTAILLÉE :

🎯 EXPRESSIONS FACIALES (Évolution temporelle)
Patterns globaux :
- Confiance moyenne : {detailed_analysis.get('facial_expressions', {}).get('overall_patterns', {}).get('avg_confidence', 0)*100:.1f}%
- Consistance sourire : {detailed_analysis.get('facial_expressions', {}).get('overall_patterns', {}).get('smile_consistency', 0)*100:.1f}%
- Vigilance oculaire : {detailed_analysis.get('facial_expressions', {}).get('overall_patterns', {}).get('eye_alertness', 0)*100:.1f}%
- Variété expressions : {detailed_analysis.get('facial_expressions', {}).get('overall_patterns', {}).get('expression_variety', 0)} types

Moments critiques identifiés : {len(detailed_analysis.get('facial_expressions', {}).get('critical_moments', []))} incidents

👁️ CONTACT VISUEL (Performance)
- Score de consistance : {detailed_analysis.get('gaze_analysis', {}).get('consistency_score', 0):.1f}%
- Niveau d'engagement : {detailed_analysis.get('gaze_analysis', {}).get('engagement_level', 'N/A')}
- Évolution sur 5 segments : {len(detailed_analysis.get('gaze_analysis', {}).get('evolution', {}))} mesures

🏃 LANGAGE CORPOREL (Stabilité)
Métriques de stabilité :
- Stabilité tête : {detailed_analysis.get('body_language', {}).get('stability_metrics', {}).get('head_stability', 0):.1f}°
- Inclinaison moyenne : {detailed_analysis.get('body_language', {}).get('stability_metrics', {}).get('avg_head_tilt', 0):.1f}°
- Consistance posture : {detailed_analysis.get('body_language', {}).get('stability_metrics', {}).get('posture_consistency', 0):.1f}%

⚡ DYNAMIQUE GESTUELLE
Patterns d'activité :
- Activité moyenne : {detailed_analysis.get('gesture_dynamics', {}).get('activity_patterns', {}).get('average_activity', 0)*100:.1f}%
- Pic d'activité : {detailed_analysis.get('gesture_dynamics', {}).get('activity_patterns', {}).get('peak_activity', 0)*100:.1f}%
- Style communication : {detailed_analysis.get('gesture_dynamics', {}).get('communication_style', 'N/A')}

GÉNÈRE UN RAPPORT PROFESSIONNEL STRUCTURÉ :

📈 RÉSUMÉ EXÉCUTIF
- Score global de performance /100 (justifie avec métriques précises)
- 3 forces majeures avec données quantifiées
- 3 axes d'amélioration prioritaires avec impact estimé
- Recommandation stratégique principale

📊 ANALYSE TEMPORELLE SEGMENTÉE
- Évolution des performances sur les 5 segments
- Identification des moments de pic et de creux
- Patterns comportementaux récurrents
- Cohérence ou incohérence dans la communication

👁️ IMPACT COMMUNICATIONNEL
- Crédibilité perçue (facteurs quantifiés)
- Engagement audience (prédiction basée données)
- Points de décrochage identifiés
- Recommandations correctives spécifiques

🏃 OPTIMISATION COMPORTEMENTALE
- Actions concrètes classées par priorité
- Timeline d'amélioration suggérée
- Métriques de suivi recommandées
- Techniques d'entraînement spécifiques

Sois précis, utilise les données quantifiées, propose des solutions actionnables et évalue l'impact business de chaque recommandation.
"""

    print("📊 Envoi de la demande à l'IA Gemini...")
    print("⏳ Génération en cours (peut prendre 10-30 secondes)...")

    try:
        response = model.generate_content(prompt)
        rapport = response.text
        print("✅ Réponse IA reçue !")
        
    except Exception as e:
        print(f"❌ ERREUR lors de la génération IA: {e}")
        print("💡 Vérifiez votre connexion internet et votre clé API")
        # Créer un rapport de fallback basique
        rapport = f"""
        RAPPORT D'ANALYSE - MODE DÉGRADÉ
        
        📈 RÉSUMÉ EXÉCUTIF
        Analyse technique complétée sur {stats.get('metadata', {}).get('duration', 'N/A')} secondes.
        
        Données disponibles :
        - Frames analysées : {stats.get('metadata', {}).get('total_frames', 'N/A')}
        - FPS : {stats.get('metadata', {}).get('fps', 'N/A')}
        
        ⚠️ Analyse IA indisponible - Consultez les données JSON pour plus de détails.
        """

    print("📄 Génération du PDF en cours...")

    print("=" * 80)
    print("RAPPORT D'ANALYSE DE COMMUNICATION NON VERBALE - VERSION DETAILLEE")
    print("=" * 80)
    print(rapport)
    print("=" * 80)
    print(f" Données analysées : {stats.get('metadata', {}).get('total_frames', 'N/A')} frames sur {stats.get('metadata', {}).get('duration', 'N/A')}s")
    print(f" Généré le : {datetime.datetime.now().strftime('%d/%m/%Y à %H:%M:%S')}")
    print("=" * 80)

def create_pdf_report(rapport_content, stats):
    """Crée un rapport PDF professionnel avec horodatage"""
    try:
        # Créer un nom de fichier avec horodatage
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"rapport_analyse_{timestamp}.pdf"
        
        # Créer le document PDF
        doc = SimpleDocTemplate(filename, pagesize=A4,
                              rightMargin=72, leftMargin=72,
                              topMargin=72, bottomMargin=18)
        
        # Obtenir les styles par défaut
        styles = getSampleStyleSheet()
        
        # Créer des styles personnalisés
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=HexColor('#2C3E50'),
            fontName='Helvetica-Bold'
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
            spaceBefore=20,
            textColor=HexColor('#34495E'),
            fontName='Helvetica-Bold'
        )
        
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontSize=11,
            spaceAfter=6,
            alignment=TA_JUSTIFY,
            fontName='Helvetica'
        )
        
        # Liste pour stocker les éléments du PDF
        story = []
        
        # Titre principal
        story.append(Paragraph("📊 RAPPORT D'ANALYSE DE COMMUNICATION NON VERBALE", title_style))
        story.append(Paragraph("VERSION DÉTAILLÉE", title_style))
        story.append(Spacer(1, 20))
        
        # Informations sur l'analyse
        info_text = f"""
         <b>Données analysées :</b> {stats.get('metadata', {}).get('total_frames', 'N/A')} frames sur {stats.get('metadata', {}).get('duration', 'N/A')} secondes<br/>
         <b>Généré le :</b> {datetime.datetime.now().strftime('%d/%m/%Y à %H:%M:%S')}<br/>
         <b>FPS :</b> {stats.get('metadata', {}).get('fps', 'N/A')}
        """
        story.append(Paragraph(info_text, normal_style))
        story.append(Spacer(1, 30))
        
        # Traiter le contenu du rapport
        lines = rapport_content.split('\n')
        current_section = ""
        
        for line in lines:
            line = line.strip()
            if not line:
                story.append(Spacer(1, 6))
                continue
                
            # Détecter les titres de section (avec emojis)
            if any(emoji in line for emoji in ['🎯', '📊', '👁️', '🏃', '⚡', '📈', '📋']):
                story.append(Spacer(1, 15))
                # Nettoyer les emojis pour le PDF
                clean_line = line.replace('🎯', '■').replace('📊', '■').replace('👁️', '■').replace('🏃', '■').replace('⚡', '■').replace('📈', '■').replace('📋', '■')
                story.append(Paragraph(clean_line, heading_style))
                current_section = line
            # Sous-titres avec tirets
            elif line.startswith('- ') and len(line) < 80:
                story.append(Paragraph(f"<b>{line}</b>", normal_style))
            # Points de liste avec puces
            elif line.startswith('SUCCES'):
                story.append(Paragraph(line, normal_style))
            # Texte normal
            else:
                # Remplacer les caractères spéciaux pour PDF
                line = line.replace('°', '&deg;').replace('•', '-')
                story.append(Paragraph(line, normal_style))
        
        # Construire le PDF
        doc.build(story)
        return filename
        
    except Exception as e:
        print(f"❌ ERREUR lors de la création PDF: {e}")
        return None

if __name__ == "__main__":
    # Générer le PDF avec gestion d'erreurs
    try:
        pdf_filename = create_pdf_report(rapport, stats)
        if pdf_filename:
            print(f"\n✅ Rapport PDF sauvegardé dans : {pdf_filename}")
        else:
            print("❌ Échec de la création du PDF")
    except Exception as e:
        print(f"❌ ERREUR lors de la génération du PDF: {e}")
        print("💡 Vérifiez que ReportLab est installé et que vous avez les permissions d'écriture")
