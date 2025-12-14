"""
Azure Personalizer Integration
التعلم التكيفي باستخدام Contextual Bandit
"""

from firebase_functions import https_fn, options
from datetime import datetime
from typing import Dict, List, Any, Optional
import random
import logging

logger = logging.getLogger(__name__)


# ============================================
# Personalizer Client (Local Implementation)
# For production, use Azure Personalizer API
# ============================================

class PersonalizerClient:
    """
    Contextual Bandit implementation for personalization
    يمكن استبداله بـ Azure Personalizer API في الإنتاج
    """
    
    def __init__(self, epsilon: float = 0.2):
        self.learning_data: Dict[str, float] = {}
        self.epsilon = epsilon  # معدل الاستكشاف
    
    def rank(
        self,
        context_features: Dict[str, Any],
        actions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        ترتيب الإجراءات بناءً على السياق
        
        Args:
            context_features: ميزات السياق
            actions: قائمة الإجراءات المتاحة
        
        Returns:
            Dict: الإجراء المختار والترتيب
        """
        # حساب النقاط لكل إجراء
        scored_actions = []
        for action in actions:
            score = self._calculate_score(action, context_features)
            scored_actions.append({"action": action, "score": score})
        
        # ترتيب تنازلي
        scored_actions.sort(key=lambda x: x["score"], reverse=True)
        
        # Epsilon-greedy exploration
        if random.random() < self.epsilon:
            # استكشاف: اختيار عشوائي
            selected_action = random.choice(actions)
        else:
            # استغلال: أفضل إجراء
            selected_action = scored_actions[0]["action"]
        
        # حساب الاحتمالات
        total_score = sum(max(sa["score"], 0.01) for sa in scored_actions)
        ranking = [
            {
                "id": sa["action"]["id"],
                "probability": max(sa["score"], 0.01) / total_score
            }
            for sa in scored_actions
        ]
        
        event_id = f"event_{int(datetime.utcnow().timestamp() * 1000)}_{random.randint(1000, 9999)}"
        
        return {
            "rewardActionId": selected_action["id"],
            "ranking": ranking,
            "eventId": event_id
        }
    
    def reward(self, event_id: str, reward_value: float) -> None:
        """
        تسجيل المكافأة للتعلم
        
        Args:
            event_id: معرف الحدث
            reward_value: قيمة المكافأة (0-1)
        """
        current_reward = self.learning_data.get(event_id, 0)
        self.learning_data[event_id] = current_reward + reward_value
        logger.info(f"Reward received: {event_id} = {reward_value}")
    
    def _calculate_score(
        self,
        action: Dict[str, Any],
        context: Dict[str, Any]
    ) -> float:
        """
        حساب النقاط للإجراء بناءً على السياق
        """
        score = 0.5  # النقطة الأساسية
        features = action.get("features", {})
        
        # مطابقة الوقت
        if features.get("bestTimeOfDay") == context.get("timeOfDay"):
            score += 0.3
        elif features.get("bestTimeOfDay") == "any":
            score += 0.1
        
        # مطابقة الإنتاجية
        required_productivity = features.get("requiredProductivity")
        user_productivity = context.get("userProductivity")
        
        if required_productivity == user_productivity:
            score += 0.2
        elif user_productivity == "high" and required_productivity == "medium":
            score += 0.1
        elif required_productivity == "any":
            score += 0.1
        
        # مطابقة نوع المهمة
        if features.get("taskType") == context.get("taskType"):
            score += 0.2
        elif features.get("taskType") == "any":
            score += 0.1
        
        # أنماط أيام الأسبوع
        weekend_days = ["friday", "saturday"]
        day_of_week = context.get("dayOfWeek", "").lower()
        
        if day_of_week in weekend_days:
            if features.get("suitableForWeekend"):
                score += 0.15
            else:
                score -= 0.1
        
        # إضافة عشوائية للاستكشاف
        score += (random.random() - 0.5) * 0.1
        
        return max(0, min(1, score))


# Singleton instance
personalizer_client = PersonalizerClient()


# ============================================
# Strategy Definitions
# ============================================

SCHEDULING_STRATEGIES = [
    {
        "id": "morning_focus",
        "features": {
            "name": "التركيز الصباحي",
            "description": "جدولة المهام المهمة في الصباح الباكر",
            "bestTimeOfDay": "morning",
            "requiredProductivity": "high",
            "taskType": "complex",
            "suitableForWeekend": False
        }
    },
    {
        "id": "afternoon_burst",
        "features": {
            "name": "اندفاع بعد الظهر",
            "description": "إنجاز المهام المتوسطة بعد الظهر",
            "bestTimeOfDay": "afternoon",
            "requiredProductivity": "medium",
            "taskType": "routine",
            "suitableForWeekend": True
        }
    },
    {
        "id": "evening_light",
        "features": {
            "name": "المهام الخفيفة مساءً",
            "description": "مهام سهلة وقصيرة في المساء",
            "bestTimeOfDay": "evening",
            "requiredProductivity": "low",
            "taskType": "simple",
            "suitableForWeekend": True
        }
    },
    {
        "id": "pomodoro_sessions",
        "features": {
            "name": "جلسات بومودورو",
            "description": "تقسيم العمل إلى جلسات 25 دقيقة",
            "bestTimeOfDay": "any",
            "requiredProductivity": "medium",
            "taskType": "any",
            "suitableForWeekend": True
        }
    },
    {
        "id": "batch_similar",
        "features": {
            "name": "تجميع المتشابهات",
            "description": "إنجاز المهام المتشابهة معاً",
            "bestTimeOfDay": "any",
            "requiredProductivity": "medium",
            "taskType": "routine",
            "suitableForWeekend": False
        }
    },
    {
        "id": "energy_matching",
        "features": {
            "name": "مطابقة الطاقة",
            "description": "مطابقة صعوبة المهمة مع مستوى طاقتك",
            "bestTimeOfDay": "any",
            "requiredProductivity": "any",
            "taskType": "any",
            "suitableForWeekend": True
        }
    }
]


# ============================================
# Helper Functions
# ============================================

def get_time_of_day(hour: int) -> str:
    """تحديد فترة اليوم"""
    if 5 <= hour < 12:
        return "morning"
    elif 12 <= hour < 17:
        return "afternoon"
    elif 17 <= hour < 21:
        return "evening"
    return "night"


def get_day_of_week() -> str:
    """الحصول على اسم اليوم"""
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    return days[datetime.utcnow().weekday()]


def calculate_user_productivity(completion_rate: float, streak: int) -> str:
    """حساب مستوى إنتاجية المستخدم"""
    productivity_score = completion_rate * 0.7 + min(streak / 7, 1) * 0.3
    
    if productivity_score >= 0.7:
        return "high"
    elif productivity_score >= 0.4:
        return "medium"
    return "low"


# ============================================
# Firebase Functions
# ============================================

@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["POST", "OPTIONS"],
    ),
    memory=options.MemoryOption.MB_128,
    timeout_sec=15
)
def getPersonalizedStrategy(req: https_fn.CallableRequest) -> dict:
    """
    الحصول على استراتيجية مخصصة
    
    المعاملات:
        userBehavior (dict): سلوك المستخدم (completionRate, streak)
        taskType (str): نوع المهمة
    """
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="يجب تسجيل الدخول"
        )
    
    data = req.data
    user_behavior = data.get("userBehavior", {})
    task_type = data.get("taskType", "routine")
    
    try:
        current_hour = datetime.utcnow().hour
        
        context = {
            "timeOfDay": get_time_of_day(current_hour),
            "dayOfWeek": get_day_of_week(),
            "userProductivity": calculate_user_productivity(
                user_behavior.get("completionRate", 0.5),
                user_behavior.get("streak", 0)
            ),
            "taskType": task_type
        }
        
        rank_response = personalizer_client.rank(
            context_features=context,
            actions=SCHEDULING_STRATEGIES
        )
        
        # إيجاد الاستراتيجية المختارة
        selected_strategy = next(
            (s for s in SCHEDULING_STRATEGIES if s["id"] == rank_response["rewardActionId"]),
            None
        )
        
        logger.info(f"Strategy selected for user {req.auth.uid}: {rank_response['rewardActionId']}")
        
        return {
            "success": True,
            "strategy": selected_strategy,
            "eventId": rank_response["eventId"],
            "ranking": rank_response["ranking"],
            "context": context,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Personalizer error: {e}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"خطأ في التخصيص: {str(e)}"
        )


@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["POST", "OPTIONS"],
    ),
    memory=options.MemoryOption.MB_128,
    timeout_sec=10
)
def sendReward(req: https_fn.CallableRequest) -> dict:
    """
    إرسال مكافأة للتعلم
    
    المعاملات:
        eventId (str): معرف الحدث
        reward (float): قيمة المكافأة (0-1)
        feedback (str): ملاحظات (اختياري)
    """
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="يجب تسجيل الدخول"
        )
    
    data = req.data
    event_id = data.get("eventId")
    reward = data.get("reward")
    feedback = data.get("feedback", "")
    
    if not event_id or reward is None:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="eventId و reward مطلوبان"
        )
    
    try:
        # تطبيع المكافأة (0-1)
        normalized_reward = max(0, min(1, float(reward)))
        
        personalizer_client.reward(event_id, normalized_reward)
        
        logger.info(f"Reward sent by user {req.auth.uid}: {event_id} = {normalized_reward}")
        
        return {
            "success": True,
            "message": "تم تسجيل التقييم بنجاح",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Reward error: {e}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"خطأ في إرسال التقييم: {str(e)}"
        )


@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["POST", "OPTIONS"],
    ),
    memory=options.MemoryOption.MB_128,
    timeout_sec=10
)
def getAvailableStrategies(req: https_fn.CallableRequest) -> dict:
    """
    الحصول على قائمة الاستراتيجيات المتاحة
    """
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="يجب تسجيل الدخول"
        )
    
    return {
        "success": True,
        "strategies": [
            {
                "id": s["id"],
                "name": s["features"]["name"],
                "description": s["features"]["description"]
            }
            for s in SCHEDULING_STRATEGIES
        ],
        "timestamp": datetime.utcnow().isoformat()
    }

