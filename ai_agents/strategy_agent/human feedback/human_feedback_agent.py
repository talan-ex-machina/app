from typing import Dict, List, Any, Optional, TypedDict
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from dataclasses import dataclass
from enum import Enum
import json
import logging
import os
from datetime import datetime
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'product_recommendation')))
from product_recommendation_agent import recommend
from dotenv import load_dotenv
load_dotenv()


# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FeedbackType(Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    SUGGESTION = "suggestion"
    QUESTION = "question"
    MIXED = "mixed"

#class StrategyComponent(Enum):
# Classe vide pour compatibilité, mais on utilisera dynamiquement les clés du dict
class StrategyComponent(str, Enum):
    pass

@dataclass
class FeedbackAnalysis:
    sentiment: str
    feedback_type: FeedbackType
    affected_components: List[StrategyComponent]
    key_issues: List[str]
    suggestions: List[str]
    confidence_score: float

@dataclass
class StrategyAdjustment:
    component: StrategyComponent
    original_content: str
    adjusted_content: str
    reason: str
    priority: int

class FeedbackState(TypedDict):
    original_strategy: Dict[str, Any]
    human_feedback: str
    feedback_analysis: Optional[FeedbackAnalysis]
    strategy_adjustments: List[StrategyAdjustment]
    adjusted_strategy: Optional[Dict[str, Any]]
    iteration_count: int
    
