/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [ "../kotlin/**/*.kt" ],
  theme: {
    extend: {},
  },
  plugins: [
     require('@tailwindcss/forms')
  ],
}

