"use client";

import React from 'react';
import { H2, Caption, Text } from '../common/Typography';
import { MoreHoriz, Plus } from 'iconoir-react';

/**
 * Enterprise Kanban Board for project management.
 * Strictly sharp, professional layout.
 */
const KanbanBoard = ({ columns = [], className = "" }) => {
  return (
    <div className={`flex gap-6 overflow-x-auto pb-4 ${className}`}>
      {columns.map((column, colIdx) => (
        <div key={colIdx} className="flex-shrink-0 w-80 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <H2 className="text-sm font-bold uppercase tracking-widest !mb-0">{column.title}</H2>
              <div className="bg-slate-100 text-[10px] font-bold px-1.5 py-0.5 border border-slate-200">
                {column.tasks?.length || 0}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1 hover:bg-slate-100 text-slate-400">
                <Plus className="w-4 h-4" />
              </button>
              <button className="p-1 hover:bg-slate-100 text-slate-400">
                <MoreHoriz className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 min-h-[200px] p-2 bg-slate-50/50 border border-slate-100">
            {column.tasks?.map((task, taskIdx) => (
              <div 
                key={taskIdx} 
                className="p-4 bg-white border border-slate-200 hover:border-primary-500 hover:shadow-md transition-all cursor-grab active:cursor-grabbing group"
                style={{ borderRadius: '0px' }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className={`w-12 h-1 ${task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-amber-500' : 'bg-green-500'}`} />
                  <Caption className="!text-[9px] uppercase font-bold text-slate-400">{task.id}</Caption>
                </div>
                <Text className="text-sm font-bold mb-3 group-hover:text-primary-600 transition-colors line-clamp-2">
                  {task.title}
                </Text>
                <div className="flex items-center justify-between">
                  <Caption className="text-[10px] font-bold text-slate-500">{task.date}</Caption>
                  <div className="w-6 h-6 bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold">
                    {task.assignee?.charAt(0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;
