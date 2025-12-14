"""
Recommendations System
نظام التوصيات للتقويم الذكي
"""

from firebase_functions import https_fn, options
from datetime import datetime
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)


# ============================================
# Recommendation Engine
# ============================================

class RecommendationEngine:
    """محرك التوصيات"""
    
    @classmethod
    def generate_recommendations(cls, behavior: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        إنشاء توصيات بناءً على سلوك المستخدم
        
        Args:
            behavior: بيانات سلوك المستخدم
        
        Returns:
            List[Dict]: قائمة التوصيات
        """
        recommendations = []
        
        # 1. توصيات الجدولة
        schedule_recs = cls._get_schedule_recommendations(behavior)
        recommendations.extend(schedule_recs)
        
        # 2. توصيات الإنتاجية
        productivity_recs = cls._get_productivity_recommendations(behavior)
        recommendations.extend(productivity_recs)
        
        # 3. توصيات الصحة
        wellness_recs = cls._get_wellness_recommendations(behavior)
        recommendations.extend(wellness_recs)
        
        # 4. توصيات الأهداف
        goal_recs = cls._get_goal_recommendations(behavior)
        recommendations.extend(goal_recs)
        
        # ترتيب حسب الأولوية والثقة
        priority_order = {"high": 0, "medium": 1, "low": 2}
        recommendations.sort(
            key=lambda x: (priority_order.get(x.get("priority", "low"), 2), -x.get("confidence", 0))
        )
        
        return recommendations
    
    @classmethod
    def _get_schedule_recommendations(cls, behavior: Dict[str, Any]) -> List[Dict[str, Any]]:
        """توصيات تحسين الجدولة"""
        recommendations = []
        task_patterns = behavior.get("taskPatterns", {})
        completion_rate = behavior.get("completionRate", 0)
        
        # إيجاد أفضل الساعات
        completed_by_hour = task_patterns.get("completedByHour", {})
        failed_by_hour = task_patterns.get("failedByHour", {})
        
        best_hours = cls._find_best_hours(completed_by_hour)
        worst_hours = cls._find_worst_hours(failed_by_hour)
        
        if best_hours:
            recommendations.append({
                "id": f"schedule-best-hours-{int(datetime.utcnow().timestamp() * 1000)}",
                "type": "schedule",
                "priority": "high",
                "title": "أفضل أوقات الإنتاجية",
                "description": f"بناءً على بياناتك، أنت أكثر إنتاجية في الساعة {cls._format_hours(best_hours)}. ننصح بجدولة المهام المهمة في هذه الأوقات.",
                "action": {
                    "type": "suggest_schedule",
                    "params": {"preferredHours": best_hours}
                },
                "confidence": 0.85
            })
        
        if worst_hours and completion_rate < 0.7:
            recommendations.append({
                "id": f"schedule-avoid-hours-{int(datetime.utcnow().timestamp() * 1000)}",
                "type": "schedule",
                "priority": "medium",
                "title": "تجنب هذه الأوقات",
                "description": f"لاحظنا أنك تواجه صعوبة في إكمال المهام في الساعة {cls._format_hours(worst_hours)}. حاول تجنب جدولة مهام مهمة في هذه الأوقات.",
                "confidence": 0.75
            })
        
        return recommendations
    
    @classmethod
    def _get_productivity_recommendations(cls, behavior: Dict[str, Any]) -> List[Dict[str, Any]]:
        """توصيات الإنتاجية"""
        recommendations = []
        completion_rate = behavior.get("completionRate", 0)
        task_patterns = behavior.get("taskPatterns", {})
        streak = behavior.get("streak", 0)
        
        if completion_rate < 0.5:
            recommendations.append({
                "id": f"productivity-low-{int(datetime.utcnow().timestamp() * 1000)}",
                "type": "productivity",
                "priority": "high",
                "title": "تحسين معدل الإنجاز",
                "description": "معدل إنجازك منخفض. جرب تقسيم المهام الكبيرة إلى مهام أصغر، أو استخدم تقنية بومودورو.",
                "action": {
                    "type": "enable_pomodoro",
                    "params": {"duration": 25, "breakDuration": 5}
                },
                "confidence": 0.9
            })
        elif completion_rate >= 0.8:
            recommendations.append({
                "id": f"productivity-great-{int(datetime.utcnow().timestamp() * 1000)}",
                "type": "productivity",
                "priority": "low",
                "title": "أداء ممتاز! 🎉",
                "description": f"معدل إنجازك {round(completion_rate * 100)}%! استمر على هذا المستوى.",
                "confidence": 1.0
            })
        
        # تحسين مدة المهام
        avg_duration = task_patterns.get("avgDuration", 0)
        if avg_duration > 90:
            recommendations.append({
                "id": f"productivity-duration-{int(datetime.utcnow().timestamp() * 1000)}",
                "type": "productivity",
                "priority": "medium",
                "title": "تقسيم المهام الطويلة",
                "description": "متوسط مدة مهامك طويل. جرب تقسيمها إلى مهام أقصر (30-45 دقيقة) لتحسين التركيز.",
                "confidence": 0.8
            })
        
        # تحفيز الالتزام
        if streak >= 7:
            recommendations.append({
                "id": f"productivity-streak-{int(datetime.utcnow().timestamp() * 1000)}",
                "type": "productivity",
                "priority": "low",
                "title": f"سلسلة رائعة! {streak} أيام 🔥",
                "description": "أنت ملتزم بشكل ممتاز! حافظ على هذا المستوى.",
                "confidence": 1.0
            })
        
        return recommendations
    
    @classmethod
    def _get_wellness_recommendations(cls, behavior: Dict[str, Any]) -> List[Dict[str, Any]]:
        """توصيات الصحة"""
        recommendations = []
        task_patterns = behavior.get("taskPatterns", {})
        completed_by_hour = task_patterns.get("completedByHour", {})
        
        # فحص العمل في ساعات متأخرة
        late_night_hours = [22, 23, 0, 1, 2, 3]
        late_night_tasks = sum(completed_by_hour.get(str(h), 0) for h in late_night_hours)
        
        if late_night_tasks > 5:
            recommendations.append({
                "id": f"wellness-sleep-{int(datetime.utcnow().timestamp() * 1000)}",
                "type": "wellness",
                "priority": "high",
                "title": "احرص على النوم الكافي",
                "description": "لاحظنا أنك تعمل في ساعات متأخرة بشكل متكرر. حاول إنهاء مهامك قبل الساعة 10 مساءً للحصول على نوم أفضل.",
                "confidence": 0.85
            })
        
        # فحص العمل المستمر
        total_tasks = sum(completed_by_hour.values())
        if total_tasks > 10:
            recommendations.append({
                "id": f"wellness-breaks-{int(datetime.utcnow().timestamp() * 1000)}",
                "type": "wellness",
                "priority": "medium",
                "title": "لا تنسَ الاستراحات",
                "description": "أنت نشيط جداً! تذكر أخذ فترات راحة قصيرة بين المهام للحفاظ على تركيزك وصحتك.",
                "confidence": 0.7
            })
        
        return recommendations
    
    @classmethod
    def _get_goal_recommendations(cls, behavior: Dict[str, Any]) -> List[Dict[str, Any]]:
        """توصيات الأهداف"""
        recommendations = []
        completion_rate = behavior.get("completionRate", 0)
        streak = behavior.get("streak", 0)
        
        # اقتراح تحديد أهداف
        if streak < 3 and completion_rate < 0.6:
            recommendations.append({
                "id": f"goal-set-{int(datetime.utcnow().timestamp() * 1000)}",
                "type": "goal",
                "priority": "medium",
                "title": "حدد أهدافك",
                "description": "ضع أهدافاً واضحة وقابلة للقياس لتحسين التزامك. ابدأ بهدف صغير: أكمل مهمة واحدة على الأقل يومياً.",
                "action": {
                    "type": "set_goal",
                    "params": {"type": "daily_minimum", "value": 1}
                },
                "confidence": 0.8
            })
        
        # الاحتفال بالتقدم
        if completion_rate >= 0.7 and streak >= 5:
            recommendations.append({
                "id": f"goal-progress-{int(datetime.utcnow().timestamp() * 1000)}",
                "type": "goal",
                "priority": "low",
                "title": "تقدم ملحوظ! 🌟",
                "description": "أنت تحقق تقدماً رائعاً نحو أهدافك. ربما حان الوقت لتحدي نفسك بأهداف أكبر!",
                "action": {
                    "type": "suggest_challenge",
                    "params": {"type": "increase_tasks"}
                },
                "confidence": 0.75
            })
        
        return recommendations
    
    @staticmethod
    def _find_best_hours(completed_by_hour: Dict) -> List[int]:
        """إيجاد أفضل ساعات الإنجاز"""
        entries = [
            {"hour": int(h), "count": c}
            for h, c in completed_by_hour.items()
            if c > 0
        ]
        entries.sort(key=lambda x: x["count"], reverse=True)
        return [e["hour"] for e in entries[:3]]
    
    @staticmethod
    def _find_worst_hours(failed_by_hour: Dict) -> List[int]:
        """إيجاد أسوأ ساعات الإنجاز"""
        entries = [
            {"hour": int(h), "count": c}
            for h, c in failed_by_hour.items()
            if c > 0
        ]
        entries.sort(key=lambda x: x["count"], reverse=True)
        return [e["hour"] for e in entries[:2]]
    
    @staticmethod
    def _format_hours(hours: List[int]) -> str:
        """تنسيق الساعات للعرض"""
        formatted = []
        for h in hours:
            if h == 0:
                formatted.append("12 ص")
            elif h == 12:
                formatted.append("12 م")
            elif h < 12:
                formatted.append(f"{h} ص")
            else:
                formatted.append(f"{h - 12} م")
        return "، ".join(formatted)
    
    @classmethod
    def suggest_schedule(
        cls,
        behavior: Dict[str, Any],
        task_duration: int = 60,
        priority: str = "medium"
    ) -> List[Dict[str, Any]]:
        """
        اقتراح جدول مثالي للمهمة
        
        Args:
            behavior: بيانات سلوك المستخدم
            task_duration: مدة المهمة بالدقائق
            priority: أولوية المهمة
        
        Returns:
            List[Dict]: قائمة الاقتراحات
        """
        suggestions = []
        task_patterns = behavior.get("taskPatterns", {})
        completed_by_hour = task_patterns.get("completedByHour", {})
        best_hours = cls._find_best_hours(completed_by_hour)
        
        # للمهام ذات الأولوية العالية، اقتراح أفضل الساعات
        if priority == "high" and best_hours:
            for hour in best_hours:
                suggestions.append({
                    "time": f"{str(hour).zfill(2)}:00",
                    "reason": "وقت إنتاجيتك العالية",
                    "confidence": 0.9
                })
        
        # اقتراحات افتراضية
        default_good_hours = [9, 10, 11, 14, 15, 16]
        for hour in default_good_hours:
            if hour not in best_hours:
                suggestions.append({
                    "time": f"{str(hour).zfill(2)}:00",
                    "reason": "وقت عمل مناسب",
                    "confidence": 0.6
                })
        
        return suggestions[:5]


# ============================================
# Firebase Functions
# ============================================

@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["POST", "OPTIONS"],
    ),
    memory=options.MemoryOption.MB_256,
    timeout_sec=30
)
def getRecommendations(req: https_fn.CallableRequest) -> dict:
    """
    الحصول على توصيات
    
    المعاملات:
        behavior (dict): بيانات سلوك المستخدم
    """
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="يجب تسجيل الدخول"
        )
    
    data = req.data
    behavior = data.get("behavior", {})
    
    if not behavior:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="بيانات السلوك مطلوبة"
        )
    
    try:
        logger.info(f"Generating recommendations for user {req.auth.uid}")
        
        behavior["userId"] = req.auth.uid
        recommendations = RecommendationEngine.generate_recommendations(behavior)
        
        return {
            "success": True,
            "recommendations": recommendations,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Recommendation error: {e}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"خطأ في إنشاء التوصيات: {str(e)}"
        )


@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["POST", "OPTIONS"],
    ),
    memory=options.MemoryOption.MB_128,
    timeout_sec=15
)
def suggestSchedule(req: https_fn.CallableRequest) -> dict:
    """
    اقتراح جدول للمهمة
    
    المعاملات:
        behavior (dict): بيانات سلوك المستخدم
        taskDuration (int): مدة المهمة بالدقائق
        priority (str): أولوية المهمة
    """
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="يجب تسجيل الدخول"
        )
    
    data = req.data
    behavior = data.get("behavior", {})
    task_duration = data.get("taskDuration", 60)
    priority = data.get("priority", "medium")
    
    if not behavior:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="بيانات السلوك مطلوبة"
        )
    
    try:
        behavior["userId"] = req.auth.uid
        suggestions = RecommendationEngine.suggest_schedule(
            behavior,
            task_duration,
            priority
        )
        
        return {
            "success": True,
            "suggestions": suggestions,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Schedule suggestion error: {e}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"خطأ في اقتراح الجدول: {str(e)}"
        )

