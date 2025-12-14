"""
Reinforcement Learning Agent (Q-Learning)
نظام التعلم المعزز للتقويم الذكي
"""

from firebase_functions import https_fn, options
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
import random
import logging

logger = logging.getLogger(__name__)


# ============================================
# State Features & Actions
# ============================================

STATE_FEATURES = [
    "hour_of_day",           # 0-23 normalized to 0-1
    "day_of_week",           # 0-6 normalized to 0-1
    "user_energy_level",     # 0-1 (estimated from recent activity)
    "pending_tasks_count",   # normalized
    "completed_today_count", # normalized
    "task_difficulty",       # 0-1
    "task_duration_minutes", # normalized
    "deadline_hours",        # normalized
    "streak_days",           # normalized
    "avg_completion_rate",   # 0-1
]

ACTIONS = [
    {"id": "schedule_now", "name": "جدولة فورية", "description": "جدولة المهمة الآن"},
    {"id": "schedule_morning", "name": "جدولة صباحية", "description": "جدولة في الصباح (8-12)"},
    {"id": "schedule_afternoon", "name": "جدولة ظهرية", "description": "جدولة بعد الظهر (12-17)"},
    {"id": "schedule_evening", "name": "جدولة مسائية", "description": "جدولة في المساء (17-21)"},
    {"id": "schedule_weekend", "name": "تأجيل للعطلة", "description": "تأجيل لعطلة الأسبوع"},
    {"id": "break_into_subtasks", "name": "تقسيم المهمة", "description": "تقسيم إلى مهام فرعية"},
    {"id": "apply_pomodoro", "name": "بومودورو", "description": "تطبيق تقنية بومودورو"},
    {"id": "batch_with_similar", "name": "تجميع المتشابهات", "description": "تجميع مع مهام مشابهة"},
]


# ============================================
# Q-Learning Agent
# ============================================

