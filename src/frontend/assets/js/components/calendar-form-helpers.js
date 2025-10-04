// Calendar Form Helper Functions
class CalendarFormHelpers {
  // Collect sleep schedules data
  static collectSleepSchedules() {
    const schedules = [];
    const scheduleItems = document.querySelectorAll('.sleep-schedule-item');
    
    scheduleItems.forEach(item => {
      const startTime = item.querySelector('input[name="sleepStart"]')?.value;
      const endTime = item.querySelector('input[name="sleepEnd"]')?.value;
      
      if (startTime && endTime) {
        schedules.push({
          startTime,
          endTime
        });
      }
    });
    
    return schedules;
  }

  // Collect day settings data
  static collectDaySettings() {
    const daySettings = {
      weekdays: {},
      specialDates: []
    };

    // Weekdays settings
    const weekdayStart = document.querySelector('input[name="weekdayStart"]')?.value;
    const weekdayEnd = document.querySelector('input[name="weekdayEnd"]')?.value;
    
    if (weekdayStart && weekdayEnd) {
      daySettings.weekdays = {
        start: weekdayStart,
        end: weekdayEnd
      };
    }

    // Special dates
    const specialDateItems = document.querySelectorAll('.special-date-item');
    specialDateItems.forEach(item => {
      const date = item.querySelector('input[name="specialDate"]')?.value;
      const start = item.querySelector('input[name="specialStart"]')?.value;
      const end = item.querySelector('input[name="specialEnd"]')?.value;
      
      if (date && start && end) {
        daySettings.specialDates.push({
          date,
          start,
          end
        });
      }
    });

    return daySettings;
  }

  // Collect goals data
  static collectGoals() {
    const goals = [];
    const goalItems = document.querySelectorAll('.goal-item');
    
    goalItems.forEach(item => {
      const goalName = item.querySelector('input[name="goalName"]')?.value;
      const priority = item.querySelector('select[name="goalPriority"]')?.value;
      const repeat = item.querySelector('select[name="goalRepeat"]')?.value;
      
      if (goalName) {
        const goal = {
          name: goalName,
          priority: priority || 'medium',
          repeat: repeat || 'daily',
          preferredTimes: []
        };

        // Collect preferred times
        const preferredTimeItems = item.querySelectorAll('.preferred-time-item');
        preferredTimeItems.forEach(timeItem => {
          const days = Array.from(
            timeItem.querySelectorAll('select[name="preferredDays"] option:checked')
          ).map(option => option.value);
          const time = timeItem.querySelector('input[name="preferredTime"]')?.value;
          
          if (days.length > 0 && time) {
            goal.preferredTimes.push({
              days,
              time
            });
          }
        });

        goals.push(goal);
      }
    });

    return goals;
  }

  // Add sleep schedule
  static addSleepSchedule() {
    const container = document.getElementById('sleepSchedules');
    if (!container) return;

    const newItem = document.createElement('div');
    newItem.className = 'sleep-schedule-item';
    newItem.innerHTML = `
      <div class="form-row">
        <div class="form-group">
          <label>وقت بداية النوم</label>
          <input type="time" name="sleepStart" value="22:00">
        </div>
        <div class="form-group">
          <label>وقت نهاية النوم</label>
          <input type="time" name="sleepEnd" value="06:00">
        </div>
        <div class="form-group">
          <button type="button" class="btn btn-danger btn-sm remove-sleep-schedule">حذف</button>
        </div>
      </div>
    `;

    container.appendChild(newItem);
    
    // Initialize Flatpickr for new time inputs
    const newTimeInputs = newItem.querySelectorAll('input[type="time"]');
    newTimeInputs.forEach(input => {
      flatpickr(input, {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        allowInput: true,
        clickOpens: true,
        theme: "material_blue"
      });
    });

    // Bind remove button
    const removeBtn = newItem.querySelector('.remove-sleep-schedule');
    removeBtn.addEventListener('click', () => {
      newItem.remove();
    });
  }

