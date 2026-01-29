const { execSync } = require('child_process');

/**
 * Get git diff for staged changes or between branches
 */
function getGitDiff(branch = null) {
  try {
    let command;
    if (branch) {
      command = `git diff ${branch}`;
    } else {
      command = 'git diff --staged';
    }

    const diff = execSync(command, { 
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });

    return diff.trim() || null;
  } catch (error) {
    return null;
  }
}

/**
 * Get list of staged files
 */
function getStagedFiles() {
  try {
    const files = execSync('git diff --staged --name-only', { 
      encoding: 'utf-8' 
    });
    return files.trim().split('\n').filter(f => f);
  } catch (error) {
    return [];
  }
}

/**
 * Get current branch name
 */
function getCurrentBranch() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { 
      encoding: 'utf-8' 
    });
    return branch.trim();
  } catch (error) {
    return null;
  }
}

/**
 * Create git commit with message
 */
function createCommit(message) {
  try {
    // Escape quotes in message for shell
    const escapedMessage = message.replace(/"/g, '\\"');
    execSync(`git commit -m "${escapedMessage}"`, { 
      stdio: 'inherit' 
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if we're in a git repository
 */
function isGitRepository() {
  try {
    execSync('git rev-parse --git-dir', { 
      stdio: 'ignore' 
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get git repository root
 */
function getRepositoryRoot() {
  try {
    const root = execSync('git rev-parse --show-toplevel', { 
      encoding: 'utf-8' 
    });
    return root.trim();
  } catch (error) {
    return null;
  }
}

module.exports = {
  getGitDiff,
  getStagedFiles,
  getCurrentBranch,
  createCommit,
  isGitRepository,
  getRepositoryRoot
};
