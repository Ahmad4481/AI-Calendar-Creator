"""
AI Models - DeepSeek R1 & Qwen Plus Clients
نماذج الذكاء الاصطناعي للتقويم الذكي
"""

import os
import json
import requests
from typing import Dict, Any, List, Optional
from datetime import datetime
from enum import Enum


class AIModel(str, Enum):
    """أنواع النماذج المدعومة"""
    DEEPSEEK_R1 = "deepseek-r1"
    DEEPSEEK_CHAT = "deepseek-chat"
    QWEN_PLUS = "qwen-plus"


class BaseAIClient:
    """كلاس أساسي لعملاء AI"""
    
    def __init__(self, api_key: str, endpoint: str, timeout: int = 60):
        self.api_key = api_key
        self.endpoint = endpoint
        self.timeout = timeout
    
    def _make_request(self, payload: Dict, headers: Dict) -> Dict:
        """إرسال طلب HTTP"""
        try:
            response = requests.post(
                self.endpoint,
                headers=headers,
                json=payload,
                timeout=self.timeout
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"API request failed: {str(e)}")


class DeepSeekClient(BaseAIClient):
    """
    DeepSeek API Client
    يدعم DeepSeek R1 (Reasoner) و DeepSeek Chat
    """
    
    def __init__(self, api_key: Optional[str] = None):
        api_key = api_key or os.environ.get("DEEPSEEK_API_KEY", "")
        super().__init__(
            api_key=api_key,
            endpoint="https://api.deepseek.com/v1/chat/completions",
            timeout=120  # R1 يحتاج وقت أطول للتفكير
        )
    
    def call(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        tools: Optional[List[Dict]] = None,
        use_reasoner: bool = False,
        max_tokens: int = 8000,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """
        استدعاء DeepSeek API
        
        Args:
            messages: قائمة الرسائل
            system_prompt: رسالة النظام
            tools: أدوات متاحة للنموذج
            use_reasoner: استخدام DeepSeek R1 (Reasoner) بدلاً من Chat
            max_tokens: الحد الأقصى للتوكنات
            temperature: درجة العشوائية
        
        Returns:
            Dict مع content, tool_calls, reasoning
        """
        if not self.api_key:
            raise Exception("DEEPSEEK_API_KEY is not set")
        
        # بناء الرسائل
        all_messages = [{"role": "system", "content": system_prompt}]
        all_messages.extend(messages)
        
        # اختيار النموذج
        model_name = "deepseek-reasoner" if use_reasoner else "deepseek-chat"
        
        # بناء الـ payload
        payload = {
            "model": model_name,
            "messages": all_messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        # إضافة tools إذا وجدت
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        # إرسال الطلب
        data = self._make_request(payload, headers)
        
        # معالجة الرد
        choice = data.get("choices", [{}])[0]
        message = choice.get("message", {})
        
        # استخراج tool calls
        tool_calls = []
        if message.get("tool_calls"):
            for tc in message["tool_calls"]:
                try:
                    tool_calls.append({
                        "id": tc.get("id", ""),
                        "name": tc.get("function", {}).get("name", ""),
                        "arguments": json.loads(tc.get("function", {}).get("arguments", "{}"))
                    })
                except json.JSONDecodeError:
                    pass
        
        return {
            "success": True,
            "content": message.get("content", ""),
            "tool_calls": tool_calls,
            "reasoning": message.get("reasoning_content"),  # R1 فقط
            "model": AIModel.DEEPSEEK_R1.value if use_reasoner else AIModel.DEEPSEEK_CHAT.value,
            "usage": data.get("usage", {})
        }


class QwenPlusClient(BaseAIClient):
    """
    Qwen Plus API Client (DashScope International)
    يدعم tools و conversation history
    """
    
    def __init__(self, api_key: Optional[str] = None):
        api_key = api_key or os.environ.get("QWEN_PLUS_API_KEY", "")
        super().__init__(
            api_key=api_key,
            endpoint="https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
            timeout=60
        )
    
    def call(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        tools: Optional[List[Dict]] = None,
        max_tokens: int = 4000,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """
        استدعاء Qwen Plus API
        
        Args:
            messages: قائمة الرسائل
            system_prompt: رسالة النظام
            tools: أدوات متاحة للنموذج
            max_tokens: الحد الأقصى للتوكنات
            temperature: درجة العشوائية
        
        Returns:
            Dict مع content, tool_calls
        """
        if not self.api_key:
            raise Exception("QWEN_PLUS_API_KEY is not set")
        
        # بناء الرسائل
        all_messages = [{"role": "system", "content": system_prompt}]
        all_messages.extend(messages)
        
        # بناء الـ payload
        payload = {
            "model": "qwen-plus",
            "input": {
                "messages": all_messages
            },
            "parameters": {
                "temperature": temperature,
                "max_tokens": max_tokens,
                "result_format": "message"
            }
        }
        
        # إضافة tools إذا وجدت
        if tools:
            payload["parameters"]["tools"] = tools
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        # إرسال الطلب
        data = self._make_request(payload, headers)
        
        # معالجة الرد (DashScope format)
        output = data.get("output", {})
        first_choice = output.get("choices", [{}])[0] if output.get("choices") else {}
        message = first_choice.get("message", {})
        content = message.get("content") or output.get("text", "")
        
        # استخراج tool calls
        tool_calls = []
        if message.get("tool_calls"):
            for tc in message["tool_calls"]:
                try:
                    func = tc.get("function", {})
                    if func:
                        tool_calls.append({
                            "id": tc.get("id", f"call_{datetime.now().timestamp()}"),
                            "name": func.get("name", ""),
                            "arguments": json.loads(func.get("arguments", "{}"))
                        })
                except json.JSONDecodeError:
                    pass
        
        return {
            "success": True,
            "content": content,
            "tool_calls": tool_calls,
            "model": AIModel.QWEN_PLUS.value,
            "usage": data.get("usage", {})
        }


class ModelRouter:
    """
    موجه النماذج - يختار النموذج المناسب حسب نوع الطلب
    """
    
    # خريطة النماذج حسب نوع الطلب
    MODEL_MAPPING = {
        "create calendar": AIModel.DEEPSEEK_R1,  # Qwen Plus أفضل لإنشاء الجداول
        "message": AIModel.QWEN_PLUS,          # Qwen Plus للمحادثات
        "analyze user": AIModel.DEEPSEEK_R1,   # DeepSeek R1 للتحليل العميق
    }
    
    def __init__(self):
        self.deepseek = DeepSeekClient()
        self.qwen = QwenPlusClient()
    
    def select_model(
        self,
        request_type: str,
        preferred_model: Optional[str] = None
    ) -> AIModel:
        """
        اختيار النموذج المناسب
        
        Args:
            request_type: نوع الطلب
            preferred_model: نموذج مفضل (اختياري)
        
        Returns:
            AIModel المختار
        """
        # إذا حدد المستخدم نموذج معين
        if preferred_model:
            if preferred_model in ["deepseek-r1", "deepseek_r1"]:
                return AIModel.DEEPSEEK_R1
            elif preferred_model in ["deepseek-chat", "deepseek_chat", "deepseek"]:
                return AIModel.DEEPSEEK_CHAT
            elif preferred_model in ["qwen-plus", "qwen_plus", "qwen"]:
                return AIModel.QWEN_PLUS
        
        # اختيار تلقائي حسب نوع الطلب
        return self.MODEL_MAPPING.get(request_type, AIModel.QWEN_PLUS)
    
    def call(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        request_type: str = "message",
        preferred_model: Optional[str] = None,
        tools: Optional[List[Dict]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        استدعاء النموذج المناسب
        
        Args:
            messages: قائمة الرسائل
            system_prompt: رسالة النظام
            request_type: نوع الطلب
            preferred_model: نموذج مفضل
            tools: أدوات متاحة
            **kwargs: معاملات إضافية
        
        Returns:
            Dict مع نتيجة الاستدعاء
        """
        model = self.select_model(request_type, preferred_model)
        
        try:
            if model == AIModel.DEEPSEEK_R1:
                return self.deepseek.call(
                    messages=messages,
                    system_prompt=system_prompt,
                    tools=tools,
                    use_reasoner=True,
                    **kwargs
                )
            elif model == AIModel.DEEPSEEK_CHAT:
                return self.deepseek.call(
                    messages=messages,
                    system_prompt=system_prompt,
                    tools=tools,
                    use_reasoner=False,
                    **kwargs
                )
            else:  # QWEN_PLUS
                return self.qwen.call(
                    messages=messages,
                    system_prompt=system_prompt,
                    tools=tools,
                    **kwargs
                )
        except Exception as e:
            # Fallback إلى نموذج آخر
            return self._fallback(
                messages=messages,
                system_prompt=system_prompt,
                tools=tools,
                failed_model=model,
                error=str(e),
                **kwargs
            )
    
    def _fallback(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        tools: Optional[List[Dict]],
        failed_model: AIModel,
        error: str,
        **kwargs
    ) -> Dict[str, Any]:
        """
        محاولة استخدام نموذج بديل عند الفشل
        """
        fallback_order = [AIModel.QWEN_PLUS, AIModel.DEEPSEEK_CHAT, AIModel.DEEPSEEK_R1]
        
        for model in fallback_order:
            if model == failed_model:
                continue
            
            try:
                if model == AIModel.DEEPSEEK_R1:
                    result = self.deepseek.call(
                        messages=messages,
                        system_prompt=system_prompt,
                        tools=tools,
                        use_reasoner=True,
                        **kwargs
                    )
                elif model == AIModel.DEEPSEEK_CHAT:
                    result = self.deepseek.call(
                        messages=messages,
                        system_prompt=system_prompt,
                        tools=tools,
                        use_reasoner=False,
                        **kwargs
                    )
                else:
                    result = self.qwen.call(
                        messages=messages,
                        system_prompt=system_prompt,
                        tools=tools,
                        **kwargs
                    )
                
                result["fallback_used"] = True
                result["original_model"] = failed_model.value
                result["original_error"] = error
                return result
                
            except Exception:
                continue
        
        # كل النماذج فشلت
        return {
            "success": False,
            "error": f"All models failed. Original error: {error}",
            "model": failed_model.value
        }

