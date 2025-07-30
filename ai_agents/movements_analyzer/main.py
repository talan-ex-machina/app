#!/usr/bin/env python3
"""
Script principal pour l'analyse complète de vidéo
Exécute dans l'ordre : VideoAnalyzer → Data Processing → Reporter
"""

import os
import sys
import time
import datetime
import json
from pathlib import Path

def get_user_configuration():
    """Interface utilisateur pour configurer l'analyse"""
    print(" CONFIGURATION DE L'ANALYSE VIDÉO")
    print("="*60)
    
    # Demander le chemin de la vidéo
    print("\n SÉLECTION DE LA VIDÉO")
    video_path = input("Entrez le chemin de votre vidéo (ou appuyez sur Entrée pour 'test.mp4'): ").strip()
    if not video_path:
        video_path = "test.mp4"
    
    # Vérifier si le fichier existe
    if not os.path.exists(video_path):
        print(f" Erreur : Le fichier '{video_path}' n'existe pas.")
        print(" Fichiers vidéo disponibles dans le dossier actuel :")
        for file in os.listdir("."):
            if file.endswith(('.mp4', '.avi', '.mov', '.mkv', '.wmv')):
                print(f"   - {file}")
        return None
    
    # Créer le dossier de sortie basé sur le nom de la vidéo
    video_name = Path(video_path).stem  # Nom sans extension
    output_folder = f"analyse_{video_name}"
    
    # Créer le dossier s'il n'existe pas
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
        print(f" Dossier de sortie créé: {output_folder}")
    else:
        print(f" Dossier de sortie existant: {output_folder}")
    
    # Demander si l'utilisateur veut personnaliser le dossier
    print(f"\n DOSSIER DE SORTIE")
    custom_folder = input(f"Dossier par défaut: '{output_folder}' (Entrée pour accepter ou tapez un nouveau nom): ").strip()
    if custom_folder:
        output_folder = custom_folder
        if not os.path.exists(output_folder):
            os.makedirs(output_folder)
            print(f" Nouveau dossier créé: {output_folder}")
        else:
            print(f" Utilisation du dossier existant: {output_folder}")
    
    # Demander le nombre de frames à ignorer
    print("\n CONFIGURATION DE L'ANALYSE")
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
    detailed = input("Voulez-vous un rapport détaillé frame par frame ? (o/n, défaut: n): ").strip().lower()
    detailed_output = detailed.startswith('o') or detailed.startswith('y')
    
    # Demander l'affichage frame par frame
    print("\n AFFICHAGE FRAME PAR FRAME")
    frame_details = input("Voulez-vous voir les détails de chaque frame en temps réel dans la console ? (o/n, défaut: n): ").strip().lower()
    show_frame_details = frame_details.startswith('o') or frame_details.startswith('y')
    
    # Afficher la configuration
    print("\n" + "="*60)
    print(" RÉSUMÉ DE LA CONFIGURATION")
    print("="*60)
    print(f" Vidéo : {video_path}")
    print(f" Dossier de sortie : {output_folder}")
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
    
    return {
        'video_path': video_path,
        'output_folder': output_folder,
        'skip_frames': skip_frames,
        'show_landmarks': show_landmarks,
        'detailed_output': detailed_output,
        'show_frame_details': show_frame_details
    }

def run_video_analysis():
    """Étape 1: Analyse vidéo avec configuration utilisateur"""
    print("\n" + "="*60)
    print(" ÉTAPE 1: ANALYSE VIDÉO")
    print("="*60)
    
    try:
        # Importer VideoAnalyzer
        from video_analyzer import analyze_video_file
        
        # Obtenir la configuration utilisateur
        config = get_user_configuration()
        if not config:
            return False, None
            
        print(f"\n Analyse de la vidéo: {config['video_path']}")
        print(f"  Configuration: skip_frames={config['skip_frames']}, landmarks={'OUI' if config['show_landmarks'] else 'NON'}")
        print(f"  Dossier de sortie: {config['output_folder']}")
        
        start_time = time.time()
        
        # Lancer l'analyse avec la configuration utilisateur
        results = analyze_video_file(
            video_path=config['video_path'],
            skip_frames=config['skip_frames'],
            detailed_output=config['detailed_output'],
            show_landmarks=config['show_landmarks'],
            show_frame_details=config['show_frame_details'],
            output_folder=config['output_folder']  # Passer le dossier de sortie
        )
        
        end_time = time.time()
        duration = end_time - start_time
        
        if results:
            print(f" Analyse vidéo terminée en {duration:.1f}s")
            print(f" {len(results['face_analysis'])} frames analysées")
            return True, config['output_folder']
        else:
            print(" Échec de l'analyse vidéo")
            return False, None
        
        
        
            
    except Exception as e:
        print(f" Erreur lors de l'analyse vidéo: {e}")
        return False, None

