module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      startServerCommand: 'npm start',
      startServerReadyPattern: 'Server running at',
      startServerReadyTimeout: 30000,
      numberOfRuns: 1
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'color-contrast': ['error', { minScore: 0.9 }],
        'image-alt': ['error', { minScore: 0.9 }],
        'label': ['error', { minScore: 0.9 }],
        'link-name': ['error', { minScore: 0.9 }],
        'list': ['error', { minScore: 0.9 }],
        'listitem': ['error', { minScore: 0.9 }],
        'heading-order': ['error', { minScore: 0.9 }],
        'html-has-lang': ['error', { minScore: 0.9 }],
        'html-lang-valid': ['error', { minScore: 0.9 }],
        'meta-viewport': ['error', { minScore: 0.9 }],
        'object-alt': ['error', { minScore: 0.9 }],
        'tabindex': ['error', { minScore: 0.9 }],
        'td-headers-attr': ['error', { minScore: 0.9 }],
        'th-has-data-cells': ['error', { minScore: 0.9 }],
        'valid-lang': ['error', { minScore: 0.9 }],
        'video-caption': ['error', { minScore: 0.9 }],
        'video-description': ['error', { minScore: 0.9 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};
