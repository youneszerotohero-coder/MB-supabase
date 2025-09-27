import { useState } from 'react';
import { Calendar, X } from 'lucide-react';

export default function DateRangePicker({ onDateChange, fromDate, toDate }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDateChange = (type, value) => {
    const newDate = value ? new Date(value).toISOString().split('T')[0] : null;
    onDateChange(type, newDate);
  };

  const clearDates = () => {
    onDateChange('fromDate', null);
    onDateChange('toDate', null);
    setIsOpen(false);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 border border-border rounded-md hover:bg-muted/50 transition-colors"
      >
        <Calendar className="h-4 w-4" />
        <span className="text-sm">
          {fromDate && toDate 
            ? `${formatDate(fromDate)} - ${formatDate(toDate)}`
            : fromDate 
            ? `From ${formatDate(fromDate)}`
            : 'Select date range'
          }
        </span>
        {fromDate && (
          <X 
            className="h-4 w-4 hover:text-destructive" 
            onClick={(e) => {
              e.stopPropagation();
              clearDates();
            }}
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-background border border-border rounded-md shadow-lg z-50 p-4 min-w-80">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                From Date
              </label>
              <input
                type="date"
                value={fromDate || ''}
                onChange={(e) => handleDateChange('fromDate', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                To Date
              </label>
              <input
                type="date"
                value={toDate || ''}
                onChange={(e) => handleDateChange('toDate', e.target.value)}
                min={fromDate || ''}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex justify-between">
              <button
                onClick={clearDates}
                className="px-3 py-1 text-sm text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