class HumanFeedbackAgent:
    def __init__(self, gemini_api_key: str, model_name: str = "gemini-2.0-flash-exp"):
        """
        Initialise l'agent de feedback humain
        
        Args:
            gemini_api_key: Clé API Gemini
            model_name: Nom du modèle Gemini à utiliser
        """
        self.llm = ChatGoogleGenerativeAI(
            google_api_key=os.getenv("GEMINI_API_KEY"),
            model=model_name,
            temperature=0.3,
            max_output_tokens=4096
        )
        
        # Construction du workflow LangGraph
        self.workflow = self._build_workflow()
        
    def _build_workflow(self) -> StateGraph:
        """Construit le workflow LangGraph pour l'analyse du feedback"""
        
        workflow = StateGraph(FeedbackState)
        
        # Ajout des nœuds
        workflow.add_node("analyze_feedback", self._analyze_feedback)
        workflow.add_node("identify_components", self._identify_affected_components)
        workflow.add_node("generate_adjustments", self._generate_adjustments)
        workflow.add_node("apply_adjustments", self._apply_adjustments)
        workflow.add_node("validate_strategy", self._validate_adjusted_strategy)
        
        # Définition des transitions
        workflow.add_edge("analyze_feedback", "identify_components")
        workflow.add_edge("identify_components", "generate_adjustments")
        workflow.add_edge("generate_adjustments", "apply_adjustments")
        workflow.add_edge("apply_adjustments", "validate_strategy")
        workflow.add_edge("validate_strategy", END)
        
        # Point d'entrée
        workflow.set_entry_point("analyze_feedback")
        
        return workflow.compile()
    
    def _analyze_feedback(self, state: FeedbackState) -> Dict[str, Any]:
        """Analyse le feedback humain pour comprendre les intentions et sentiments"""
        
        feedback = state["human_feedback"]
        
        analysis_prompt = f"""
        Tu es un expert en analyse de feedback utilisateur. Analyse ce feedback sur une stratégie business :
        
        FEEDBACK: "{feedback}"
        
        Analyse ce feedback selon ces critères :
        
        1. SENTIMENT (positif/négatif/neutre/mixte)
        2. TYPE DE FEEDBACK (positive/negative/suggestion/question/mixed)
        3. PROBLÈMES IDENTIFIÉS (liste les points spécifiques mentionnés)
        4. SUGGESTIONS IMPLICITES OU EXPLICITES
        5. NIVEAU DE CONFIANCE dans ton analyse (0-1)
        
        Réponds en JSON structuré :
        {{
            "sentiment": "...",
            "feedback_type": "...",
            "key_issues": ["issue1", "issue2", ...],
            "suggestions": ["suggestion1", "suggestion2", ...],
            "confidence_score": 0.85
        }}
        """
        
        try:
            response = self.llm.invoke(analysis_prompt)
            analysis_data = json.loads(response.content)
            
            feedback_analysis = FeedbackAnalysis(
                sentiment=analysis_data["sentiment"],
                feedback_type=FeedbackType(analysis_data["feedback_type"]),
                affected_components=[],  # Sera rempli dans la prochaine étape
                key_issues=analysis_data["key_issues"],
                suggestions=analysis_data["suggestions"],
                confidence_score=analysis_data["confidence_score"]
            )
            
            logger.info(f"Feedback analysé avec un score de confiance: {feedback_analysis.confidence_score}")
            
            return {**state, "feedback_analysis": feedback_analysis}
            
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse du feedback: {e}")
            # Analyse par défaut en cas d'erreur
            default_analysis = FeedbackAnalysis(
                sentiment="neutre",
                feedback_type=FeedbackType.MIXED,
                affected_components=[],
                key_issues=["Analyse automatique échouée"],
                suggestions=["Réviser le feedback manuellement"],
                confidence_score=0.1
            )
            return {**state, "feedback_analysis": default_analysis}
    
    def _identify_affected_components(self, state: FeedbackState) -> Dict[str, Any]:
        """Identifie quels composants de la stratégie sont affectés par le feedback"""
        
        feedback = state["human_feedback"]
        strategy = state["original_strategy"]
        
        components_prompt = f"""
        Tu es un expert en stratégie business. Identifie dynamiquement les clés (composants) du dictionnaire de stratégie ci-dessous qui sont affectées par ce feedback :

        FEEDBACK: "{feedback}"

        STRATÉGIE ACTUELLE (dictionnaire Python): {json.dumps(strategy, indent=2, ensure_ascii=False)}

        Retourne uniquement une liste JSON des clés du dictionnaire affectées (exemple: [\"plan_action\", \"budget\"]).
        """
        try:
            response = self.llm.invoke(components_prompt)
            affected_components_str = json.loads(response.content)
            # Utilise dynamiquement les clés du dictionnaire comme composants
            affected_components = [StrategyComponent(comp) for comp in affected_components_str if comp in strategy.keys()]
            feedback_analysis = state["feedback_analysis"]
            feedback_analysis.affected_components = affected_components
            logger.info(f"Composants affectés identifiés: {[c for c in affected_components]}")
            return {**state, "feedback_analysis": feedback_analysis}
        except Exception as e:
            logger.error(f"Erreur lors de l'identification des composants: {e}")
            # Par défaut, considérer tous les composants dynamiquement
            feedback_analysis = state["feedback_analysis"]
            feedback_analysis.affected_components = [StrategyComponent(k) for k in strategy.keys()]
            return {**state, "feedback_analysis": feedback_analysis}
    
    def _generate_adjustments(self, state: FeedbackState) -> Dict[str, Any]:
        """Génère les ajustements spécifiques pour chaque composant affecté"""
        
        feedback_analysis = state["feedback_analysis"]
        strategy = state["original_strategy"]
        feedback = state["human_feedback"]
        
        adjustments = []
        
        for component in feedback_analysis.affected_components:
            adjustment_prompt = f"""
            Tu es un consultant en stratégie business. Génère un ajustement spécifique pour le composant '{component.value}' 
            basé sur ce feedback utilisateur.
            
            FEEDBACK UTILISATEUR: "{feedback}"
            
            PROBLÈMES IDENTIFIÉS: {feedback_analysis.key_issues}
            SUGGESTIONS: {feedback_analysis.suggestions}
            
            CONTENU ACTUEL DU COMPOSANT '{component.value}':
            {strategy.get(component.value, "Non spécifié")}
            
            Génère un ajustement en JSON :
            {{
                "original_content": "contenu actuel...",
                "adjusted_content": "contenu ajusté...",
                "reason": "explication de l'ajustement...",
                "priority": 1-5
            }}
            
            L'ajustement doit :
            - Répondre directement aux préoccupations du feedback
            - Être spécifique et actionnable
            - Maintenir la cohérence avec le reste de la stratégie
            - Être réaliste et implémentable
            """
            
            try:
                response = self.llm.invoke(adjustment_prompt)
                adjustment_data = json.loads(response.content)
                
                adjustment = StrategyAdjustment(
                    component=component,
                    original_content=adjustment_data["original_content"],
                    adjusted_content=adjustment_data["adjusted_content"],
                    reason=adjustment_data["reason"],
                    priority=adjustment_data["priority"]
                )
                
                adjustments.append(adjustment)
                logger.info(f"Ajustement généré pour {component.value} avec priorité {adjustment.priority}")
                
            except Exception as e:
                logger.error(f"Erreur lors de la génération d'ajustement pour {component.value}: {e}")
                continue
        
        # Tri par priorité (1 = plus haute priorité)
        adjustments.sort(key=lambda x: x.priority)
        
        return {**state, "strategy_adjustments": adjustments}
    
    def _apply_adjustments(self, state: FeedbackState) -> Dict[str, Any]:
        """Applique les ajustements à la stratégie originale"""
        
        adjusted_strategy = state["original_strategy"].copy()
        adjustments = state["strategy_adjustments"]
        
        for adjustment in adjustments:
            component_key = adjustment.component.value
            adjusted_strategy[component_key] = adjustment.adjusted_content
            
            logger.info(f"Ajustement appliqué à {component_key}")
        
        # Ajout des métadonnées sur les ajustements
        adjusted_strategy["_metadata"] = {
            "adjustments_applied": len(adjustments),
            "iteration": state.get("iteration_count", 1),
            "feedback_confidence": state["feedback_analysis"].confidence_score,
            "adjustments_summary": [
                {
                    "component": adj.component.value,
                    "reason": adj.reason,
                    "priority": adj.priority
                } for adj in adjustments
            ]
        }
        
        return {**state, "adjusted_strategy": adjusted_strategy}
    
    def _validate_adjusted_strategy(self, state: FeedbackState) -> Dict[str, Any]:
        """Valide la cohérence de la stratégie ajustée"""
        
        adjusted_strategy = state["adjusted_strategy"]
        
        validation_prompt = f"""
        Tu es un expert en validation de stratégies business. Évalue la cohérence et la qualité de cette stratégie ajustée :
        
        STRATÉGIE AJUSTÉE: {json.dumps(adjusted_strategy, indent=2, ensure_ascii=False)}
        
        Vérifie :
        1. Cohérence interne entre les différents composants
        2. Réalisme et faisabilité
        3. Alignement avec les objectifs
        4. Complétude de l'information
        
        Retourne un score de validation (0-10) et des commentaires :
        {{
            "validation_score": 8.5,
            "is_valid": true,
            "comments": ["commentaire1", "commentaire2"],
            "recommendations": ["amélioration1", "amélioration2"]
        }}
        """
        
        try:
            response = self.llm.invoke(validation_prompt)
            validation_data = json.loads(response.content)
            
            # Ajout des infos de validation aux métadonnées
            if "_metadata" not in adjusted_strategy:
                adjusted_strategy["_metadata"] = {}
            
            adjusted_strategy["_metadata"]["validation"] = validation_data
            
            logger.info(f"Stratégie validée avec un score de {validation_data['validation_score']}/10")
            
        except Exception as e:
            logger.error(f"Erreur lors de la validation: {e}")
            # Validation par défaut
            if "_metadata" not in adjusted_strategy:
                adjusted_strategy["_metadata"] = {}
            adjusted_strategy["_metadata"]["validation"] = {
                "validation_score": 5.0,
                "is_valid": True,
                "comments": ["Validation automatique échouée"],
                "recommendations": ["Révision manuelle recommandée"]
            }
        
        return {**state, "adjusted_strategy": adjusted_strategy}
    
    def process_feedback(self, original_strategy: Dict[str, Any], human_feedback: str) -> Dict[str, Any]:
        """
        Point d'entrée principal pour traiter le feedback humain
        
        Args:
            original_strategy: La stratégie originale à ajuster
            human_feedback: Le feedback de l'utilisateur
            
        Returns:
            Dict contenant la stratégie ajustée et les métadonnées
        """
        
        initial_state = FeedbackState(
            original_strategy=original_strategy,
            human_feedback=human_feedback,
            feedback_analysis=None,
            strategy_adjustments=[],
            adjusted_strategy=None,
            iteration_count=1
        )
        
        logger.info("Démarrage du traitement du feedback...")
        
        try:
            # Exécution du workflow
            final_state = self.workflow.invoke(initial_state)
            
            result = {
                "success": True,
                "adjusted_strategy": final_state["adjusted_strategy"],
                "feedback_analysis": {
                    "sentiment": final_state["feedback_analysis"].sentiment,
                    "feedback_type": final_state["feedback_analysis"].feedback_type.value,
                    "key_issues": final_state["feedback_analysis"].key_issues,
                    "suggestions": final_state["feedback_analysis"].suggestions,
                    "confidence_score": final_state["feedback_analysis"].confidence_score,
                    "affected_components": [c.value for c in final_state["feedback_analysis"].affected_components]
                },
                "adjustments_applied": len(final_state["strategy_adjustments"]),
                "processing_time": "completed"
            }
            
            logger.info("Traitement du feedback terminé avec succès")
            return result
            
        except Exception as e:
            logger.error(f"Erreur lors du traitement du feedback: {e}")
            return {
                "success": False,
                "error": str(e),
                "original_strategy": original_strategy
            }

