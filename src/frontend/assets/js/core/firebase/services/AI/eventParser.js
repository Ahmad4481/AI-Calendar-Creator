// eventParser.js
import eventMapper from "../eventService/EventMapper.js";

/**
 * يحاول استخراج مصفوفة أحداث JSON من نص المحتوى.
 * يدعم: JSON array صريح، وJSON داخل رسالة نصية.
 */
export function parseEventsFromContent(content) {
  const events = [];
  if (!content || typeof content !== "string") return events;

  // Helper: محاولة parse آمنة
  const safeParse = (txt) => {
    try {
      return JSON.parse(txt);
    } catch (e) {
      return null;
    }
  };

  // 1) حاول إيجاد أول مصفوفة JSON في النص
  try {
    const arrayMatch = content.match(/\[[\s\S]*?\]/);
    if (arrayMatch) {
      const parsed = safeParse(arrayMatch[0]);
      if (Array.isArray(parsed)) {
        parsed.forEach(item => {
          if (item && (item.title || item.name)) {
            try {
              events.push(eventMapper(item));
            } catch (e) {
              console.warn("[eventParser] mapper failed for item:", item, e);
            }
          }
        });
        return events;
      }
    }
  } catch (e) {
    console.warn("[eventParser] array extraction failed", e);
  }

  // 2) حاول إذا كان المحتوى نفسه JSON object يحتوي على events
  try {
    const obj = safeParse(content);
    if (obj && Array.isArray(obj.events)) {
      obj.events.forEach(item => {
        if (item && (item.title || item.name)) {
          try {
            events.push(eventMapper(item));
          } catch (e) {
            console.warn("[eventParser] mapper failed for item:", item, e);
          }
        }
      });
      return events;
    }
  } catch (e) {
    // لا نفشل هنا، نتابع
  }

  // 3) حاول استخراج JSONs منفصلة (مثل: {...}\n{...})
  try {
    const possibleObjects = content.match(/\{[\s\S]*?\}/g);
    if (possibleObjects && possibleObjects.length) {
      for (const txt of possibleObjects) {
        const parsed = safeParse(txt);
        if (parsed && (parsed.title || parsed.name)) {
          try {
            events.push(eventMapper(parsed));
          } catch (e) {
            console.warn("[eventParser] mapper failed for parsed object", e);
          }
        }
      }
    }
  } catch (e) {
    // تجاهل
  }

  return events;
}
