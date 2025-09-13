# 🧠 Machine Learning Algorithms

This document explains the machine learning algorithms used in the Meme Coin Analyzer to predict token success probability and continuously improve prediction accuracy.

## 📊 Overview

The analyzer uses a hybrid approach combining multiple ML techniques:

1. **Feature Engineering** - Extracts 50+ features from token data
2. **Ensemble Learning** - Combines multiple models for robust predictions
3. **Online Learning** - Updates model weights based on user feedback
4. **Risk Calibration** - Adjusts confidence based on historical accuracy

## 🔢 Feature Engineering

### Primary Features

#### Liquidity Metrics (Weight: 0.25)
```javascript
const liquidityFeatures = {
    liquidityUSD: Math.log10(liquidityData.usd + 1), // Log scale
    liquidityLocked: liquidityData.locked ? 1 : 0,   // Binary
    lockDuration: liquidityData.lockDuration / 365,   // Years normalized
    lockProvider: getProviderScore(liquidityData.provider), // 0-1
    liquidityRatio: liquidityData.usd / (marketCap || 1), // L/MC ratio
    priceImpact1K: calculatePriceImpact(1000, liquidityData.usd),
    priceImpact10K: calculatePriceImpact(10000, liquidityData.usd)
};

function calculatePriceImpact(tradeSize, liquidity) {
    // Simplified constant product formula
    return tradeSize / (liquidity * 2); // Normalized impact
}
```

#### Smart Money Features (Weight: 0.20)
```javascript
const smartMoneyFeatures = {
    smartWalletCount: Math.min(smartMoney.count / 20, 1), // Normalized to 20 max
    avgWalletSuccessRate: smartMoney.avgSuccessRate / 100,
    totalSmartMoneyVolume: Math.log10(smartMoney.totalVolume + 1) / 10,
    earlyEntryRatio: smartMoney.earlyBuyers / smartMoney.totalBuyers,
    avgHoldingTime: smartMoney.avgHoldingDays / 30, // Months
    smartMoneyConcentration: smartMoney.topWalletShare,
    exitingSmartMoney: smartMoney.recentSells / smartMoney.totalPositions
};
```

#### Technical Features (Weight: 0.15)
```javascript
const technicalFeatures = {
    contractVerified: contractData.verified ? 1 : 0,
    isProxy: contractData.isProxy ? 0 : 1, // Penalty for proxy contracts
    hasTimelock: contractData.hasTimelock ? 1 : 0,
    ownershipRenounced: contractData.ownershipRenounced ? 1 : 0,
    mintingDisabled: contractData.canMint ? 0 : 1,
    transferTax: Math.max(0, 1 - contractData.transferTax / 10),
    maxTransaction: contractData.maxTx / contractData.totalSupply,
    honeypotRisk: 1 - contractData.honeypotScore
};
```

#### Social Features (Weight: 0.15)
```javascript
const socialFeatures = {
    twitterFollowers: Math.log10(socialData.twitter.followers + 1) / 7, // Log normalized
    telegramMembers: Math.log10(socialData.telegram.members + 1) / 6,
    discordMembers: Math.log10(socialData.discord.members + 1) / 6,
    socialGrowthRate: socialData.growthRate / 100, // Daily growth %
    sentimentScore: socialData.sentiment / 100,
    influencerMentions: Math.min(socialData.influencerMentions / 10, 1),
    communityEngagement: socialData.engagementRate
};
```

#### Market Features (Weight: 0.15)
```javascript
const marketFeatures = {
    volume24h: Math.log10(marketData.volume24h + 1) / 10,
    volumeGrowth: marketData.volumeGrowth / 100,
    priceVolatility: Math.min(marketData.volatility, 1), // Cap at 100%
    holderCount: Math.log10(marketData.holders + 1) / 6,
    holderGrowth: marketData.holderGrowthRate / 100,
    avgTransactionSize: Math.log10(marketData.avgTxSize + 1) / 8,
    daysSinceLaunch: Math.min(marketData.age / 30, 1) // Cap at 30 days
};
```

