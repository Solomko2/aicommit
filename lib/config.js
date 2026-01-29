const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Get config file path
 */
function getConfigPath() {
  const homeDir = os.homedir();
  const configDir = path.join(homeDir, '.aicommit');
  
  // Create config directory if it doesn't exist
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  return path.join(configDir, 'config.json');
}

/**
 * Load configuration from file
 */
function loadConfig() {
  const configPath = getConfigPath();
  
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('Warning: Could not load config file:', error.message);
  }
  
  // Return default config
  return {
    defaultProvider: 'claude',
    apiKeys: {
      anthropic: '',
      openai: '',
      gemini: ''
    },
    autoCommit: false
  };
}

/**
 * Save configuration to file
 */
function saveConfig(config) {
  const configPath = getConfigPath();
  
  try {
    fs.writeFileSync(
      configPath, 
      JSON.stringify(config, null, 2), 
      'utf-8'
    );
    return true;
  } catch (error) {
    throw new Error(`Failed to save config: ${error.message}`);
  }
}

/**
 * Get API key for provider
 */
function getApiKey(provider, config) {
  const keyMap = {
    'claude': 'anthropic',
    'openai': 'openai',
    'gemini': 'gemini'
  };
  
  const keyName = keyMap[provider];
  
  // Check config first, then environment variables
  return config.apiKeys?.[keyName] || 
         process.env[`${keyName.toUpperCase()}_API_KEY`] ||
         null;
}

module.exports = {
  getConfigPath,
  loadConfig,
  saveConfig,
  getApiKey
};
