const {
  generateHashtags,
  generateDescription,
  generateViralTitle,
  optimizeForViral
} = require('./viral-content-generator');

// Example 1: Generate hashtags for tech content
console.log('=== TECH HASHTAGS ===');
const techHashtags = generateHashtags('tech', 5);
console.log(techHashtags.join(' '));

// Example 2: Generate viral title
console.log('\n=== VIRAL TITLES ===');
console.log(generateViralTitle('AI Automation', 'curiosity'));
console.log(generateViralTitle('YouTube Growth', 'howTo'));
console.log(generateViralTitle('Content Creation', 'urgency'));

// Example 3: Full optimization
console.log('\n=== FULL OPTIMIZATION ===');
const videoData = {
  title: 'AI YouTube Automation Tutorial',
  category: 'tech',
  duration: '10:30',
  keywords: ['AI automation', 'YouTube growth', 'content creation']
};

const optimized = optimizeForViral(videoData);
console.log('Title:', optimized.optimizedTitle);
console.log('\nDescription:\n', optimized.description);
console.log('\nSEO Score:', optimized.seoScore, '/100');

// Example 4: Custom description
console.log('\n=== CUSTOM DESCRIPTION ===');
const customDesc = generateDescription({
  title: 'Master YouTube in 30 Days',
  primaryKeyword: 'YouTube growth strategy',
  category: 'business',
  chapters: [
    { time: '00:00', title: 'Introduction to YouTube Growth' },
    { time: '02:15', title: 'The Algorithm Explained' },
    { time: '06:30', title: 'Content Strategy That Works' },
    { time: '09:45', title: 'Monetization Tips' }
  ],
  links: [
    { title: 'Free YouTube Guide', url: 'https://example.com/guide' },
    { title: 'Join Our Community', url: 'https://example.com/community' }
  ]
});
console.log(customDesc);
