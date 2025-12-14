/**
 * EventConverter.js - نقطة الربط بين Firestore و FullCalendar
 * يدعم:
 * - recurring events
 * - exdates
 * - occurrenceDate
 * - rrule parsing
 */

export class EventConverter {

  /**
   * تحويل الحدث من Firestore إلى FullCalendar
   */
  toFullCalendar(event) {
    if (!event) return null;

    const start = this._toDate(event.startTime);
    const end = this._toDate(event.endTime);

    if (!start) {
      console.error("[EventConverter] حدث بدون startTime:", event);
      return null;
    }

    const isRecurring = !!event.rrule;

    return {
      id: event.id,
      title: event.title || "بدون عنوان",
      start,
      end: end || null,

      // FullCalendar يستخدم rrule + exdate
      rrule: isRecurring ? event.rrule : null,
      exdate: Array.isArray(event.exdates) ? event.exdates : [],

      recurring: isRecurring,

      extendedProps: {
        completed: event.completed || false,
        rrule: event.rrule || null,
        exdates: event.exdates || [],

        // عند التكرار: مثيل داخل السلسلة
        originalEventId: event.originalEventId || event.id,
        occurrenceDate: start
      }
    };
  }

  /**
   * تحويل الحدث من FullCalendar إلى Firestore
   */
  toFirebase(fcEvent) {
    return {
      id: fcEvent.id,
      title: fcEvent.title,
      startTime: this._toDate(fcEvent.start),
      endTime: this._toDate(fcEvent.end),

      completed: fcEvent.extendedProps?.completed || false,

      // recurring logic
      rrule: fcEvent.rrule || fcEvent.extendedProps?.rrule || null,
      recurring: !!(fcEvent.rrule || fcEvent.extendedProps?.rrule),

      // exceptions
      exdates: fcEvent.extendedProps?.exdates || [],

      originalEventId: fcEvent.extendedProps?.originalEventId || fcEvent.id,
      occurrenceDate: fcEvent.extendedProps?.occurrenceDate || fcEvent.start
    };
  }

  /**
   * مساعد لتحويل أي نوع تاريخ إلى Date موحدة
   */
  _toDate(value) {
    if (!value) return null;

    // Timestamp Firebase
    if (value.toDate && typeof value.toDate === "function") {
      return value.toDate();
    }

    // Object seconds
    if (value.seconds !== undefined) {
      return new Date(value.seconds * 1000);
    }

    // FullCalendar date
    if (value instanceof Date) {
      return value;
    }

    // ISO string / number
    return new Date(value);
  }

  /**
   * تحليل نوع التكرار
   */
  parseRRuleFreq(rruleStr) {
    if (!rruleStr) return null;

    if (rruleStr.includes("FREQ=DAILY")) return "daily";
    if (rruleStr.includes("FREQ=WEEKLY")) return "weekly";
    if (rruleStr.includes("FREQ=MONTHLY")) return "monthly";
    if (rruleStr.includes("FREQ=YEARLY")) return "yearly";

    return null;
  }
}
