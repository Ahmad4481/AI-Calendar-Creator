// Calendar Form Management
class CalendarFormManager {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 4;
    this.formData = {
      basicInfo: {},
      sleepSchedules: [],
      daySettings: {
        weekdays: {},
        specialDates: [],
      },
      goals: [],
    };
    this.init();
  }

  init() {
    this.bindEvents();
    this.updateProgress();
    this.updateNavigation();
    this.showStep(1); // Ensure first step is shown
  }

  // Bind all form events
  bindEvents() {
    // Modal events
    const addCalendarBtn = document.getElementById("addCalendarBtn");
    const closeModal = document.getElementById("closeModal");
    const modalOverlay = document.getElementById("calendarModal");

    if (addCalendarBtn) {
      addCalendarBtn.addEventListener("click", () => this.openModal());
    }

    if (closeModal) {
      closeModal.addEventListener("click", () => this.closeModal());
    }

    if (modalOverlay) {
      modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) {
          this.closeModal();
        }
      });
    }

    // Form navigation
    const prevStepBtn = document.getElementById("prevStep");
    const nextStepBtn = document.getElementById("nextStep");
    const submitFormBtn = document.getElementById("submitForm");

    if (prevStepBtn) {
      prevStepBtn.addEventListener("click", () => this.previousStep());
    }

    if (nextStepBtn) {
      nextStepBtn.addEventListener("click", () => this.nextStep());
    }

    if (submitFormBtn) {
      submitFormBtn.addEventListener("click", (e) => this.submitForm(e));
    }

    // Dynamic form elements
    this.bindDynamicElements();
  }

  // Bind dynamic form elements
  bindDynamicElements() {
    // Sleep schedules
    const addSleepScheduleBtn = document.getElementById("addSleepSchedule");
    if (addSleepScheduleBtn) {
      addSleepScheduleBtn.addEventListener("click", () =>
        this.addSleepSchedule()
      );
    }

    // Special dates
    const addSpecialDateBtn = document.getElementById("addSpecialDate");
    if (addSpecialDateBtn) {
      addSpecialDateBtn.addEventListener("click", () => this.addSpecialDate());
    }

    // Goals
    const addGoalBtn = document.getElementById("addGoal");
    if (addGoalBtn) {
      addGoalBtn.addEventListener("click", () => this.addGoal());
    }

    // Bind existing remove buttons
    this.bindRemoveButtons();
  }

  // Bind remove buttons for dynamic elements
  bindRemoveButtons() {
    // Sleep schedule remove buttons
    document.querySelectorAll(".remove-sleep-schedule").forEach((btn) => {
      btn.addEventListener("click", (e) => this.removeSleepSchedule(e));
    });

    // Special date remove buttons
    document.querySelectorAll(".remove-special-date").forEach((btn) => {
      btn.addEventListener("click", (e) => this.removeSpecialDate(e));
    });

    // Goal remove buttons
    document.querySelectorAll(".remove-goal").forEach((btn) => {
      btn.addEventListener("click", (e) => this.removeGoal(e));
    });

    // Preferred time remove buttons
    document.querySelectorAll(".remove-preferred-time").forEach((btn) => {
      btn.addEventListener("click", (e) => this.removePreferredTime(e));
    });

    // Add preferred time buttons
    document.querySelectorAll(".add-preferred-time").forEach((btn) => {
      btn.addEventListener("click", (e) => this.addPreferredTime(e));
    });
  }

  // Open modal
  openModal() {
    const modal = document.getElementById("calendarModal");
    if (modal) {
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  }

  // Close modal
  closeModal() {
    const modal = document.getElementById("calendarModal");
    if (modal) {
      modal.classList.remove("active");
      document.body.style.overflow = "";
      this.resetForm();
    }
  }

  // Reset form to initial state
  resetForm() {
    this.currentStep = 1;
    this.formData = {
      basicInfo: {},
      sleepSchedules: [],
      daySettings: {
        weekdays: {},
        specialDates: [],
      },
      goals: [],
    };
    this.updateProgress();
    this.updateNavigation();
    this.showStep(1);
  }

  // Navigate to next step
  nextStep() {
    if (this.validateCurrentStep()) {
      this.saveCurrentStepData();
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        this.showStep(this.currentStep);
        this.updateProgress();
        this.updateNavigation();
      }
    }
  }

  // Navigate to previous step
  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.showStep(this.currentStep);
      this.updateProgress();
      this.updateNavigation();
    }
  }

  // Show specific step
  showStep(step) {
    // Hide all steps
    document.querySelectorAll(".form-step").forEach((stepEl) => {
      stepEl.classList.remove("active");
    });

    // Show current step
    const currentStepEl = document.querySelector(
      `.form-step[data-step="${step}"]`
    );
    if (currentStepEl) {
      currentStepEl.classList.add("active");
    }
  }

  // Update progress indicator
  updateProgress() {
    document.querySelectorAll(".progress-step").forEach((stepEl, index) => {
      const stepNumber = index + 1;
      stepEl.classList.remove("active", "completed");

      if (stepNumber === this.currentStep) {
        stepEl.classList.add("active");
      } else if (stepNumber < this.currentStep) {
        stepEl.classList.add("completed");
      }
    });
  }

  // Update navigation buttons
  updateNavigation() {
    const prevBtn = document.getElementById("prevStep");
    const nextBtn = document.getElementById("nextStep");
    const submitBtn = document.getElementById("submitForm");

    if (prevBtn) {
      prevBtn.disabled = this.currentStep === 1;
    }

    if (nextBtn) {
      nextBtn.style.display =
        this.currentStep === this.totalSteps ? "none" : "inline-flex";
    }

    if (submitBtn) {
      submitBtn.style.display =
        this.currentStep === this.totalSteps ? "inline-flex" : "none";
    }
  }

  // Validate current step
  validateCurrentStep() {
    const currentStepEl = document.querySelector(
      `.form-step[data-step="${this.currentStep}"]`
    );
    if (!currentStepEl) return false;

    const requiredFields = currentStepEl.querySelectorAll("[required]");
    let isValid = true;

    requiredFields.forEach((field) => {
      if (!field.value.trim()) {
        field.style.borderColor = "var(--destructive)";
        isValid = false;
      } else {
        field.style.borderColor = "";
      }
    });

    if (!isValid) {
      this.showMessage("يرجى ملء جميع الحقول المطلوبة", "error");
    }

    return isValid;
  }

  // Save current step data
  saveCurrentStepData() {
    const currentStepEl = document.querySelector(
      `.form-step[data-step="${this.currentStep}"]`
    );
    if (!currentStepEl) return;

    switch (this.currentStep) {
      case 1:
        this.saveBasicInfo();
        break;
      case 2:
        this.saveSleepSchedules();
        break;
      case 3:
        this.saveDaySettings();
        break;
      case 4:
        this.saveGoals();
        break;
    }
  }

  // Save basic info
  saveBasicInfo() {
    const calendarName = document.getElementById("calendarName").value;
    const calendarScope = document.getElementById("calendarScope").value;

    this.formData.basicInfo = {
      name: calendarName,
      scope: calendarScope,
    };
  }

  // Save sleep schedules
  saveSleepSchedules() {
    this.formData.sleepSchedules = [];
    document.querySelectorAll(".sleep-schedule-item").forEach((item) => {
      const startTime = item.querySelector('[name="sleepStart"]').value;
      const endTime = item.querySelector('[name="sleepEnd"]').value;

      if (startTime && endTime) {
        this.formData.sleepSchedules.push({
          start: startTime,
          end: endTime,
        });
      }
    });
  }

  // Save day settings
  saveDaySettings() {
    // Weekdays
    const weekdayStart = document.querySelector('[name="weekdayStart"]').value;
    const weekdayEnd = document.querySelector('[name="weekdayEnd"]').value;

    this.formData.daySettings.weekdays = {
      start: weekdayStart,
      end: weekdayEnd,
    };

    // Special dates
    this.formData.daySettings.specialDates = [];
    document.querySelectorAll(".special-date-item").forEach((item) => {
      const date = item.querySelector('[name="specialDate"]').value;
      const startTime = item.querySelector('[name="specialStart"]').value;
      const endTime = item.querySelector('[name="specialEnd"]').value;

      if (date && startTime && endTime) {
        this.formData.daySettings.specialDates.push({
          date: date,
          start: startTime,
          end: endTime,
        });
      }
    });
  }

  // Save goals
  saveGoals() {
    this.formData.goals = [];
    document.querySelectorAll(".goal-item").forEach((item) => {
      const goalName = item.querySelector('[name="goalName"]').value;
      const priority = item.querySelector('[name="goalPriority"]').value;
      const repeat = item.querySelector('[name="goalRepeat"]').value;

      if (goalName) {
        const preferredTimes = [];
        item.querySelectorAll(".preferred-time-item").forEach((timeItem) => {
          const days = Array.from(
            timeItem.querySelector('[name="preferredDays"]').selectedOptions
          ).map((option) => option.value);
          const time = timeItem.querySelector('[name="preferredTime"]').value;

          if (days.length > 0 && time) {
            preferredTimes.push({
              days: days,
              time: time,
            });
          }
        });

        this.formData.goals.push({
          name: goalName,
          priority: priority,
          repeat: repeat,
          preferredTimes: preferredTimes,
        });
      }
    });
  }

  // Add sleep schedule
  addSleepSchedule() {
    const container = document.getElementById("sleepSchedules");
    const newItem = document.createElement("div");
    newItem.className = "sleep-schedule-item";
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
    this.bindRemoveButtons();
  }

  // Remove sleep schedule
  removeSleepSchedule(event) {
    const container = document.getElementById("sleepSchedules");
    if (container.children.length > 1) {
      event.target.closest(".sleep-schedule-item").remove();
    } else {
      this.showMessage("يجب أن يكون هناك على الأقل جدول نوم واحد", "error");
    }
  }

  // Add special date
  addSpecialDate() {
    const container = document.getElementById("specialDates");
    const newItem = document.createElement("div");
    newItem.className = "special-date-item";
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
    this.bindRemoveButtons();
  }

  // Remove special date
  removeSpecialDate(event) {
    event.target.closest(".special-date-item").remove();
  }

  // Add goal
  addGoal() {
    const container = document.getElementById("goals");
    const newItem = document.createElement("div");
    newItem.className = "goal-item";
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
          <span class="btn-icon">➕</span>
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
    this.bindRemoveButtons();
  }

  // Remove goal
  removeGoal(event) {
    const container = document.getElementById("goals");
    if (container.children.length > 1) {
      event.target.closest(".goal-item").remove();
    } else {
      this.showMessage("يجب أن يكون هناك على الأقل هدف واحد", "error");
    }
  }

  // Add preferred time
  addPreferredTime(event) {
    const goalItem = event.target.closest(".goal-item");
    const preferredTimes = goalItem.querySelector(".preferred-times");
    const newItem = document.createElement("div");
    newItem.className = "preferred-time-item";
    newItem.innerHTML = `
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

    const addBtn = preferredTimes.querySelector(".add-preferred-time");
    preferredTimes.insertBefore(newItem, addBtn);
    this.bindRemoveButtons();
  }

  // Remove preferred time
  removePreferredTime(event) {
    const goalItem = event.target.closest(".goal-item");
    const preferredTimes = goalItem.querySelectorAll(".preferred-time-item");
    if (preferredTimes.length > 1) {
      event.target.closest(".preferred-time-item").remove();
    } else {
      this.showMessage("يجب أن يكون هناك على الأقل وقت مفضل واحد", "error");
    }
  }

  // Submit form
  submitForm(event) {
    event.preventDefault();

    if (this.validateCurrentStep()) {
      this.saveCurrentStepData();

      // Save calendar to localStorage
      this.saveCalendar();

      this.showMessage("تم إنشاء التقويم بنجاح!", "success");

      setTimeout(() => {
        this.closeModal();
        const calendarPageManager = new CalendarPageManager();
        calendarPageManager.loadCalendars();
      }, 1500);
    }
  }

  // Save calendar to localStorage
  saveCalendar() {
    const calendars = JSON.parse(localStorage.getItem("calendars") || "[]");
    const newCalendar = {
      id: Date.now(),
      ...this.formData.basicInfo,
      sleepSchedules: this.formData.sleepSchedules,
      daySettings: this.formData.daySettings,
      goals: this.formData.goals,
      createdAt: new Date().toISOString(),
    };

    calendars.push(newCalendar);
    localStorage.setItem("calendars", JSON.stringify(calendars));
  }

  // Refresh calendar list
  refreshCalendarList() {
    // Reload the page to show new calendar
    new (calendarPageManager).initializePage();
  }

  // Load calendar data for editing
  loadCalendarData(calendar) {
    console.log("load calendar date");
    // Load basic info
    document.getElementById("calendarName").value = calendar.name || "";
    document.getElementById("calendarScope").value = calendar.scope || "";

    // Load sleep schedules
    const sleepContainer = document.getElementById("sleepSchedules");
    sleepContainer.innerHTML = "";

    if (calendar.sleepSchedules && calendar.sleepSchedules.length > 0) {
      calendar.sleepSchedules.forEach((schedule) => {
        const newItem = document.createElement("div");
        newItem.className = "sleep-schedule-item";
        newItem.innerHTML = `
          <div class="form-row">
            <div class="form-group">
              <label>وقت بداية النوم</label>
              <input type="time" name="sleepStart" value="${schedule.start}">
            </div>
            <div class="form-group">
              <label>وقت نهاية النوم</label>
              <input type="time" name="sleepEnd" value="${schedule.end}">
            </div>
            <div class="form-group">
              <button type="button" class="btn btn-danger btn-sm remove-sleep-schedule">حذف</button>
            </div>
          </div>
        `;
        sleepContainer.appendChild(newItem);
      });
    } else {
      // Add default sleep schedule
      this.addSleepSchedule();
    }

    // Load day settings
    if (calendar.daySettings && calendar.daySettings.weekdays) {
      document.querySelector('[name="weekdayStart"]').value =
        calendar.daySettings.weekdays.start || "";
      document.querySelector('[name="weekdayEnd"]').value =
        calendar.daySettings.weekdays.end || "";
    }

    // Load special dates
    const specialDatesContainer = document.getElementById("specialDates");
    specialDatesContainer.innerHTML = "";

    if (
      calendar.daySettings &&
      calendar.daySettings.specialDates &&
      calendar.daySettings.specialDates.length > 0
    ) {
      calendar.daySettings.specialDates.forEach((specialDate) => {
        const newItem = document.createElement("div");
        newItem.className = "special-date-item";
        newItem.innerHTML = `
          <div class="form-row">
            <div class="form-group">
              <label>التاريخ</label>
              <input type="date" name="specialDate" value="${specialDate.date}">
            </div>
            <div class="form-group">
              <label>وقت البداية</label>
              <input type="time" name="specialStart" value="${specialDate.start}">
            </div>
            <div class="form-group">
              <label>وقت النهاية</label>
              <input type="time" name="specialEnd" value="${specialDate.end}">
            </div>
            <div class="form-group">
              <button type="button" class="btn btn-danger btn-sm remove-special-date">حذف</button>
            </div>
          </div>
        `;
        specialDatesContainer.appendChild(newItem);
      });
    }

    // Load goals
    const goalsContainer = document.getElementById("goals");
    goalsContainer.innerHTML = "";

    if (calendar.goals && calendar.goals.length > 0) {
      calendar.goals.forEach((goal) => {
        const newItem = document.createElement("div");
        newItem.className = "goal-item";

        let preferredTimesHtml = "";
        if (goal.preferredTimes && goal.preferredTimes.length > 0) {
          goal.preferredTimes.forEach((prefTime, index) => {
            const selectedDays = prefTime.days
              .map(
                (day) =>
                  `<option value="${day}" selected>${this.getDayName(
                    day
                  )}</option>`
              )
              .join("");

            preferredTimesHtml += `
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
                    <input type="time" name="preferredTime" value="${prefTime.time}">
                  </div>
                  <div class="form-group">
                    <button type="button" class="btn btn-danger btn-sm remove-preferred-time">حذف</button>
                  </div>
                </div>
              </div>
            `;
          });
        } else {
          preferredTimesHtml = `
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
          `;
        }

        newItem.innerHTML = `
          <div class="form-group">
            <label>اسم الهدف</label>
            <input type="text" name="goalName" placeholder="أدخل اسم الهدف" value="${
              goal.name
            }">
          </div>
          <div class="form-group">
            <label>الأولوية</label>
            <select name="goalPriority">
              <option value="high" ${
                goal.priority === "high" ? "selected" : ""
              }>عالي</option>
              <option value="medium" ${
                goal.priority === "medium" ? "selected" : ""
              }>متوسط</option>
              <option value="low" ${
                goal.priority === "low" ? "selected" : ""
              }>منخفض</option>
            </select>
          </div>
          
          <div class="preferred-times">
            <h5>الأوقات المفضلة</h5>
            ${preferredTimesHtml}
            <button type="button" class="btn btn-secondary btn-sm add-preferred-time">
              <span class="btn-icon">➕</span>
              إضافة وقت مفضل
            </button>
          </div>

          <div class="form-group">
            <label>تكرار الهدف</label>
            <select name="goalRepeat">
              <option value="daily" ${
                goal.repeat === "daily" ? "selected" : ""
              }>يومي</option>
              <option value="weekly" ${
                goal.repeat === "weekly" ? "selected" : ""
              }>أسبوعي</option>
              <option value="monthly" ${
                goal.repeat === "monthly" ? "selected" : ""
              }>شهري</option>
              <option value="custom" ${
                goal.repeat === "custom" ? "selected" : ""
              }>مخصص</option>
            </select>
          </div>

          <div class="form-group">
            <button type="button" class="btn btn-danger remove-goal">حذف الهدف</button>
          </div>
        `;
        goalsContainer.appendChild(newItem);
      });
    } else {
      // Add default goal
      this.addGoal();
    }

    // Re-bind events
    this.bindRemoveButtons();
  }

  // Get day name in Arabic
  getDayName(dayValue) {
    const dayNames = {
      sunday: "الأحد",
      monday: "الاثنين",
      tuesday: "الثلاثاء",
      wednesday: "الأربعاء",
      thursday: "الخميس",
      friday: "الجمعة",
      saturday: "السبت",
    };
    return dayNames[dayValue] || dayValue;
  }

  // Show message
  showMessage(message, type) {
    // Remove existing messages
    const existingMessage = document.querySelector(".form-message");
    if (existingMessage) {
      existingMessage.remove();
    }

    // Create message element
    const messageEl = document.createElement("div");
    messageEl.className = `form-message message-${type}`;
    messageEl.textContent = message;

    // Add styles
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      border-radius: var(--radius);
      color: white;
      font-weight: var(--font-weight-medium);
      z-index: 1001;
      animation: slideIn 0.3s ease;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;

    if (type === "success") {
      messageEl.style.backgroundColor = "var(--secondary)";
    } else if (type === "error") {
      messageEl.style.backgroundColor = "var(--destructive)";
    }

    // Add to page
    document.body.appendChild(messageEl);

    // Auto remove after 5 seconds
    setTimeout(() => {
      messageEl.style.animation = "slideOut 0.3s ease";
      setTimeout(() => {
        if (messageEl.parentNode) {
          messageEl.remove();
        }
      }, 300);
    }, 5000);
  }
}

// Calendar Page Manager
class CalendarPageManager {
  constructor() {
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.initializePage();
      });
    } else {
      this.initializePage();
    }
  }

  initializePage() {
    // Load existing calendars
    this.loadCalendars();

    // Initialize form manager
    this.formManager = new CalendarFormManager();
  }

  // Load existing calendars from localStorage
  loadCalendars() {
    const calendars = JSON.parse(localStorage.getItem("calendars") || "[]");
    const calendarGrid = document.querySelector(".calendar-grid");

    if (!calendarGrid) return;

    // Clear existing cards (except the first two demo cards)
    const existingCards = calendarGrid.querySelectorAll(".calendar-card");
    existingCards.forEach((card) => card.remove());

    // Add loaded calendars
    calendars.forEach((calendar) => {
      const calendarCard = this.createCalendarCard(calendar);
      calendarGrid.appendChild(calendarCard);
    });
  }

  // Create calendar card element
  createCalendarCard(calendar) {
    const card = document.createElement("div");
    card.className = "calendar-card";

    const scopeText =
      {
        daily: "يومي",
        weekly: "أسبوعي",
        monthly: "شهري",
        yearly: "سنوي",
      }[calendar.scope] || calendar.scope;

    const goalsCount = calendar.goals ? calendar.goals.length : 0;
    const createdAt = new Date(calendar.createdAt);
    const timeAgo = this.getTimeAgo(createdAt);

    card.innerHTML = `
      <div class="calendar-card-header">
        <h3>${calendar.name}</h3>
        <div class="calendar-actions">
          <button class="btn-icon-btn" title="تعديل" onclick="calendarPageManager.editCalendar(${calendar.id})">✏️</button>
          <button class="btn-icon-btn" title="حذف" onclick="calendarPageManager.deleteCalendar(${calendar.id})">🗑️</button>
        </div>
      </div>
      <div class="calendar-card-body">
        <div class="calendar-info">
          <span class="info-label">النطاق:</span>
          <span class="info-value">${scopeText}</span>
        </div>
        <div class="calendar-info">
          <span class="info-label">الأهداف:</span>
          <span class="info-value">${goalsCount} أهداف</span>
        </div>
        <div class="calendar-info">
          <span class="info-label">آخر تحديث:</span>
          <span class="info-value">${timeAgo}</span>
        </div>
      </div>
    `;

    return card;
  }

  // Get time ago string
  getTimeAgo(date) {
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return "الآن";
    } else if (diffInHours < 24) {
      return `منذ ${diffInHours} ساعة`;
    } else if (diffInHours < 48) {
      return "أمس";
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `منذ ${diffInDays} يوم`;
    }
  }

  // Edit calendar
  editCalendar(calendarId) {
    const calendars = JSON.parse(localStorage.getItem("calendars") || "[]");
    const calendar = calendars.find((cal) => cal.id === calendarId);

    if (calendar) {
      // Open modal and populate with calendar data
      this.formManager.openModal();
      this.formManager.loadCalendarData(calendar);
    }
  }

  // Delete calendar
  deleteCalendar(calendarId) {
    if (confirm("هل أنت متأكد من حذف هذا التقويم؟")) {
      const calendars = JSON.parse(localStorage.getItem("calendars") || "[]");
      const filteredCalendars = calendars.filter(
        (cal) => cal.id !== calendarId
      );
      localStorage.setItem("calendars", JSON.stringify(filteredCalendars));

      // Reload calendar list
      this.loadCalendars();

      this.showMessage("تم حذف التقويم بنجاح", "success");
    }
  }

  // Show message
  showMessage(message, type) {
    // Remove existing messages
    const existingMessage = document.querySelector(".page-message");
    if (existingMessage) {
      existingMessage.remove();
    }

    // Create message element
    const messageEl = document.createElement("div");
    messageEl.className = `page-message message-${type}`;
    messageEl.textContent = message;

    // Add styles
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      border-radius: var(--radius);
      color: white;
      font-weight: var(--font-weight-medium);
      z-index: 1001;
      animation: slideIn 0.3s ease;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;

    if (type === "success") {
      messageEl.style.backgroundColor = "var(--secondary)";
    } else if (type === "error") {
      messageEl.style.backgroundColor = "var(--destructive)";
    }

    // Add to page
    document.body.appendChild(messageEl);

    // Auto remove after 5 seconds
    setTimeout(() => {
      messageEl.style.animation = "slideOut 0.3s ease";
      setTimeout(() => {
        if (messageEl.parentNode) {
          messageEl.remove();
        }
      }, 300);
    }, 5000);
  }
}

// Initialize calendar page manager
const calendarPageManager = new CalendarPageManager();

// Export for use in other modules
window.calendarPageManager = calendarPageManager;
