/**
 * Monday.com Board Selector Component
 * Allows users to select and view Monday.com boards
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, FolderIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface MondayBoard {
  id: string;
  name: string;
  description?: string;
  state: string;
  board_kind: string;
  items_count?: number;
  columns?: Array<{
    id: string;
    title: string;
    type: string;
  }>;
}

interface MondayBoardSelectorProps {
  onBoardSelect: (board: MondayBoard) => void;
  selectedBoardId?: string;
}

export function MondayBoardSelector({ onBoardSelect, selectedBoardId }: MondayBoardSelectorProps) {
  const [boards, setBoards] = useState<MondayBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/integrations/monday/boards');
      
      if (!response.ok) {
        throw new Error('Failed to fetch boards');
      }

      const data = await response.json();
      setBoards(data.boards || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const selectedBoard = boards.find(b => b.id === selectedBoardId);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-sm p-3 bg-red-50 rounded-md">
        Error loading boards: {error}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      >
        <span className="flex items-center">
          <FolderIcon className="h-5 w-5 text-gray-400 mr-2" />
          <span className="block truncate">
            {selectedBoard ? selectedBoard.name : 'Select a board...'}
          </span>
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {boards.length === 0 ? (
            <div className="px-3 py-2 text-gray-500 text-sm">
              No boards found
            </div>
          ) : (
            boards.map((board) => (
              <button
                key={board.id}
                onClick={() => {
                  onBoardSelect(board);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center justify-between ${
                  board.id === selectedBoardId ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{board.name}</div>
                  {board.description && (
                    <div className="text-xs text-gray-500 truncate">{board.description}</div>
                  )}
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      board.state === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {board.state}
                    </span>
                    <span className="text-xs text-gray-500">
                      {board.items_count || 0} items
                    </span>
                  </div>
                </div>
                {board.id === selectedBoardId && (
                  <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                )}
              </button>
            ))
          )}
        </div>
      )}

      {selectedBoard && selectedBoard.columns && (
        <div className="mt-2 text-xs text-gray-500">
          <div className="font-medium mb-1">Columns:</div>
          <div className="flex flex-wrap gap-1">
            {selectedBoard.columns.map((col) => (
              <span
                key={col.id}
                className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700"
              >
                {col.title}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