  // Add special date
  static addSpecialDate() {
    const container = document.getElementById('specialDates');
    if (!container) return;

    const newItem = document.createElement('div');
    newItem.className = 'special-date-item';
    newItem.innerHTML = `
      <div class="form-row">
        <div class="form-group">
          <label>التاريخ</label>
          <input type="date" name="specialDate">
        </div>
        <div class="form-group">
          <label>وقت البداية</label>
          <input type="time" name="specialStart" value="09:00">
        </div>
        <div class="form-group">
          <label>وقت النهاية</label>
          <input type="time" name="specialEnd" value="18:00">
        </div>
        <div class="form-group">
          <button type="button" class="btn btn-danger btn-sm remove-special-date">حذف</button>
        </div>
      </div>
    `;

    container.appendChild(newItem);
    
    // Initialize Flatpickr for new inputs
    const dateInput = newItem.querySelector('input[type="date"]');
    const timeInputs = newItem.querySelectorAll('input[type="time"]');
    
    if (dateInput) {
      flatpickr(dateInput, {
        dateFormat: "Y-m-d",
        locale: "ar",
        allowInput: true,
        clickOpens: true,
        theme: "material_blue"
      });
    }
    
    timeInputs.forEach(input => {
      flatpickr(input, {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        allowInput: true,
        clickOpens: true,
        theme: "material_blue"
      });
    });

    // Bind remove button
    const removeBtn = newItem.querySelector('.remove-special-date');
    removeBtn.addEventListener('click', () => {
      newItem.remove();
    });
  }

