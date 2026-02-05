export default defineAppConfig({
  pages: ['pages/index/index'],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '@navBackgroundColor',
    navigationBarTitleText: '点点手帐',
    navigationBarTextStyle: '@navTextStyle',
  },
  darkmode: true,
  themeLocation: 'theme.json',
})
