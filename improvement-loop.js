const { optimizeForViral, generateViralTitle, generateHashtags } = require('./viral-content-generator');

class ContentImprover {
  constructor() {
    this.iterations = 0;
    this.bestScore = 0;
    this.bestContent = null;
    this.performanceHistory = [];
  }

  generateVariations(baseData, count = 5) {
    const variations = [];
    const styles = ['curiosity', 'howTo', 'urgency', 'listicle'];
    
    for (let i = 0; i < count; i++) {
      const style = styles[i % styles.length];
      const optimized = optimizeForViral({
        ...baseData,
        titleStyle: style
      });
      
      // Generate alternative title
      optimized.optimizedTitle = generateViralTitle(baseData.keywords[0], style);
      
      // Vary hashtag mix
      const hashtagMix = i % 2 === 0 ? 'highVolume' : 'hiddenGems';
      optimized.hashtags = this.mixHashtags(baseData.category, hashtagMix);
      
      // Recalculate description with new hashtags
      optimized.description = optimized.description.replace(
        /🔥 #.+/,
        `🔥 ${optimized.hashtags.join(' ')}`
      );
      
      variations.push({
        id: i + 1,
        style,
        hashtagMix,
        ...optimized
      });
    }
    
    return variations;
  }

  mixHashtags(category, strategy) {
    const { VIRAL_HASHTAGS } = require('./viral-content-generator');
    const tags = [];
    
    if (strategy === 'highVolume') {
      tags.push(...VIRAL_HASHTAGS.highVolume.slice(0, 3));
      tags.push(...VIRAL_HASHTAGS.niche[category]?.slice(0, 2) || VIRAL_HASHTAGS.hiddenGems.slice(0, 2));
    } else {
      tags.push(...VIRAL_HASHTAGS.hiddenGems.slice(0, 3));
      tags.push(...VIRAL_HASHTAGS.highEngagement.slice(0, 2));
    }
    
    return [...new Set(tags)].slice(0, 5);
  }

  scoreVariation(variation) {
    let score = variation.seoScore;
    
    // Title scoring
    const titleLength = variation.optimizedTitle.length;
    if (titleLength >= 50 && titleLength <= 70) score += 10;
    if (variation.optimizedTitle.includes('2026')) score += 5;
    if (/\d+/.test(variation.optimizedTitle)) score += 5; // Has numbers
    
    // Description scoring
    if (variation.description.length > 300) score += 5;
    if (variation.description.includes('⏱️')) score += 5;
    if (variation.description.split('\n').length > 10) score += 5;
    
    // Hashtag scoring
    if (variation.hashtags.length === 5) score += 5;
    
    return Math.min(score, 100);
  }

  async runImprovementLoop(baseData, iterations = 10) {
    console.log('🚀 Starting Improvement Loop...\n');
    
    for (let i = 0; i < iterations; i++) {
      this.iterations++;
      console.log(`\n📊 Iteration ${this.iterations}/${iterations}`);
      console.log('─'.repeat(50));
      
      // Generate variations
      const variations = this.generateVariations(baseData, 5);
      
      // Score each variation
      const scored = variations.map(v => ({
        ...v,
        finalScore: this.scoreVariation(v)
      })).sort((a, b) => b.finalScore - a.finalScore);
      
      // Track best
      const best = scored[0];
      if (best.finalScore > this.bestScore) {
        this.bestScore = best.finalScore;
        this.bestContent = best;
        console.log(`✨ NEW BEST SCORE: ${best.finalScore}/100`);
      }
      
      // Show top 3
      console.log('\n🏆 Top 3 Variations:');
      scored.slice(0, 3).forEach((v, idx) => {
        console.log(`\n${idx + 1}. Score: ${v.finalScore}/100 | Style: ${v.style} | Mix: ${v.hashtagMix}`);
        console.log(`   Title: ${v.optimizedTitle.substring(0, 60)}...`);
        console.log(`   Tags: ${v.hashtags.slice(0, 3).join(' ')}`);
      });
      
      // Record performance
      this.performanceHistory.push({
        iteration: this.iterations,
        bestScore: best.finalScore,
        avgScore: scored.reduce((sum, v) => sum + v.finalScore, 0) / scored.length,
        topStyle: best.style
      });
      
      // Simulate learning delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return this.getBestResult();
  }

  getBestResult() {
    console.log('\n' + '='.repeat(50));
    console.log('🎯 FINAL BEST RESULT');
    console.log('='.repeat(50));
    console.log(`\n📈 Score: ${this.bestScore}/100`);
    console.log(`🎨 Style: ${this.bestContent.style}`);
    console.log(`📊 Hashtag Mix: ${this.bestContent.hashtagMix}`);
    console.log(`\n📝 Title:\n${this.bestContent.optimizedTitle}`);
    console.log(`\n🏷️ Hashtags:\n${this.bestContent.hashtags.join(' ')}`);
    console.log(`\n📄 Description:\n${this.bestContent.description.substring(0, 300)}...`);
    
    this.showPerformanceGraph();
    
    return this.bestContent;
  }

  showPerformanceGraph() {
    console.log('\n📊 Performance Over Time:');
    console.log('─'.repeat(50));
    
    this.performanceHistory.forEach(record => {
      const bar = '█'.repeat(Math.floor(record.bestScore / 5));
      console.log(`Iter ${record.iteration.toString().padStart(2)}: ${bar} ${record.bestScore}`);
    });
  }

  exportBest(filename = 'best-content.json') {
    const fs = require('fs');
    fs.writeFileSync(filename, JSON.stringify(this.bestContent, null, 2));
    console.log(`\n💾 Saved to ${filename}`);
  }
}

// Run if called directly
if (require.main === module) {
  const improver = new ContentImprover();
  
  const testData = {
    title: 'AI YouTube Automation',
    category: 'tech',
    keywords: ['AI automation', 'YouTube growth', 'viral content'],
    duration: '10:30'
  };
  
  improver.runImprovementLoop(testData, 10).then(best => {
    improver.exportBest();
  });
}

module.exports = ContentImprover;
