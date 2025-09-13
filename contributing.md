# 🤝 Contributing to Meme Coin Analyzer

Thank you for your interest in contributing to the Meme Coin Analyzer! This document provides guidelines and information for contributors.

## 🎯 Ways to Contribute

### 🐛 Bug Reports
- **Check existing issues** first to avoid duplicates
- **Use the bug report template** when creating issues
- **Include detailed reproduction steps**
- **Provide screenshots** for UI-related bugs
- **Include browser/device information**

### 💡 Feature Requests
- **Search existing feature requests** to avoid duplicates
- **Explain the use case** and why it's valuable
- **Provide mockups or examples** if possible
- **Consider the scope** - keep features focused

### 📝 Documentation Improvements
- **Fix typos and grammar**
- **Improve code comments**
- **Add missing documentation**
- **Create tutorials and guides**
- **Update API documentation**

### 🧪 Testing
- **Write unit tests** for new features
- **Add integration tests**
- **Test edge cases**
- **Improve test coverage**
- **Manual testing of new features**

### 💻 Code Contributions
- **Fix bugs and implement features**
- **Improve performance**
- **Add new ML algorithms**
- **Enhance UI/UX**
- **API integrations**

## 🚀 Getting Started

### Development Setup

1. **Fork the repository**
```bash
git clone https://github.com/your-username/meme-coin-analyzer.git
cd meme-coin-analyzer
```

2. **Set up development environment**
```bash
# Install dependencies (if using Node.js build tools)
npm install

# Or start a simple HTTP server
python -m http.server 8000
# Visit http://localhost:8000
```

3. **Create a feature branch**
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### Development Guidelines

#### Code Style
- **Use consistent indentation** (2 spaces)
- **Follow existing naming conventions**
- **Add comments for complex logic**
- **Keep functions small and focused**
- **Use meaningful variable names**

```javascript
// ✅ Good
function calculateLiquidityScore(liquidityData, marketCap) {
    const liquidityRatio = liquidityData.usd / marketCap;
    const lockScore = liquidityData.locked ? 100 : 0;
    
    // Weight locked liquidity higher than total amount
    return Math.min(100, lockScore * 0.6 + liquidityRatio * 40);
}

// ❌ Bad
function calc(l, m) {
    return l.usd / m * 100; // What does this calculate?
}
```

#### HTML/CSS Standards
- **Use semantic HTML elements**
- **Follow CSS naming conventions** (BEM recommended)
- **Ensure responsive design**
- **Maintain accessibility standards**
- **Test cross-browser compatibility**

```css
/* ✅ Good - BEM naming convention */
.metric-card {
    background: var(--white);
    border-radius: 12px;
}

.metric-card__title {
    font-weight: 600;
    margin-bottom: 16px;
}

.metric-card__value {
    font-size: 1.75rem;
    color: var(--primary-blue);
}
```

#### JavaScript Standards
- **Use ES6+ features** appropriately
- **Handle errors gracefully**
- **Avoid global variables**
- **Use async/await** for promises
- **Add JSDoc comments** for functions

```javascript
/**
 * Analyzes token contract for security risks
 * @param {string} contractAddress - The token contract address
 * @param {string} chain - Blockchain network (ethereum, bsc, polygon)
 * @returns {Promise<Object>} Security analysis results
 */
async function analyzeContractSecurity(contractAddress, chain = 'ethereum') {
    try {
        const contractData = await fetchContractData(contractAddress, chain);
        
        return {
            verified: contractData.verified,
            hasTimelock: contractData.timelock,
            ownershipRenounced: contractData.ownership === null,
            securityScore: calculateSecurityScore(contractData)
        };
    } catch (error) {
        console.error('Contract analysis failed:', error);
        throw new Error(`Unable to analyze contract: ${error.message}`);
    }
}
```

## 📋 Pull Request Process

### Before Submitting

1. **Test your changes thoroughly**
   - Test on multiple browsers
   - Test responsive design
   - Verify all features work
   - Check for console errors

2. **Update documentation**
   - Update README.md if needed
   - Add code comments
   - Update API documentation

3. **Follow commit conventions**
```bash
# Format: type(scope): description
git commit -m "feat(analysis): add smart money tracking algorithm"
git commit -m "fix(ui): resolve mobile responsive issues"
git commit -m "docs(readme): update installation instructions"
```

### Commit Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **perf**: Performance improvements

### PR Template

When creating a pull request, please use this template:

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] I have tested these changes locally
- [ ] I have added/updated relevant tests
- [ ] All tests pass

## Screenshots (if applicable)
Add screenshots of UI changes here.

