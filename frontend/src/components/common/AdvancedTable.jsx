"use client";

import React, { useState } from 'react';
import { NavArrowLeft, NavArrowRight, SortDown, SortUp } from 'iconoir-react';
import Button from './Button';
import { Caption } from './Typography';
import { useI18n } from '../../hooks/useI18n';

/**
 * Advanced Table with Pagination and Sorting capability.
 * Strictly sharp, professional layout.
 */
const AdvancedTable = ({ 
  headers = [],
  data = [], 
  pageSize = 5,
  className = "",
  selectedIds = [],
  onSelectionChange = null,
  rowIdKey = "id"
}) => {
  const { t } = useI18n();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState(null);

  const totalPages = Math.ceil(data.length / pageSize);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    let sortableData = [...data];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSelectAll = (e) => {
    if (!onSelectionChange) return;
    if (e.target.checked) {
      onSelectionChange(paginatedData.map(item => item[rowIdKey]));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectRow = (id) => {
    if (!onSelectionChange) return;
    const newSelection = selectedIds.includes(id)
      ? selectedIds.filter(item => item !== id)
      : [...selectedIds, id];
    onSelectionChange(newSelection);
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="overflow-x-auto border-2 border-slate-100">
        <table className="w-full text-left border-collapse bg-white">
          <thead className="bg-slate-50 border-b-2 border-slate-100">
            <tr>
              {onSelectionChange && (
                <th className="px-6 py-4 w-10">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    onChange={handleSelectAll}
                    checked={paginatedData.length > 0 && paginatedData.every(item => selectedIds.includes(item[rowIdKey]))}
                  />
                </th>
              )}
              {headers.map((header) => (
                <th 
                  key={header.key}
                  onClick={() => header.sortable && requestSort(header.key)}
                  className={`
                    px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500
                    ${header.sortable ? 'cursor-pointer hover:text-secondary-900 select-none' : ''}
                  `}
                >
                  <div className="flex items-center gap-2">
                    {header.label}
                    {header.sortable && sortConfig?.key === header.key && (
                      sortConfig.direction === 'ascending' ? <SortUp className="w-3.5 h-3.5" /> : <SortDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr 
                key={idx} 
                className={`
                  border-b border-slate-50 hover:bg-slate-50/50 transition-colors
                  ${selectedIds.includes(row[rowIdKey]) ? '!bg-primary-50/50' : ''}
                `}
              >
                {onSelectionChange && (
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                      checked={selectedIds.includes(row[rowIdKey])}
                      onChange={() => handleSelectRow(row[rowIdKey])}
                    />
                  </td>
                )}
                {headers.map((header) => (
                  <td key={header.key} className="px-6 py-4 text-sm text-secondary-900 font-medium">
                    {header.render ? header.render(row[header.key], row) : row[header.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <Caption className="font-bold">
            {t('common.pagination.showing', {
              from: ((currentPage - 1) * pageSize) + 1,
              to: Math.min(currentPage * pageSize, data.length),
              total: data.length
            })}
          </Caption>
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              className="p-2 min-w-0" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              <NavArrowLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={currentPage === page ? 'primary' : 'outline'}
                className="px-3 min-w-0"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button 
              variant="outline" 
              className="p-2 min-w-0" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              <NavArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedTable;
