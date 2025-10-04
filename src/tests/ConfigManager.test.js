// Test file for ConfigManager
import { ConfigManager } from '../frontend/assets/js/core/config.js';

describe('ConfigManager', () => {
  let configManager;

  beforeEach(() => {
    configManager = new ConfigManager();
  });

  test('should initialize with default values', () => {
    expect(configManager).toBeDefined();
    expect(configManager.config).toBeDefined();
  });

  test('should get Qwen Plus config', () => {
    const qwenConfig = configManager.getQwenPlusConfig();
    expect(qwenConfig).toBeDefined();
    expect(qwenConfig.apiKey).toBeDefined();
    expect(qwenConfig.endpoint).toBeDefined();
    expect(qwenConfig.model).toBeDefined();
  });

  test('should get storage config', () => {
    const storageConfig = configManager.getStorageConfig();
    expect(storageConfig).toBeDefined();
    expect(storageConfig.chatHistoryKey).toBeDefined();
    expect(storageConfig.eventsStorageKey).toBeDefined();
  });

  test('should get UI config', () => {
    const uiConfig = configManager.getUIConfig();
    expect(uiConfig).toBeDefined();
    expect(uiConfig.maxChatHistory).toBeDefined();
  });

  test('should get dev config', () => {
    const devConfig = configManager.getDevConfig();
    expect(devConfig).toBeDefined();
    expect(devConfig.debugMode).toBeDefined();
    expect(devConfig.apiTimeout).toBeDefined();
  });

  test('should set config values', () => {
    const result = configManager.setConfig('api.qwenPlus.apiKey', 'test-key');
    expect(result).toBe(true);
    
    const qwenConfig = configManager.getQwenPlusConfig();
    expect(qwenConfig.apiKey).toBe('test-key');
  });

  test('should handle invalid config paths', () => {
    const result = configManager.setConfig('invalid.path', 'value');
    expect(result).toBe(false);
  });

  test('should export config as JSON', () => {
    const exportedConfig = configManager.exportConfig();
    expect(exportedConfig).toBeDefined();
    expect(typeof exportedConfig).toBe('string');
    
    const parsedConfig = JSON.parse(exportedConfig);
    expect(parsedConfig).toBeDefined();
    expect(parsedConfig.api).toBeDefined();
    expect(parsedConfig.storage).toBeDefined();
  });
});
