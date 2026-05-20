import React from 'react';
import { Link } from 'react-router-dom';

function parseInlineElements(text) {
  if (text == null || text === '') {
    return null;
  }

  // A regex that matches **bold** or [label](url)
  const regex = /(\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\))/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;

    // Add preceding text if any
    if (matchIndex > lastIndex) {
      parts.push(<span key={`t-${key++}`}>{text.substring(lastIndex, matchIndex)}</span>);
    }

    if (match[2] !== undefined) {
      // It's a bold text
      parts.push(
        <strong key={`b-${key++}`} className="font-semibold text-slate-950">
          {match[2]}
        </strong>
      );
    } else if (match[3] !== undefined && match[4] !== undefined) {
      // It's a markdown link
      const label = match[3];
      const url = match[4];

      if (url.startsWith('/')) {
        parts.push(
          <Link key={`l-${key++}`} to={url} className="font-bold text-primary-600 underline hover:text-primary-700">
            {label}
          </Link>
        );
      } else {
        parts.push(
          <a key={`a-${key++}`} href={url} target="_blank" rel="noopener noreferrer" className="font-bold text-primary-600 underline hover:text-primary-700">
            {label}
          </a>
        );
      }
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={`t-${key++}`}>{text.substring(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : text;
}

/**
 * Tách đoạn văn / danh sách số / bullet theo từng dòng (hỗ trợ một \n trước mục 1.).
 */
function parseLineChunks(rawLines) {
  const lines = rawLines;
  const chunks = [];
  let i = 0;

  const skipBlanks = () => {
    while (i < lines.length && lines[i].trim() === '') {
      i += 1;
    }
  };

  while (i < lines.length) {
    skipBlanks();
    if (i >= lines.length) {
      break;
    }
    const t = lines[i].trim();
    if (/^\d+\.\s+/.test(t)) {
      const items = [];
      while (i < lines.length) {
        const lt = lines[i].trim();
        if (lt === '') {
          break;
        }
        if (!/^\d+\.\s+/.test(lt)) {
          break;
        }
        items.push(lt.replace(/^\d+\.\s+/, ''));
        i += 1;
      }
      chunks.push({ type: 'ol', items });
      continue;
    }
    if (/^[-*]\s+/.test(t)) {
      const items = [];
      while (i < lines.length) {
        const lt = lines[i].trim();
        if (lt === '') {
          break;
        }
        if (!/^[-*]\s+/.test(lt)) {
          break;
        }
        items.push(lt.replace(/^[-*]\s+/, ''));
        i += 1;
      }
      chunks.push({ type: 'ul', items });
      continue;
    }
    const paraLines = [];
    while (i < lines.length) {
      const lt = lines[i].trim();
      if (lt === '') {
        i += 1;
        break;
      }
      if (/^\d+\.\s+/.test(lt) || /^[-*]\s+/.test(lt)) {
        break;
      }
      paraLines.push(lines[i]);
      i += 1;
    }
    if (paraLines.length > 0) {
      chunks.push({ type: 'p', lines: paraLines });
    }
  }

  return chunks;
}

function renderChunk(chunk, keyPrefix) {
  if (chunk.type === 'ol') {
    return (
      <ol
        key={keyPrefix}
        className="my-2 list-decimal space-y-1.5 pl-5 text-[13px] leading-snug text-slate-800 marker:font-medium marker:text-slate-600"
      >
        {chunk.items.map((item, li) => (
          <li key={`${keyPrefix}-li-${li}`} className="pl-0.5">
            {parseInlineElements(item)}
          </li>
        ))}
      </ol>
    );
  }
  if (chunk.type === 'ul') {
    return (
      <ul
        key={keyPrefix}
        className="my-2 list-disc space-y-1.5 pl-5 text-[13px] leading-snug text-slate-800 marker:text-slate-600"
      >
        {chunk.items.map((item, li) => (
          <li key={`${keyPrefix}-li-${li}`} className="pl-0.5">
            {parseInlineElements(item)}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div key={keyPrefix} className="text-[13px] leading-relaxed text-slate-800">
      {chunk.lines.map((line, li) => (
        <React.Fragment key={`${keyPrefix}-ln-${li}`}>
          {li > 0 && <br />}
          {parseInlineElements(line)}
        </React.Fragment>
      ))}
    </div>
  );
}

/**
 * Hiển thị phản hồi AI: đoạn cách bởi \\n\\n, **in đậm**, danh sách 1. / - / *.
 */
export function AiChatRichText({ text, className = '' }) {
  const normalized = String(text ?? '').replace(/\r\n/g, '\n');
  if (!normalized.trim()) {
    return null;
  }

  const sections = normalized.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);

  return (
    <div className={`space-y-3 ${className}`.trim()}>
      {sections.map((section, si) => {
        const lines = section.split('\n');
        const chunks = parseLineChunks(lines);
        return (
          <div key={`sec-${si}`} className="space-y-1">
            {chunks.map((chunk, ci) => renderChunk(chunk, `sec-${si}-c-${ci}`))}
          </div>
        );
      })}
    </div>
  );
}

export default AiChatRichText;

