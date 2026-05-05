export function sanitizeLoginForIdentity(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || `user_${Math.random().toString(36).slice(2, 8)}`;
}

export function createInternalEmailFromLogin(login: string) {
  return `${sanitizeLoginForIdentity(login)}@users.subreel.ru`;
}
