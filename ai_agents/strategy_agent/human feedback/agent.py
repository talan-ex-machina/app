from typing import Dict, List, Any, Optional, TypedDict, Union
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from dataclasses import dataclass
from enum import Enum
import json
import logging
import os
from datetime import datetime
import sys
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

class StrategyElementType(Enum):
    TEXT = "text"
    LIST = "list"
    DICT = "dict"
    NUMBER = "number"
    BOOLEAN = "boolean"
    DATE = "date"
    COMPLEX = "complex"

@dataclass
class StrategyElement:
    """Représente un élément de stratégie avec ses métadonnées"""
    path: str  # Chemin dans la structure (ex: "budget.marketing.digital")
    value: Any
    element_type: StrategyElementType
    parent_path: Optional[str] = None
    description: Optional[str] = None

@dataclass
class FeedbackAnalysis:
    sentiment: str
    feedback_type: FeedbackType
    affected_elements: List[StrategyElement]
    key_issues: List[str]
    suggestions: List[str]
    confidence_score: float
    feedback_complexity: str  # simple, moderate, complex
    
@dataclass
class StrategyAdjustment:
    element_path: str
    original_value: Any
    adjusted_value: Any
    reason: str
    priority: int
    adjustment_type: str  # "modify", "add", "remove", "restructure"
    impact_level: str  # "low", "medium", "high"

class FeedbackState(TypedDict):
    original_strategy: Dict[str, Any]
    human_feedback: str
    strategy_structure: Dict[str, StrategyElement]
    feedback_analysis: Optional[FeedbackAnalysis]
    strategy_adjustments: List[StrategyAdjustment]
    adjusted_strategy: Optional[Dict[str, Any]]
    iteration_count: int
    processing_metadata: Dict[str, Any]

