#!/usr/bin/env node

// Suppress punycode deprecation warning in Node.js 22+
process.noDeprecation = true;

const { program } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { getGitDiff, getStagedFiles, createCommit } = require('../lib/git');
const { generateCommitMessage } = require('../lib/ai-providers');
const { loadConfig, saveConfig, getConfigPath } = require('../lib/config');

program
  .name('aicommit')
  .description('AI-powered git commit message generator')
  .version('1.0.0')
  .option('-p, --provider <provider>', 'AI provider for this run (claude, openai, gemini)')
  .option('-b, --branch <branch>', 'Compare with branch instead of staged changes')
  .option('-e, --editor', 'Open in editor instead of console')
  .option('--setup', 'Configure API keys')
  .option('--config', 'Show current configuration')
  .option('--set-provider <provider>', 'Set default provider (claude, openai, gemini)')
  .parse(process.argv);

const options = program.opts();

async function setup() {
  console.log(chalk.blue.bold('\n🔧 AICommit Configuration\n'));
  
  const config = loadConfig();
  
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'defaultProvider',
      message: 'Select default AI provider:',
      choices: ['claude', 'openai', 'gemini'],
      default: config.defaultProvider || 'claude'
    },
    {
      type: 'input',
      name: 'anthropicKey',
      message: 'Anthropic API Key (for Claude):',
      default: config.apiKeys?.anthropic || '',
      when: (answers) => answers.defaultProvider === 'claude' || config.apiKeys?.anthropic
    },
    {
      type: 'input',
      name: 'openaiKey',
      message: 'OpenAI API Key (for GPT-4):',
      default: config.apiKeys?.openai || '',
      when: (answers) => answers.defaultProvider === 'openai' || config.apiKeys?.openai
    },
    {
      type: 'input',
      name: 'geminiKey',
      message: 'Google Gemini API Key:',
      default: config.apiKeys?.gemini || '',
      when: (answers) => answers.defaultProvider === 'gemini' || config.apiKeys?.gemini
    },
    {
      type: 'confirm',
      name: 'autoCommit',
      message: 'Auto-commit after message generation?',
      default: config.autoCommit || false
    }
  ]);

  const newConfig = {
    defaultProvider: answers.defaultProvider,
    apiKeys: {
      anthropic: answers.anthropicKey || config.apiKeys?.anthropic || '',
      openai: answers.openaiKey || config.apiKeys?.openai || '',
      gemini: answers.geminiKey || config.apiKeys?.gemini || ''
    },
    autoCommit: answers.autoCommit
  };

  saveConfig(newConfig);
  console.log(chalk.green('\n✓ Configuration saved successfully!'));
  console.log(chalk.gray(`Config location: ${getConfigPath()}\n`));
}

async function showConfig() {
  const config = loadConfig();
  console.log(chalk.blue.bold('\n📋 Current Configuration:\n'));
  console.log(chalk.white('Default Provider:'), chalk.cyan(config.defaultProvider || 'Not set'));
  console.log(chalk.white('Auto-commit:'), chalk.cyan(config.autoCommit ? 'Yes' : 'No'));
  console.log(chalk.white('\nAPI Keys:'));
  console.log(chalk.white('  Anthropic:'), config.apiKeys?.anthropic ? chalk.green('Set ✓') : chalk.red('Not set'));
  console.log(chalk.white('  OpenAI:'), config.apiKeys?.openai ? chalk.green('Set ✓') : chalk.red('Not set'));
  console.log(chalk.white('  Gemini:'), config.apiKeys?.gemini ? chalk.green('Set ✓') : chalk.red('Not set'));
  console.log(chalk.gray(`\nConfig file: ${getConfigPath()}\n`));
}

async function setProvider(provider) {
  const validProviders = ['claude', 'openai', 'gemini'];
  
  if (!validProviders.includes(provider)) {
    console.log(chalk.red(`\n❌ Unknown provider: "${provider}"`));
    console.log(chalk.yellow(`Valid providers: ${validProviders.join(', ')}\n`));
    process.exit(1);
  }

  const config = loadConfig();
  config.defaultProvider = provider;
  saveConfig(config);
  
  console.log(chalk.green(`\n✓ Default provider set to: ${chalk.cyan(provider)}\n`));
}