#### Unique Features (Weight: 0.10)
```javascript
const uniquenessFeatures = {
    memeOriginality: await calculateMemeOriginality(tokenData),
    visualAppeal: await analyzeTokenVisuals(tokenData.logo),
    narrativeStrength: await analyzeTokenNarrative(tokenData.description),
    timingScore: calculateTimingScore(tokenData.launchDate),
    competitorSimilarity: 1 - await findSimilarTokens(tokenData),
    trendAlignment: await checkTrendAlignment(tokenData.category)
};
```

## 🎯 Model Architecture

### Ensemble Model Structure

```javascript
class MemeTokenEnsemble {
    constructor() {
        this.models = {
            logisticRegression: new LogisticRegressionModel(),
            randomForest: new RandomForestModel(50), // 50 trees
            gradientBoosting: new GradientBoostingModel(),
            neuralNetwork: new SimpleNeuralNetwork([64, 32, 16, 1])
        };
        
        this.weights = {
            logisticRegression: 0.3,
            randomForest: 0.3,
            gradientBoosting: 0.25,
            neuralNetwork: 0.15
        };
        
        this.calibrator = new PlattScalingCalibrator();
    }
    
    predict(features) {
        const predictions = {};
        
        // Get prediction from each model
        Object.keys(this.models).forEach(modelName => {
            predictions[modelName] = this.models[modelName].predict(features);
        });
        
        // Weighted ensemble
        let ensemblePrediction = 0;
        Object.keys(predictions).forEach(modelName => {
            ensemblePrediction += predictions[modelName] * this.weights[modelName];
        });
        
        // Calibrate probability
        return this.calibrator.calibrate(ensemblePrediction);
    }
    
    async train(trainingData) {
        // Train each model
        await Promise.all(
            Object.values(this.models).map(model => model.train(trainingData))
        );
        
        // Update ensemble weights based on validation performance
        this.updateEnsembleWeights(trainingData);
        
        // Calibrate probabilities
        this.calibrator.fit(trainingData);
    }
}
```

### Online Learning Implementation

```javascript
class OnlineLearningManager {
    constructor() {
        this.learningRate = 0.01;
        this.featureWeights = new Map();
        this.recentPerformance = [];
        this.adaptationRate = 0.1;
    }
    
    updateFromOutcome(features, predictedScore, actualOutcome) {
        const prediction = predictedScore / 100; // Convert to 0-1
        const actual = actualOutcome === 'success' ? 1 : 0;
        const error = actual - prediction;
        
        // Update feature weights using gradient descent
        Object.keys(features).forEach(featureName => {
            const currentWeight = this.featureWeights.get(featureName) || 0;
            const featureValue = features[featureName];
            
            // Gradient: error * feature_value
            const gradient = error * featureValue * this.learningRate;
            this.featureWeights.set(featureName, currentWeight + gradient);
        });
        
        // Track recent performance for adaptive learning rate
        this.recentPerformance.push({
            error: Math.abs(error),
            timestamp: Date.now()
        });
        
        // Keep only recent performance (last 50 predictions)
        if (this.recentPerformance.length > 50) {
            this.recentPerformance.shift();
        }
        
        // Adapt learning rate based on recent performance
        this.adaptLearningRate();
    }
    
    adaptLearningRate() {
        if (this.recentPerformance.length < 10) return;
        
        const recentErrors = this.recentPerformance.slice(-10);
        const avgError = recentErrors.reduce((sum, p) => sum + p.error, 0) / 10;
        
        // Increase learning rate if error is high, decrease if low
        if (avgError > 0.3) {
            this.learningRate = Math.min(0.05, this.learningRate * 1.1);
        } else if (avgError < 0.1) {
            this.learningRate = Math.max(0.001, this.learningRate * 0.9);
        }
    }
    
    getAdjustedPrediction(basePrediction, features) {
        let adjustment = 0;
        
        Object.keys(features).forEach(featureName => {
            const weight = this.featureWeights.get(featureName) || 0;
            const featureValue = features[featureName];
            adjustment += weight * featureValue;
        });
        
        // Apply adjustment with sigmoid to keep in valid range
        const adjustedScore = basePrediction + (adjustment * 20); // Scale adjustment
        return Math.max(0, Math.min(100, adjustedScore));
    }
}
```

