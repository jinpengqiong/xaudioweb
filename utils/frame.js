import reqAnimationFrame from './request-animation-frame';

export default function frame(func) {
  return (...args) => reqAnimationFrame(() => func(...args));
}
