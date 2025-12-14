/**
 * Reinforcement Learning Client
 * التواصل مع نظام التعلم المعزز في Firebase Functions
 */

import { getFunctions, httpsCallable } from './firebase/firebase-exports.js';
import { app } from './firebase/index.js';

class RLClient {
  constructor() {
    this.functions = getFunctions(app);
    this.rlPredict = httpsCallable(this.functions, 'rlPredict');
    this.rlFeedback = httpsCallable(this.functions, 'rlFeedback');
    this.rlTrain = httpsCallable(this.functions, 'rlTrain');
    this.rlStats = httpsCallable(this.functions, 'rlStats');
    this.rlGetActions = httpsCallable(this.functions, 'rlGetActions');
    
    // Cache for actions
    this.actionsCache = null;
  }

  /**
   * Get current state from user context
   */
  buildState(userContext = {}) {
    const now = new Date();
    
    return {
      hour_of_day: now.getHours(),
      day_of_week: now.getDay(),
      user_energy_level: userContext.energyLevel || 0.5,
      pending_tasks_count: userContext.pendingTasks || 0,
      completed_today_count: userContext.completedToday || 0,
      task_difficulty: userContext.taskDifficulty || 0.5,
      task_duration_minutes: userContext.taskDuration || 30,
      deadline_hours: userContext.deadlineHours || 24,
      streak_days: userContext.streak || 0,
      avg_completion_rate: userContext.completionRate || 0.5,
    };
  }

  /**
   * Get recommended action for current context
   */
  async predict(userContext = {}, explore = true) {
    try {
      const state = this.buildState(userContext);
      
      const result = await this.rlPredict({
        state,
        explore,
      });

      return {
        success: true,
        action: result.data.action,
        confidence: result.data.confidence,
        actionScores: result.data.actionScores,
      };
    } catch (error) {
      console.error('[RLClient] Prediction error:', error);
      return {
        success: false,
        error: error.message,
        // Fallback action
        action: { id: 'schedule_now', name: 'جدولة فورية' },
        confidence: 0,
      };
    }
  }

  /**
   * Send feedback after action is taken
   */
  async sendFeedback(userContext, actionId, feedback = {}, done = false) {
    try {
      const state = this.buildState(userContext);
      
      const result = await this.rlFeedback({
        state,
        action: actionId,
        nextState: state, // In real scenario, this would be the new state
        feedback,
        done,
      });

      return {
        success: true,
        reward: result.data.reward,
        stats: result.data.stats,
      };
    } catch (error) {
      console.error('[RLClient] Feedback error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Trigger batch training
   */
  async train(batchSize = 32, epochs = 10) {
    try {
      const result = await this.rlTrain({
        batchSize,
        epochs,
      });

      return {
        success: true,
        ...result.data,
      };
    } catch (error) {
      console.error('[RLClient] Training error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get agent statistics
   */
  async getStats() {
    try {
      const result = await this.rlStats({});
      return {
        success: true,
        ...result.data,
      };
    } catch (error) {
      console.error('[RLClient] Stats error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get available actions
   */
  async getActions() {
    if (this.actionsCache) {
      return this.actionsCache;
    }

    try {
      const result = await this.rlGetActions({});
      this.actionsCache = result.data.actions;
      return this.actionsCache;
    } catch (error) {
      console.error('[RLClient] Get actions error:', error);
      // Return default actions
      return [
        { id: 'schedule_now', name: 'جدولة فورية' },
        { id: 'schedule_morning', name: 'جدولة صباحية' },
        { id: 'schedule_afternoon', name: 'جدولة ظهرية' },
        { id: 'schedule_evening', name: 'جدولة مسائية' },
      ];
    }
  }

  /**
   * Helper: Report task completion
   */
  async reportTaskCompleted(userContext, actionId, onTime = true, satisfaction = 0.8) {
    return this.sendFeedback(userContext, actionId, {
      task_completed: true,
      on_time: onTime,
      satisfaction,
    }, true);
  }

  /**
   * Helper: Report task failure
   */
  async reportTaskFailed(userContext, actionId) {
    return this.sendFeedback(userContext, actionId, {
      task_failed: true,
      satisfaction: 0,
    }, true);
  }

  /**
   * Helper: Report task rescheduled
   */
  async reportTaskRescheduled(userContext, actionId) {
    return this.sendFeedback(userContext, actionId, {
      rescheduled: true,
      satisfaction: 0.3,
    }, false);
  }
}

// Create singleton instance
const rlClient = new RLClient();

export default rlClient;
export { RLClient };

