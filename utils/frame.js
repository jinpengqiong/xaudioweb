
export default function frame(func) {
  return (...args) => window.requestAnimationFrame(() => func(...args));
}
