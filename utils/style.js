export default function style(el, styles) {
  Object.keys(styles).forEach(prop => {
    if (el.style[prop] !== styles[prop]) {
      el.style[prop] = styles[prop];
    }
  });
  return el;
}
