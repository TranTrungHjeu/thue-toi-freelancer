import React from 'react';

/**
 * Thành phần bảng dùng chung theo phong cách giao diện góc cạnh.
 * @param {Array} headers - Danh sách tiêu đề cột
 * @param {Array} data - Danh sách dữ liệu
 * @param {function} renderRow - Hàm dựng từng dòng tùy chỉnh
 */
const Table = ({ headers, data, renderRow, className = '' }) => {
  return (
    <div className={`overflow-x-auto border border-slate-200 ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {headers.map((header, idx) => (
              <th 
                key={idx} 
                className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-secondary-700 font-sans"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {data.map((item, idx) => (
            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
              {renderRow ? renderRow(item) : (
                Object.values(item).map((val, i) => (
                  <td key={i} className="px-4 py-4 text-sm text-slate-600 font-sans">
                    {val}
                  </td>
                ))
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
