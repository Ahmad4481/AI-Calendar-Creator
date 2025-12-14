
export class RecurringEventModal {
  constructor() {
    this.modalId = 'recurring-options-modal';
    this.element = null;
    this.resolvePromise = null;
    this.createModal();
  }

  createModal() {
    const modalHtml = `
      <style>
        #${this.modalId} {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }
        #${this.modalId} .modal-container {
            background: var(--card, #fff);
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            width: 90%;
            max-width: 400px;
            transform: translateY(20px);
            opacity: 0;
            transition: all 0.3s ease;
        }
        #${this.modalId} .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        #${this.modalId} .modal-header h3 {
            margin: 0;
            font-size: 1.25rem;
            color: var(--foreground, #333);
        }
        #${this.modalId} .close-modal {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: var(--muted-foreground, #666);
        }
        #${this.modalId} .modal-body p {
            margin-bottom: 1.5rem;
            color: var(--muted-foreground, #666);
            line-height: 1.5;
        }
        #${this.modalId} .recurring-options {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }
        #${this.modalId} .option-btn {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            width: 100%;
            padding: 0.875rem 1rem;
            border: 1px solid var(--border, #ddd);
            border-radius: 8px;
            background: var(--background, #fff);
            color: var(--foreground, #333);
            cursor: pointer;
            transition: all 0.2s;
            text-align: right;
            font-size: 0.95rem;
        }
        #${this.modalId} .option-btn:hover {
            border-color: var(--primary, #2563EB);
            background: color-mix(in srgb, var(--primary, #2563EB) 5%, transparent);
            color: var(--primary, #2563EB);
        }
        #${this.modalId} .option-btn i {
            font-size: 1.1rem;
            width: 24px;
            text-align: center;
        }
        #${this.modalId} .modal-footer {
            margin-top: 1.5rem;
            display: flex;
            justify-content: flex-end;
        }
        #${this.modalId} .cancel-btn {
            padding: 0.5rem 1.25rem;
            border: none;
            background: transparent;
            color: var(--muted-foreground, #666);
            cursor: pointer;
            font-weight: 500;
        }
        #${this.modalId} .cancel-btn:hover {
            color: var(--foreground, #333);
        }
      </style>
      <div id="${this.modalId}" style="display: none;">
        <div class="modal-container">
          <div class="modal-header">
            <h3>تعديل حدث متكرر</h3>
            <button class="close-modal">&times;</button>
          </div>
          <div class="modal-body">
            <p>هذا الحدث جزء من سلسلة متكررة. كيف تريد تطبيق التغييرات؟</p>
            <div class="recurring-options">
              <button class="btn option-btn" data-action="this">
                <i class="fa-solid fa-calendar-day"></i>
                هذا الحدث فقط
              </button>
              <button class="btn option-btn" data-action="future">
                <i class="fa-solid fa-forward"></i>
                هذا والأحداث التالية
              </button>
              <button class="btn option-btn" data-action="all">
                <i class="fa-solid fa-calendar-days"></i>
                جميع الأحداث
              </button>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn cancel-btn">إلغاء</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    this.element = document.getElementById(this.modalId);
    
    // Bind events
    this.element.querySelector('.close-modal').addEventListener('click', () => this.close(null));
    this.element.querySelector('.cancel-btn').addEventListener('click', () => this.close(null));
    
    this.element.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this.close(action);
      });
    });
  }

  ask() {
    return new Promise((resolve) => {
      this.resolvePromise = resolve;
      this.element.style.display = 'flex';
      
      // Animation
      const container = this.element.querySelector('.modal-container');
      container.style.opacity = '0';
      container.style.transform = 'translateY(-20px)';
      
      requestAnimationFrame(() => {
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
      });
    });
  }

  close(result) {
    if (this.element) {
        this.element.style.display = 'none';
    }
    if (this.resolvePromise) {
      this.resolvePromise(result);
      this.resolvePromise = null;
    }
  }
}