class GeneralizedHumanFeedbackAgent:
    def __init__(self, gemini_api_key: str = None, model_name: str = "gemini-2.0-flash-exp"):
        """
        Initialise l'agent de feedback humain généralisé
        
        Args:
            gemini_api_key: Clé API Gemini (utilise la variable d'environnement si None)
            model_name: Nom du modèle Gemini à utiliser
        """
        api_key = gemini_api_key or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY doit être fournie soit comme paramètre soit comme variable d'environnement")
            
        self.llm = ChatGoogleGenerativeAI(
            google_api_key=api_key,
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
        workflow.add_node("analyze_structure", self._analyze_strategy_structure)
        workflow.add_node("analyze_feedback", self._analyze_feedback)
        workflow.add_node("identify_elements", self._identify_affected_elements)
        workflow.add_node("generate_adjustments", self._generate_adjustments)
        workflow.add_node("apply_adjustments", self._apply_adjustments)
        workflow.add_node("validate_strategy", self._validate_adjusted_strategy)
        
        # Définition des transitions
        workflow.add_edge("analyze_structure", "analyze_feedback")
        workflow.add_edge("analyze_feedback", "identify_elements")
        workflow.add_edge("identify_elements", "generate_adjustments")
        workflow.add_edge("generate_adjustments", "apply_adjustments")
        workflow.add_edge("apply_adjustments", "validate_strategy")
        workflow.add_edge("validate_strategy", END)
        
        # Point d'entrée
        workflow.set_entry_point("analyze_structure")
        
        return workflow.compile()
    
    def _analyze_strategy_structure(self, state: FeedbackState) -> Dict[str, Any]:
        """Analyse la structure de la stratégie pour comprendre ses composants"""
        
        strategy = state["original_strategy"]
        structure_elements = {}
        
        def analyze_element(value: Any, path: str, parent_path: Optional[str] = None) -> StrategyElement:
            """Analyse récursivement chaque élément de la stratégie"""
            
            if isinstance(value, dict):
                element = StrategyElement(
                    path=path,
                    value=value,
                    element_type=StrategyElementType.DICT,
                    parent_path=parent_path
                )
                # Analyser les sous-éléments
                for key, sub_value in value.items():
                    sub_path = f"{path}.{key}" if path else key
                    analyze_element(sub_value, sub_path, path)
                    
            elif isinstance(value, list):
                element = StrategyElement(
                    path=path,
                    value=value,
                    element_type=StrategyElementType.LIST,
                    parent_path=parent_path
                )
                # Analyser les éléments de la liste
                for i, item in enumerate(value):
                    item_path = f"{path}[{i}]"
                    analyze_element(item, item_path, path)
                    
            elif isinstance(value, (int, float)):
                element = StrategyElement(
                    path=path,
                    value=value,
                    element_type=StrategyElementType.NUMBER,
                    parent_path=parent_path
                )
                
            elif isinstance(value, bool):
                element = StrategyElement(
                    path=path,
                    value=value,
                    element_type=StrategyElementType.BOOLEAN,
                    parent_path=parent_path
                )
                
            elif isinstance(value, str):
                # Détecter si c'est une date
                if self._is_date_string(value):
                    element = StrategyElement(
                        path=path,
                        value=value,
                        element_type=StrategyElementType.DATE,
                        parent_path=parent_path
                    )
                else:
                    element = StrategyElement(
                        path=path,
                        value=value,
                        element_type=StrategyElementType.TEXT,
                        parent_path=parent_path
                    )
            else:
                element = StrategyElement(
                    path=path,
                    value=value,
                    element_type=StrategyElementType.COMPLEX,
                    parent_path=parent_path
                )
            
            structure_elements[path] = element
            return element
        
        # Analyser la structure complète
        for key, value in strategy.items():
            analyze_element(value, key)
        
        logger.info(f"Structure analysée: {len(structure_elements)} éléments identifiés")
        
        return {**state, "strategy_structure": structure_elements}
    
    def _is_date_string(self, text: str) -> bool:
        """Détecte si une chaîne représente une date"""
        date_patterns = [
            r'\d{4}-\d{2}-\d{2}',  # YYYY-MM-DD
            r'\d{2}/\d{2}/\d{4}',  # DD/MM/YYYY
            r'\d{1,2} mois',        # X mois
            r'\d{1,2} ans?',        # X an(s)
            r'janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre'
        ]
        
        import re
        for pattern in date_patterns:
            if re.search(pattern, text.lower()):
                return True
        return False
    
    def _analyze_feedback(self, state: FeedbackState) -> Dict[str, Any]:
        """Analyse le feedback humain de manière générale"""
        
        feedback = state["human_feedback"]
        strategy_summary = self._generate_strategy_summary(state["original_strategy"])
        
        analysis_prompt = f"""
        Tu es un expert en analyse de feedback utilisateur pour les stratégies business. 
        Analyse ce feedback sur une stratégie quelconque :
        
        RÉSUMÉ DE LA STRATÉGIE: {strategy_summary}
        
        FEEDBACK UTILISATEUR: "{feedback}"
        
        Analyse ce feedback selon ces critères :
        
        1. SENTIMENT (positif/négatif/neutre/mixte)
        2. TYPE DE FEEDBACK (positive/negative/suggestion/question/mixed)
        3. COMPLEXITÉ DU FEEDBACK (simple/moderate/complex)
        4. PROBLÈMES IDENTIFIÉS (sois spécifique)
        5. SUGGESTIONS IMPLICITES OU EXPLICITES
        6. NIVEAU DE CONFIANCE dans ton analyse (0-1)
        
        Réponds en JSON structuré :
        {{
            "sentiment": "...",
            "feedback_type": "...",
            "feedback_complexity": "...",
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
                affected_elements=[],  # Sera rempli dans la prochaine étape
                key_issues=analysis_data["key_issues"],
                suggestions=analysis_data["suggestions"],
                confidence_score=analysis_data["confidence_score"],
                feedback_complexity=analysis_data.get("feedback_complexity", "moderate")
            )
            
            logger.info(f"Feedback analysé - Sentiment: {feedback_analysis.sentiment}, Confiance: {feedback_analysis.confidence_score}")
            
            return {**state, "feedback_analysis": feedback_analysis}
            
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse du feedback: {e}")
            # Analyse par défaut
            default_analysis = FeedbackAnalysis(
                sentiment="neutre",
                feedback_type=FeedbackType.MIXED,
                affected_elements=[],
                key_issues=["Analyse automatique échouée"],
                suggestions=["Réviser le feedback manuellement"],
                confidence_score=0.1,
                feedback_complexity="moderate"
            )
            return {**state, "feedback_analysis": default_analysis}
    
    def _generate_strategy_summary(self, strategy: Dict[str, Any]) -> str:
        """Génère un résumé de la stratégie pour le contexte"""
        try:
            summary_parts = []
            
            def summarize_element(key: str, value: Any, depth: int = 0) -> str:
                indent = "  " * depth
                if isinstance(value, dict):
                    sub_items = [f"{k}: {type(v).__name__}" for k, v in value.items()]
                    return f"{indent}{key}: {{{', '.join(sub_items[:3])}{', ...' if len(sub_items) > 3 else '}'}"
                elif isinstance(value, list):
                    return f"{indent}{key}: liste de {len(value)} éléments"
                else:
                    preview = str(value)[:50] + "..." if len(str(value)) > 50 else str(value)
                    return f"{indent}{key}: {preview}"
            
            for key, value in strategy.items():
                summary_parts.append(summarize_element(key, value))
            
            return "\n".join(summary_parts)
            
        except Exception:
            return "Structure complexe non résumable"
    
    def _identify_affected_elements(self, state: FeedbackState) -> Dict[str, Any]:
        """Identifie quels éléments de la stratégie sont affectés par le feedback"""
        
        feedback = state["human_feedback"]
        structure_elements = state["strategy_structure"]
        feedback_analysis = state["feedback_analysis"]
        
        # Créer une liste descriptive des éléments pour l'IA
        elements_description = []
        for path, element in structure_elements.items():
            description = f"- {path} ({element.element_type.value}): {str(element.value)[:100]}..."
            elements_description.append(description)
        
        identification_prompt = f"""
        Tu es un expert en analyse de stratégies. Identifie quels éléments spécifiques de cette stratégie 
        sont affectés par le feedback utilisateur.
        
        FEEDBACK: "{feedback}"
        
        PROBLÈMES IDENTIFIÉS: {feedback_analysis.key_issues}
        SUGGESTIONS: {feedback_analysis.suggestions}
        
        ÉLÉMENTS DE LA STRATÉGIE:
        {chr(10).join(elements_description)}
        
        Retourne une liste JSON des chemins d'éléments affectés (exemple: ["budget", "timeline.duration", "objectives[0]"]):
        """
        
        try:
            response = self.llm.invoke(identification_prompt)
            affected_paths = json.loads(response.content)
            
            # Filtrer les chemins valides et créer les éléments affectés
            affected_elements = []
            for path in affected_paths:
                if path in structure_elements:
                    affected_elements.append(structure_elements[path])
                else:
                    # Recherche approximative pour les chemins partiels
                    for element_path, element in structure_elements.items():
                        if path in element_path or element_path in path:
                            affected_elements.append(element)
                            break
            
            feedback_analysis.affected_elements = affected_elements
            
            logger.info(f"Éléments affectés identifiés: {[e.path for e in affected_elements]}")
            
            return {**state, "feedback_analysis": feedback_analysis}
            
        except Exception as e:
            logger.error(f"Erreur lors de l'identification des éléments: {e}")
            # Par défaut, sélectionner les premiers éléments
            feedback_analysis.affected_elements = list(structure_elements.values())[:3]
            return {**state, "feedback_analysis": feedback_analysis}
    
    def _generate_adjustments(self, state: FeedbackState) -> Dict[str, Any]:
        """Génère les ajustements spécifiques pour chaque élément affecté"""
        
        feedback_analysis = state["feedback_analysis"]
        original_strategy = state["original_strategy"]
        feedback = state["human_feedback"]
        
        adjustments = []
        
        for element in feedback_analysis.affected_elements:
            adjustment_prompt = f"""
            Tu es un consultant en stratégie. Génère un ajustement spécifique pour l'élément de stratégie suivant 
            basé sur le feedback utilisateur.
            
            FEEDBACK UTILISATEUR: "{feedback}"
            PROBLÈMES IDENTIFIÉS: {feedback_analysis.key_issues}
            SUGGESTIONS: {feedback_analysis.suggestions}
            
            ÉLÉMENT À AJUSTER:
            - Chemin: {element.path}
            - Type: {element.element_type.value}
            - Valeur actuelle: {element.value}
            
            Génère un ajustement en JSON :
            {{
                "original_value": "valeur actuelle...",
                "adjusted_value": "valeur ajustée...",
                "reason": "explication détaillée de l'ajustement...",
                "priority": 1-5,
                "adjustment_type": "modify/add/remove/restructure",
                "impact_level": "low/medium/high"
            }}
            
            IMPORTANT: 
            - La valeur ajustée doit respecter le type d'origine
            - L'ajustement doit être spécifique et actionnable
            - Maintenir la cohérence avec le reste de la stratégie
            """
            
            try:
                response = self.llm.invoke(adjustment_prompt)
                adjustment_data = json.loads(response.content)
                
                adjustment = StrategyAdjustment(
                    element_path=element.path,
                    original_value=adjustment_data["original_value"],
                    adjusted_value=adjustment_data["adjusted_value"],
                    reason=adjustment_data["reason"],
                    priority=adjustment_data["priority"],
                    adjustment_type=adjustment_data.get("adjustment_type", "modify"),
                    impact_level=adjustment_data.get("impact_level", "medium")
                )
                
                adjustments.append(adjustment)
                logger.info(f"Ajustement généré pour {element.path} (priorité: {adjustment.priority})")
                
            except Exception as e:
                logger.error(f"Erreur lors de la génération d'ajustement pour {element.path}: {e}")
                continue
        
        # Tri par priorité et impact
        adjustments.sort(key=lambda x: (x.priority, {"high": 1, "medium": 2, "low": 3}[x.impact_level]))
        
        return {**state, "strategy_adjustments": adjustments}
    
    def _apply_adjustments(self, state: FeedbackState) -> Dict[str, Any]:
        """Applique les ajustements à la stratégie de manière intelligente"""
        
        adjusted_strategy = self._deep_copy_strategy(state["original_strategy"])
        adjustments = state["strategy_adjustments"]
        
        applied_adjustments = []
        
        for adjustment in adjustments:
            try:
                success = self._apply_single_adjustment(adjusted_strategy, adjustment)
                if success:
                    applied_adjustments.append(adjustment)
                    logger.info(f"Ajustement appliqué avec succès: {adjustment.element_path}")
                else:
                    logger.warning(f"Échec de l'application de l'ajustement: {adjustment.element_path}")
                    
            except Exception as e:
                logger.error(f"Erreur lors de l'application de l'ajustement {adjustment.element_path}: {e}")
        
        # Ajout des métadonnées
        metadata = {
            "adjustments_applied": len(applied_adjustments),
            "total_adjustments_attempted": len(adjustments),
            "iteration": state.get("iteration_count", 1),
            "feedback_confidence": state["feedback_analysis"].confidence_score,
            "feedback_complexity": state["feedback_analysis"].feedback_complexity,
            "adjustments_summary": [
                {
                    "path": adj.element_path,
                    "type": adj.adjustment_type,
                    "reason": adj.reason,
                    "priority": adj.priority,
                    "impact": adj.impact_level
                } for adj in applied_adjustments
            ],
            "timestamp": datetime.now().isoformat()
        }
        
        # Ajouter les métadonnées sans écraser la structure existante
        if isinstance(adjusted_strategy, dict):
            adjusted_strategy["_feedback_metadata"] = metadata
        
        return {
            **state, 
            "adjusted_strategy": adjusted_strategy,
            "processing_metadata": metadata
        }
    
    def _deep_copy_strategy(self, strategy: Any) -> Any:
        """Copie profonde de la stratégie"""
        if isinstance(strategy, dict):
            return {k: self._deep_copy_strategy(v) for k, v in strategy.items()}
        elif isinstance(strategy, list):
            return [self._deep_copy_strategy(item) for item in strategy]
        else:
            return strategy
    
    def _apply_single_adjustment(self, strategy: Dict[str, Any], adjustment: StrategyAdjustment) -> bool:
        """Applique un ajustement unique à la stratégie"""
        
        path_parts = adjustment.element_path.split('.')
        current = strategy
        
        try:
            # Naviguer jusqu'au parent de l'élément à modifier
            for i, part in enumerate(path_parts[:-1]):
                if '[' in part and ']' in part:
                    # Gestion des indices de liste
                    key, index_str = part.split('[')
                    index = int(index_str.rstrip(']'))
                    current = current[key][index]
                else:
                    current = current[part]
            
            # Appliquer l'ajustement
            final_key = path_parts[-1]
            
            if '[' in final_key and ']' in final_key:
                # Gestion des indices de liste
                key, index_str = final_key.split('[')
                index = int(index_str.rstrip(']'))
                
                if adjustment.adjustment_type == "remove":
                    current[key].pop(index)
                elif adjustment.adjustment_type == "add":
                    current[key].insert(index, adjustment.adjusted_value)
                else:
                    current[key][index] = adjustment.adjusted_value
            else:
                if adjustment.adjustment_type == "remove":
                    current.pop(final_key, None)
                elif adjustment.adjustment_type == "add":
                    current[final_key] = adjustment.adjusted_value
                else:
                    current[final_key] = adjustment.adjusted_value
            
            return True
            
        except (KeyError, IndexError, ValueError, TypeError) as e:
            logger.error(f"Erreur lors de l'application de l'ajustement {adjustment.element_path}: {e}")
            return False
    
    def _validate_adjusted_strategy(self, state: FeedbackState) -> Dict[str, Any]:
        """Valide la cohérence de la stratégie ajustée de manière générale"""
        
        adjusted_strategy = state["adjusted_strategy"]
        original_strategy = state["original_strategy"]
        
        validation_prompt = f"""
        Tu es un expert en validation de stratégies. Évalue la qualité et la cohérence de cette stratégie ajustée 
        par rapport à l'originale.
        
        STRATÉGIE ORIGINALE: {json.dumps(original_strategy, indent=2, ensure_ascii=False)[:1000]}...
        
        STRATÉGIE AJUSTÉE: {json.dumps(adjusted_strategy, indent=2, ensure_ascii=False)[:1000]}...
        
        Évalue selon ces critères :
        1. Cohérence interne entre les différents éléments
        2. Préservation de la structure logique
        3. Réalisme et faisabilité des modifications
        4. Amélioration par rapport à l'original
        5. Complétude de l'information
        
        Retourne ton évaluation en JSON :
        {{
            "validation_score": 8.5,
            "is_valid": true,
            "coherence_score": 0.9,
            "improvement_score": 0.8,
            "feasibility_score": 0.85,
            "comments": ["commentaire1", "commentaire2"],
            "recommendations": ["amélioration1", "amélioration2"],
            "critical_issues": ["problème critique si il y en a"]
        }}
        """
        
        try:
            response = self.llm.invoke(validation_prompt)
            validation_data = json.loads(response.content)
            
            # Mise à jour des métadonnées
            processing_metadata = state.get("processing_metadata", {})
            processing_metadata["validation"] = validation_data
            
            # Ajout aux métadonnées de la stratégie si possible
            if isinstance(adjusted_strategy, dict) and "_feedback_metadata" in adjusted_strategy:
                adjusted_strategy["_feedback_metadata"]["validation"] = validation_data
            
            logger.info(f"Validation terminée - Score: {validation_data.get('validation_score', 'N/A')}/10")
            
            return {
                **state, 
                "adjusted_strategy": adjusted_strategy,
                "processing_metadata": processing_metadata
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de la validation: {e}")
            
            # Validation par défaut
            default_validation = {
                "validation_score": 6.0,
                "is_valid": True,
                "coherence_score": 0.7,
                "improvement_score": 0.6,
                "feasibility_score": 0.7,
                "comments": ["Validation automatique limitée"],
                "recommendations": ["Révision manuelle recommandée"],
                "critical_issues": []
            }
            
            processing_metadata = state.get("processing_metadata", {})
            processing_metadata["validation"] = default_validation
            
            return {
                **state,
                "processing_metadata": processing_metadata
            }
    
    def process_feedback(self, original_strategy: Union[Dict[str, Any], List, str], human_feedback: str) -> Dict[str, Any]:
        """
        Point d'entrée principal pour traiter le feedback humain sur n'importe quelle stratégie
        
        Args:
            original_strategy: La stratégie originale (peut être dict, list, ou autre structure)
            human_feedback: Le feedback de l'utilisateur
            
        Returns:
            Dict contenant la stratégie ajustée et toutes les métadonnées
        """
        
        # Normaliser la stratégie en dictionnaire si nécessaire
        if not isinstance(original_strategy, dict):
            if isinstance(original_strategy, list):
                normalized_strategy = {"strategy_elements": original_strategy}
            elif isinstance(original_strategy, str):
                normalized_strategy = {"strategy_content": original_strategy}
            else:
                normalized_strategy = {"strategy_data": original_strategy}
        else:
            normalized_strategy = original_strategy
        
        initial_state = FeedbackState(
            original_strategy=normalized_strategy,
            human_feedback=human_feedback,
            strategy_structure={},
            feedback_analysis=None,
            strategy_adjustments=[],
            adjusted_strategy=None,
            iteration_count=1,
            processing_metadata={}
        )
        
        logger.info(f"Démarrage du traitement du feedback pour une stratégie de type {type(original_strategy).__name__}")
        
        try:
            # Exécution du workflow
            final_state = self.workflow.invoke(initial_state)
            
            # Construction du résultat final
            result = {
                "success": True,
                "adjusted_strategy": final_state["adjusted_strategy"],
                "feedback_analysis": {
                    "sentiment": final_state["feedback_analysis"].sentiment,
                    "feedback_type": final_state["feedback_analysis"].feedback_type.value,
                    "complexity": final_state["feedback_analysis"].feedback_complexity,
                    "key_issues": final_state["feedback_analysis"].key_issues,
                    "suggestions": final_state["feedback_analysis"].suggestions,
                    "confidence_score": final_state["feedback_analysis"].confidence_score,
                    "affected_elements": [e.path for e in final_state["feedback_analysis"].affected_elements]
                },
                "processing_metadata": final_state["processing_metadata"],
                "strategy_structure_info": {
                    "total_elements": len(final_state["strategy_structure"]),
                    "element_types": list(set(e.element_type.value for e in final_state["strategy_structure"].values())),
                    "affected_elements_count": len(final_state["feedback_analysis"].affected_elements)
                }
            }
            
            logger.info("Traitement du feedback terminé avec succès")
            return result
            
        except Exception as e:
            logger.error(f"Erreur lors du traitement du feedback: {e}")
            return {
                "success": False,
                "error": str(e),
                "original_strategy": original_strategy,
                "feedback": human_feedback
            }

# Fonction utilitaire pour tester différents types de stratégies
def test_agent_with_different_strategies():
    """Teste l'agent avec différents types de stratégies"""
    
    feedback_agent = GeneralizedHumanFeedbackAgent()
    
    # Test 1: Stratégie business classique
    business_strategy = {
        "objectifs": "Augmenter les ventes de 20% en 6 mois",
        "plan_action": [
            "Analyse du marché",
            "Optimisation marketing",
            "Formation équipe"
        ],
        "budget": {"total": 50000, "marketing": 30000, "formation": 20000},
        "timeline": "6 mois",
        "kpis": ["chiffre d'affaires", "taux de conversion", "satisfaction client"]
    }
    
    # Test 2: Stratégie produit
    product_strategy = {
        "product_vision": "Plateforme d'apprentissage innovante",
        "features": {
            "core": ["personalisation", "analytics", "collaboration"],
            "advanced": ["AI recommendations", "integration APIs"]
        },
        "roadmap": [
            {"phase": "MVP", "duration": "3 mois", "features": ["core"]},
            {"phase": "V2", "duration": "6 mois", "features": ["advanced"]}
        ],
        "target_audience": {
            "primary": "Entreprises 50-500 employés",
            "secondary": "Consultants formation"
        }
    }
    
    # Test 3: Stratégie simple (liste)
    simple_strategy = [
        "Étape 1: Recherche marché",
        "Étape 2: Développement prototype",
        "Étape 3: Tests utilisateurs",
        "Étape 4: Lancement"
    ]
    
    feedback = "Cette approche semble trop ambitieuse en termes de délais. Il faudrait plus de réalisme dans la planification et prévoir des étapes intermédiaires de validation."
    
    # Tester chaque type
    strategies_to_test = [
        ("Business Strategy", business_strategy),
        ("Product Strategy", product_strategy),
        ("Simple Strategy", simple_strategy)
    ]
    
    for name, strategy in strategies_to_test:
        print(f"\n{'='*50}")
        print(f"Test: {name}")
        print(f"{'='*50}")
        
        result = feedback_agent.process_feedback(strategy, feedback)
        
        if result["success"]:
            print(f"✅ {name} ajustée avec succès!")
            print(f"   Sentiment: {result['feedback_analysis']['sentiment']}")
            print(f"   Éléments affectés: {len(result['feedback_analysis']['affected_elements'])}")
            print(f"   Ajustements: {result['processing_metadata']['adjustments_applied']}")
            print(f"   Score validation: {result['processing_metadata'].get('validation', {}).get('validation_score', 'N/A')}")
        else:
            print(f"❌ Erreur pour {name}: {result['error']}")

# Exemple d'utilisation avancée
if __name__ == "__main__":
    # Configuration
    try:
        # Initialisation de l'agent
        feedback_agent = GeneralizedHumanFeedbackAgent()
        
        # Exemple avec une stratégie complexe et imbriquée
        complex_strategy = {
            "meta_info": {
                "created_by": "Strategy Team",
                "version": "2.1",
                "last_updated": "2024-01-15"
            },
            "executive_summary": {
                "vision": "Devenir leader du marché EdTech B2B",
                "mission": "Transformer l'apprentissage professionnel",
                "core_values": ["Innovation", "Qualité", "Collaboration"]
            },
            "market_analysis": {
                "size": {"current": "5.2B€", "projected_2027": "12.8B€"},
                "competitors": [
                    {"name": "Cornerstone", "market_share": "15%", "strength": "Enterprise"},
                    {"name": "Coursera", "market_share": "12%", "strength": "Content"}
                ],
                "opportunities": ["Remote work growth", "AI integration", "Mobile learning"],
                "threats": ["Economic downturn", "New regulations"]
            },
            "product_strategy": {
                "current_products": {
                    "momentum_platform": {
                        "description": "Plateforme d'apprentissage personnalisée",
                        "status": "Production",
                        "users": 50000,
                        "revenue_contribution": "70%"
                    },
                    "analytics_suite": {
                        "description": "Outils d'analyse d'apprentissage",
                        "status": "Beta",
                        "users": 5000,
                        "revenue_contribution": "15%"
                    }
                },
                "roadmap": {
                    "q1_2024": ["AI recommendations", "Mobile app v2"],
                    "q2_2024": ["Advanced analytics", "API platform"],
                    "q3_2024": ["VR integration", "Marketplace launch"],
                    "q4_2024": ["Enterprise suite", "Global expansion"]
                }
            },
            "go_to_market": {
                "target_segments": {
                    "enterprise": {
                        "size": "500+ employees",
                        "budget": "100k+/year",
                        "decision_makers": ["CHRO", "L&D Director"],
                        "sales_cycle": "6-12 months"
                    },
                    "mid_market": {
                        "size": "50-500 employees", 
                        "budget": "20k-100k/year",
                        "decision_makers": ["HR Manager", "CEO"],
                        "sales_cycle": "3-6 months"
                    }
                },
                "channels": {
                    "direct_sales": {"target": "Enterprise", "team_size": 15},
                    "inside_sales": {"target": "Mid-market", "team_size": 8},
                    "partners": {"target": "SMB", "partners_count": 25},
                    "digital": {"target": "All", "monthly_budget": "50k€"}
                }
            },
            "financial_projections": {
                "revenue": {
                    "2024": {"q1": 2.5, "q2": 3.2, "q3": 4.1, "q4": 5.8},
                    "2025": {"target": 25.0, "growth_rate": "150%"},
                    "2026": {"target": 50.0, "growth_rate": "100%"}
                },
                "expenses": {
                    "personnel": {"2024": 8.5, "2025": 15.0, "2026": 25.0},
                    "marketing": {"2024": 3.0, "2025": 6.0, "2026": 10.0},
                    "technology": {"2024": 2.0, "2025": 3.5, "2026": 6.0},
                    "operations": {"2024": 1.5, "2025": 2.5, "2026": 4.0}
                }
            },
            "risk_management": {
                "identified_risks": [
                    {
                        "risk": "Key talent departure",
                        "probability": "Medium",
                        "impact": "High",
                        "mitigation": "Retention programs, knowledge transfer"
                    },
                    {
                        "risk": "Competition from Big Tech",
                        "probability": "High", 
                        "impact": "High",
                        "mitigation": "Differentiation strategy, niche focus"
                    },
                    {
                        "risk": "Economic recession",
                        "probability": "Medium",
                        "impact": "Medium",
                        "mitigation": "Diversified customer base, flexible pricing"
                    }
                ]
            },
            "success_metrics": {
                "financial": {
                    "arr": {"current": 12.0, "target_2025": 25.0},
                    "gross_margin": {"current": "75%", "target": "80%"},
                    "ltv_cac": {"current": 3.2, "target": 5.0}
                },
                "product": {
                    "user_engagement": {"dau_mau": 0.35, "target": 0.45},
                    "retention": {"month_1": "85%", "month_12": "65%", "target_12": "75%"},
                    "nps": {"current": 42, "target": 60}
                },
                "operational": {
                    "team_size": {"current": 85, "target_2025": 180},
                    "customer_acquisition": {"monthly": 150, "target": 300},
                    "support_satisfaction": {"current": "4.2/5", "target": "4.5/5"}
                }
            }
        }
        
        # Feedback complexe et nuancé
        complex_feedback = """
        J'ai analysé votre stratégie en détail et j'ai plusieurs observations importantes :
        
        1. CROISSANCE TROP AGGRESSIVE: Vos projections de croissance (150% puis 100%) semblent irréalistes compte tenu du contexte économique actuel. Les entreprises réduisent leurs budgets formation.
        
        2. ROADMAP PRODUIT SURCHARGÉE: Q3 2024 avec VR integration ET Marketplace launch simultanément ? C'est beaucoup trop ambitieux. La VR n'est pas encore mature pour l'EdTech corporate.
        
        3. POSITIONNEMENT CONCURRENTIEL: Vous sous-estimez Google Workspace for Education et Microsoft Viva Learning qui intègrent nativement l'apprentissage.
        
        4. SEGMENTATION CLIENT: La différence entre Enterprise et Mid-market n'est pas assez claire. Les budgets se chevauchent (100k vs 20k-100k).
        
        5. POINTS FORTS À EXPLOITER: Vos métriques d'engagement sont excellentes (DAU/MAU 0.35). C'est votre vraie différenciation face aux géants.
        
        RECOMMANDATIONS:
        - Revoir les projections à la baisse (100% puis 60% de croissance)
        - Reporter la VR à 2025, focus sur l'AI et analytics
        - Renforcer le message différenciation vs Big Tech
        - Clarifier la segmentation client
        - Capitaliser sur l'engagement utilisateur dans le messaging
        """
        
        print("🚀 Traitement d'une stratégie complexe avec feedback détaillé...")
        print("=" * 80)
        
        # Traitement du feedback
        result = feedback_agent.process_feedback(complex_strategy, complex_feedback)
        
        if result["success"]:
            print("✅ TRAITEMENT RÉUSSI!")
            print(f"📊 ANALYSE DU FEEDBACK:")
            print(f"   • Sentiment: {result['feedback_analysis']['sentiment']}")
            print(f"   • Type: {result['feedback_analysis']['feedback_type']}")
            print(f"   • Complexité: {result['feedback_analysis']['complexity']}")
            print(f"   • Score de confiance: {result['feedback_analysis']['confidence_score']:.2f}")
            print(f"   • Éléments affectés: {len(result['feedback_analysis']['affected_elements'])}")
            
            print(f"\n🔧 AJUSTEMENTS APPLIQUÉS:")
            metadata = result['processing_metadata']
            print(f"   • Ajustements réussis: {metadata['adjustments_applied']}/{metadata['total_adjustments_attempted']}")
            
            if 'validation' in metadata:
                validation = metadata['validation']
                print(f"\n✅ VALIDATION:")
                print(f"   • Score global: {validation.get('validation_score', 'N/A')}/10")
                print(f"   • Cohérence: {validation.get('coherence_score', 'N/A')}")
                print(f"   • Faisabilité: {validation.get('feasibility_score', 'N/A')}")
                print(f"   • Amélioration: {validation.get('improvement_score', 'N/A')}")
            
            print(f"\n📋 DÉTAILS DES AJUSTEMENTS:")
            for i, adj in enumerate(metadata.get('adjustments_summary', [])[:5], 1):
                print(f"   {i}. {adj['path']} ({adj['type']}) - Priorité: {adj['priority']}")
                print(f"      Raison: {adj['reason'][:80]}...")
            
            print(f"\n🎯 PROBLÈMES IDENTIFIÉS:")
            for issue in result['feedback_analysis']['key_issues'][:3]:
                print(f"   • {issue}")
            
            print(f"\n💡 SUGGESTIONS EXTRAITES:")
            for suggestion in result['feedback_analysis']['suggestions'][:3]:
                print(f"   • {suggestion}")
            
            # Affichage d'un échantillon de la stratégie ajustée
            print(f"\n📄 APERÇU STRATÉGIE AJUSTÉE:")
            adjusted = result['adjusted_strategy']
            if 'financial_projections' in adjusted:
                print("   Projections financières mises à jour:")
                revenue_2025 = adjusted['financial_projections']['revenue']['2025']
                print(f"   • Objectif 2025: {revenue_2025.get('target', 'N/A')}M€ (croissance: {revenue_2025.get('growth_rate', 'N/A')})")
            
        else:
            print(f"❌ ERREUR: {result['error']}")
        
        # Test de l'agent avec différents types de stratégies
        print(f"\n{'='*80}")
        print("🧪 TESTS AVEC DIFFÉRENTS TYPES DE STRATÉGIES")
        print("="*80)
        test_agent_with_different_strategies()
        
    except Exception as e:
        print(f"❌ Erreur lors de l'initialisation: {e}")
        print("Vérifiez que la variable d'environnement GEMINI_API_KEY est définie")