  // Add goal
  static addGoal() {
    const container = document.getElementById('goals');
    if (!container) return;

    const newItem = document.createElement('div');
    newItem.className = 'goal-item';
    newItem.innerHTML = `
      <div class="form-group">
        <label>اسم الهدف</label>
        <input type="text" name="goalName" placeholder="أدخل اسم الهدف">
      </div>
      <div class="form-group">
        <label>الأولوية</label>
        <select name="goalPriority">
          <option value="high">عالي</option>
          <option value="medium">متوسط</option>
          <option value="low">منخفض</option>
        </select>
      </div>

      <div class="preferred-times">
        <h5>الأوقات المفضلة</h5>
        <div class="preferred-time-item">
          <div class="form-row">
            <div class="form-group">
              <label>الأيام</label>
              <select name="preferredDays" multiple>
                <option value="sunday">الأحد</option>
                <option value="monday">الاثنين</option>
                <option value="tuesday">الثلاثاء</option>
                <option value="wednesday">الأربعاء</option>
                <option value="thursday">الخميس</option>
                <option value="friday">الجمعة</option>
                <option value="saturday">السبت</option>
              </select>
            </div>
            <div class="form-group">
              <label>الوقت المفضل</label>
              <input type="time" name="preferredTime" value="10:00">
            </div>
            <div class="form-group">
              <button type="button" class="btn btn-danger btn-sm remove-preferred-time">حذف</button>
            </div>
          </div>
        </div>
        <button type="button" class="btn btn-secondary btn-sm add-preferred-time">
          <span class="btn-icon" aria-hidden="true">
            <i class="fa-solid fa-plus"></i>
          </span>
          إضافة وقت مفضل
        </button>
      </div>

      <div class="form-group">
        <label>تكرار الهدف</label>
        <select name="goalRepeat">
          <option value="daily">يومي</option>
          <option value="weekly">أسبوعي</option>
          <option value="monthly">شهري</option>
          <option value="custom">مخصص</option>
        </select>
      </div>

      <div class="form-group">
        <button type="button" class="btn btn-danger remove-goal">حذف الهدف</button>
      </div>
    `;

    container.appendChild(newItem);
    
    // Initialize Choices.js for select inputs
    const selectInputs = newItem.querySelectorAll('select');
    selectInputs.forEach(select => {
      new Choices(select, {
        searchEnabled: false,
        itemSelectText: '',
        shouldSort: false,
        placeholder: true,
        placeholderValue: select.getAttribute('placeholder') || 'اختر...',
        noResultsText: 'لا توجد نتائج',
        noChoicesText: 'لا توجد خيارات',
        loadingText: 'جاري التحميل...',
        classNames: {
          containerOuter: 'choices',
          containerInner: 'choices__inner',
          input: 'choices__input',
          inputCloned: 'choices__input--cloned',
          list: 'choices__list',
          listItems: 'choices__list--multiple',
          listSingle: 'choices__list--single',
          listDropdown: 'choices__list--dropdown',
          item: 'choices__item',
          itemSelectable: 'choices__item--selectable',
          itemDisabled: 'choices__item--disabled',
          itemChoice: 'choices__item--choice',
          placeholder: 'choices__placeholder',
          group: 'choices__group',
          groupHeading: 'choices__heading',
          button: 'choices__button',
          activeState: 'is-active',
          focusState: 'is-focused',
          openState: 'is-open',
          disabledState: 'is-disabled',
          highlightedState: 'is-highlighted',
          selectedState: 'is-selected',
          flippedState: 'is-flipped',
          loadingState: 'is-loading',
          noResults: 'has-no-results',
          noChoices: 'has-no-choices'
        }
      });
    });

    // Initialize Flatpickr for time input
    const timeInput = newItem.querySelector('input[type="time"]');
    if (timeInput) {
      flatpickr(timeInput, {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        allowInput: true,
        clickOpens: true,
        theme: "material_blue"
      });
    }

    // Bind remove button
    const removeBtn = newItem.querySelector('.remove-goal');
    removeBtn.addEventListener('click', () => {
      newItem.remove();
    });

    // Bind add preferred time button
    const addPreferredTimeBtn = newItem.querySelector('.add-preferred-time');
    addPreferredTimeBtn.addEventListener('click', () => {
      CalendarFormHelpers.addPreferredTime(newItem);
    });

    // Bind remove preferred time buttons
    const removePreferredTimeBtns = newItem.querySelectorAll('.remove-preferred-time');
    removePreferredTimeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.target.closest('.preferred-time-item').remove();
      });
    });
  }

  // Add preferred time
  static addPreferredTime(goalItem) {
    const preferredTimesContainer = goalItem.querySelector('.preferred-times');
    if (!preferredTimesContainer) return;

    const newTimeItem = document.createElement('div');
    newTimeItem.className = 'preferred-time-item';
    newTimeItem.innerHTML = `
      <div class="form-row">
        <div class="form-group">
          <label>الأيام</label>
          <select name="preferredDays" multiple>
            <option value="sunday">الأحد</option>
            <option value="monday">الاثنين</option>
            <option value="tuesday">الثلاثاء</option>
            <option value="wednesday">الأربعاء</option>
            <option value="thursday">الخميس</option>
            <option value="friday">الجمعة</option>
            <option value="saturday">السبت</option>
          </select>
        </div>
        <div class="form-group">
          <label>الوقت المفضل</label>
          <input type="time" name="preferredTime" value="10:00">
        </div>
        <div class="form-group">
          <button type="button" class="btn btn-danger btn-sm remove-preferred-time">حذف</button>
        </div>
      </div>
    `;

    // Insert before the add button
    const addBtn = preferredTimesContainer.querySelector('.add-preferred-time');
    preferredTimesContainer.insertBefore(newTimeItem, addBtn);

    // Initialize Choices.js for select
    const selectInput = newTimeItem.querySelector('select');
    if (selectInput) {
      new Choices(selectInput, {
        searchEnabled: false,
        itemSelectText: '',
        shouldSort: false,
        placeholder: true,
        placeholderValue: 'اختر الأيام...',
        noResultsText: 'لا توجد نتائج',
        noChoicesText: 'لا توجد خيارات',
        loadingText: 'جاري التحميل...',
        classNames: {
          containerOuter: 'choices',
          containerInner: 'choices__inner',
          input: 'choices__input',
          inputCloned: 'choices__input--cloned',
          list: 'choices__list',
          listItems: 'choices__list--multiple',
          listSingle: 'choices__list--single',
          listDropdown: 'choices__list--dropdown',
          item: 'choices__item',
          itemSelectable: 'choices__item--selectable',
          itemDisabled: 'choices__item--disabled',
          itemChoice: 'choices__item--choice',
          placeholder: 'choices__placeholder',
          group: 'choices__group',
          groupHeading: 'choices__heading',
          button: 'choices__button',
          activeState: 'is-active',
          focusState: 'is-focused',
          openState: 'is-open',
          disabledState: 'is-disabled',
          highlightedState: 'is-highlighted',
          selectedState: 'is-selected',
          flippedState: 'is-flipped',
          loadingState: 'is-loading',
          noResults: 'has-no-results',
          noChoices: 'has-no-choices'
        }
      });
    }

    // Initialize Flatpickr for time input
    const timeInput = newTimeItem.querySelector('input[type="time"]');
    if (timeInput) {
      flatpickr(timeInput, {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        allowInput: true,
        clickOpens: true,
        theme: "material_blue"
      });
    }

    // Bind remove button
    const removeBtn = newTimeItem.querySelector('.remove-preferred-time');
    removeBtn.addEventListener('click', () => {
      newTimeItem.remove();
    });
  }
}