def run_data_processing(output_folder):
    """Étape 2: Traitement des données avec data.py"""
    print("\n" + "="*60)
    print(" ÉTAPE 2: TRAITEMENT DES DONNÉES")
    print("="*60)
    
    try:
        # Importer et utiliser le module data
        import data
        import glob
        
        # Chercher le fichier d'analyse le plus récent dans le dossier de sortie
        analysis_pattern = os.path.join(output_folder, "resultats_analyse_*.json")
        analysis_files = glob.glob(analysis_pattern)
        
        if not analysis_files:
            # Chercher dans le dossier actuel comme fallback
            analysis_files = glob.glob("resultats_analyse_*.json")
        
        if analysis_files:
            latest_file = max(analysis_files, key=os.path.getctime)
            print(f" Fichier d'analyse trouvé: {latest_file}")
        else:
            print(" Aucun fichier d'analyse trouvé")
            return False
        
        start_time = time.time()
        
        # Créer le nom du fichier de sortie dans le dossier de sortie
        resume_output = os.path.join(output_folder, "resume_structure.json")
        
        # Traiter les données
        data.main(latest_file, resume_output)
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f" Traitement des données terminé en {duration:.1f}s")
        print(f" Fichier de résumé créé: {resume_output}")
        return True
        
    except Exception as e:
        print(f" Erreur lors du traitement des données: {e}")
        return False

