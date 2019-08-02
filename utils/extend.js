export default function extend(dest, ...sources) {
  sources.forEach(source => {
    Object.keys(source).forEach(key => {
      dest[key] = source[key];
    });
  });
  return dest;
}
