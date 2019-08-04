export default function getId(prefix) {
  if (prefix === undefined) {
    prefix = 'waveform_';
  }
  return (
    prefix +
    Math.random()
    .toString(32)
    .substring(2)
  );
}
