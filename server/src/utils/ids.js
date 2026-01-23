export function generateUserId() {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `RB-USER-${n}`;
}

export function generateMatchId() {
  const letters = Array.from({ length: 3 })
    .map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26)))
    .join('');
  const numbers = Math.floor(100 + Math.random() * 900);
  return `${letters}-${numbers}`;
}

export function generateNumericOtp(length = 6) {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}