## Related Issues
Closes #123
```

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Testing** on multiple browsers
4. **Documentation** review
5. **Final approval** and merge

## 🧪 Testing Guidelines

### Manual Testing Checklist

#### Core Functionality
- [ ] Token analysis works with valid addresses
- [ ] Error handling for invalid addresses
- [ ] All scores display correctly
- [ ] Performance tracking functions work
- [ ] ML learning system updates properly

#### UI/UX Testing
- [ ] Responsive design on mobile/tablet
- [ ] All buttons and links work
- [ ] Loading states display correctly
- [ ] Error messages are user-friendly
- [ ] Accessibility features work

#### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers

### Writing Tests

```javascript
// Example test structure
describe('Liquidity Analysis', () => {
    test('should calculate correct liquidity score', () => {
        const liquidityData = {
            usd: 100000,
            locked: true,
            lockDuration: 365
        };
        
        const score = calculateLiquidityScore(liquidityData);
        
        expect(score).toBeGreaterThan(80);
        expect(score).toBeLessThanOrEqual(100);
    });
    
    test('should handle missing liquidity data', () => {
        const invalidData = {};
        
        expect(() => {
            calculateLiquidityScore(invalidData);
        }).not.toThrow();
    });
});
```

## 📊 ML Algorithm Contributions

### Adding New Features

When contributing new ML features or algorithms:

1. **Document the algorithm** in ML_ALGORITHMS.md
2. **Provide mathematical background**
3. **Include performance benchmarks**
4. **Add unit tests**
5. **Consider computational efficiency**

```javascript
/**
 * Calculates social sentiment score using multiple indicators
 * @param {Object} socialData - Social media metrics
 * @returns {number} Sentiment score (0-100)
 */
function calculateSentimentScore(socialData) {
    const weights = {
        twitterSentiment: 0.4,
        telegramActivity: 0.3,
        redditMentions: 0.2,
        discordGrowth: 0.1
    };
    
    let weightedScore = 0;
    Object.keys(weights).forEach(metric => {
        if (socialData[metric] !== undefined) {
            weightedScore += socialData[metric] * weights[metric];
        }
    });
    
    return Math.min(100, Math.max(0, weightedScore));
}
```

### Performance Considerations

- **Optimize for real-time analysis** (< 3 seconds)
- **Consider API rate limits**
- **Cache expensive calculations**
- **Use efficient algorithms**
- **Profile performance impact**

## 🛡️ Security Guidelines

### API Keys and Secrets
- **Never commit API keys** to the repository
- **Use environment variables** for sensitive data
- **Document required environment variables**
- **Provide example .env files**

### Input Validation
```javascript
function validateContractAddress(address) {
    // Ethereum address validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        throw new Error('Invalid Ethereum address format');
    }
    
    // Additional validation...
    return true;
}
```

### Error Handling
- **Don't expose internal errors** to users
- **Log errors appropriately**
- **Provide helpful error messages**
- **Handle edge cases gracefully**

## 🎨 Design Guidelines

### UI/UX Principles
- **Professional appearance** - Clean, modern design
- **User-friendly** - Intuitive navigation and clear labeling
- **Responsive design** - Works on all device sizes
- **Accessible** - Follow WCAG guidelines
- **Consistent** - Use established patterns and styling

### Color Scheme
```css
:root {
    --primary-blue: #2563eb;
    --secondary-blue: #1e40af;
    --light-blue: #3b82f6;
    --accent-blue: #60a5fa;
    --dark-gray: #1f2937;
    --medium-gray: #374151;
    --light-gray: #6b7280;
    --bg-gray: #f8fafc;
    --success-green: #10b981;
    --warning-orange: #f59e0b;
    --error-red: #ef4444;
}
```

### Typography
- **Primary font**: Inter, system fonts
- **Headings**: 700 weight
- **Body text**: 400-500 weight
- **Small text**: 400 weight

## 🏷️ Issue Labels

We use these labels to categorize issues:

- **bug** - Something isn't working
- **enhancement** - New feature or request
- **documentation** - Improvements to documentation
- **good first issue** - Good for newcomers
- **help wanted** - Extra attention needed
- **priority-high** - Critical issues
- **priority-medium** - Important issues
- **priority-low** - Nice to have

## 📞 Getting Help

### Communication Channels
- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - General questions and ideas
- **Discord Server** - Real-time chat (link in README)
- **Email** - Direct contact for sensitive issues

### Questions?
Before asking questions:
1. **Search existing issues** and discussions
2. **Check the documentation**
3. **Review the README.md**

When asking questions:
- **Be specific** about the problem
- **Include relevant code** or screenshots
- **Describe what you've tried**
- **Provide system information** if relevant

## 🎉 Recognition

Contributors are recognized in several ways:
- **Listed in README.md** contributors section
- **Mentioned in release notes** for significant contributions
- **Special badges** for long-term contributors
- **Early access** to new features

## 📜 Code of Conduct

### Our Standards
- **Be respectful** and inclusive
- **Welcome newcomers** and help them learn
- **Focus on constructive feedback**
- **Respect different viewpoints**
- **Maintain professional behavior**

### Unacceptable Behavior
- Harassment or discriminatory language
- Personal attacks or insults
- Spam or off-topic discussions
- Sharing others' private information
- Any form of trolling or inflammatory behavior

### Reporting
Report unacceptable behavior to the project maintainers through:
- Private message to maintainers
- Email to [conduct@yourproject.com]
- GitHub's reporting features

---

Thank you for contributing to the Meme Coin Analyzer! Your efforts help make crypto analysis more accessible and accurate for everyone. 🚀
