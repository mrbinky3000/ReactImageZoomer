/**
 * @function cn
 * @desc Create a className string.  Pass this function strings, arrays, or multi-dimensonal
 * arrays.  You can even pass in an IIFE that returns a string or array.
 *
 * Example:
 * const c = 'cool';
 * const d = 'dude';
 * cn(false, undefined, null, 'wow', ['this', 'is'], (c => c)(c), (d => [d])(d));
 *
 * Output:
 * "wow this is cool dude"
 *
 * @returns string
 */
 export default (...args) => {
  const flatten = (arr) =>
    arr.reduce(
      (acc, val) => acc.concat(Array.isArray(val) ? flatten(val) : val),
      []
    );

  return flatten(Array.from(args))
    .filter((c) => c)
    .join(" ");
};
