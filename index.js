const { generateCommitMessage } = require('./lib/ai-providers');
const { getGitDiff, getStagedFiles, createCommit } = require('./lib/git');
const { loadConfig, saveConfig, getApiKey } = require('./lib/config');

module.exports = {
  generateCommitMessage,
  getGitDiff,
  getStagedFiles,
  createCommit,
  loadConfig,
  saveConfig,
  getApiKey
};