# Exemple d'utilisation
if __name__ == "__main__":
    # Configuration
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    
    # Initialisation de l'agent
    feedback_agent = HumanFeedbackAgent(GEMINI_API_KEY)
    
    # Exemple de stratégie
    example_strategy = {
        "objectifs": "Augmenter les ventes de 20% en 6 mois",
        "plan_action": [
            "1. Analyse du marché",
            "2. Optimisation du marketing digital",
            "3. Formation de l'équipe commerciale"
        ],
        "recommandations": [
            "Se concentrer sur les segments les plus rentables",
            "Investir dans les réseaux sociaux"
        ],
        "timing": "6 mois avec révisions mensuelles",
        "budget": "50000 euros"
    }
    
    # Exemple de feedback
    feedback = "Je pense que 6 mois c'est trop ambitieux, et le budget semble insuffisant pour les objectifs fixés. Pourriez-vous proposer un plan plus réaliste?"
    feedback_product = "La plateforme Momentum semble prometteuse, mais je trouve que la personnalisation du contenu pourrait être améliorée davantage. Actuellement, il semble que l'accent soit mis sur la formation individuelle, mais pour qu'elle soit plus efficace dans un environnement professionnel, il serait intéressant de renforcer les aspects de collaboration et de partage de connaissances. De plus, les rappels de calendrier peuvent devenir trop nombreux et perturbants si trop de sessions sont programmées d'un coup. Peut-être faudrait-il un système de priorisation des modules à recommander. Enfin, l'intégration avec les plateformes RH pourrait être plus intuitive, car certaines entreprises utilisent des outils différents de Workday ou BambooHR."
    final_product= recommend()
    # Traitement
    result = feedback_agent.process_feedback(final_product, feedback_product)

    if result["success"]:
        print("✅ Stratégie ajustée avec succès!")
        print(f"Sentiment du feedback: {result['feedback_analysis']['sentiment']}")
        print(f"Ajustements appliqués: {result['adjustments_applied']}")
        print("\n📋 Stratégie ajustée:")
        print(json.dumps(result["adjusted_strategy"], indent=2, ensure_ascii=False))
    else:
        print(f"❌ Erreur: {result['error']}")