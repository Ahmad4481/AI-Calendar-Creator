// Action buttons functionality
class ActionsManager {
  constructor() {
    this.init();
  }

  init() {
    this.bindEvents();
  }

  // Handle action button clicks
  handleActionClick(event) {
    const actionText = event.currentTarget.querySelector('.action-text').textContent;
    
    switch (actionText) {
      case 'إضافة حدث':
        this.showAddEventModal();
        break;
      case 'إنشاء قائمة مهام':
        this.showTaskListModal();
        break;
      case 'تقرير شهري':
        this.showMonthlyReport();
        break;
      case 'إعدادات التقويم':
        this.showCalendarSettings();
        break;
      default:
        this.showGenericAction(actionText);
    }
  }

  // Show add event modal
  showAddEventModal() {
    this.showModal('إضافة حدث جديد', 'سيتم فتح نافذة إضافة حدث جديد');
  }

  // Show task list modal
  showTaskListModal() {
    this.showModal('إنشاء قائمة مهام', 'سيتم فتح نافذة إنشاء قائمة مهام');
  }

  // Show monthly report
  showMonthlyReport() {
    this.showModal('تقرير شهري', 'سيتم فتح تقرير شهري');
  }

  // Show calendar settings
  showCalendarSettings() {
    this.showModal('إعدادات التقويم', 'سيتم فتح إعدادات التقويم');
  }

  // Show generic action
  showGenericAction(actionText) {
    this.showModal('إجراء', `تم النقر على: ${actionText}`);
  }

  // Show modal (placeholder for now)
  showModal(title, message) {
    // For now, use alert. In a real app, you'd create a proper modal
    alert(`${title}\n\n${message}`);
    
    // Dispatch custom event for other components
    this.dispatchActionEvent(title, message);
  }

  // Dispatch custom event when action is triggered
  dispatchActionEvent(actionTitle, actionMessage) {
    const event = new CustomEvent('actionTriggered', {
      detail: {
        title: actionTitle,
        message: actionMessage,
        timestamp: new Date().toISOString()
      }
    });
    document.dispatchEvent(event);
  }

  // Bind action button events
  bindEvents() {
    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.handleActionClick(e);
      });
    });
  }

  // Add new action button dynamically
  addActionButton(buttonData) {
    const actionsContainer = document.querySelector('.action-buttons');
    if (!actionsContainer) return;

    const button = document.createElement('button');
    button.className = `action-btn ${buttonData.type || 'secondary'}`;
    button.innerHTML = `
      <span class="action-icon">${buttonData.icon}</span>
      <span class="action-text">${buttonData.text}</span>
    `;
    
    button.addEventListener('click', (e) => {
      this.handleActionClick(e);
    });
    
    actionsContainer.appendChild(button);
  }

  // Remove action button
  removeActionButton(buttonText) {
    const buttons = document.querySelectorAll('.action-btn');
    buttons.forEach(btn => {
      const text = btn.querySelector('.action-text').textContent;
      if (text === buttonText) {
        btn.remove();
      }
    });
  }
}

// Initialize actions manager
const actionsManager = new ActionsManager();

// Export for use in other modules
window.actionsManager = actionsManager;
