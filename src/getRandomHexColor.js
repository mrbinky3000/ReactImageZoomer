/**
 * @function getRandomHexColor
 * @desc Create a random hex color.  This is useful for visually grocking how many times a React component
 * renders.  This is not meant for production.  Webpack tree-shaking will keep this out of the app
 * bundle.
 *
 * Example:
 *  add this attribute to the root element in a react component's render method.
 *  style={{ backgroundColor: getRandomHexColor() }}
 *
 * Thanks to Paul Irish, of course.
 * https://www.paulirish.com/2009/random-hex-color-code-snippets/
 * @return {string} A string that starts with "#" followed by 6 hex digits.
 */
const getRandomHexColor = () => `#${Math.floor(Math.random() * 16777215).toString(16)}`;

export default getRandomHexColor;
