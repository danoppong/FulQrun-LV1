// src/components/dashboard/controls/DateRangePicker.tsx
// Date Range Picker Component for custom date selection
// Provides a more advanced calendar interface for precise date selection

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';

interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
  onCancel?: () => void;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

interface CalendarDate {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isInRange: boolean;
  isStart: boolean;
  isEnd: boolean;
  isDisabled: boolean;
}

export function DateRangePicker({
  startDate,
  endDate,
  onDateRangeChange,
  onCancel,
  minDate = new Date(2020, 0, 1),
  maxDate = new Date(),
  className = ''
}: DateRangePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(startDate || new Date());
  const [tempStartDate, setTempStartDate] = useState<Date | null>(startDate || null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(endDate || null);
  const [isSelectingEnd, setIsSelectingEnd] = useState(false);

  // Generate calendar dates for the current month
  const calendarDates = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get first day of month and calculate calendar start
    const firstDay = new Date(year, month, 1);
    const startOfCalendar = new Date(firstDay);
    startOfCalendar.setDate(startOfCalendar.getDate() - firstDay.getDay());
    
    // Generate 42 days (6 weeks) for the calendar grid
    const dates: CalendarDate[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startOfCalendar);
      date.setDate(startOfCalendar.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.getTime() === today.getTime();
      const isDisabled = date < minDate || date > maxDate;
      
      let isSelected = false;
      let isInRange = false;
      let isStart = false;
      let isEnd = false;

      if (tempStartDate) {
        isStart = date.getTime() === tempStartDate.getTime();
        isSelected = isStart;
      }

      if (tempEndDate) {
        isEnd = date.getTime() === tempEndDate.getTime();
        isSelected = isSelected || isEnd;
      }

      if (tempStartDate && tempEndDate) {
        isInRange = date > tempStartDate && date < tempEndDate;
      }

      dates.push({
        date,
        isCurrentMonth,
        isToday,
        isSelected,
        isInRange,
        isStart,
        isEnd,
        isDisabled
      });
    }

    return dates;
  }, [currentMonth, tempStartDate, tempEndDate, minDate, maxDate]);

  const handleDateClick = useCallback((date: Date) => {
    if (date < minDate || date > maxDate) return;

    if (!tempStartDate || (tempStartDate && tempEndDate && !isSelectingEnd)) {
      // Start new selection
      setTempStartDate(date);
      setTempEndDate(null);
      setIsSelectingEnd(true);
    } else if (tempStartDate && !tempEndDate) {
      // Select end date
      if (date >= tempStartDate) {
        setTempEndDate(date);
        setIsSelectingEnd(false);
      } else {
        // If selected date is before start, make it the new start
        setTempStartDate(date);
        setTempEndDate(null);
      }
    }
  }, [tempStartDate, tempEndDate, isSelectingEnd, minDate, maxDate]);

  const handleApply = useCallback(() => {
    if (tempStartDate && tempEndDate) {
      onDateRangeChange(tempStartDate, tempEndDate);
    }
  }, [tempStartDate, tempEndDate, onDateRangeChange]);

  const handleCancel = useCallback(() => {
    setTempStartDate(startDate || null);
    setTempEndDate(endDate || null);
    setIsSelectingEnd(false);
    if (onCancel) {
      onCancel();
    }
  }, [startDate, endDate, onCancel]);

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  }, []);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Select Date Range</h3>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-600">
            {tempStartDate ? tempStartDate.toLocaleDateString() : 'Start'} - {' '}
            {tempEndDate ? tempEndDate.toLocaleDateString() : 'End'}
          </div>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600" />
        </button>
        
        <h4 className="text-lg font-medium text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h4>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowRight className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="mb-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDates.map((calendarDate, index) => {
            const { date, isCurrentMonth, isToday, isSelected, isInRange, isStart, isEnd, isDisabled } = calendarDate;
            
            let cellClasses = 'p-2 text-center text-sm cursor-pointer transition-colors ';
            
            if (isDisabled) {
              cellClasses += 'text-gray-300 cursor-not-allowed ';
            } else if (!isCurrentMonth) {
              cellClasses += 'text-gray-400 hover:bg-gray-100 ';
            } else {
              cellClasses += 'text-gray-900 hover:bg-gray-100 ';
            }

            if (isSelected) {
              if (isStart && isEnd) {
                cellClasses += 'bg-blue-600 text-white rounded-lg ';
              } else if (isStart) {
                cellClasses += 'bg-blue-600 text-white rounded-l-lg ';
              } else if (isEnd) {
                cellClasses += 'bg-blue-600 text-white rounded-r-lg ';
              } else {
                cellClasses += 'bg-blue-600 text-white ';
              }
            } else if (isInRange) {
              cellClasses += 'bg-blue-100 text-blue-900 ';
            }

            if (isToday && !isSelected) {
              cellClasses += 'font-bold ring-2 ring-blue-400 ';
            }

            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                disabled={isDisabled}
                className={cellClasses}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Message */}
      <div className="mb-4 text-sm text-gray-600">
        {!tempStartDate && 'Click a date to start selecting your range'}
        {tempStartDate && !tempEndDate && 'Click another date to complete your range'}
        {tempStartDate && tempEndDate && 
          `Selected: ${tempStartDate.toLocaleDateString()} - ${tempEndDate.toLocaleDateString()}`
        }
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <button
          onClick={handleCancel}
          className="flex items-center space-x-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <X className="h-4 w-4" />
          <span>Cancel</span>
        </button>
        
        <button
          onClick={handleApply}
          disabled={!tempStartDate || !tempEndDate}
          className="flex items-center space-x-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <Check className="h-4 w-4" />
          <span>Apply</span>
        </button>
      </div>
    </div>
  );
}