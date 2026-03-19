import React from 'react';

/**
 * Common Table component following "Strict Sharpness".
 * @param {Array} headers - List of header strings or objects
 * @param {Array} data - List of data objects
 * @param {function} renderRow - Custom row renderer
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
