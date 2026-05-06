// Viral Content Generator for YouTube Automation
// Based on 2026 research data

const VIRAL_HASHTAGS = {
  // Top performing hashtags by category
  highVolume: [
    '#Inspiration', '#Motivation', '#PersonalGrowth', '#SelfImprovement',
    '#ViralVideo', '#Entertainment', '#Comedy', '#Gaming'
  ],
  
  highEngagement: [
    '#Innovation', '#ContentCreation', '#ArtificialIntelligence', '#AI',
    '#DigitalMarketing', '#MarketingTips', '#BusinessGrowth', '#Entrepreneurship'
  ],
  
  hiddenGems: [
    '#TechTrends', '#FutureTech', '#DigitalTransformation', '#ContentStrategy',
    '#VideoMarketing', '#SuccessTips', '#ProfessionalDevelopment'
  ],
  
  niche: {
    tech: ['#AI', '#Innovation', '#TechTrends', '#FutureTech', '#DigitalTransformation'],
    business: ['#Entrepreneurship', '#BusinessGrowth', '#BusinessStrategy', '#Leadership', '#FinancialFreedom'],
    lifestyle: ['#Motivation', '#PersonalGrowth', '#SelfImprovement', '#Mindfulness', '#Wellness'],
    entertainment: ['#Comedy', '#Entertainment', '#ViralVideo', '#FunnyMoments', '#Drama'],
    gaming: ['#Gaming', '#GamingCommunity', '#Gameplay', '#Gamer', '#VideoGames']
  }
};

function generateHashtags(category = 'general', count = 5) {
  const tags = [];
  
  if (category !== 'general' && VIRAL_HASHTAGS.niche[category]) {
    tags.push(...VIRAL_HASHTAGS.niche[category].slice(0, 3));
  } else {
    tags.push(...VIRAL_HASHTAGS.highVolume.slice(0, 2));
  }
  
  tags.push(...VIRAL_HASHTAGS.hiddenGems.slice(0, 2));
  
  return tags.slice(0, count);
}

function generateDescription(options = {}) {
  const {
    title = 'Amazing Video',
    primaryKeyword = 'viral content',
    category = 'general',
    videoLength = '10:00',
    chapters = [],
    links = []
  } = options;

  // First 150 characters - CRITICAL for SEO
  const hook = `${primaryKeyword}: ${title}. Learn the exact strategies that work in 2026.`;
  
  // Build description
  let description = `${hook}\n\n`;
  
  // Add chapters if provided
  if (chapters.length > 0) {
    description += '⏱️ TIMESTAMPS:\n';
    chapters.forEach(chapter => {
      description += `${chapter.time} - ${chapter.title}\n`;
    });
    description += '\n';
  }
  
  // Add hashtags
  const hashtags = generateHashtags(category, 5);
  description += `🔥 ${hashtags.join(' ')}\n\n`;
  
  // Add CTA
  description += '👉 Subscribe for more content like this!\n';
  description += '💬 Drop a comment with your thoughts!\n\n';
  
  // Add links if provided
  if (links.length > 0) {
    description += '🔗 RESOURCES:\n';
    links.forEach(link => {
      description += `${link.title}: ${link.url}\n`;
    });
  }
  
  return description;
}

function generateViralTitle(keyword, style = 'curiosity') {
  const templates = {
    curiosity: [
      `The ${keyword} Secret Nobody Talks About`,
      `What ${keyword} Experts Don't Want You to Know`,
      `I Tried ${keyword} for 30 Days - Here's What Happened`
    ],
    howTo: [
      `How to Master ${keyword} in 2026 (Step-by-Step)`,
      `${keyword}: Complete Beginner's Guide`,
      `The Only ${keyword} Tutorial You'll Ever Need`
    ],
    listicle: [
      `7 ${keyword} Hacks That Actually Work`,
      `Top 10 ${keyword} Mistakes (And How to Fix Them)`,
      `5 ${keyword} Tips That Changed Everything`
    ],
    urgency: [
      `${keyword} is Changing in 2026 - Watch This Now`,
      `Don't Start ${keyword} Until You Watch This`,
      `${keyword}: What's Working Right Now`
    ]
  };
  
  const options = templates[style] || templates.curiosity;
  return options[Math.floor(Math.random() * options.length)];
}

function optimizeForViral(videoData) {
  const { title, category, duration, keywords = [] } = videoData;
  
  const primaryKeyword = keywords[0] || 'viral content';
  
  // Generate optimized title
  const viralTitle = generateViralTitle(primaryKeyword, 'curiosity');
  
  // Generate chapters (example structure)
  const chapters = [
    { time: '00:00', title: `${primaryKeyword} - Quick Overview` },
    { time: '01:30', title: 'The Strategy That Works' },
    { time: '05:00', title: 'Common Mistakes to Avoid' },
    { time: '08:00', title: 'Real Results & Examples' }
  ];
  
  // Generate full description
  const description = generateDescription({
    title: viralTitle,
    primaryKeyword,
    category,
    chapters,
    links: [
      { title: 'Free Resources', url: 'https://yourwebsite.com/resources' }
    ]
  });
  
  return {
    optimizedTitle: viralTitle,
    description,
    hashtags: generateHashtags(category, 5),
    chapters,
    seoScore: calculateSEOScore(viralTitle, description)
  };
}

function calculateSEOScore(title, description) {
  let score = 0;
  
  // Title length (60-70 chars is optimal)
  if (title.length >= 60 && title.length <= 70) score += 20;
  else if (title.length >= 50 && title.length <= 80) score += 10;
  
  // Description has first 150 chars
  if (description.length >= 150) score += 20;
  
  // Has timestamps
  if (description.includes('⏱️') || description.includes('00:00')) score += 20;
  
  // Has hashtags
  if (description.includes('#')) score += 20;
  
  // Has CTA
  if (description.includes('Subscribe') || description.includes('Comment')) score += 20;
  
  return score;
}

module.exports = {
  generateHashtags,
  generateDescription,
  generateViralTitle,
  optimizeForViral,
  VIRAL_HASHTAGS
};