def run_report_generation(output_folder):
    """Étape 3: Génération du rapport avec reporter.py"""
    print("\n" + "="*60)
    print(" ÉTAPE 3: GÉNÉRATION DU RAPPORT")
    print("="*60)
    
    try:
        # Importer et exécuter directement reporter
        import sys
        import os
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        
        start_time = time.time()
        
        # Exécuter le code reporter directement
        print(" Lancement de la génération du rapport...")
        
        # Import des modules nécessaires
        import google.generativeai as genai
        import json
        from datetime import datetime
        from reportlab.lib.pagesizes import letter, A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
        from reportlab.lib.colors import HexColor
        from reportlab.lib.units import inch
        import glob
        
        API_KEY = "AIzaSyBQz8bQhmEy4UfjKOBOQrxsUKWRnyI_8Zo."
        genai.configure(api_key=API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Trouve le fichier de résumé le plus récent dans le dossier de sortie
        resume_pattern = os.path.join(output_folder, "resume_structure_*.json")
        resume_files = glob.glob(resume_pattern)
        
        if not resume_files:
            # Chercher dans le dossier actuel comme fallback
            resume_files = glob.glob("resume_structure_*.json")
        
        if resume_files:
            latest_resume = max(resume_files, key=os.path.getctime)
            print(f"Utilisation du resume: {latest_resume}")
        else:
            # Chercher le fichier de base dans le dossier de sortie
            base_resume = os.path.join(output_folder, "resume_structure.json")
            if os.path.exists(base_resume):
                latest_resume = base_resume
                print(f"Utilisation du resume de base: {latest_resume}")
            else:
                print(f"Erreur: Aucun fichier resume trouve dans {output_folder}")
                return False
        
        with open(latest_resume, "r", encoding='utf-8') as f:
            stats = json.load(f)
        
        # Importer seulement la fonction d'analyse de reporter.py
        try:
            from reporter import analyze_data_structure
        except:
            # Fallback si l'import échoue
            def analyze_data_structure(data):
                return {
                    'session_context': data.get('metadata', {}),
                    'facial_expressions': {'overall_patterns': {}, 'critical_moments': []},
                    'gaze_analysis': {'consistency_score': 0, 'engagement_level': 'unknown'},
                    'body_language': {'stability_metrics': {}},
                    'gesture_dynamics': {'activity_patterns': {}, 'communication_style': 'unknown'}
                }
        
        # Créer l'analyse détaillée
        detailed_analysis = analyze_data_structure(stats)
        
        # Créer le prompt optimisé avec analyse temporelle
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

        print("Envoi de la demande a l'IA Gemini...")
        print("Generation en cours (peut prendre 10-30 secondes)...")

        response = model.generate_content(prompt)
        rapport = response.text

        print("Reponse IA recue !")
        print("Generation du PDF en cours...")

        print("=" * 80)
        print("RAPPORT D'ANALYSE DE COMMUNICATION NON VERBALE - VERSION DETAILLEE")
        print("=" * 80)
        print(rapport)
        print("=" * 80)
        
        # Créer le PDF en utilisant la fonction de reporter.py
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Importer la fonction de création PDF de reporter.py
        import sys
        import os
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        
        # Créer le PDF en utilisant le même code que reporter.py
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
        from reportlab.lib.colors import HexColor
        
        def create_pdf_report_main(rapport_content, stats, output_folder):
            """Crée un rapport PDF professionnel avec horodatage dans le dossier de sortie"""
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = os.path.join(output_folder, f"rapport_analyse_{timestamp}.pdf")
            
            doc = SimpleDocTemplate(filename, pagesize=A4,
                                  rightMargin=72, leftMargin=72,
                                  topMargin=72, bottomMargin=18)
            
            styles = getSampleStyleSheet()
            
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
            
            story = []
            
            # Titre principal
            story.append(Paragraph("RAPPORT D'ANALYSE DE COMMUNICATION NON VERBALE", title_style))
            story.append(Paragraph("VERSION DÉTAILLÉE", title_style))
            story.append(Spacer(1, 20))
            
            # Informations sur l'analyse
            info_text = f"""
             <b>Données analysées :</b> {stats.get('metadata', {}).get('total_frames', 'N/A')} frames sur {stats.get('metadata', {}).get('duration', 'N/A')} secondes<br/>
             <b>Généré le :</b> {datetime.now().strftime('%d/%m/%Y à %H:%M:%S')}<br/>
             <b>FPS :</b> {stats.get('metadata', {}).get('fps', 'N/A')}
            """
            story.append(Paragraph(info_text, normal_style))
            story.append(Spacer(1, 30))
            
            # Traiter le contenu du rapport
            lines = rapport_content.split('\n')
            
            for line in lines:
                line = line.strip()
                if not line:
                    story.append(Spacer(1, 6))
                    continue
                    
                # Détecter les titres de section
                if any(marker in line for marker in ['RÉSUMÉ EXÉCUTIF', 'ANALYSE DÉTAILLÉE', 'EXPRESSIONS FACIALES', 'CONTACT VISUEL', 'POSTURE', 'RECOMMANDATIONS']):
                    story.append(Spacer(1, 15))
                    story.append(Paragraph(f"<b>{line}</b>", heading_style))
                # Sous-titres avec tirets
                elif line.startswith('- ') and len(line) < 80:
                    story.append(Paragraph(f"<b>{line}</b>", normal_style))
                # Texte normal
                else:
                    line = line.replace('°', '&deg;')
                    story.append(Paragraph(line, normal_style))
            
            doc.build(story)
            return filename
        
        # Charger les stats pour le PDF
        try:
            import glob
            resume_pattern = os.path.join(output_folder, "resume_structure_*.json")
            resume_files = glob.glob(resume_pattern)
            
            if not resume_files:
                # Chercher dans le dossier actuel comme fallback
                resume_files = glob.glob("resume_structure_*.json")
            
            if resume_files:
                latest_resume = max(resume_files, key=os.path.getctime)
                with open(latest_resume, "r") as f:
                    stats_for_pdf = json.load(f)
            else:
                stats_for_pdf = {"metadata": {"total_frames": "N/A", "duration": "N/A", "fps": "N/A"}}
            
            # Créer le PDF dans le dossier de sortie
            pdf_filename = create_pdf_report_main(rapport, stats_for_pdf, output_folder)
            print(f"\nRapport PDF sauvegardé dans : {pdf_filename}")
            
        except Exception as pdf_error:
            print(f"  Erreur lors de la création du PDF : {pdf_error}")
            print("Rapport affiché dans la console seulement")
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f" Rapport généré en {duration:.1f}s")
        return True
            
    except Exception as e:
        print(f" Erreur lors de la génération du rapport: {e}")
        return False

