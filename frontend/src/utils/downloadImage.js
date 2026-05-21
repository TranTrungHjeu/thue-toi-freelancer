/**
 * Tải ảnh từ một URL về máy người dùng dưới dạng file.
 *
 * Chiến lược:
 *  1) Thử fetch() để lấy blob — đa số CDN (vietqr.io, api.qrserver.com, Cloudinary)
 *     đều bật CORS nên cách này hoạt động và file được tải đúng định dạng.
 *  2) Nếu CORS chặn fetch, fallback sang thẻ <a download> trỏ thẳng URL.
 *     Trình duyệt sẽ tải về (cùng-origin) hoặc mở tab mới (khác-origin) — vẫn
 *     đảm bảo user có cách lấy ảnh.
 *
 * @param {string} url - URL ảnh.
 * @param {string} [filename] - Tên file mong muốn (đã có/không có đuôi).
 * @returns {Promise<boolean>} true nếu tải thành công (qua blob), false nếu fallback.
 */
export async function downloadImage(url, filename = "qr-code.png") {
  if (!url) return false;
  const safeName = ensureExtension(filename);

  try {
    const res = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    triggerBlobDownload(blob, safeName);
    return true;
  } catch {
    // Fallback: nếu CORS chặn fetch thì dùng thẻ <a download>; trình duyệt có thể
    // mở tab thay vì tải, nhưng đó là phương án dự phòng cuối.
    const a = document.createElement("a");
    a.href = url;
    a.download = safeName;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return false;
  }
}

function triggerBlobDownload(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Để trình duyệt kịp khởi tạo download trước khi revoke.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function ensureExtension(name) {
  if (/\.[a-z0-9]{2,4}$/i.test(name)) return name;
  return `${name}.png`;
}

export default downloadImage;
