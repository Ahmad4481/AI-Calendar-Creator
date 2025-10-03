// Calendar Form Core Management
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
    this.initializeFlatpickr();
    this.initializeChoices();
    this.updateProgress();
    this.updateNavigation();
    this.showStep(1); // Ensure first step is shown
  }

  // Bind all form events
  bindEvents() {
    // Modal events
    const addCalendarBtn = document.getElementById("addSystemTrigger");
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
    const nextStepBtn = document.getElementById("nextStep");
    const prevStepBtn = document.getElementById("prevStep");
    const submitFormBtn = document.getElementById("submitForm");

    if (nextStepBtn) {
      nextStepBtn.addEventListener("click", () => this.nextStep());
    }

    if (prevStepBtn) {
      prevStepBtn.addEventListener("click", () => this.prevStep());
    }

    if (submitFormBtn) {
      submitFormBtn.addEventListener("click", (e) => this.handleSubmit(e));
    }

    // Dynamic form elements
    this.bindDynamicElements();
  }

  // Bind dynamic form elements
  bindDynamicElements() {
    // Sleep schedules
    const addSleepBtn = document.getElementById("addSleepSchedule");
    if (addSleepBtn) {
      addSleepBtn.addEventListener("click", () => this.addSleepSchedule());
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

    // Bind remove buttons
    this.bindRemoveButtons();
  }

  // Bind remove buttons for dynamic elements
  bindRemoveButtons() {
    // Remove sleep schedule buttons
    const removeSleepBtns = document.querySelectorAll(".remove-sleep-schedule");
    removeSleepBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.target.closest(".sleep-schedule-item").remove();
      });
    });

    // Remove special date buttons
    const removeSpecialDateBtns = document.querySelectorAll(".remove-special-date");
    removeSpecialDateBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.target.closest(".special-date-item").remove();
      });
    });

    // Remove goal buttons
    const removeGoalBtns = document.querySelectorAll(".remove-goal");
    removeGoalBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.target.closest(".goal-item").remove();
      });
    });

    // Remove preferred time buttons
    const removePreferredTimeBtns = document.querySelectorAll(".remove-preferred-time");
    removePreferredTimeBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.target.closest(".preferred-time-item").remove();
      });
    });

    // Add preferred time buttons
    const addPreferredTimeBtns = document.querySelectorAll(".add-preferred-time");
    addPreferredTimeBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.addPreferredTime(e.target.closest(".goal-item"));
      });
    });
  }

  // Modal management
  openModal() {
    const modal = document.getElementById("calendarModal");
    if (modal) {
      modal.style.display = "flex";
      document.body.style.overflow = "hidden";
      this.resetForm();
    }
  }

  closeModal() {
    const modal = document.getElementById("calendarModal");
    if (modal) {
      modal.style.display = "none";
      document.body.style.overflow = "auto";
    }
  }

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

  // Step navigation
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

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.showStep(this.currentStep);
      this.updateProgress();
      this.updateNavigation();
    }
  }

  showStep(stepNumber) {
    // Hide all steps
    const steps = document.querySelectorAll(".form-step");
    steps.forEach((step) => {
      step.classList.remove("active");
    });

    // Show current step
    const currentStepEl = document.querySelector(`[data-step="${stepNumber}"]`);
    if (currentStepEl) {
      currentStepEl.classList.add("active");
    }

    // Update progress indicators
    const progressSteps = document.querySelectorAll(".progress-step");
    progressSteps.forEach((progressStep, index) => {
      if (index + 1 <= stepNumber) {
        progressStep.classList.add("active");
      } else {
        progressStep.classList.remove("active");
      }
    });
  }

  updateProgress() {
    const progressSteps = document.querySelectorAll(".progress-step");
    progressSteps.forEach((step, index) => {
      if (index + 1 <= this.currentStep) {
        step.classList.add("active");
      } else {
        step.classList.remove("active");
      }
    });
  }

  updateNavigation() {
    const prevBtn = document.getElementById("prevStep");
    const nextBtn = document.getElementById("nextStep");
    const submitBtn = document.getElementById("submitForm");

    if (prevBtn) {
      prevBtn.disabled = this.currentStep === 1;
    }

    if (nextBtn && submitBtn) {
      if (this.currentStep === this.totalSteps) {
        nextBtn.style.display = "none";
        submitBtn.style.display = "inline-flex";
      } else {
        nextBtn.style.display = "inline-flex";
        submitBtn.style.display = "none";
      }
    }
  }

  // Validation
  validateCurrentStep() {
    const currentStepEl = document.querySelector(`[data-step="${this.currentStep}"]`);
    if (!currentStepEl) return false;

    const requiredFields = currentStepEl.querySelectorAll("[required]");
    let isValid = true;

    requiredFields.forEach((field) => {
      if (!field.value.trim()) {
        isValid = false;
        field.classList.add("error");
      } else {
        field.classList.remove("error");
      }
    });

    return isValid;
  }

  // Data management
  saveCurrentStepData() {
    const currentStepEl = document.querySelector(`[data-step="${this.currentStep}"]`);
    if (!currentStepEl) return;

    const formData = new FormData(currentStepEl.querySelector("form") || currentStepEl);
    const stepData = {};

    for (let [key, value] of formData.entries()) {
      stepData[key] = value;
    }

    switch (this.currentStep) {
      case 1:
        this.formData.basicInfo = stepData;
        break;
      case 2:
        this.formData.sleepSchedules = this.collectSleepSchedules();
        break;
      case 3:
        this.formData.daySettings = this.collectDaySettings();
        break;
      case 4:
        this.formData.goals = this.collectGoals();
        break;
    }
  }

  // Form submission
  handleSubmit(e) {
    e.preventDefault();
    
    if (this.validateCurrentStep()) {
      this.saveCurrentStepData();
      this.submitForm();
    }
  }

  submitForm() {
    console.log("Form submitted with data:", this.formData);
    
    // Here you would typically send the data to a server
    // For now, we'll just show a success message
    alert("تم إنشاء التقويم بنجاح!");
    this.closeModal();
  }

  // Initialize external libraries
  initializeFlatpickr() {
    // Date inputs
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
      flatpickr(input, {
        dateFormat: "Y-m-d",
        locale: "ar",
        allowInput: true,
        clickOpens: true,
        theme: "material_blue"
      });
    });

    // Time inputs
    const timeInputs = document.querySelectorAll('input[type="time"]');
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

    // DateTime inputs (if any)
    const datetimeInputs = document.querySelectorAll('input[data-type="datetime"]');
    datetimeInputs.forEach(input => {
      flatpickr(input, {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        locale: "ar",
        allowInput: true,
        clickOpens: true,
        theme: "material_blue"
      });
    });
  }

  initializeChoices() {
    const selectInputs = document.querySelectorAll('select:not([multiple])');
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
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new CalendarFormManager();
});
