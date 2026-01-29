const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const chalk = require('chalk');

/**
 * Max diff size limits per provider (in characters)
 * Based on context window sizes with safety margin for prompt + response
 */
const DIFF_LIMITS = {
  claude: 100000,  // 200K context, very generous
  openai: 80000,   // 128K context
  gemini: 25000    // 32K context
};

/**
 * Generate commit message using specified AI provider
 */
async function generateCommitMessage(diff, provider, config) {
  const limit = DIFF_LIMITS[provider] || 50000;
  const truncatedDiff = diff.substring(0, limit);
  
  // Warn if diff was truncated
  if (diff.length > limit) {
    const originalKB = (diff.length / 1024).toFixed(1);
    const truncatedKB = (limit / 1024).toFixed(1);
    console.log(chalk.yellow(`\n⚠️  Large diff detected: ${originalKB}KB truncated to ${truncatedKB}KB for ${provider}`));
    console.log(chalk.gray(`   Tip: Split large changes into smaller commits for better analysis`));
  }
  
  switch (provider) {
    case 'claude':
      return generateWithClaude(truncatedDiff, config);
    case 'openai':
      return generateWithOpenAI(truncatedDiff, config);
    case 'gemini':
      return generateWithGemini(truncatedDiff, config);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Generate commit message using Claude (Anthropic)
 */
async function generateWithClaude(diff, config) {
  const apiKey = config.apiKeys?.anthropic || process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('Anthropic API key not found');
  }

  const anthropic = new Anthropic({ apiKey });

  const prompt = buildPrompt(diff);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        { role: 'user', content: prompt }
      ]
    });

    return message.content[0].text.trim();
  } catch (error) {
    throw new Error(`Claude API error: ${error.message}`);
  }
}

/**
 * Generate commit message using OpenAI GPT-4
 */
async function generateWithOpenAI(diff, config) {
  const apiKey = config.apiKeys?.openai || process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not found');
  }

  const openai = new OpenAI({ apiKey });

  const prompt = buildPrompt(diff);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert Git commit message writer. Generate clear, professional commit messages following Conventional Commits format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1024
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    throw new Error(`OpenAI API error: ${error.message}`);
  }
}

/**
 * Generate commit message using Google Gemini
 */
async function generateWithGemini(diff, config) {
  const apiKey = config.apiKeys?.gemini || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key not found');
  }

  const prompt = buildPrompt(diff);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API request failed');
    }

    return data.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    throw new Error(`Gemini API error: ${error.message}`);
  }
}

/**
 * Build prompt for AI
 */
function buildPrompt(diff) {
  return `You are an expert developer writing a detailed git commit message. Analyze the git diff carefully and generate a professional, comprehensive commit message.

## OUTPUT FORMAT (Conventional Commits):

<type>(<scope>): <concise summary describing the main change>

<paragraph explaining the motivation, context, and overall approach - 2-4 sentences>

Key changes:
- <specific technical change 1>
- <specific technical change 2>
- <specific technical change 3>
- ... (list ALL significant changes)

[Optional sections if applicable:]

Testing:
- <what was tested>

Fixes:
- <specific bug/issue fixed>

Breaking changes:
- <what breaks and how to migrate>

## COMMIT TYPES:
- feat: New feature or significant enhancement
- fix: Bug fix
- refactor: Code restructuring without changing behavior
- docs: Documentation only
- style: Formatting, whitespace (no logic change)
- test: Adding/updating tests
- chore: Build, config, tooling changes
- perf: Performance improvements

## CRITICAL RULES:
1. NEVER write generic messages like "Update files" or "Make changes"
2. The summary line must describe WHAT specifically changed (max 72 chars)
3. Analyze the ACTUAL code changes - mention specific functions, components, variables
4. Explain WHY the change was made, not just what files were touched
5. Group related changes logically in the bullet points
6. Use technical terminology appropriate to the codebase
7. If there are multiple distinct changes, mention all of them
8. Use present tense imperatives: "Add", "Fix", "Refactor", "Update"
9. Be specific: instead of "improve code", say "extract validation logic into separate helper function"
10. If the diff shows HTML/CSS/JS changes together, describe the feature being built, not just "update HTML, JS, CSS"

## EXAMPLE OF GOOD COMMIT:

refactor(auth): simplify token validation and fix session handling

Restructure authentication flow to improve maintainability and fix
several edge cases in session management that caused users to be
unexpectedly logged out.

Key changes:
- Extract token validation into dedicated validateToken() helper
- Replace synchronous localStorage calls with async wrapper
- Fix race condition in concurrent API requests during token refresh
- Add null checks for user context in protected routes
- Remove deprecated sessionStorage fallback code

Fixes:
- Users no longer logged out when opening multiple tabs
- Token refresh no longer fails silently on slow connections

## GIT DIFF TO ANALYZE:

${diff}

Generate the commit message now. Be thorough and specific.`;
}

module.exports = {
  generateCommitMessage
};
