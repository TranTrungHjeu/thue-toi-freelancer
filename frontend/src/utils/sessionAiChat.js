const STORAGE_PREFIX = 'thuetoi_ai_chat_v1_';

export function getAiChatStorageKey(userId) {
  if (typeof window === 'undefined' || userId == null) {
    return null;
  }
  return `${STORAGE_PREFIX}${userId}`;
}

export function loadAiChatMessages(userId) {
  const key = getAiChatStorageKey(userId);
  if (!key) {
    return [];
  }
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
    );
  } catch {
    return [];
  }
}

export function saveAiChatMessages(userId, messages) {
  const key = getAiChatStorageKey(userId);
  if (!key) {
    return;
  }
  try {
    sessionStorage.setItem(key, JSON.stringify(messages));
  } catch {
    // quota / private mode
  }
}

export function clearAiChatHistoryForUser(userId) {
  const key = getAiChatStorageKey(userId);
  if (key) {
    sessionStorage.removeItem(key);
  }
}
