# Environment Variables Configuration

This document explains how to configure environment variables for the AI Calendar Creator application.

## Setup Instructions

### 1. Copy Environment File
```bash
cp src/config/env.example .env
```

### 2. Configure Variables
Edit the `.env` file with your actual values:

```env
# Qwen Plus API Configuration
QWEN_PLUS_API_KEY=sk-your-actual-qwen-key
QWEN_PLUS_ENDPOINT=https://dashscope.aliyun.com/compatible-mode/v1/chat/completions
QWEN_PLUS_MODEL=qwen-plus
QWEN_PLUS_TEMPERATURE=0.7
QWEN_PLUS_MAX_TOKENS=1024
```

## Configuration Methods

### Method 1: Environment Variables (Recommended for Production)
Set environment variables in your system or deployment environment:

```bash
export QWEN_PLUS_API_KEY="sk-your-actual-key"
export QWEN_PLUS_MODEL="qwen-plus"
```

### Method 2: Meta Tags (For Static Hosting)
Add meta tags to your HTML files:

```html
<meta name="QWEN_PLUS_API_KEY" content="sk-your-actual-key">
<meta name="QWEN_PLUS_MODEL" content="qwen-plus">
<meta name="QWEN_PLUS_TEMPERATURE" content="0.7">
```

### Method 3: Window Object (For Development)
Set configuration in JavaScript before loading the application:

```javascript
window.QWEN_PLUS_CONFIG = {
  apiKey: 'sk-your-actual-key',
  model: 'qwen-plus',
  temperature: 0.7,
  maxTokens: 1024
};
```

## Available Variables

### Qwen Plus API Configuration
- `QWEN_PLUS_API_KEY`: Your Qwen Plus API key (required)
- `QWEN_PLUS_ENDPOINT`: API endpoint URL
- `QWEN_PLUS_MODEL`: Model name (default: qwen-plus)
- `QWEN_PLUS_TEMPERATURE`: Response creativity (0.0-1.0)
- `QWEN_PLUS_MAX_TOKENS`: Maximum response length

### Application Configuration
- `APP_NAME`: Application name
- `APP_VERSION`: Application version
- `APP_ENVIRONMENT`: Environment (development/production)

### Storage Configuration
- `STORAGE_PREFIX`: Prefix for localStorage keys
- `CHAT_HISTORY_KEY`: Key for chat history storage
- `EVENTS_STORAGE_KEY`: Key for events storage

### UI Configuration
- `DEFAULT_THEME`: Default theme (light/dark)
- `AUTO_SAVE_INTERVAL`: Auto-save interval in milliseconds
- `MAX_CHAT_HISTORY`: Maximum number of chat messages to keep

### Development Settings
- `DEBUG_MODE`: Enable debug logging (true/false)
- `LOG_LEVEL`: Logging level (debug/info/warn/error)
- `API_TIMEOUT`: API request timeout in milliseconds

## Security Notes

1. **Never commit `.env` files** to version control
2. **Use environment variables** in production
3. **Rotate API keys** regularly
4. **Use HTTPS** for API endpoints in production

## Troubleshooting

### Missing API Key
If you see "Missing API key" warnings:
1. Check that your API key is set correctly
2. Verify the environment variable name matches exactly
3. Ensure the configuration is loaded before the application starts

### Configuration Not Loading
If configuration isn't loading:
1. Check browser console for errors
2. Verify file paths are correct
3. Ensure `config.js` is loaded before other scripts

### API Errors
If you're getting API errors:
1. Verify your API key is valid
2. Check the endpoint URL
3. Ensure you have sufficient API credits
4. Check network connectivity

## Example Configuration

### Development
```env
QWEN_PLUS_API_KEY=sk-dev-key-here
DEBUG_MODE=true
LOG_LEVEL=debug
API_TIMEOUT=60000
```

### Production
```env
QWEN_PLUS_API_KEY=sk-prod-key-here
DEBUG_MODE=false
LOG_LEVEL=error
API_TIMEOUT=30000
APP_ENVIRONMENT=production
```
