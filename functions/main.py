"""
Firebase Cloud Functions - AI Calendar Creator
الدوال الرئيسية لاستدعاء نماذج الذكاء الاصطناعي

Functions:
- useAi: دالة AI الرئيسية (تدعم DeepSeek R1, DeepSeek Chat, Qwen Plus)
- chat: دالة المحادثة (Qwen Plus مع conversation history)
"""

from firebase_functions import https_fn, options
from firebase_admin import initialize_app
import json
from typing import Dict, Any, List, Optional
from datetime import datetime

# استيراد الموديولات المحلية
from ai_models import ModelRouter, AIModel
from tools import CALENDAR_TOOLS, get_system_prompt, build_context_prompt

# تهيئة Firebase Admin
try:
initialize_app()
except ValueError:
    pass # Already initialized

# إنشاء موجه النماذج
model_router = ModelRouter()


# ============================================
# Helper Functions
# ============================================

def build_messages(
    content: str,
    conversation_history: Optional[List[Dict]] = None
) -> List[Dict[str, str]]:
    """
    بناء قائمة الرسائل مع تاريخ المحادثة
    
    Args:
        content: محتوى الرسالة الحالية
        conversation_history: تاريخ المحادثة السابقة
    
    Returns:
        List[Dict]: قائمة الرسائل
    """
    messages = []
    
    # إضافة تاريخ المحادثة
    if conversation_history:
        for msg in conversation_history[-10:]:  # آخر 10 رسائل
            role = "assistant" if msg.get("role") == "assistant" else "user"
            messages.append({
                "role": role,
                "content": msg.get("content", "")
            })
    
    # إضافة الرسالة الحالية
    messages.append({"role": "user", "content": content})
    
    return messages


def process_content(content: Any) -> str:
    """
    تحويل المحتوى إلى نص
    
    Args:
        content: المحتوى (قد يكون dict أو str)
    
    Returns:
        str: المحتوى كنص
    """
    if isinstance(content, dict):
        return content.get("answer") or content.get("message") or json.dumps(content)
    elif isinstance(content, str):
        return content
    else:
        return str(content)


# ============================================
# Main AI Function
# ============================================

@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["POST", "OPTIONS"],
    ),
    memory=options.MemoryOption.MB_512,
    timeout_sec=120,
    secrets=["DEEPSEEK_API_KEY", "QWEN_PLUS_API_KEY"]
)
def useAi(req: https_fn.CallableRequest) -> dict:
    """
    دالة AI الرئيسية - تدعم جميع النماذج والأنواع
    """
    # التحقق من المصادقة
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="يجب تسجيل الدخول لاستخدام AI"
        )
    
    # التحقق من البيانات
    data = req.data
    if not data:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="البيانات المطلوبة غير موجودة"
        )
    
    # استخراج البيانات
    content = data.get("content", "")
    request_type = data.get("type", "message")
    system_context = data.get("systemContext", {})
    preferred_model = data.get("preferredModel")
    conversation_history = data.get("conversationHistory", [])
    
    # تحويل المحتوى إلى نص
    content = process_content(content)
    
    if not content:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="المحتوى مطلوب"
        )
    
    try:
        # بناء الرسائل
        messages = build_messages(content, conversation_history)
        
        # بناء system prompt
        model_name = "منشئ الأحداث" if request_type == "create calendar" else "مساعد التقويم"
        system_prompt = get_system_prompt(request_type, model_name)
        system_prompt += build_context_prompt(system_context)
        
        # تحديد الأدوات
        tools = CALENDAR_TOOLS if request_type in ["create calendar", "message"] else None
        
        # استدعاء النموذج
        result = model_router.call(
            messages=messages,
            system_prompt=system_prompt,
            request_type=request_type,
            preferred_model=preferred_model,
            tools=tools
        )
        
        # إضافة معلومات إضافية
        result["userId"] = req.auth.uid
        result["timestamp"] = datetime.utcnow().isoformat()
        result["request_type"] = request_type
        
        # تحويل tool_calls إلى toolCalls للتوافق مع Frontend
        if "tool_calls" in result:
            result["toolCalls"] = result.pop("tool_calls")
        
        return result
        
    except Exception as e:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"خطأ في معالجة طلب AI: {str(e)}"
        )


# ============================================
# Chat Function (Qwen Plus)
# ============================================

@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["POST", "OPTIONS"],
    ),
    memory=options.MemoryOption.MB_256,
    timeout_sec=60,
    secrets=["QWEN_PLUS_API_KEY"]
)
def chat(req: https_fn.CallableRequest) -> dict:
    """
    دالة المحادثة - Qwen Plus مع conversation history و tools
    """
    # التحقق من المصادقة
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="يجب تسجيل الدخول"
        )
    
    # استخراج البيانات
    data = req.data
    message = data.get("message", "")
    history = data.get("history", [])
    
    if not message:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="الرسالة مطلوبة"
        )
    
    try:
        # بناء الرسائل
        messages = build_messages(message, history)
        
        # بناء system prompt
        system_prompt = get_system_prompt("message", "مساعد التقويم")
        
        # استدعاء Qwen Plus مع tools
        result = model_router.call(
            messages=messages,
            system_prompt=system_prompt,
            request_type="message",
            preferred_model="qwen-plus",
            tools=CALENDAR_TOOLS
        )
        
        # إضافة معلومات إضافية
        result["userId"] = req.auth.uid
        result["timestamp"] = datetime.utcnow().isoformat()
        
        # تحويل tool_calls إلى toolCalls
        if "tool_calls" in result:
            result["toolCalls"] = result.pop("tool_calls")
        
        return result
        
    except Exception as e:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"خطأ في المحادثة: {str(e)}"
        )


# ============================================
# Exports from other modules
# ============================================

# Analytics
from analytics import trackBehavior, getAnalytics, getInsights

# Personalizer
from personalizer import getPersonalizedStrategy, sendReward, getAvailableStrategies

# Recommendations
from recommendations import getRecommendations, suggestSchedule

# RL Agent
from rl_agent import rlPredict, rlFeedback, rlTrain, rlStats, rlGetActions
