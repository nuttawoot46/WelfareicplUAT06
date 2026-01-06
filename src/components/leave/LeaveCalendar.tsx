import React, { useState, useMemo } from 'react';
import { LeaveRequest, Holiday } from '@/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWeekend, addMonths, subMonths, parseISO, isBefore, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, List, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LeaveCalendarProps {
  leaves: LeaveRequest[];
  holidays: Holiday[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onAddLeave?: () => void;
  onAddLeaveWithDate?: (date: Date) => void;
  showAddButton?: boolean;
}

interface DayEvents {
  leaves: LeaveRequest[];
  holidays: Holiday[];
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const LeaveCalendar: React.FC<LeaveCalendarProps> = ({
  leaves,
  holidays,
  currentDate,
  onDateChange,
  onAddLeave,
  onAddLeaveWithDate,
  showAddButton = true,
}) => {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'list'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<DayEvents | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [clickedDate, setClickedDate] = useState<Date | null>(null);

  // Calculate days in the current month view
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);

    // Get the first day of the month
    const firstDayOfMonth = start.getDay();

    // Get days from previous month to fill the first week
    const prevMonthEnd = new Date(start);
    prevMonthEnd.setDate(0);

    const days: Date[] = [];

    // Add previous month days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = new Date(prevMonthEnd);
      day.setDate(prevMonthEnd.getDate() - i);
      days.push(day);
    }

    // Add current month days
    const daysInMonth = eachDayOfInterval({ start, end });
    days.push(...daysInMonth);

    // Add next month days to complete the grid (6 rows * 7 days = 42)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const day = new Date(end);
      day.setDate(end.getDate() + i);
      days.push(day);
    }

    return days;
  }, [currentDate]);

  // Get events for a specific day
  const getDayEvents = (date: Date): DayEvents => {
    const dateStr = format(date, 'yyyy-MM-dd');

    const dayLeaves = leaves.filter((leave) => {
      const startDate = leave.start_date;
      const endDate = leave.end_date;
      return dateStr >= startDate && dateStr <= endDate;
    });

    const dayHolidays = holidays.filter(
      (holiday) => holiday.date === dateStr
    );

    return { leaves: dayLeaves, holidays: dayHolidays };
  };

  // Check if date is in the past
  const isPastDate = (date: Date): boolean => {
    return isBefore(startOfDay(date), startOfDay(new Date()));
  };

  // Handle day click
  const handleDayClick = (date: Date) => {
    const events = getDayEvents(date);
    const hasEvents = events.leaves.length > 0 || events.holidays.length > 0;
    const canAddLeave = !!onAddLeaveWithDate;

    if (hasEvents && canAddLeave) {
      // Show action dialog to choose between viewing events or adding leave
      setClickedDate(date);
      setSelectedEvents(events);
      setShowActionDialog(true);
    } else if (hasEvents) {
      // Only show events dialog
      setSelectedDate(date);
      setSelectedEvents(events);
      setShowEventDialog(true);
    } else if (canAddLeave) {
      // Directly open add leave form with the selected date
      onAddLeaveWithDate(date);
    }
  };

  // Handle view events action
  const handleViewEvents = () => {
    setShowActionDialog(false);
    if (clickedDate && selectedEvents) {
      setSelectedDate(clickedDate);
      setShowEventDialog(true);
    }
  };

  // Handle add leave action
  const handleAddLeaveAction = () => {
    setShowActionDialog(false);
    if (clickedDate && onAddLeaveWithDate) {
      onAddLeaveWithDate(clickedDate);
    }
  };

  // Navigate months
  const goToPreviousMonth = () => {
    onDateChange(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    onDateChange(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending_manager':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending_hr':
        return 'bg-blue-100 text-blue-800';
      case 'rejected_manager':
      case 'rejected_hr':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'Approved';
      case 'pending_manager':
        return 'Pending Manager';
      case 'pending_hr':
        return 'Pending HR';
      case 'rejected_manager':
        return 'Rejected by Manager';
      case 'rejected_hr':
        return 'Rejected by HR';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <div className="m-portlet bg-white rounded-lg shadow">
      {/* Calendar Header */}
      <div className="m-portlet__head border-b border-gray-200 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="m-portlet__head-title flex items-center gap-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-800 text-sm sm:text-base">I C P Calendar</h3>
          </div>

          {showAddButton && onAddLeave && (
            <Button
              onClick={onAddLeave}
              className="bg-purple-500 hover:bg-purple-600 text-white"
              size="sm"
            >
              <span className="flex items-center gap-1 sm:gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Leave Day</span>
                <span className="sm:hidden">Add</span>
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Calendar Body */}
      <div className="m-portlet__body p-2 sm:p-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
          {/* Navigation Buttons */}
          <div className="flex items-center gap-1 sm:gap-2 order-2 sm:order-1">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              disabled={isSameMonth(currentDate, new Date())}
              className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
            >
              today
            </Button>
          </div>

          {/* Month/Year Title */}
          <h2 className="text-base sm:text-xl font-semibold text-gray-800 order-1 sm:order-2">
            {format(currentDate, 'MMMM yyyy')}
          </h2>

          {/* View Mode Buttons */}
          <div className="flex items-center gap-0.5 sm:gap-1 order-3">
            <Button
              variant={viewMode === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('month')}
              className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
            >
              <span className="hidden sm:inline">month</span>
              <span className="sm:hidden">M</span>
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
              className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm hidden md:inline-flex"
            >
              week
            </Button>
            <Button
              variant={viewMode === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('day')}
              className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm hidden md:inline-flex"
            >
              day
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 w-8 p-0 sm:h-9 sm:w-9"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        {viewMode === 'month' && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 bg-gray-50">
              {WEEKDAYS.map((day, index) => (
                <div
                  key={day}
                  className={cn(
                    'p-1 sm:p-2 text-center text-xs sm:text-sm font-medium border-b border-gray-200',
                    index === 0 && 'text-red-500',
                    index === 6 && 'text-blue-500'
                  )}
                >
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{WEEKDAYS_SHORT[index]}</span>
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                const events = getDayEvents(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, new Date());
                const isWeekendDay = isWeekend(day);
                const hasEvents = events.leaves.length > 0 || events.holidays.length > 0;
                const isHoliday = events.holidays.length > 0;
                const canClick = hasEvents || !!onAddLeaveWithDate;

                return (
                  <div
                    key={index}
                    className={cn(
                      'min-h-[50px] sm:min-h-[70px] md:min-h-[80px] p-0.5 sm:p-1 border-b border-r border-gray-200 transition-colors',
                      !isCurrentMonth && 'bg-gray-100 text-gray-400',
                      isToday && 'bg-blue-50',
                      isHoliday && 'bg-red-50',
                      index % 7 === 6 && 'border-r-0',
                      canClick && 'cursor-pointer hover:bg-gray-50',
                      !canClick && 'cursor-default'
                    )}
                    onClick={() => canClick && handleDayClick(day)}
                  >
                    <div
                      className={cn(
                        'text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 flex items-center justify-between',
                        isWeekendDay && isCurrentMonth && 'text-red-500',
                        isToday && 'text-blue-600 font-bold'
                      )}
                    >
                      <span>{format(day, 'd')}</span>
                      {/* Show + icon on hover for dates that can add leave */}
                      {onAddLeaveWithDate && isCurrentMonth && (
                        <span className="hidden group-hover:inline-flex sm:opacity-0 sm:hover:opacity-100 text-purple-500">
                          <Plus className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    {/* Events Preview - Desktop */}
                    <div className="hidden sm:block space-y-0.5 overflow-hidden">
                      {events.holidays.slice(0, 1).map((holiday) => (
                        <div
                          key={`holiday-${holiday.id}`}
                          className="text-xs px-1 py-0.5 rounded truncate bg-red-500 text-white"
                        >
                          {holiday.name_th}
                        </div>
                      ))}

                      {events.leaves.slice(0, 2).map((leave) => (
                        <div
                          key={`leave-${leave.id}`}
                          className="text-xs px-1 py-0.5 rounded truncate"
                          style={{
                            backgroundColor: leave.leave_type?.color || '#add8e6',
                            color: 'white',
                          }}
                        >
                          {leave.employee_name} {leave.leave_type_name.split(' ')[0]}
                        </div>
                      ))}

                      {events.leaves.length > 2 && (
                        <div className="text-xs text-blue-500 font-medium">
                          +{events.leaves.length - 2} more
                        </div>
                      )}
                    </div>

                    {/* Events Preview - Mobile (dots only) */}
                    <div className="sm:hidden flex flex-wrap gap-0.5 justify-center">
                      {events.holidays.length > 0 && (
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                      )}
                      {events.leaves.slice(0, 3).map((leave, idx) => (
                        <div
                          key={`leave-dot-${idx}`}
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: leave.leave_type?.color || '#add8e6',
                          }}
                        />
                      ))}
                      {events.leaves.length > 3 && (
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-2">
            {leaves.length === 0 ? (
              <div className="text-center text-gray-500 py-8 text-sm sm:text-base">
                No leave requests for this month
              </div>
            ) : (
              leaves.map((leave) => (
                <div
                  key={leave.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 border border-gray-200 rounded-lg hover:bg-gray-50 gap-2"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div
                      className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: leave.leave_type?.color || '#add8e6' }}
                    />
                    <div className="min-w-0">
                      <div className="font-medium text-sm sm:text-base truncate">{leave.employee_name}</div>
                      <div className="text-xs sm:text-sm text-gray-500 truncate">
                        {leave.leave_type_name}
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1 ml-4 sm:ml-0">
                    <div className="text-xs sm:text-sm whitespace-nowrap">
                      {format(parseISO(leave.start_date), 'dd/MM/yy')} -{' '}
                      {format(parseISO(leave.end_date), 'dd/MM/yy')}
                    </div>
                    <Badge className={cn(getStatusColor(leave.status), 'text-xs whitespace-nowrap')}>
                      {getStatusLabel(leave.status)}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Action Choice Dialog - When clicking on a date with events */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="max-w-[90vw] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {clickedDate && format(clickedDate, 'EEEE, d MMMM yyyy')}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 text-center text-sm text-gray-600">
            เลือกการดำเนินการ
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleViewEvents}
              className="w-full sm:w-auto"
            >
              ดูรายการ ({(selectedEvents?.leaves.length || 0) + (selectedEvents?.holidays.length || 0)})
            </Button>
            <Button
              onClick={handleAddLeaveAction}
              className="w-full sm:w-auto bg-purple-500 hover:bg-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              ขอลาวันนี้
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Detail Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg flex items-center justify-between">
              <span>{selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
              {onAddLeaveWithDate && selectedDate && (
                <Button
                  size="sm"
                  onClick={() => {
                    setShowEventDialog(false);
                    onAddLeaveWithDate(selectedDate);
                  }}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Add Leave</span>
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4">
            {/* Holidays */}
            {selectedEvents?.holidays.map((holiday) => (
              <div
                key={holiday.id}
                className="p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="font-medium text-red-800 text-sm sm:text-base">
                  {holiday.name_en}
                </div>
                <div className="text-xs sm:text-sm text-red-600">{holiday.name_th}</div>
              </div>
            ))}

            {/* Leave Requests */}
            {selectedEvents?.leaves.map((leave) => (
              <div
                key={leave.id}
                className="p-2 sm:p-3 border border-gray-200 rounded-lg"
                style={{ borderLeftColor: leave.leave_type?.color || '#add8e6', borderLeftWidth: 4 }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1 sm:gap-2">
                  <div className="font-medium text-sm sm:text-base">{leave.employee_name}</div>
                  <Badge className={cn(getStatusColor(leave.status), 'text-xs w-fit')}>
                    {getStatusLabel(leave.status)}
                  </Badge>
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  <div>{leave.leave_type_name}</div>
                  <div className="text-gray-500">
                    {format(parseISO(leave.start_date), 'HH:mm')} -{' '}
                    {format(parseISO(leave.end_date), 'HH:mm')}
                  </div>
                  {leave.reason && (
                    <div className="mt-2 text-gray-700">
                      <span className="font-medium">Reason:</span> {leave.reason}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {selectedEvents?.holidays.length === 0 &&
              selectedEvents?.leaves.length === 0 && (
                <div className="text-center text-gray-500 py-4 text-sm">
                  No events for this day
                </div>
              )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaveCalendar;