class QLearningAgent:
    """Q-Learning Agent للتعلم المعزز"""
    
    def __init__(
        self,
        learning_rate: float = 0.1,
        discount_factor: float = 0.99,
        epsilon: float = 0.2,
        min_epsilon: float = 0.05,
        epsilon_decay: float = 0.995
    ):
        self.q_table: Dict[str, Dict[str, Any]] = {}
        self.experiences: List[Dict[str, Any]] = []
        self.learning_rate = learning_rate
        self.discount_factor = discount_factor
        self.epsilon = epsilon
        self.min_epsilon = min_epsilon
        self.epsilon_decay = epsilon_decay
    
    def _discretize_state(self, state: List[float]) -> str:
        """تحويل الحالة المستمرة إلى مفتاح نصي"""
        # تقسيم كل قيمة إلى 4 مستويات
        bins = []
        for value in state:
            if value < 0.25:
                bins.append(0)
            elif value < 0.5:
                bins.append(1)
            elif value < 0.75:
                bins.append(2)
            else:
                bins.append(3)
        return "-".join(str(b) for b in bins)
    
    def get_q_values(self, state: List[float]) -> List[float]:
        """الحصول على Q-values للحالة"""
        key = self._discretize_state(state)
        entry = self.q_table.get(key)
        
        if not entry:
            # تهيئة بقيم عشوائية صغيرة
            return [random.random() * 0.1 for _ in ACTIONS]
        
        return entry["values"]
    
    def select_action(
        self,
        state: List[float],
        explore: bool = True
    ) -> Dict[str, Any]:
        """
        اختيار الإجراء باستخدام epsilon-greedy
        
        Args:
            state: الحالة الحالية
            explore: هل نستكشف أم نستغل
        
        Returns:
            Dict: الإجراء المختار مع الثقة
        """
        q_values = self.get_q_values(state)
        
        if explore and random.random() < self.epsilon:
            # استكشاف: اختيار عشوائي
            action_index = random.randint(0, len(ACTIONS) - 1)
        else:
            # استغلال: أفضل إجراء
            action_index = q_values.index(max(q_values))
        
        max_q = max(q_values)
        avg_q = sum(q_values) / len(q_values)
        confidence = max(0, min(1, max_q - avg_q))
        
        return {
            "actionIndex": action_index,
            "action": ACTIONS[action_index],
            "confidence": confidence
        }
    
    def update(
        self,
        state: List[float],
        action_index: int,
        reward: float,
        next_state: List[float],
        done: bool
    ) -> None:
        """
        تحديث Q-values بناءً على التجربة
        
        Args:
            state: الحالة الحالية
            action_index: فهرس الإجراء
            reward: المكافأة
            next_state: الحالة التالية
            done: هل انتهت الحلقة
        """
        key = self._discretize_state(state)
        next_key = self._discretize_state(next_state)
        
        # الحصول على Q-values الحالية
        if key not in self.q_table:
            self.q_table[key] = {
                "values": [0.0] * len(ACTIONS),
                "visits": 0,
                "lastUpdate": datetime.utcnow().isoformat()
            }
        
        entry = self.q_table[key]
        
        # الحصول على أقصى Q-value للحالة التالية
        next_entry = self.q_table.get(next_key)
        next_max_q = max(next_entry["values"]) if next_entry else 0
        
        # Q-learning update
        target = reward if done else reward + self.discount_factor * next_max_q
        current_q = entry["values"][action_index]
        entry["values"][action_index] = current_q + self.learning_rate * (target - current_q)
        entry["visits"] += 1
        entry["lastUpdate"] = datetime.utcnow().isoformat()
        
        # تقليل epsilon
        self.epsilon = max(self.min_epsilon, self.epsilon * self.epsilon_decay)
    
    def add_experience(self, experience: Dict[str, Any]) -> None:
        """إضافة تجربة إلى الذاكرة"""
        self.experiences.append(experience)
        
        # الاحتفاظ بآخر 10000 تجربة فقط
        if len(self.experiences) > 10000:
            self.experiences = self.experiences[-10000:]
    
    def train_batch(self, batch_size: int = 32) -> Dict[str, Any]:
        """
        التدريب على دفعة من التجارب
        
        Args:
            batch_size: حجم الدفعة
        
        Returns:
            Dict: عدد التجارب المدربة ومتوسط الخسارة
        """
        if len(self.experiences) < batch_size:
            return {"trained": 0, "avgLoss": 0}
        
        # اختيار عشوائي
        indices = random.sample(range(len(self.experiences)), batch_size)
        total_loss = 0
        
        for idx in indices:
            exp = self.experiences[idx]
            
            # حساب TD error (الخسارة)
            current_q = self.get_q_values(exp["state"])[exp["action"]]
            next_max_q = 0 if exp["done"] else max(self.get_q_values(exp["nextState"]))
            target = exp["reward"] + self.discount_factor * next_max_q
            loss = abs(target - current_q)
            total_loss += loss
            
            # التحديث
            self.update(
                exp["state"],
                exp["action"],
                exp["reward"],
                exp["nextState"],
                exp["done"]
            )
        
        return {
            "trained": batch_size,
            "avgLoss": total_loss / batch_size
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """الحصول على إحصائيات الوكيل"""
        total_reward = sum(exp["reward"] for exp in self.experiences)
        
        return {
            "qTableSize": len(self.q_table),
            "totalExperiences": len(self.experiences),
            "epsilon": self.epsilon,
            "avgReward": total_reward / len(self.experiences) if self.experiences else 0
        }
    
    def get_action_scores(self, state: List[float]) -> Dict[str, float]:
        """الحصول على نقاط جميع الإجراءات"""
        q_values = self.get_q_values(state)
        return {
            action["id"]: q_values[idx]
            for idx, action in enumerate(ACTIONS)
        }


# Global agent instance
agent = QLearningAgent()


# ============================================
# Helper Functions
# ============================================

def normalize_state(raw_state: Dict[str, float]) -> List[float]:
    """
    تطبيع الحالة الخام إلى قيم 0-1
    
    Args:
        raw_state: الحالة الخام
    
    Returns:
        List[float]: الحالة المطبعة
    """
    state = []
    
    # hour_of_day: 0-23 -> 0-1
    state.append(raw_state.get("hour_of_day", 0) / 23)
    
    # day_of_week: 0-6 -> 0-1
    state.append(raw_state.get("day_of_week", 0) / 6)
    
    # user_energy_level: already 0-1
    state.append(raw_state.get("user_energy_level", 0.5))
    
    # pending_tasks_count: normalize to 0-1 (assume max 20)
    state.append(min(raw_state.get("pending_tasks_count", 0) / 20, 1))
    
    # completed_today_count: normalize to 0-1 (assume max 10)
    state.append(min(raw_state.get("completed_today_count", 0) / 10, 1))
    
    # task_difficulty: already 0-1
    state.append(raw_state.get("task_difficulty", 0.5))
    
    # task_duration_minutes: normalize to 0-1 (assume max 180)
    state.append(min(raw_state.get("task_duration_minutes", 30) / 180, 1))
    
    # deadline_hours: normalize to 0-1 (assume max 168 = 1 week)
    state.append(min(raw_state.get("deadline_hours", 24) / 168, 1))
    
    # streak_days: normalize to 0-1 (assume max 30)
    state.append(min(raw_state.get("streak_days", 0) / 30, 1))
    
    # avg_completion_rate: already 0-1
    state.append(raw_state.get("avg_completion_rate", 0.5))
    
    return state


def calculate_reward(feedback: Dict[str, Any]) -> float:
    """
    حساب المكافأة من التغذية الراجعة
    
    Args:
        feedback: بيانات التغذية الراجعة
    
    Returns:
        float: المكافأة (-1 إلى 1)
    """
    reward = 0
    
    # إكمال المهمة هو المكافأة الرئيسية
    if feedback.get("task_completed"):
        reward += 1.0
    
    # مكافأة الإنجاز في الوقت
    if feedback.get("on_time"):
        reward += 0.3
    
    # رضا المستخدم (0-1)
    satisfaction = feedback.get("satisfaction", 0.5)
    reward += satisfaction * 0.2
    
    # عقوبة فشل المهمة
    if feedback.get("task_failed"):
        reward -= 0.5
    
    # عقوبة إعادة الجدولة (خفيفة)
    if feedback.get("rescheduled"):
        reward -= 0.1
    
    return max(-1, min(1, reward))


# ============================================
# Firebase Functions
# ============================================

@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["POST", "OPTIONS"],
    ),
    memory=options.MemoryOption.MB_256,
    timeout_sec=15
)
def rlPredict(req: https_fn.CallableRequest) -> dict:
    """
    التنبؤ بأفضل إجراء
    
    المعاملات:
        state (dict): الحالة الحالية
        explore (bool): هل نستكشف (اختياري، افتراضي True)
    """
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="يجب تسجيل الدخول"
        )
    
    data = req.data
    raw_state = data.get("state", {})
    explore = data.get("explore", True)
    
    if not raw_state:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="الحالة مطلوبة"
        )
    
    try:
        state = normalize_state(raw_state)
        result = agent.select_action(state, explore)
        action_scores = agent.get_action_scores(state)
        
        logger.info(f"RL Prediction for user {req.auth.uid}: {result['action']['id']}")
        
        return {
            "success": True,
            "action": result["action"],
            "actionIndex": result["actionIndex"],
            "confidence": result["confidence"],
            "actionScores": action_scores,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"RL Prediction error: {e}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"خطأ في التنبؤ: {str(e)}"
        )


