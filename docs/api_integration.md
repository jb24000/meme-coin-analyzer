# 🔌 API Integration Guide

This guide covers integrating real blockchain and market data APIs to replace the mock data in the Meme Coin Analyzer.

## 📋 Overview

The analyzer integrates with multiple data providers to gather comprehensive token analysis:

- **DexScreener** - DEX trading data and liquidity metrics
- **Etherscan/BSCScan** - Contract verification and transaction analysis
- **CoinGecko** - Market data and token information
- **Twitter API** - Social sentiment analysis
- **Pump.fun API** - Platform-specific metrics
- **DexTools** - Advanced trading analytics

## 🔑 API Keys Setup

### 1. Environment Configuration
Create a `.env` file in your project root:

```env
# DEX Data
DEXSCREENER_API_KEY=your_dexscreener_key
DEXTOOLS_API_KEY=your_dextools_key

# Blockchain Explorers
ETHERSCAN_API_KEY=your_etherscan_key
BSCSCAN_API_KEY=your_bscscan_key
SOLSCAN_API_KEY=your_solscan_key

# Market Data
COINGECKO_API_KEY=your_coingecko_key
COINMARKETCAP_API_KEY=your_cmc_key

# Social Data
TWITTER_BEARER_TOKEN=your_twitter_token
TELEGRAM_BOT_TOKEN=your_telegram_token

# Platform Specific
PUMP_FUN_API_KEY=your_pump_fun_key
```

### 2. API Key Sources