## 🔄 Training Pipeline

### Data Collection & Preprocessing

```javascript
class TrainingDataManager {
    constructor() {
        this.trainingData = [];
        this.validationData = [];
        this.testData = [];
    }
    
    async collectHistoricalData() {
        // Collect data from successful meme coins
        const successfulTokens = await getTopPerformingMemeCoins(200);
        const failedTokens = await getFailedMemeCoins(200);
        
        const allTokens = [...successfulTokens, ...failedTokens];
        
        for (const token of allTokens) {
            try {
                const features = await extractFeatures(token.address);
                const label = token.maxReturn >= 1000 ? 1 : 0; // 10x+ = success
                
                this.trainingData.push({
                    features,
                    label,
                    weight: this.calculateSampleWeight(token)
                });
            } catch (error) {
                console.warn(`Failed to extract features for ${token.address}`);
            }
        }
        
        this.splitData();
    }
    
    calculateSampleWeight(token) {
        // Weight more recent examples higher
        const daysSinceLaunch = (Date.now() - token.launchDate) / (1000 * 60 * 60 * 24);
        const timeWeight = Math.exp(-daysSinceLaunch / 180); // 6-month decay
        
        // Weight extreme examples higher
        const extremeWeight = token.maxReturn >= 10000 || token.maxReturn <= 10 ? 1.5 : 1;
        
        return timeWeight * extremeWeight;
    }
    
    splitData() {
        // Shuffle data
        const shuffled = this.trainingData.sort(() => Math.random() - 0.5);
        
        // 70% training, 15% validation, 15% test
        const trainEnd = Math.floor(shuffled.length * 0.7);
        const validEnd = Math.floor(shuffled.length * 0.85);
        
        this.trainingData = shuffled.slice(0, trainEnd);
        this.validationData = shuffled.slice(trainEnd, validEnd);
        this.testData = shuffled.slice(validEnd);
    }
}
```

### Cross-Validation & Hyperparameter Tuning

```javascript
class ModelValidator {
    constructor() {
        this.kFolds = 5;
        this.metrics = ['accuracy', 'precision', 'recall', 'f1', 'auc'];
    }
    
    async crossValidate(model, data) {
        const foldSize = Math.floor(data.length / this.kFolds);
        const results = [];
        
        for (let i = 0; i < this.kFolds; i++) {
            const start = i * foldSize;
            const end = start + foldSize;
            
            const testFold = data.slice(start, end);
            const trainFold = [...data.slice(0, start), ...data.slice(end)];
            
            // Train on fold
            await model.train(trainFold);
            
            // Test on fold
            const predictions = testFold.map(sample => 
                model.predict(sample.features)
            );
            const actuals = testFold.map(sample => sample.label);
            
            // Calculate metrics
            const foldMetrics = this.calculateMetrics(predictions, actuals);
            results.push(foldMetrics);
        }
        
        return this.aggregateResults(results);
    }
    
    calculateMetrics(predictions, actuals) {
        const tp = predictions.reduce((sum, pred, i) => 
            sum + (pred >= 0.5 && actuals[i] === 1 ? 1 : 0), 0);
        const fp = predictions.reduce((sum, pred, i) => 
            sum + (pred >= 0.5 && actuals[i] === 0 ? 1 : 0), 0);
        const tn = predictions.reduce((sum, pred, i) => 
            sum + (pred < 0.5 && actuals[i] === 0 ? 1 : 0), 0);
        const fn = predictions.reduce((sum, pred, i) => 
            sum + (pred < 0.5 && actuals[i] === 1 ? 1 : 0), 0);
        
        return {
            accuracy: (tp + tn) / (tp + tn + fp + fn),
            precision: tp / (tp + fp) || 0,
            recall: tp / (tp + fn) || 0,
            f1: 2 * tp / (2 * tp + fp + fn) || 0,
            auc: this.calculateAUC(predictions, actuals)
        };
    }
}
```

