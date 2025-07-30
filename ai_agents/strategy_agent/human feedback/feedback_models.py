# models/feedback_models.py

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

class FeedbackSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class FeedbackCategory(Enum):
    STRATEGIC = "strategic"
    OPERATIONAL = "operational"
    FINANCIAL = "financial"
    TEMPORAL = "temporal"
    RESOURCE = "resource"
    MARKET = "market"

class FeedbackRequest(BaseModel):
    """Modèle pour les requêtes de feedback"""
    strategy_id: str = Field(..., description="ID unique de la stratégie")
    human_feedback: str = Field(..., min_length=10, description="Feedback de l'utilisateur")
    user_id: Optional[str] = Field(None, description="ID de l'utilisateur")
    timestamp: datetime = Field(default_factory=datetime.now)
    context: Optional[Dict[str, Any]] = Field(None, description="Contexte supplémentaire")

class FeedbackAnalysisResult(BaseModel):
    """Résultat de l'analyse du feedback"""
    sentiment: str = Field(..., description="Sentiment général (positif/négatif/neutre/mixte)")
    feedback_type: str = Field(..., description="Type de feedback")
    severity: FeedbackSeverity = Field(..., description="Sévérité du feedback")
    category: FeedbackCategory = Field(..., description="Catégorie principale")
    key_issues: List[str] = Field(default_factory=list, description="Problèmes identifiés")
    suggestions: List[str] = Field(default_factory=list, description="Suggestions extraites")
    affected_components: List[str] = Field(default_factory=list, description="Composants affectés")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Score de confiance")
    processing_time_ms: Optional[int] = Field(None, description="Temps de traitement en ms")

class StrategyAdjustmentDetail(BaseModel):
    """Détail d'un ajustement de stratégie"""
    component: str = Field(..., description="Composant ajusté")
    original_content: str = Field(..., description="Contenu original")
    adjusted_content: str = Field(..., description="Contenu ajusté")
    reason: str = Field(..., description="Raison de l'ajustement")
    priority: int = Field(..., ge=1, le=5, description="Priorité (1=haute, 5=basse)")
    impact_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="Score d'impact estimé")

class StrategyValidation(BaseModel):
    """Validation de la stratégie ajustée"""
    validation_score: float = Field(..., ge=0.0, le=10.0, description="Score de validation")
    is_valid: bool = Field(..., description="Stratégie valide ou non")
    coherence_score: float = Field(..., ge=0.0, le=1.0, description="Score de cohérence")
    feasibility_score: float = Field(..., ge=0.0, le=1.0, description="Score de faisabilité")
    comments: List[str] = Field(default_factory=list, description="Commentaires de validation")
    recommendations: List[str] = Field(default_factory=list, description="Recommandations d'amélioration")
    validated_at: datetime = Field(default_factory=datetime.now)

class FeedbackProcessingResult(BaseModel):
    """Résultat complet du traitement du feedback"""
    success: bool = Field(..., description="Succès du traitement")
    strategy_id: str = Field(..., description="ID de la stratégie")
    original_strategy: Dict[str, Any] = Field(..., description="Stratégie originale")
    adjusted_strategy: Optional[Dict[str, Any]] = Field(None, description="Stratégie ajustée")
    feedback_analysis: FeedbackAnalysisResult = Field(..., description="Analyse du feedback")
    adjustments: List[StrategyAdjustmentDetail] = Field(default_factory=list, description="Ajustements appliqués")
    validation: Optional[StrategyValidation] = Field(None, description="Validation de la stratégie")
    processing_metadata: Dict[str, Any] = Field(default_factory=dict, description="Métadonnées de traitement")
    error_message: Optional[str] = Field(None, description="Message d'erreur si échec")
    created_at: datetime = Field(default_factory=datetime.now)

class FeedbackHistory(BaseModel):
    """Historique des feedbacks pour une stratégie"""
    strategy_id: str = Field(..., description="ID de la stratégie")
    feedback_sessions: List[FeedbackProcessingResult] = Field(default_factory=list)
    total_iterations: int = Field(default=0, description="Nombre total d'itérations")
    improvement_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="Score d'amélioration global")
    last_updated: datetime = Field(default_factory=datetime.now)

# Modèles pour l'API
class FeedbackAPIRequest(BaseModel):
    """Requête API pour le traitement de feedback"""
    strategy: Dict[str, Any] = Field(..., description="Stratégie à ajuster")
    feedback: str = Field(..., min_length=10, description="Feedback utilisateur")
    options: Optional[Dict[str, Any]] = Field(None, description="Options de traitement")

class FeedbackAPIResponse(BaseModel):
    """Réponse API du traitement de feedback"""
    success: bool
    data: Optional[FeedbackProcessingResult] = None
    error: Optional[str] = None
    request_id: str = Field(..., description="ID unique de la requête")
    timestamp: datetime = Field(default_factory=datetime.now)