export const getProjectCoverImage = (skills = []) => {
  const defaultImage = '/images/covers/default.webp';

  if (!skills || skills.length === 0) {
    return defaultImage;
  }

  // Chuyển tất cả kỹ năng về chữ thường để dễ so sánh
  const skillText = skills.map(s => (typeof s === 'string' ? s : s?.name || '')).join(' ').toLowerCase();

  // Keyword mapping
  const mappings = [
    {
      keywords: ['react', 'node', 'java', 'php', 'python', 'html', 'css', 'javascript', 'vue', 'angular', 'web', 'app', 'lập trình', 'code', 'dev'],
      image: '/images/covers/development.webp'
    },
    {
      keywords: ['design', 'thiết kế', 'ui', 'ux', 'photoshop', 'illustrator', 'figma', 'logo', 'banner'],
      image: '/images/covers/design.webp'
    },
    {
      keywords: ['seo', 'marketing', 'ads', 'quảng cáo', 'facebook', 'google', 'tiktok', 'sale', 'bán hàng'],
      image: '/images/covers/marketing.webp'
    },
    {
      keywords: ['viết', 'bài', 'content', 'dịch', 'translation', 'copywriting', 'blog', 'báo'],
      image: '/images/covers/writing.webp'
    },
    {
      keywords: ['video', 'edit', 'quay', 'dựng', 'premiere', 'after effect', 'capcut', 'vlog'],
      image: '/images/covers/video.webp'
    }
  ];

  for (const mapping of mappings) {
    if (mapping.keywords.some(keyword => skillText.includes(keyword))) {
      return mapping.image;
    }
  }

  return defaultImage;
};