## 📈 Performance Metrics

### Model Evaluation

```javascript
class PerformanceTracker {
    constructor() {
        this.predictions = [];
        this.outcomes = [];
        this.timeDecay = 0.95; // Older predictions have less weight
    }
    
    addPrediction(contractAddress, prediction, features, timestamp) {
        this.predictions.push({
            contractAddress,
            prediction,
            features,
            timestamp,
            outcome: null // To be filled later
        });
    }
    
    recordOutcome(contractAddress, outcome, performanceData) {
        const predictionIndex = this.predictions.findIndex(
            p => p.contractAddress === contractAddress
        );
        
        if (predictionIndex !== -1) {
            this.predictions[predictionIndex].outcome = outcome;
            this.predictions[predictionIndex].performanceData = performanceData;
            
            // Update model performance metrics
            this.updateMetrics();
        }
    }
    
    updateMetrics() {
        const completedPredictions = this.predictions.filter(p => p.outcome !== null);
        
        if (completedPredictions.length === 0) return;
        
        // Calculate weighted accuracy (more recent predictions weighted higher)
        let weightedCorrect = 0;
        let totalWeight = 0;
        
        completedPredictions.forEach(pred => {
            const daysSince = (Date.now() - pred.timestamp) / (1000 * 60 * 60 * 24);
            const weight = Math.pow(this.timeDecay, daysSince);
            
            const predicted = pred.prediction >= 70; // High confidence threshold
            const actual = pred.outcome === 'success';
            
            if (predicted === actual) {
                weightedCorrect += weight;
            }
            totalWeight += weight;
        });
        
        const accuracy = weightedCorrect / totalWeight;
        
        // Calculate other metrics
        const metrics = {
            accuracy: accuracy * 100,
            totalPredictions: completedPredictions.length,
            successRate: this.calculateSuccessRate(),
            avgReturnOnSuccess: this.calculateAvgReturn(),
            calibrationScore: this.calculateCalibration()
        };
        
        // Store metrics
        localStorage.setItem('modelMetrics', JSON.stringify(metrics));
        return metrics;
    }
    
    calculateCalibration() {
        // How well do prediction scores match actual success rates?
        const bins = Array(10).fill(0).map(() => ({ predicted: [], actual: [] }));
        
        this.predictions.forEach(pred => {
            if (pred.outcome !== null) {
                const bin = Math.min(9, Math.floor(pred.prediction / 10));
                bins[bin].predicted.push(pred.prediction);
                bins[bin].actual.push(pred.outcome === 'success' ? 100 : 0);
            }
        });
        
        let calibrationError = 0;
        let totalSamples = 0;
        
        bins.forEach(bin => {
            if (bin.predicted.length > 0) {
                const avgPredicted = bin.predicted.reduce((a, b) => a + b, 0) / bin.predicted.length;
                const avgActual = bin.actual.reduce((a, b) => a + b, 0) / bin.actual.length;
                
                calibrationError += Math.abs(avgPredicted - avgActual) * bin.predicted.length;
                totalSamples += bin.predicted.length;
            }
        });
        
        return 100 - (calibrationError / totalSamples); // Higher = better calibrated
    }
}
```

## 🎛️ Hyperparameter Optimization

### Bayesian Optimization

