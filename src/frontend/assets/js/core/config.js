/**
 * Configuration Manager for AI Calendar Creator
 * Handles environment variables and application settings
 */
class ConfigManager {
  constructor() {
    this.config = {
      // Qwen Plus API Configuration
      qwenPlus: {
        apiKey: this.getEnvVar('QWEN_PLUS_API_KEY', ''),
        endpoint: this.getEnvVar('QWEN_PLUS_ENDPOINT', 'https://dashscope.aliyun.com/compatible-mode/v1/chat/completions'),
        model: this.getEnvVar('QWEN_PLUS_MODEL', 'qwen-plus'),
        temperature: parseFloat(this.getEnvVar('QWEN_PLUS_TEMPERATURE', '0.7')),
        maxTokens: parseInt(this.getEnvVar('QWEN_PLUS_MAX_TOKENS', '1024'))
      },
      
      // Application Configuration
      app: {
        name: this.getEnvVar('APP_NAME', 'AI Calendar Creator'),
        version: this.getEnvVar('APP_VERSION', '1.0.0'),
        environment: this.getEnvVar('APP_ENVIRONMENT', 'development')
      },
      
      // Storage Configuration
      storage: {
        prefix: this.getEnvVar('STORAGE_PREFIX', 'ai-calendar'),
        chatHistoryKey: this.getEnvVar('CHAT_HISTORY_KEY', 'ai-calendar-chat-history'),
        eventsStorageKey: this.getEnvVar('EVENTS_STORAGE_KEY', 'ai-calendar-events')
      },
      
      // UI Configuration
      ui: {
        defaultTheme: this.getEnvVar('DEFAULT_THEME', 'light'),
        autoSaveInterval: parseInt(this.getEnvVar('AUTO_SAVE_INTERVAL', '30000')),
        maxChatHistory: parseInt(this.getEnvVar('MAX_CHAT_HISTORY', '100'))
      },
      
      // Development Settings
      dev: {
        debugMode: this.getEnvVar('DEBUG_MODE', 'true') === 'true',
        logLevel: this.getEnvVar('LOG_LEVEL', 'info'),
        apiTimeout: parseInt(this.getEnvVar('API_TIMEOUT', '30000'))
      }
    };
    
    this.loadFromWindowConfig();
  }

  /**
   * Get environment variable with fallback
   * @param {string} key - Environment variable key
   * @param {string} defaultValue - Default value if not found
   * @returns {string} Environment variable value
   */
  getEnvVar(key, defaultValue = '') {
    // Check if running in browser with meta tags
    const metaTag = document.querySelector(`meta[name="${key}"]`);
    if (metaTag) {
      return metaTag.getAttribute('content') || defaultValue;
    }
    
    // Check if running in Node.js environment
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key] || defaultValue;
    }
    
    // Check window object for environment variables
    if (typeof window !== 'undefined' && window.ENV) {
      return window.ENV[key] || defaultValue;
    }
    
    return defaultValue;
  }

  /**
   * Load configuration from window.QWEN_PLUS_CONFIG
   */
  loadFromWindowConfig() {
    if (typeof window !== 'undefined' && window.QWEN_PLUS_CONFIG) {
      this.config.qwenPlus = {
        ...this.config.qwenPlus,
        ...window.QWEN_PLUS_CONFIG
      };
    }
  }

  /**
   * Get Qwen Plus configuration
   * @returns {Object} Qwen Plus config
   */
  getQwenPlusConfig() {
    return { ...this.config.qwenPlus };
  }

  /**
   * Get application configuration
   * @returns {Object} Application config
   */
  getAppConfig() {
    return { ...this.config.app };
  }

  /**
   * Get storage configuration
   * @returns {Object} Storage config
   */
  getStorageConfig() {
    return { ...this.config.storage };
  }

  /**
   * Get UI configuration
   * @returns {Object} UI config
   */
  getUIConfig() {
    return { ...this.config.ui };
  }

  /**
   * Get development configuration
   * @returns {Object} Development config
   */
  getDevConfig() {
    return { ...this.config.dev };
  }

  /**
   * Get all configuration
   * @returns {Object} Complete configuration
   */
  getAllConfig() {
    return JSON.parse(JSON.stringify(this.config));
  }

  /**
   * Update configuration
   * @param {string} section - Configuration section
   * @param {Object} updates - Updates to apply
   */
  updateConfig(section, updates) {
    if (this.config[section]) {
      this.config[section] = { ...this.config[section], ...updates };
    }
  }

  /**
   * Set Qwen Plus API key
   * @param {string} apiKey - API key
   */
  setQwenPlusApiKey(apiKey) {
    this.config.qwenPlus.apiKey = apiKey;
  }

  /**
   * Check if Qwen Plus is configured
   * @returns {boolean} True if API key is set
   */
  isQwenPlusConfigured() {
    return !!this.config.qwenPlus.apiKey;
  }

  /**
   * Get storage key with prefix
   * @param {string} key - Storage key
   * @returns {string} Prefixed storage key
   */
  getStorageKey(key) {
    return `${this.config.storage.prefix}-${key}`;
  }

  /**
   * Log debug message if debug mode is enabled
   * @param {string} message - Debug message
   * @param {*} data - Additional data to log
   */
  debug(message, data = null) {
    if (this.config.dev.debugMode) {
      console.log(`[${this.config.app.name}] ${message}`, data);
    }
  }

  /**
   * Log error message
   * @param {string} message - Error message
   * @param {*} error - Error object
   */
  error(message, error = null) {
    console.error(`[${this.config.app.name}] ${message}`, error);
  }

  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {*} data - Additional data to log
   */
  warn(message, data = null) {
    console.warn(`[${this.config.app.name}] ${message}`, data);
  }

  /**
   * Export configuration as JSON
   * @returns {string} JSON string of configuration
   */
  exportConfig() {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON
   * @param {string} configJson - JSON string of configuration
   */
  importConfig(configJson) {
    try {
      const importedConfig = JSON.parse(configJson);
      this.config = { ...this.config, ...importedConfig };
    } catch (error) {
      this.error('Failed to import configuration:', error);
      throw new Error('Invalid configuration format');
    }
  }
}

// Create global instance
window.configManager = new ConfigManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConfigManager;
}
