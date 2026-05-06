const ContentImprover = require('./improvement-loop');
const fs = require('fs');

class AdvancedOptimizer extends ContentImprover {
  constructor() {
    super();
    this.abTests = [];
    this.learningRate = 0.1;
    this.weights = {
      titleLength: 1.0,
      hasNumbers: 1.0,
      hasYear: 1.0,
      curiosityWords: 1.0,
      hashtagMix: 1.0
    };
  }

  // Simulate real performance data
  simulatePerformance(content) {
    let ctr = 0.05; // Base 5% CTR
    let avgViewDuration = 180; // Base 3 minutes
    
    // Title impact
    if (content.style === 'curiosity') ctr += 0.02;
    if (content.style === 'urgency') ctr += 0.015;
    if (/\d+/.test(content.optimizedTitle)) ctr += 0.01;
    if (content.optimizedTitle.includes('2026')) ctr += 0.005;
    
    // Hashtag impact
    if (content.hashtagMix === 'hiddenGems') avgViewDuration += 30;
    if (content.hashtags.includes('#Innovation')) avgViewDuration += 20;
    
    // Add randomness
    ctr += (Math.random() - 0.5) * 0.02;
    avgViewDuration += (Math.random() - 0.5) * 40;
    
    return {
      ctr: Math.max(0.01, Math.min(0.15, ctr)),
      avgViewDuration: Math.max(60, Math.min(600, avgViewDuration)),
      engagement: ctr * avgViewDuration / 10
    };
  }

  async runABTest(baseData, iterations = 20) {
    console.log('🧪 Starting A/B Testing Loop...\n');
    
    for (let i = 0; i < iterations; i++) {
      this.iterations++;
      console.log(`\n🔬 Test ${this.iterations}/${iterations}`);
      
      const variations = this.generateVariations(baseData, 3);
      
      // Simulate performance for each
      const results = variations.map(v => {
        const perf = this.simulatePerformance(v);
        const score = this.scoreVariation(v);
        
        return {
          ...v,
          ...perf,
          finalScore: score + (perf.engagement * 10)
        };
      }).sort((a, b) => b.finalScore - a.finalScore);
      
      const winner = results[0];
      
      // Update weights based on winner
      this.updateWeights(winner);
      
      if (winner.finalScore > this.bestScore) {
        this.bestScore = winner.finalScore;
        this.bestContent = winner;
        console.log(`🏆 NEW WINNER: ${winner.finalScore.toFixed(1)}/100`);
        console.log(`   CTR: ${(winner.ctr * 100).toFixed(2)}% | Avg View: ${winner.avgViewDuration.toFixed(0)}s`);
      }
      
      this.abTests.push({
        iteration: this.iterations,
        winner: winner.style,
        ctr: winner.ctr,
        avgViewDuration: winner.avgViewDuration,
        score: winner.finalScore
      });
      
      console.log(`   Best: ${winner.style} (${(winner.ctr * 100).toFixed(2)}% CTR)`);
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return this.getOptimizedResult();
  }

  updateWeights(winner) {
    if (winner.style === 'curiosity') this.weights.curiosityWords += this.learningRate;
    if (/\d+/.test(winner.optimizedTitle)) this.weights.hasNumbers += this.learningRate;
    if (winner.hashtagMix === 'hiddenGems') this.weights.hashtagMix += this.learningRate;
  }

  getOptimizedResult() {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 OPTIMIZED RESULT (A/B TESTED)');
    console.log('='.repeat(60));
    
    console.log(`\n📊 Final Metrics:`);
    console.log(`   Score: ${this.bestContent.finalScore.toFixed(1)}/100`);
    console.log(`   CTR: ${(this.bestContent.ctr * 100).toFixed(2)}%`);
    console.log(`   Avg View Duration: ${this.bestContent.avgViewDuration.toFixed(0)}s`);
    console.log(`   Engagement: ${this.bestContent.engagement.toFixed(2)}`);
    
    console.log(`\n🎨 Winning Strategy:`);
    console.log(`   Style: ${this.bestContent.style}`);
    console.log(`   Hashtag Mix: ${this.bestContent.hashtagMix}`);
    
    console.log(`\n📝 Title:\n   ${this.bestContent.optimizedTitle}`);
    console.log(`\n🏷️ Hashtags:\n   ${this.bestContent.hashtags.join(' ')}`);
    
    this.showABTestResults();
    this.showLearnings();
    
    return this.bestContent;
  }

  showABTestResults() {
    console.log('\n📈 A/B Test Performance:');
    console.log('─'.repeat(60));
    
    const avgCTR = this.abTests.reduce((sum, t) => sum + t.ctr, 0) / this.abTests.length;
    const avgDuration = this.abTests.reduce((sum, t) => sum + t.avgViewDuration, 0) / this.abTests.length;
    
    console.log(`Average CTR: ${(avgCTR * 100).toFixed(2)}%`);
    console.log(`Average View Duration: ${avgDuration.toFixed(0)}s`);
    
    const styleWins = this.abTests.reduce((acc, t) => {
      acc[t.winner] = (acc[t.winner] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n🏆 Style Win Rate:');
    Object.entries(styleWins).forEach(([style, wins]) => {
      const rate = (wins / this.abTests.length * 100).toFixed(1);
      console.log(`   ${style}: ${wins}/${this.abTests.length} (${rate}%)`);
    });
  }

  showLearnings() {
    console.log('\n🧠 Learned Weights:');
    console.log('─'.repeat(60));
    Object.entries(this.weights).forEach(([key, value]) => {
      const bar = '▓'.repeat(Math.floor(value * 5));
      console.log(`${key.padEnd(20)}: ${bar} ${value.toFixed(2)}`);
    });
  }

  exportResults(filename = 'optimization-results.json') {
    const results = {
      bestContent: this.bestContent,
      abTests: this.abTests,
      weights: this.weights,
      summary: {
        totalTests: this.abTests.length,
        bestScore: this.bestScore,
        bestCTR: this.bestContent.ctr,
        bestAvgViewDuration: this.bestContent.avgViewDuration
      }
    };
    
    fs.writeFileSync(filename, JSON.stringify(results, null, 2));
    console.log(`\n💾 Full results saved to ${filename}`);
  }
}

// Run if called directly
if (require.main === module) {
  const optimizer = new AdvancedOptimizer();
  
  const testData = {
    title: 'AI YouTube Automation',
    category: 'tech',
    keywords: ['AI automation', 'YouTube growth', 'viral content'],
    duration: '10:30'
  };
  
  optimizer.runABTest(testData, 20).then(best => {
    optimizer.exportResults();
  });
}

module.exports = AdvancedOptimizer;