```javascript
class HyperparameterOptimizer {
    constructor() {
        this.trials = [];
        this.bestScore = -Infinity;
        this.bestParams = null;
    }
    
    async optimize(parameterSpace, evaluationFunction, maxTrials = 50) {
        for (let trial = 0; trial < maxTrials; trial++) {
            const params = this.selectNextParams(parameterSpace);
            const score = await evaluationFunction(params);
            
            this.trials.push({ params, score });
            
            if (score > this.bestScore) {
                this.bestScore = score;
                this.bestParams = params;
            }
            
            console.log(`Trial ${trial + 1}: Score ${score.toFixed(4)}, Best: ${this.bestScore.toFixed(4)}`);
        }
        
        return this.bestParams;
    }
    
    selectNextParams(parameterSpace) {
        if (this.trials.length < 5) {
            // Random exploration for first few trials
            return this.randomSample(parameterSpace);
        }
        
        // Use Gaussian Process to suggest next parameters
        return this.bayesianSelection(parameterSpace);
    }
    
    randomSample(parameterSpace) {
        const params = {};
        
        Object.keys(parameterSpace).forEach(param => {
            const space = parameterSpace[param];
            
            if (space.type === 'continuous') {
                params[param] = Math.random() * (space.max - space.min) + space.min;
            } else if (space.type === 'discrete') {
                params[param] = space.values[Math.floor(Math.random() * space.values.length)];
            }
        });
        
        return params;
    }
}

// Usage example
const optimizer = new HyperparameterOptimizer();

const parameterSpace = {
    learningRate: { type: 'continuous', min: 0.001, max: 0.1 },
    batchSize: { type: 'discrete', values: [32, 64, 128, 256] },
    hiddenLayers: { type: 'discrete', values: [1, 2, 3, 4] },
    dropout: { type: 'continuous', min: 0.1, max: 0.5 }
};

async function evaluateModel(params) {
    const model = new NeuralNetwork(params);
    const cvResults = await crossValidate(model, trainingData);
    return cvResults.f1Score;
}

const bestParams = await optimizer.optimize(parameterSpace, evaluateModel);
```

## 🚀 Advanced Features

### Feature Importance Analysis

```javascript
class FeatureImportanceAnalyzer {
    constructor(model) {
        this.model = model;
        this.importance = {};
    }
    
    calculatePermutationImportance(testData) {
        const baselineScore = this.evaluateModel(testData);
        
        Object.keys(testData[0].features).forEach(feature => {
            // Create corrupted dataset
            const corruptedData = testData.map(sample => {
                const corrupted = { ...sample };
                corrupted.features = { ...sample.features };
                
                // Shuffle this feature's values
                const shuffledValue = testData[
                    Math.floor(Math.random() * testData.length)
                ].features[feature];
                
                corrupted.features[feature] = shuffledValue;
                return corrupted;
            });
            
            const corruptedScore = this.evaluateModel(corruptedData);
            this.importance[feature] = baselineScore - corruptedScore;
        });
        
        return this.importance;
    }
    
    getTopFeatures(n = 10) {
        return Object.entries(this.importance)
            .sort(([,a], [,b]) => b - a)
            .slice(0, n);
    }
}
```

### Anomaly Detection

```javascript
class AnomalyDetector {
    constructor() {
        this.threshold = 2.5; // Z-score threshold
        this.featureStats = new Map();
    }
    
    fit(trainingData) {
        const features = Object.keys(trainingData[0].features);
        
        features.forEach(feature => {
            const values = trainingData.map(sample => sample.features[feature]);
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
            const stdDev = Math.sqrt(variance);
            
            this.featureStats.set(feature, { mean, stdDev });
        });
    }
    
    detectAnomalies(features) {
        const anomalies = [];
        
        Object.keys(features).forEach(feature => {
            const stats = this.featureStats.get(feature);
            if (!stats) return;
            
            const zScore = Math.abs((features[feature] - stats.mean) / stats.stdDev);
            
            if (zScore > this.threshold) {
                anomalies.push({
                    feature,
                    value: features[feature],
                    zScore,
                    expected: stats.mean
                });
            }
        });
        
        return anomalies;
    }
}
```

---

This ML system continuously learns and improves, making it more accurate over time as users provide feedback on token outcomes. The ensemble approach ensures robustness, while the online learning component allows for rapid adaptation to market changes.
