export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      overrideBrowserslist: [
        'last 2 versions',
        '> 1%',
        'not dead',
        'not ie 11'
      ],
      flexbox: 'no-2009',
      grid: 'autoplace',
      cascade: true,
      add: true,
      remove: true,
      supports: true,
      flexbox: true,
      grid: true
    },
    'postcss-preset-env': {
      stage: 3,
      features: {
        'nesting-rules': true,
        'custom-properties': true,
        'custom-media-queries': true,
        'media-query-ranges': true,
        'custom-selectors': true,
        'color-mod-function': true,
        'gap-properties': true,
        'focus-visible-pseudo-class': true,
        'focus-within-pseudo-class': true,
        'logical-properties-and-values': true,
        'has-pseudo-class': true,
        'image-set-function': true,
        'is-pseudo-class': true,
        'not-pseudo-class': true,
        'overflow-property': true,
        'overflow-wrap-property': true,
        'place-properties': true,
        'prefers-color-scheme-query': true,
        'text-decoration-shorthand': true,
        'text-decoration-skip-ink': true,
        'text-orientation': true,
        'text-size-adjust': true,
        'text-spacing': true,
        'user-select-none': true,
        'will-change': true
      }
    }
  }
}
