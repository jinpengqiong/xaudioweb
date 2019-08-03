
export default function frame(func) {
  return (...args) => window.reqAnimationFrame(() => func(...args));
}
