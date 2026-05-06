#!/usr/bin/env node

const AdvancedOptimizer = require('./advanced-optimizer');
const fs = require('fs');

const args = process.argv.slice(2);
const mode = args[0] || 'quick';

const configs = {
  quick: { iterations: 10, variations: 3 },
  standard: { iterations: 20, variations: 5 },
  deep: { iterations: 50, variations: 10 },
  continuous: { iterations: 100, variations: 5 }
};

async function optimize(videoData, mode = 'standard') {
  const config = configs[mode] || configs.standard;
  
  console.log(`\n🚀 Running ${mode.toUpperCase()} optimization`);
  console.log(`   Iterations: ${config.iterations}`);
  console.log(`   Variations per test: ${config.variations}\n`);
  
  const optimizer = new AdvancedOptimizer();
  const result = await optimizer.runABTest(videoData, config.iterations);
  
  optimizer.exportResults(`results-${mode}-${Date.now()}.json`);
  
  return result;
}

// Example usage
const exampleVideo = {
  title: 'AI YouTube Automation',
  category: 'tech',
  keywords: ['AI automation', 'YouTube growth', 'viral content'],
  duration: '10:30'
};

optimize(exampleVideo, mode).then(result => {
  console.log('\n✅ Optimization complete!');
  console.log(`\nUse this optimized content for your next upload:`);
  console.log(`Title: ${result.optimizedTitle}`);
  console.log(`Tags: ${result.hashtags.join(', ')}`);
});
