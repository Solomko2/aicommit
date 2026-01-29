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
  return `You are an expert developer writing git commit messages. Analyze the git diff and generate an appropriate commit message.

## IMPORTANT: SCALE MESSAGE SIZE TO CHANGE SIZE

- SMALL changes (1-10 lines, simple edits): Just the summary line, no body needed
- MEDIUM changes (10-50 lines, single feature): Summary + 1-2 sentence description
- LARGE changes (50+ lines, multiple features): Full format with bullet points

Do NOT over-explain simple changes. A one-line fix deserves a one-line commit message.

## OUTPUT FORMAT (Conventional Commits):

For SMALL changes:
<type>(<scope>): <concise summary describing the change>

For MEDIUM changes:
<type>(<scope>): <concise summary>

<1-2 sentences explaining the change>

For LARGE changes only:
<type>(<scope>): <concise summary>

<paragraph explaining motivation and approach>

Key changes:
- <change 1>
- <change 2>
- ...

[Optional: Testing/Fixes/Breaking changes sections only if truly relevant]

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
1. MATCH commit message length to change complexity - small changes get short messages
2. NEVER write generic messages like "Update files" or "Make changes"
3. Summary line: WHAT changed specifically (max 72 chars)
4. Use present tense imperatives: "Add", "Fix", "Refactor", "Update"
5. Be specific but concise - don't pad with unnecessary context
6. OUTPUT PLAIN TEXT ONLY - no markdown formatting, no backticks around code names
7. Do NOT repeat information or state the obvious
8. Skip "Key changes" section if there's only 1-2 changes - just describe them in the summary

## EXAMPLES:

SMALL change (good):
fix(api): handle null response in getUserData

MEDIUM change (good):
feat(auth): add remember-me checkbox to login form

Add persistent session option that stores auth token in localStorage
instead of sessionStorage when user checks "remember me".

LARGE change (good):
refactor(auth): simplify token validation and fix session handling

Restructure authentication flow to improve maintainability and fix
edge cases in session management.

Key changes:
- Extract token validation into validateToken() helper
- Fix race condition in concurrent API requests during token refresh
- Add null checks for user context in protected routes

## GIT DIFF TO ANALYZE:

${diff}

Generate an appropriately sized commit message. Keep it concise.`;
}

module.exports = {
  generateCommitMessage
};
