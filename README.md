# AICommit 🤖

AI-powered commit message generator with support for multiple AI providers. Generate professional commit messages in Conventional Commits format.

[![npm version](https://img.shields.io/npm/v/aicommit.svg)](https://www.npmjs.com/package/aicommit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🎯 **Multiple AI Providers**: Claude (Anthropic), GPT-4 (OpenAI), Gemini (Google)
- 📝 **Conventional Commits**: Automatic formatting in standard format
- ⚡ **Quick Setup**: Configure once and use forever
- 🎨 **Interactive**: Edit in console or git editor
- 💾 **Local Configuration**: API keys stored securely
- 🚀 **Fast**: Generate commit messages in seconds

## 🚀 Quick Start

### Global Installation

```bash
npm install -g aicommit
```

### First-Time Setup

```bash
aicommit --setup
```

You'll see an interactive menu to configure:
- Default AI provider selection
- API keys input
- Auto-commit behavior

### Usage

```bash
# Stage your files
git add .

# Generate commit message
aicommit

# Or with specific provider
aicommit --provider openai

# Or with git editor
aicommit --editor

# Short alias
aic
```

## 📖 Detailed Usage

### Commands

```bash
aicommit                     # Generate commit for staged changes
aicommit --provider claude   # Use Claude (for this run only)
aicommit --provider openai   # Use GPT-4 (for this run only)
aicommit --provider gemini   # Use Gemini (for this run only)
aicommit --set-provider openai  # Change default provider permanently
aicommit --branch main       # Compare with main branch
aicommit --editor            # Open in git editor
aicommit --setup             # Configure API keys
aicommit --config            # Show current configuration
aicommit --help              # Show help

# Short alias (all same options work)
aic
aic --set-provider claude
```

### Getting API Keys

#### Claude (Anthropic) - Recommended ⭐

1. Go to https://console.anthropic.com/
2. Create account or sign in
3. Navigate to API Keys
4. Create new key
5. **Cost**: ~$3 per million tokens

#### OpenAI (GPT-4)

1. Go to https://platform.openai.com/
2. Create account
3. Navigate to API keys
4. Create new key
5. **Cost**: ~$10 per million tokens

#### Google Gemini - Free 🎉

1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Create API key
4. **Cost**: Free up to 60 requests/minute

### Example Output

```bash
$ git add .
$ aicommit

🤖 AICommit Generator

✓ Found changes in 3 file(s)
Files: src/auth.js, src/middleware.js, tests/auth.test.js

✓ Commit message generated!

============================================================
Generated Commit Message:
============================================================
feat(auth): Add JWT authentication system

Implement complete JWT-based authentication to replace the
legacy session-based approach. This improves scalability and
enables stateless authentication across distributed services.

- Add JWT token generation and validation middleware
- Implement refresh token rotation mechanism
- Create authentication endpoints (login, logout, refresh)
- Add password hashing with bcrypt
- Update user model with token-related fields
- Add comprehensive authentication tests
============================================================

? What would you like to do?
  ✓ Commit with this message
  ✏️  Edit in git editor
  📋 Copy to clipboard
❯ ❌ Cancel
```

## ⚙️ Configuration

Configuration file is stored at `~/.aicommit/config.json`

```json
{
  "defaultProvider": "claude",
  "apiKeys": {
    "anthropic": "sk-ant-...",
    "openai": "sk-...",
    "gemini": "..."
  },
  "autoCommit": false
}
```

### Environment Variables (Alternative)

Instead of storing in config, you can use environment variables:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."
export GEMINI_API_KEY="..."
```

## 🎯 Conventional Commits Format

The tool generates commits in standard format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting (no logic change)
- `refactor`: Code refactoring without functionality change
- `perf`: Performance improvements
- `test`: Adding/updating tests
- `chore`: Build updates, config changes, etc.
- `ci`: CI/CD changes

## 📊 Provider Comparison

| Provider | Quality | Speed | Cost | Token Limit |
|----------|---------|-------|------|-------------|
| **Claude** | ⭐⭐⭐⭐⭐ | Fast | $3/1M | 200K |
| **GPT-4** | ⭐⭐⭐⭐⭐ | Fast | $10/1M | 128K |
| **Gemini** | ⭐⭐⭐⭐ | Fast | Free | 32K |

**Recommendation**: Claude for best quality at reasonable price, Gemini for free usage.

### Project Structure

```
aicommit/
├── bin/
│   └── gca.js           # CLI entry point
├── lib/
│   ├── ai-providers.js  # AI provider implementations
│   ├── config.js        # Configuration management
│   └── git.js           # Git operations
├── index.js             # Main export
├── package.json
└── README.md
```

## 🛠️ Troubleshooting

### Problem: "No changes found"

**Solution**: Make sure you have staged files:
```bash
git add <files>
# or
git add .
```

### Problem: "API key not configured"

**Solution**: Run setup:
```bash
aicommit --setup
```

Or set environment variable:
```bash
export ANTHROPIC_API_KEY="your-key"
```

### Problem: "Rate limit exceeded"

**Solution**: 
- For Gemini: Wait a minute (60 req/min limit)
- For Claude/OpenAI: Check your plan and limits

### Problem: Incorrect formatting on Windows

**Solution**: Set git line ending settings:
```bash
git config --global core.autocrlf true
```

## 💡 Tips

1. **Use frequently**: The more you use it, the better AI understands your style
2. **Staged changes**: Always `git add` before `aicommit`
3. **Edit freely**: Don't hesitate to edit generated messages
4. **Scope detection**: AI automatically determines scope from files (auth, api, ui, etc.)
5. **Large diffs**: For very large changes, split into multiple commits

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`aicommit` 😉)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📄 License

MIT © [Oleksii Solomko]

## 🙏 Acknowledgments

- Anthropic for amazing Claude API
- OpenAI for GPT-4
- Google for free Gemini
- All contributors

## 📧 Contact

- GitHub: [@Solomko2](https://github.com/Solomko2)
- Email: solomko2006@gmail.com
- Issues: [GitHub Issues](https://github.com/Solomko2/aicommit/issues)

---
