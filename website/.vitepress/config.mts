import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'SnapFill',
  description: 'Cross-platform WebView autofill engine',
  base: '/snapfill/',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/snapfill/logo-icon.svg' }],
  ],

  themeConfig: {
    logo: '/logo-icon.svg',

    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
      { text: 'Platforms', link: '/platforms/react-native' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'How It Works', link: '/guide/how-it-works' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'Injectable Scripts', link: '/api/injectable' },
            { text: 'Form Detection', link: '/api/form-detection' },
            { text: 'Form Filling', link: '/api/form-filling' },
            { text: 'Cart Detection', link: '/api/cart-detection' },
            { text: 'Types', link: '/api/types' },
          ],
        },
      ],
      '/platforms/': [
        {
          text: 'Platforms',
          items: [
            { text: 'React Native', link: '/platforms/react-native' },
            { text: 'Android', link: '/platforms/android' },
            { text: 'iOS', link: '/platforms/ios' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/wangdicoder/snapfill' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright &copy; 2024-present SnapFill Contributors',
    },

    search: {
      provider: 'local',
    },
  },
});
