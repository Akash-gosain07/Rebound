function randomCode(length) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function generateUserId() {
  return `RB-USER-${randomCode(5)}`;
}

export function generateItemId(prefix) {
  return `RB-ITEM-${prefix || 'ITEM'}-${randomCode(5)}`;
}
