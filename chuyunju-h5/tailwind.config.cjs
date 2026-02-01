module.exports = {
  content: [
    './index.html',
    './**/*.html',
    './**/*.js'
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui')
  ],
  daisyui: {
    themes: [
      {
        chuyunju: {
          'primary': '#7aa6a1',
          'secondary': '#c49a6c',
          'neutral': '#f7f7f7',
          'base-100': '#ffffff',
          'info': '#60a5fa'
        }
      }
    ]
  }
}
