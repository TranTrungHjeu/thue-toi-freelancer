export const normalizeAttachments = (attachments) => {
  if (Array.isArray(attachments)) {
    return attachments
      .filter((attachment) => attachment?.url)
      .map((attachment) => ({
        url: attachment.url,
        name: attachment.name || attachment.url,
        contentType: attachment.contentType || 'application/octet-stream',
        size: Number(attachment.size || 0),
        storageProvider: attachment.storageProvider,
      }));
  }

  if (typeof attachments === 'string' && /^https?:\/\//i.test(attachments)) {
    return [{
      url: attachments,
      name: attachments.split('/').pop() || attachments,
      contentType: 'application/octet-stream',
      size: 0,
    }];
  }

  return [];
};

export const formatAttachmentSize = (size) => {
  const numericSize = Number(size || 0);
  if (!numericSize) {
    return '';
  }
  if (numericSize < 1024 * 1024) {
    return `${Math.max(1, Math.round(numericSize / 1024))} KB`;
  }
  return `${(numericSize / 1024 / 1024).toFixed(2)} MB`;
};
