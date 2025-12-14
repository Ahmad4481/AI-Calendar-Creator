/**
 * src/features/events/repeat/RRuleBuilder.js
 * مبسط لبناء RRule string من خيارات النموذج
 * يدعم presets: none, daily, weekly, monthly, yearly, custom
 */
export default class RRuleBuilder {
    constructor() {}
  
    build(opts = {}) {
      const { repeat, interval, frequency, endType, count, until, days = [], monthDay } = opts;
  
      if (!repeat || repeat === 'none') return null;
  
      // presets
      if (repeat === 'daily') return 'FREQ=DAILY';
      if (repeat === 'weekly') return 'FREQ=WEEKLY';
      if (repeat === 'monthly') return 'FREQ=MONTHLY';
      if (repeat === 'yearly') return 'FREQ=YEARLY';
  
      // custom
      if (repeat === 'custom') {
        const parts = [];
        const freq = frequency || 'WEEKLY';
        parts.push(`FREQ=${freq}`);
  
        const intv = interval ? parseInt(interval, 10) : 1;
        if (intv && intv > 1) parts.push(`INTERVAL=${intv}`);
  
        if (freq === 'WEEKLY' && Array.isArray(days) && days.length) {
          // expecting days like MO,TU,WE...
          parts.push(`BYDAY=${days.join(',')}`);
        }
  
        if (freq === 'MONTHLY' && monthDay) {
          parts.push(`BYMONTHDAY=${monthDay}`);
        }
  
        if (endType === 'count' && count) {
          const c = parseInt(count, 10);
          if (!isNaN(c) && c > 0) parts.push(`COUNT=${c}`);
        } else if (endType === 'until' && until) {
          // until expected in YYYY-MM-DD -> convert to YYYYMMDDT000000Z (UTC zeroed)
          const normalized = until.replace(/-/g, '');
          if (normalized.length >= 8) {
            parts.push(`UNTIL=${normalized}T000000Z`);
          }
        }
  
        return parts.join(';');
      }
  
      // fallback
      return null;
    }
  
    // Optional parse method (not fully complete) — can be extended later
    parse(rruleStr = '') {
      if (!rruleStr) return null;
      const parts = rruleStr.split(';');
      const res = {};
      parts.forEach(p => {
        const [k, v] = p.split('=');
        res[k] = v;
      });
      return res;
    }
  }
  