async function main() {
  try {
    // Handle setup
    if (options.setup) {
      await setup();
      return;
    }

    // Show config
    if (options.config) {
      await showConfig();
      return;
    }

    // Set default provider
    if (options.setProvider) {
      await setProvider(options.setProvider);
      return;
    }

    // Load configuration
    const config = loadConfig();
    const provider = options.provider || config.defaultProvider || 'claude';

    // Validate provider
    const validProviders = ['claude', 'openai', 'gemini'];
    if (!validProviders.includes(provider)) {
      console.log(chalk.red(`\n❌ Unknown provider: "${provider}"`));
      console.log(chalk.yellow(`Valid providers: ${validProviders.join(', ')}\n`));
      process.exit(1);
    }

    // Check if API key is configured
    const apiKeyMap = {
      'claude': 'anthropic',
      'openai': 'openai',
      'gemini': 'gemini'
    };

    const apiKeyName = apiKeyMap[provider];
    if (!config.apiKeys?.[apiKeyName] && !process.env[`${apiKeyName.toUpperCase()}_API_KEY`]) {
      console.log(chalk.red(`\n❌ API key for ${provider} not configured.`));
      console.log(chalk.yellow(`Run: ${chalk.cyan('aicommit --setup')} to configure API keys\n`));
      process.exit(1);
    }

    // Provider display names
    const providerNames = {
      'claude': 'Claude (Anthropic)',
      'openai': 'GPT-4 (OpenAI)',
      'gemini': 'Gemini (Google)'
    };

    console.log(chalk.blue.bold('\n🤖 AICommit Generator'));
    console.log(chalk.gray(`   Provider: ${providerNames[provider]}\n`));

    // Get git diff
    const spinner = ora('Reading git diff...').start();
    const diff = getGitDiff(options.branch);
    
    if (!diff) {
      spinner.fail('No changes found');
      console.log(chalk.yellow('\nMake sure you have staged changes: git add <files>'));
      process.exit(1);
    }

    const files = getStagedFiles();
    spinner.succeed(`Found changes in ${files.length} file(s)`);
    console.log(chalk.gray(`Files: ${files.join(', ')}\n`));

    // Generate commit message
    spinner.start(`Generating commit message with ${provider}...`);
    
    const commitMessage = await generateCommitMessage(diff, provider, config);
    
    if (!commitMessage) {
      spinner.fail('Failed to generate commit message');
      process.exit(1);
    }

    spinner.succeed('Commit message generated!');

    // Display the message
    console.log(chalk.blue('\n' + '='.repeat(60)));
    console.log(chalk.white.bold('Generated Commit Message:'));
    console.log(chalk.blue('='.repeat(60)));
    console.log(chalk.green(commitMessage));
    console.log(chalk.blue('='.repeat(60) + '\n'));

    // Ask what to do
    if (options.editor) {
      // Open in git commit editor
      console.log(chalk.cyan('Opening in git editor...\n'));
      const tempFile = path.join(os.tmpdir(), 'COMMIT_EDITMSG');
      fs.writeFileSync(tempFile, commitMessage);
      
      try {
        execSync(`git commit -t ${tempFile}`, { stdio: 'inherit' });
        console.log(chalk.green('\n✓ Commit created successfully!\n'));
      } catch (error) {
        console.log(chalk.yellow('\nCommit cancelled or failed.\n'));
      } finally {
        fs.unlinkSync(tempFile);
      }
    } else {
      // Console interaction
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: '✓ Commit with this message', value: 'commit' },
            { name: '✏️  Edit in git editor', value: 'edit' },
            { name: '📋 Copy to clipboard', value: 'copy' },
            { name: '❌ Cancel', value: 'cancel' }
          ]
        }
      ]);

      switch (action) {
        case 'commit':
          const success = createCommit(commitMessage);
          if (success) {
            console.log(chalk.green('\n✓ Commit created successfully!\n'));
          } else {
            console.log(chalk.red('\n❌ Failed to create commit\n'));
            process.exit(1);
          }
          break;

        case 'edit':
          const tempFile = path.join(os.tmpdir(), 'COMMIT_EDITMSG');
          fs.writeFileSync(tempFile, commitMessage);
          try {
            execSync(`git commit -t ${tempFile}`, { stdio: 'inherit' });
            console.log(chalk.green('\n✓ Commit created successfully!\n'));
          } catch (error) {
            console.log(chalk.yellow('\nCommit cancelled or failed.\n'));
          } finally {
            fs.unlinkSync(tempFile);
          }
          break;

        case 'copy':
          // Try to copy to clipboard (works on macOS, Linux with xclip, Windows)
          try {
            if (process.platform === 'darwin') {
              execSync('pbcopy', { input: commitMessage });
            } else if (process.platform === 'linux') {
              execSync('xclip -selection clipboard', { input: commitMessage });
            } else if (process.platform === 'win32') {
              execSync('clip', { input: commitMessage });
            }
            console.log(chalk.green('\n✓ Copied to clipboard!\n'));
          } catch {
            console.log(chalk.yellow('\n⚠️  Could not copy to clipboard. Copy manually.\n'));
          }
          break;

        case 'cancel':
          console.log(chalk.gray('\nCancelled.\n'));
          break;
      }
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
    process.exit(1);
  }
}

main();