| Provider | Free Tier | Paid Plans | Use Case |
|----------|-----------|------------|----------|
| [DexScreener](https://dexscreener.com/api) | 300 req/min | Custom | DEX data, liquidity |
| [Etherscan](https://etherscan.io/apis) | 5 req/sec | $0.25/10k | Contract verification |
| [CoinGecko](https://www.coingecko.com/en/api) | 50 req/min | $129/mo | Market data |
| [Twitter](https://developer.twitter.com/en/docs/twitter-api) | 300 req/15min | $100/mo | Social sentiment |
| [DexTools](https://www.dextools.io/api) | 100 req/min | $50/mo | Advanced analytics |

## 🏗️ Implementation Examples

### DexScreener Integration

```javascript
// Real-time token data from DexScreener
async function getDexScreenerData(contractAddress) {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`, {
        headers: {
            'X-API-Key': process.env.DEXSCREENER_API_KEY
        }
    });
    
    const data = await response.json();
    const pair = data.pairs?.[0];
    
    if (!pair) throw new Error('Token not found');
    
    return {
        liquidity: {
            usd: pair.liquidity?.usd || 0,
            locked: pair.liquidity?.locked || false,
            lockProvider: pair.liquidity?.provider
        },
        volume24h: pair.volume?.h24 || 0,
        priceChange24h: pair.priceChange?.h24 || 0,
        marketCap: pair.fdv || 0,
        age: pair.pairCreatedAt ? Date.now() - new Date(pair.pairCreatedAt).getTime() : 0
    };
}
```

### Contract Security Analysis

```javascript
// Etherscan contract verification check
async function getContractSecurity(contractAddress, chain = 'ethereum') {
    const baseUrl = {
        ethereum: 'https://api.etherscan.io/api',
        bsc: 'https://api.bscscan.com/api',
        polygon: 'https://api.polygonscan.com/api'
    };
    
    const response = await fetch(`${baseUrl[chain]}`, {
        method: 'GET',
        params: {
            module: 'contract',
            action: 'getsourcecode',
            address: contractAddress,
            apikey: process.env.ETHERSCAN_API_KEY
        }
    });
    
    const data = await response.json();
    const contract = data.result[0];
    
    return {
        verified: contract.SourceCode !== '',
        contractName: contract.ContractName,
        compilerVersion: contract.CompilerVersion,
        optimizationUsed: contract.OptimizationUsed,
        isProxy: contract.Proxy === '1',
        securityScore: calculateSecurityScore(contract)
    };
}

function calculateSecurityScore(contract) {
    let score = 0;
    
    if (contract.SourceCode !== '') score += 30; // Verified
    if (contract.OptimizationUsed === '1') score += 20; // Optimized
    if (!contract.Proxy || contract.Proxy === '0') score += 25; // Not a proxy
    if (contract.CompilerVersion.includes('0.8')) score += 25; // Modern compiler
    
    return Math.min(100, score);
}
```

### Smart Money Tracking

```javascript
// Track successful trader wallets
async function getSmartMoneyActivity(contractAddress) {
    const knownSmartWallets = await loadSmartWalletDatabase();
    
    // Get recent transactions
    const transactions = await getRecentTransactions(contractAddress);
    
    let smartMoneyScore = 0;
    let smartMoneyCount = 0;
    
    for (const tx of transactions) {
        const wallet = tx.from.toLowerCase();
        
        if (knownSmartWallets.has(wallet)) {
            const walletStats = knownSmartWallets.get(wallet);
            smartMoneyCount++;
            
            // Weight by wallet success rate
            smartMoneyScore += walletStats.successRate * walletStats.avgReturn;
        }
    }
    
    return {
        smartMoneyCount,
        smartMoneyScore: Math.min(100, smartMoneyScore / 10),
        avgWalletPerformance: smartMoneyScore / smartMoneyCount || 0
    };
}

// Build smart wallet database from historical data
async function buildSmartWalletDatabase() {
    const database = new Map();
    
    // Analyze top performing wallets from successful meme coins
    const successfulTokens = await getTopPerformingMemeCoins(100);
    
    for (const token of successfulTokens) {
        const earlyBuyers = await getEarlyBuyers(token.address, 48); // First 48 hours
        
        earlyBuyers.forEach(buyer => {
            if (!database.has(buyer.address)) {
                database.set(buyer.address, {
                    successRate: 0,
                    totalInvestments: 0,
                    avgReturn: 0,
                    tokens: []
                });
            }
            
            const wallet = database.get(buyer.address);
            wallet.totalInvestments++;
            wallet.tokens.push({
                address: token.address,
                entryTime: buyer.timestamp,
                performance: token.maxGain
            });
            
            // Update success metrics
            if (token.maxGain >= 1000) { // 10x+
                wallet.successRate = (wallet.successRate * (wallet.totalInvestments - 1) + 100) / wallet.totalInvestments;
            }
            
            wallet.avgReturn = wallet.tokens.reduce((sum, t) => sum + t.performance, 0) / wallet.tokens.length;
        });
    }
    
    // Filter for consistently successful wallets
    return new Map([...database.entries()].filter(([addr, stats]) => 
        stats.totalInvestments >= 5 && stats.successRate >= 30
    ));
}
```

### Social Sentiment Analysis

```javascript
// Twitter sentiment analysis
async function getTwitterSentiment(tokenSymbol, contractAddress) {
    const query = `${tokenSymbol} OR ${contractAddress} -is:retweet lang:en`;
    
    const response = await fetch(`https://api.twitter.com/2/tweets/search/recent`, {
        headers: {
            'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
            'Content-Type': 'application/json'
        },
        params: {
            query,
            max_results: 100,
            'tweet.fields': 'created_at,public_metrics,context_annotations'
        }
    });
    
    const data = await response.json();
    
    return analyzeSentiment(data.data || []);
}

function analyzeSentiment(tweets) {
    const positiveKeywords = ['moon', 'pump', 'gem', 'bullish', '🚀', '💎', 'hodl'];
    const negativeKeywords = ['dump', 'scam', 'rug', 'bearish', '📉', 'sell', 'exit'];
    
    let sentiment = { positive: 0, negative: 0, neutral: 0 };
    let totalEngagement = 0;
    
    tweets.forEach(tweet => {
        const text = tweet.text.toLowerCase();
        const engagement = (tweet.public_metrics?.like_count || 0) + 
                          (tweet.public_metrics?.retweet_count || 0);
        
        totalEngagement += engagement;
        
        const positiveCount = positiveKeywords.filter(word => text.includes(word)).length;
        const negativeCount = negativeKeywords.filter(word => text.includes(word)).length;
        
        if (positiveCount > negativeCount) {
            sentiment.positive += 1 + engagement * 0.1;
        } else if (negativeCount > positiveCount) {
            sentiment.negative += 1 + engagement * 0.1;
        } else {
            sentiment.neutral += 1;
        }
    });
    
    const total = sentiment.positive + sentiment.negative + sentiment.neutral;
    
    return {
        score: total > 0 ? Math.round((sentiment.positive - sentiment.negative) / total * 100 + 50) : 50,
        totalTweets: tweets.length,
        totalEngagement,
        breakdown: sentiment
    };
}
```

### Pump.fun Integration

```javascript
// Pump.fun specific metrics
async function getPumpFunData(contractAddress) {
    // Note: Pump.fun doesn't have official API, this is conceptual
    const response = await fetch(`https://api.pump.fun/token/${contractAddress}`, {
        headers: {
            'X-API-Key': process.env.PUMP_FUN_API_KEY
        }
    });
    
    const data = await response.json();
    
    return {
        migrationStatus: data.migrated ? 'migrated' : 'pump_fun',
        migrationTime: data.migrationTime,
        pumpFunGraduation: data.graduated || false,
        initialLiquidity: data.initialLiquidity,
        creatorHolding: data.creatorTokens / data.totalSupply,
        bondingCurveProgress: data.bondingCurveProgress
    };
}
```

## 🔄 Data Pipeline

### Update Analysis Function

Replace the mock data generation with real API calls:

```javascript
async function performRealAnalysis(contractAddress) {
    try {
        // Parallel API calls for efficiency
        const [
            dexData,
            contractSecurity,
            smartMoney,
            socialSentiment,
            pumpFunData
        ] = await Promise.all([
            getDexScreenerData(contractAddress),
            getContractSecurity(contractAddress),
            getSmartMoneyActivity(contractAddress),
            getTwitterSentiment(contractAddress),
            getPumpFunData(contractAddress)
        ]);
        
        // Calculate composite scores
        const analysis = {
            overall: 0,
            liquidity: calculateLiquidityScore(dexData, pumpFunData),
            security: contractSecurity.securityScore,
            uniqueness: await calculateUniquenessScore(contractAddress),
            smartMoney: smartMoney.smartMoneyScore,
            community: socialSentiment.score,
            volume: calculateVolumeScore(dexData),
            sentiment: socialSentiment.score,
            migration: calculateMigrationScore(pumpFunData),
            timeScore: calculateTimeScore(dexData.age),
            distribution: await calculateDistributionScore(contractAddress)
        };
        
        // Calculate weighted overall score
        analysis.overall = calculateOverallScore(analysis);
        
        return analysis;
        
    } catch (error) {
        console.error('Analysis failed:', error);
        throw new Error(`Analysis failed: ${error.message}`);
    }
}
```

## 🚨 Rate Limiting & Error Handling

### Rate Limiting Strategy

```javascript
class RateLimitedAPI {
    constructor(requestsPerSecond = 5) {
        this.requests = [];
        this.limit = requestsPerSecond;
    }
    
    async makeRequest(apiCall) {
        // Remove requests older than 1 second
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < 1000);
        
        // Wait if we've hit the limit
        if (this.requests.length >= this.limit) {
            const oldestRequest = Math.min(...this.requests);
            const waitTime = 1000 - (now - oldestRequest);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        // Make the request
        this.requests.push(Date.now());
        return await apiCall();
    }
}

const dexScreenerAPI = new RateLimitedAPI(5); // 5 requests per second
```

### Error Handling

```javascript
async function safeAPICall(apiFunction, fallbackValue = null, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await apiFunction();
        } catch (error) {
            console.warn(`API call failed (attempt ${i + 1}/${retries}):`, error.message);
            
            if (i === retries - 1) {
                console.error('All retry attempts failed, using fallback value');
                return fallbackValue;
            }
            
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
}
```

## 🧪 Testing APIs

Create a test suite to validate API integrations:

```javascript
// test/api-integration.test.js
describe('API Integration Tests', () => {
    test('DexScreener returns valid data', async () => {
        const testAddress = '0x...'; // Known token address
        const data = await getDexScreenerData(testAddress);
        
        expect(data).toHaveProperty('liquidity');
        expect(data.liquidity.usd).toBeGreaterThan(0);
    });
    
    test('Smart money detection works', async () => {
        const testAddress = '0x...';
        const smartMoney = await getSmartMoneyActivity(testAddress);
        
        expect(smartMoney).toHaveProperty('smartMoneyScore');
        expect(smartMoney.smartMoneyScore).toBeBetween(0, 100);
    });
});
```

## 📊 Monitoring & Analytics

Track API performance and costs:

```javascript
class APIMonitor {
    constructor() {
        this.stats = {
            requests: 0,
            errors: 0,
            totalLatency: 0,
            costs: 0
        };
    }
    
    async trackRequest(apiCall, cost = 0) {
        const start = Date.now();
        this.stats.requests++;
        
        try {
            const result = await apiCall();
            this.stats.totalLatency += Date.now() - start;
            this.stats.costs += cost;
            return result;
        } catch (error) {
            this.stats.errors++;
            throw error;
        }
    }
    
    getPerformanceReport() {
        return {
            totalRequests: this.stats.requests,
            errorRate: (this.stats.errors / this.stats.requests * 100).toFixed(2) + '%',
            avgLatency: (this.stats.totalLatency / this.stats.requests).toFixed(0) + 'ms',
            totalCosts: '$' + this.stats.costs.toFixed(4)
        };
    }
}
```

---

This integration guide provides the foundation for replacing mock data with real-time blockchain and market analysis. Start with the free tiers and scale up based on your usage needs.
