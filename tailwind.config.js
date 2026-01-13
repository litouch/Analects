/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './*.html',
    './my-favorites.html',
	'./chapters/**/*.html',
	'./stories/**/*.html',
  './articles/**/*.html',
  './people/**/*.html',
    './src/**/*.js',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}