// Vendor libraries loaded from npm packages
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

import flatpickr from 'flatpickr';
import Choices from 'choices.js';
import { computePosition, flip, shift, offset } from '@floating-ui/dom';

// Make libraries globally available
window.FullCalendar = {
  Calendar,
  dayGridPlugin,
  timeGridPlugin,
  interactionPlugin,
  listPlugin
};

window.flatpickr = flatpickr;
window.Choices = Choices;
window.FloatingUI = {
  computePosition,
  flip,
  shift,
  offset
};

// Export for ES modules
export {
  Calendar,
  dayGridPlugin,
  timeGridPlugin,
  interactionPlugin,
  listPlugin,
  flatpickr,
  Choices,
  computePosition,
  flip,
  shift,
  offset
};
