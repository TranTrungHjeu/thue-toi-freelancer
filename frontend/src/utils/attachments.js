export const normalizeAttachments = (attachments) => {
  if (!attachments) {
    return [];
  }

  // Handle JSON string from legacy or raw DB fields
  let processed = attachments;
  if (typeof attachments === "string" && attachments.trim().startsWith("[")) {
    try {
      processed = JSON.parse(attachments);
    } catch (e) {
      console.error("Failed to parse attachments JSON", e);
      return [];
    }
  }

  if (Array.isArray(processed)) {
    return processed
      .filter((attachment) => attachment?.url)
      .map((attachment) => ({
        url: attachment.url,
        name: attachment.name || attachment.url,
        contentType: attachment.contentType || "application/octet-stream",
        size: Number(attachment.size || 0),
        storageProvider: attachment.storageProvider,
      }));
  }

  if (typeof processed === "string" && /^https?:\/\//i.test(processed)) {
    return [
      {
        url: processed,
        name: processed.split("/").pop() || processed,
        contentType: "application/octet-stream",
        size: 0,
      },
    ];
  }

  return [];
};

export const formatAttachmentSize = (size) => {
  const numericSize = Number(size || 0);
  if (!numericSize) {
    return "";
  }
  if (numericSize < 1024 * 1024) {
    return `${Math.max(1, Math.round(numericSize / 1024))} KB`;
  }
  return `${(numericSize / 1024 / 1024).toFixed(2)} MB`;
};
