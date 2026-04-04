import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import SnapfillDemo from './SnapfillDemo.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('SnapfillDemo', SnapfillDemo);
  },
} satisfies Theme;