@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["POST", "OPTIONS"],
    ),
    memory=options.MemoryOption.MB_256,
    timeout_sec=15
)
def rlFeedback(req: https_fn.CallableRequest) -> dict:
    """
    تسجيل التغذية الراجعة
    
    المعاملات:
        state (dict): الحالة الحالية
        action (int|str): الإجراء المتخذ
        nextState (dict): الحالة التالية
        feedback (dict): بيانات التغذية الراجعة
        done (bool): هل انتهت الحلقة
    """
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="يجب تسجيل الدخول"
        )
    
    data = req.data
    raw_state = data.get("state", {})
    action = data.get("action")
    raw_next_state = data.get("nextState", raw_state)
    feedback = data.get("feedback", {})
    done = data.get("done", False)
    
    if not raw_state or action is None:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="الحالة والإجراء مطلوبان"
        )
    
    try:
        state = normalize_state(raw_state)
        next_state = normalize_state(raw_next_state)
        
        # إيجاد فهرس الإجراء
        if isinstance(action, int):
            action_index = action
        else:
            action_index = next(
                (i for i, a in enumerate(ACTIONS) if a["id"] == action),
                -1
            )
        
        if action_index < 0 or action_index >= len(ACTIONS):
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
                message="إجراء غير صالح"
            )
        
        # حساب المكافأة
        reward = calculate_reward(feedback)
        
        # إضافة التجربة
        experience = {
            "state": state,
            "action": action_index,
            "reward": reward,
            "nextState": next_state,
            "done": done,
            "timestamp": datetime.utcnow().isoformat(),
            "userId": req.auth.uid
        }
        
        agent.add_experience(experience)
        
        # تحديث الوكيل
        agent.update(state, action_index, reward, next_state, done)
        
        logger.info(f"RL Feedback from user {req.auth.uid}: action={ACTIONS[action_index]['id']}, reward={reward}")
        
        return {
            "success": True,
            "reward": reward,
            "stats": agent.get_stats(),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except https_fn.HttpsError:
        raise
    except Exception as e:
        logger.error(f"RL Feedback error: {e}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"خطأ في التغذية الراجعة: {str(e)}"
        )


@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["POST", "OPTIONS"],
    ),
    memory=options.MemoryOption.MB_512,
    timeout_sec=60
)
def rlTrain(req: https_fn.CallableRequest) -> dict:
    """
    تدريب الوكيل على التجارب المخزنة
    
    المعاملات:
        batchSize (int): حجم الدفعة (افتراضي 32)
        epochs (int): عدد الحقب (افتراضي 10)
    """
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="يجب تسجيل الدخول"
        )
    
    data = req.data
    batch_size = data.get("batchSize", 32)
    epochs = data.get("epochs", 10)
    
    try:
        total_trained = 0
        total_loss = 0
        
        for _ in range(epochs):
            result = agent.train_batch(batch_size)
            total_trained += result["trained"]
            total_loss += result["avgLoss"]
        
        avg_loss = total_loss / epochs if epochs > 0 else 0
        
        logger.info(f"RL Training by user {req.auth.uid}: epochs={epochs}, trained={total_trained}")
        
        return {
            "success": True,
            "epochs": epochs,
            "batchSize": batch_size,
            "totalTrained": total_trained,
            "avgLoss": avg_loss,
            "stats": agent.get_stats(),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"RL Training error: {e}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"خطأ في التدريب: {str(e)}"
        )


@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["POST", "OPTIONS"],
    ),
    memory=options.MemoryOption.MB_128,
    timeout_sec=10
)
def rlStats(req: https_fn.CallableRequest) -> dict:
    """الحصول على إحصائيات الوكيل"""
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="يجب تسجيل الدخول"
        )
    
    return {
        "success": True,
        "stats": agent.get_stats(),
        "actions": ACTIONS,
        "features": STATE_FEATURES,
        "timestamp": datetime.utcnow().isoformat()
    }


@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["POST", "OPTIONS"],
    ),
    memory=options.MemoryOption.MB_128,
    timeout_sec=5
)
def rlGetActions(req: https_fn.CallableRequest) -> dict:
    """الحصول على قائمة الإجراءات المتاحة"""
    # هذه الدالة لا تتطلب مصادقة
    return {
        "success": True,
        "actions": ACTIONS,
        "features": STATE_FEATURES,
        "timestamp": datetime.utcnow().isoformat()
    }