def main():
    """Fonction principale qui orchestre toute la pipeline"""
    print(" PIPELINE COMPLÈTE D'ANALYSE VIDÉO")
    print("=" * 60)
    print(f" Démarrage: {datetime.datetime.now().strftime('%d/%m/%Y à %H:%M:%S')}")
    
    start_total = time.time()
    
    # Étape 1: Analyse vidéo
    success, output_folder = run_video_analysis()
    if not success:
        print("\n ÉCHEC: Impossible de continuer sans analyse vidéo")
        return False
    
    # Petite pause entre les étapes
    time.sleep(1)
    
    # Étape 2: Traitement des données
    if not run_data_processing(output_folder):
        print("\n ÉCHEC: Impossible de continuer sans traitement des données")
        return False
    
    # Petite pause entre les étapes
    time.sleep(1)
    
    # Étape 3: Génération du rapport
    if not run_report_generation(output_folder):
        print("\n ATTENTION: Rapport non généré, mais les données sont disponibles")
    
    end_total = time.time()
    total_duration = end_total - start_total
    
    # Résumé final
    print("\n" + "="*60)
    print(" RÉSUMÉ DE LA PIPELINE")
    print("="*60)
    print(f"  Durée totale: {total_duration:.1f} secondes")
    print(f" Terminé: {datetime.datetime.now().strftime('%d/%m/%Y à %H:%M:%S')}")
    print(f" Dossier de sortie: {output_folder}")
    
    # Lister les fichiers générés dans le dossier de sortie
    print(f"\n FICHIERS GÉNÉRÉS DANS '{output_folder}':")
    
    import glob  # Déplacer l'import ici
    
    # Fichiers d'analyse
    analysis_pattern = os.path.join(output_folder, "resultats_analyse_*.json")
    analysis_files = glob.glob(analysis_pattern)
    if analysis_files:
        latest_analysis = max(analysis_files, key=os.path.getctime)
        print(f"    Analyse: {os.path.basename(latest_analysis)}")
    
    # Fichiers de résumé
    resume_pattern = os.path.join(output_folder, "resume_structure_*.json")
    resume_files = glob.glob(resume_pattern)
    if resume_files:
        latest_resume = max(resume_files, key=os.path.getctime)
        print(f"    Résumé: {os.path.basename(latest_resume)}")
    
    # Fichiers de rapport PDF seulement
    report_pattern = os.path.join(output_folder, "rapport_analyse_*.pdf")
    report_files_pdf = glob.glob(report_pattern)
    
    if report_files_pdf:
        latest_pdf = max(report_files_pdf, key=os.path.getctime)
        print(f"    Rapport PDF: {os.path.basename(latest_pdf)}")
    
    print("✓ PIPELINE TERMINÉE AVEC SUCCÈS!")
    print(f" Tous les fichiers sont dans le dossier: {output_folder}")
    return True

if __name__ == "__main__":
    try:
        success = main()
        if success:
            print("\n Tous les fichiers ont été générés avec succès!")
            print(" Vous pouvez maintenant consulter vos rapports d'analyse.")
        else:
            print("\n La pipeline s'est terminée avec des erreurs.")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n  Pipeline interrompue par l'utilisateur")
        sys.exit(1)
    except Exception as e:
        print(f"\n Erreur fatale: {e}")
        sys.exit(1)
