/**
 * Utility for exporting JSON data to CSV and triggering a browser download.
 * Bám chuẩn chuyên nghiệp: Xử lý UTF-8 BOM để Excel hiển thị đúng tiếng Việt.
 * 
 * @param {Array} data Mảng các đối tượng dữ liệu
 * @param {Array} headers Mảng các tiêu đề { key, label }
 * @param {string} fileName Tên file (không bao gồm đuôi .csv)
 */
export const exportToCsv = (data, headers, fileName = 'export') => {
  if (!data || !data.length) return;

  const csvRows = [];

  // 1. Thêm Header
  csvRows.push(headers.map(h => `"${h.label}"`).join(','));

  // 2. Thêm Dữ liệu
  for (const row of data) {
    const values = headers.map(header => {
      let val = row[header.key];
      
      // Xử lý nested objects hoặc custom logic nếu cần
      if (typeof val === 'object' && val !== null) {
        val = JSON.stringify(val);
      }
      
      const escaped = ('' + (val || '')).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  // 3. Tạo Blob với BOM UTF-8 (Quan trọng cho tiếng Việt trong Excel)
  const csvContent = "\uFEFF" + csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // 4. Trigger download
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
