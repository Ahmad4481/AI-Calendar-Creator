"""
User Behavior Analytics
تحليل سلوك المستخدم وتتبع الأداء
"""

from firebase_functions import https_fn, options
from datetime import datetime
from typing import Dict, List, Any, Optional
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


# ============================================
# Types
# ============================================

VALID_EVENT_TYPES = [
    "task_created",
    "task_completed", 
    "task_failed",
    "task_rescheduled",
    "session_start",
    "session_end"
]


# ============================================
# Analytics Engine
# ============================================

class AnalyticsEngine:
    """محرك التحليلات"""
    
    @staticmethod
    def process_events(events: List[Dict]) -> Dict[str, Any]:
        """
        معالجة الأحداث وإنشاء التحليلات
        
        Args:
            events: قائمة الأحداث
        
        Returns:
            Dict: التحليلات المعالجة
        """
        analytics = {
            "totalTasks": 0,
            "completedTasks": 0,
            "failedTasks": 0,
            "rescheduledTasks": 0,
            "completionRate": 0,
            "avgTaskDuration": 0,
            "taskPatterns": {
                "completedByHour": defaultdict(int),
                "failedByHour": defaultdict(int),
                "completedByDay": defaultdict(int)
            }
        }
        
        durations = []
        
        for event in events:
            try:
                event_date = datetime.fromisoformat(event.get("timestamp", "").replace("Z", "+00:00"))
                hour = event_date.hour
                day = event_date.strftime("%A").lower()
                event_type = event.get("type", "")
                metadata = event.get("metadata", {})
                
                if event_type == "task_created":
                    analytics["totalTasks"] += 1
                    
                elif event_type == "task_completed":
                    analytics["completedTasks"] += 1
                    analytics["taskPatterns"]["completedByHour"][hour] += 1
                    analytics["taskPatterns"]["completedByDay"][day] += 1
                    
                    if metadata.get("duration") and isinstance(metadata["duration"], (int, float)):
                        durations.append(metadata["duration"])
                        
                elif event_type == "task_failed":
                    analytics["failedTasks"] += 1
                    analytics["taskPatterns"]["failedByHour"][hour] += 1
                    
                elif event_type == "task_rescheduled":
                    analytics["rescheduledTasks"] += 1
                    
            except Exception as e:
                logger.warning(f"Error processing event: {e}")
                continue
        
        # حساب معدل الإنجاز
        if analytics["totalTasks"] > 0:
            analytics["completionRate"] = analytics["completedTasks"] / analytics["totalTasks"]
        
        # حساب متوسط مدة المهمة
        if durations:
            analytics["avgTaskDuration"] = sum(durations) / len(durations)
        
        # تحويل defaultdict إلى dict عادي
        analytics["taskPatterns"]["completedByHour"] = dict(analytics["taskPatterns"]["completedByHour"])
        analytics["taskPatterns"]["failedByHour"] = dict(analytics["taskPatterns"]["failedByHour"])
        analytics["taskPatterns"]["completedByDay"] = dict(analytics["taskPatterns"]["completedByDay"])
        
        analytics["lastAnalyzed"] = datetime.utcnow().isoformat()
        
        return analytics
    
    @staticmethod
    def calculate_streak(events: List[Dict]) -> Dict[str, int]:
        """
        حساب أيام الالتزام المتتالية
        
        Args:
            events: قائمة الأحداث
        
        Returns:
            Dict: current و best streak
        """
        completed_days = set()
        
        for event in events:
            if event.get("type") == "task_completed":
                try:
                    date_str = event.get("timestamp", "")[:10]  # YYYY-MM-DD
                    completed_days.add(date_str)
                except Exception:
                    continue
        
        if not completed_days:
            return {"current": 0, "best": 0}
        
        sorted_days = sorted(completed_days, reverse=True)
        
        current_streak = 0
        best_streak = 0
        temp_streak = 0
        previous_date = None
        
        today = datetime.utcnow().date()
        
        for day_str in sorted_days:
            try:
                day = datetime.strptime(day_str, "%Y-%m-%d").date()
                
                if previous_date is None:
                    diff_from_today = (today - day).days
                    if diff_from_today <= 1:
                        current_streak = 1
                        temp_streak = 1
                    previous_date = day
                    continue
                
                diff_days = (previous_date - day).days
                
                if diff_days == 1:
                    temp_streak += 1
                    current_streak = max(current_streak, temp_streak)
                else:
                    temp_streak = 1
                
                best_streak = max(best_streak, temp_streak)
                previous_date = day
                
            except Exception:
                continue
        
        return {
            "current": current_streak,
            "best": max(best_streak, current_streak)
        }
    
    @staticmethod
    def find_productive_hours(completed_by_hour: Dict[int, int]) -> List[int]:
        """
        إيجاد أكثر الساعات إنتاجية
        
        Args:
            completed_by_hour: المهام المكتملة حسب الساعة
        
        Returns:
            List[int]: أفضل 3 ساعات
        """
        if not completed_by_hour:
            return []
        
        sorted_hours = sorted(
            completed_by_hour.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        return [int(hour) for hour, _ in sorted_hours[:3]]
    
    @staticmethod
    def generate_insights(analytics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        إنشاء رؤى من التحليلات
        
        Args:
            analytics: بيانات التحليلات
        
        Returns:
            List[Dict]: قائمة الرؤى
        """
        insights = []
        
        # رؤية معدل الإنجاز
        completion_rate = analytics.get("completionRate", 0)
        completion_percent = round(completion_rate * 100)
        
        if completion_percent >= 70:
            insight_type = "positive"
            description = "أداء ممتاز! استمر على هذا المستوى"
        elif completion_percent >= 40:
            insight_type = "neutral"
            description = "أداء متوسط، يمكنك تحسينه"
        else:
            insight_type = "negative"
            description = "يحتاج تحسين، جرب تقسيم المهام"
        
        insights.append({
            "type": insight_type,
            "category": "productivity",
            "title": "معدل الإنجاز",
            "value": f"{completion_percent}%",
            "description": description
        })
        
        # رؤية أيام الالتزام
        streak = analytics.get("streak", 0)
        
        if streak >= 7:
            insight_type = "positive"
            description = "التزام رائع! 🔥"
        elif streak >= 3:
            insight_type = "neutral"
            description = "بداية جيدة، استمر"
        else:
            insight_type = "negative"
            description = "حاول الالتزام يومياً"
        
        insights.append({
            "type": insight_type,
            "category": "consistency",
            "title": "أيام الالتزام",
            "value": streak,
            "description": description
        })
        
        # رؤية أفضل وقت للإنتاجية
        productive_hours = analytics.get("productiveHours", [])
        if productive_hours:
            best_hour = productive_hours[0]
            if best_hour < 12:
                hour_display = f"{best_hour} ص"
            elif best_hour == 12:
                hour_display = "12 م"
            else:
                hour_display = f"{best_hour - 12} م"
            
            insights.append({
                "type": "positive",
                "category": "timing",
                "title": "أفضل وقت للإنتاجية",
                "value": hour_display,
                "description": f"أكثر إنتاجيتك في الساعة {hour_display}"
            })
        
        # رؤية إجمالي المهام
        total_tasks = analytics.get("totalTasks", 0)
        insights.append({
            "type": "neutral",
            "category": "progress",
            "title": "إجمالي المهام",
            "value": total_tasks,
            "description": f"أنشأت {total_tasks} مهمة حتى الآن"
        })
        
        # رؤية متوسط مدة المهمة
        avg_duration = analytics.get("avgTaskDuration", 0)
        if avg_duration > 0:
            avg_minutes = round(avg_duration)
            
            if avg_minutes <= 45:
                insight_type = "positive"
                description = "مدة مثالية للتركيز"
            elif avg_minutes <= 90:
                insight_type = "neutral"
                description = "مدة مقبولة"
            else:
                insight_type = "negative"
                description = "جرب تقسيم المهام الطويلة"
            
            insights.append({
                "type": insight_type,
                "category": "productivity",
                "title": "متوسط مدة المهمة",
                "value": f"{avg_minutes} دقيقة",
                "description": description
            })
        
        return insights


# ============================================
# Firebase Functions
# ============================================

@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["POST", "OPTIONS"],
    ),
    memory=options.MemoryOption.MB_128,
    timeout_sec=10
)
def trackBehavior(req: https_fn.CallableRequest) -> dict:
    """
    تتبع سلوك المستخدم
    
    المعاملات:
        eventType (str): نوع الحدث
        metadata (dict): بيانات إضافية
    """
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="يجب تسجيل الدخول"
        )
    
    data = req.data
    event_type = data.get("eventType", "")
    metadata = data.get("metadata", {})
    
    if not event_type or event_type not in VALID_EVENT_TYPES:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="نوع الحدث غير صالح"
        )
    
    try:
        event = {
            "type": event_type,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata
        }
        
        logger.info(f"Behavior tracked: {event_type}", extra={
            "userId": req.auth.uid,
            "event": event
        })
        
        return {
            "success": True,
            "eventId": f"{event_type}_{int(datetime.utcnow().timestamp() * 1000)}",
            "timestamp": event["timestamp"]
        }
        
    except Exception as e:
        logger.error(f"Tracking error: {e}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"خطأ في تتبع السلوك: {str(e)}"
        )


@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["POST", "OPTIONS"],
    ),
    memory=options.MemoryOption.MB_256,
    timeout_sec=30
)
def getAnalytics(req: https_fn.CallableRequest) -> dict:
    """
    الحصول على تحليلات المستخدم
    
    المعاملات:
        events (list): قائمة الأحداث
    """
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="يجب تسجيل الدخول"
        )
    
    data = req.data
    events = data.get("events", [])
    
    if not events or not isinstance(events, list):
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="الأحداث مطلوبة"
        )
    
    try:
        # معالجة الأحداث
        base_analytics = AnalyticsEngine.process_events(events)
        
        # حساب أيام الالتزام
        streak_data = AnalyticsEngine.calculate_streak(events)
        
        # إيجاد أكثر الساعات إنتاجية
        productive_hours = AnalyticsEngine.find_productive_hours(
            base_analytics.get("taskPatterns", {}).get("completedByHour", {})
        )
        
        analytics = {
            "userId": req.auth.uid,
            "totalTasks": base_analytics.get("totalTasks", 0),
            "completedTasks": base_analytics.get("completedTasks", 0),
            "failedTasks": base_analytics.get("failedTasks", 0),
            "rescheduledTasks": base_analytics.get("rescheduledTasks", 0),
            "completionRate": base_analytics.get("completionRate", 0),
            "avgTaskDuration": base_analytics.get("avgTaskDuration", 0),
            "streak": streak_data["current"],
            "bestStreak": streak_data["best"],
            "productiveHours": productive_hours,
            "taskPatterns": base_analytics.get("taskPatterns", {}),
            "lastAnalyzed": datetime.utcnow().isoformat()
        }
        
        # إنشاء الرؤى
        insights = AnalyticsEngine.generate_insights(analytics)
        
        logger.info(f"Analytics generated for user {req.auth.uid}")
        
        return {
            "success": True,
            "analytics": analytics,
            "insights": insights,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Analytics error: {e}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"خطأ في تحليل البيانات: {str(e)}"
        )


@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["POST", "OPTIONS"],
    ),
    memory=options.MemoryOption.MB_128,
    timeout_sec=15
)
def getInsights(req: https_fn.CallableRequest) -> dict:
    """
    الحصول على رؤى من التحليلات
    
    المعاملات:
        analytics (dict): بيانات التحليلات
    """
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="يجب تسجيل الدخول"
        )
    
    data = req.data
    analytics = data.get("analytics", {})
    
    if not analytics:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="البيانات التحليلية مطلوبة"
        )
    
    try:
        analytics["userId"] = req.auth.uid
        insights = AnalyticsEngine.generate_insights(analytics)
        
        return {
            "success": True,
            "insights": insights,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Insights error: {e}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"خطأ في إنشاء الرؤى: {str(e)}"
        )

