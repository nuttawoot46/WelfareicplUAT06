import React, { useState, useEffect, useMemo } from 'react';
import { useLeave } from '@/context/LeaveContext';
import { useAuth } from '@/context/AuthContext';
import { HolidayList } from '@/components/leave/HolidayList';
import { LeaveBalanceList } from '@/components/leave/LeaveBalanceCard';
import { LeaveCalendar } from '@/components/leave/LeaveCalendar';
import { LeaveRequestForm } from '@/components/leave/LeaveRequestForm';
import { LeaveRequest, LeaveBalance } from '@/types';
import { format, parseISO, startOfDay, addDays, isSameDay, isAfter, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { th } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, FileText, User, CalendarDays, ChevronLeft, ChevronRight, Calendar, Gift } from 'lucide-react';
import { toast } from 'sonner';

// Teams list (based on the HTML provided)
const TEAMS = [
  { id: 0, name: 'All' },
  { id: 1, name: 'Delivery' },
  { id: 3, name: 'Distribution' },
  { id: 4, name: 'Operation' },
  { id: 6, name: 'BackOffice' },
  { id: 7, name: 'Corporate and Export' },
  { id: 8, name: 'Product Development' },
  { id: 9, name: 'Public Health' },
  { id: 10, name: 'Marketing Executive' },
  { id: 11, name: 'Foreign Department' },
  { id: 12, name: 'Digital' },
  { id: 13, name: 'Registration' },
  { id: 14, name: 'Accounting & Finance' },
  { id: 15, name: 'IT Engineer' },
  { id: 16, name: 'Domestic' },
  { id: 17, name: 'Warehouse' },
  { id: 18, name: 'Packaging' },
  { id: 19, name: 'Production' },
  { id: 20, name: 'Planning' },
  { id: 21, name: '(Factory)Maintenance' },
  { id: 22, name: '(Factory)Package' },
  { id: 25, name: '(Factory)Q.C.' },
  { id: 27, name: 'Marketing representative' },
  { id: 28, name: 'Strategy' },
  { id: 29, name: 'Management' },
  { id: 36, name: 'Procurement' },
  { id: 1057, name: 'Inspiration' },
  { id: 1071, name: 'Lab' },
  { id: 1072, name: 'Q.C.' },
  { id: 1077, name: 'Admin' },
];

const LOCATIONS = ['All', 'Office', 'Factory'] as const;

export const LeaveCalendarPage: React.FC = () => {
  const {
    leaveTypes,
    holidays,
    leaveBalances,
    leaveRequests,
    currentYear,
    currentMonth,
    selectedLocation,
    selectedTeam,
    isLoading,
    isSubmitting,
    setCurrentYear,
    setCurrentMonth,
    setSelectedLocation,
    setSelectedTeam,
    refreshAll,
    submitLeaveRequest,
    cancelLeaveRequest,
    checkLeaveConflict,
    getCalendarEvents,
  } = useLeave();

  const { profile } = useAuth();

  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showBalanceDetail, setShowBalanceDetail] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<LeaveBalance | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<{
    leaves: LeaveRequest[];
    holidays: typeof holidays;
  }>({ leaves: [], holidays: [] });
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
  const [showMobileBalanceSheet, setShowMobileBalanceSheet] = useState(false);
  const [preselectedDate, setPreselectedDate] = useState<Date | null>(null);
  const [teamTimeOffIndex, setTeamTimeOffIndex] = useState(0);
  const [holidayIndex, setHolidayIndex] = useState(0);

  // Load calendar events
  useEffect(() => {
    const loadEvents = async () => {
      const events = await getCalendarEvents();
      setCalendarEvents(events);
    };
    loadEvents();
  }, [currentYear, currentMonth, selectedTeam, selectedLocation, getCalendarEvents]);

  // Filter pending requests for the current user
  useEffect(() => {
    const employeeId = profile?.employee_id;
    if (employeeId) {
      const pending = leaveRequests.filter(
        (req) =>
          req.employee_id === employeeId &&
          (req.status === 'pending_manager' || req.status === 'pending_hr')
      );
      setPendingRequests(pending);
    }
  }, [leaveRequests, profile]);

  // Calculate total available leaves
  const totalAvailableLeaves = useMemo(() => {
    return leaveBalances.reduce((sum, balance) => sum + (balance.remaining_days || 0), 0);
  }, [leaveBalances]);

  // Get team time off for the week
  const teamTimeOffByDay = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Start from Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: addDays(weekEnd, 7) }); // 2 weeks

    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const leavesOnDay = calendarEvents.leaves.filter(leave => {
        return dateStr >= leave.start_date && dateStr <= leave.end_date &&
               (leave.status === 'completed' || leave.status === 'pending_hr' || leave.status === 'pending_manager');
      });
      return {
        date: day,
        leaves: leavesOnDay
      };
    });
  }, [calendarEvents.leaves]);

  // Get upcoming holidays
  const upcomingHolidays = useMemo(() => {
    const today = new Date();
    return holidays
      .filter(h => isAfter(parseISO(h.date), today) || isSameDay(parseISO(h.date), today))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [holidays]);

  const handleDateChange = (date: Date) => {
    setCurrentYear(date.getFullYear());
    setCurrentMonth(date.getMonth() + 1);
  };

  const handleAddLeaveWithDate = (date: Date) => {
    setPreselectedDate(startOfDay(date));
    setShowLeaveForm(true);
  };

  const handleAddLeave = () => {
    setPreselectedDate(null);
    setShowLeaveForm(true);
  };

  const handleCloseLeaveForm = () => {
    setShowLeaveForm(false);
    setPreselectedDate(null);
  };

  const handleShowBalanceDetail = (balance: LeaveBalance) => {
    setSelectedBalance(balance);
    setShowBalanceDetail(true);
  };

  const handleSubmitLeave = async (formData: any) => {
    const result = await submitLeaveRequest(formData);
    if (result) {
      handleCloseLeaveForm();
      toast.success('Leave request submitted successfully');
    }
  };

  const handleCancelRequest = async (id: number) => {
    const success = await cancelLeaveRequest(id);
    if (success) {
      toast.success('Leave request cancelled');
    }
  };

  const handleCheckConflict = async (startDate: string, endDate: string) => {
    const conflicts = await checkLeaveConflict(startDate, endDate);
    return conflicts.length > 0;
  };

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
      case 'rejected_hr':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';
  };

  // Get color for avatar based on name
  const getAvatarColor = (name: string) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'];
    const index = name?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  // Mobile Balance Sheet Content
  const BalanceSheetContent = () => (
    <div className="space-y-4">
      <LeaveBalanceList
        balances={leaveBalances}
        leaveTypes={leaveTypes}
        employeeName={profile?.display_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || ''}
        employeePosition={profile?.position || ''}
        employeeEmail={profile?.email || ''}
        onShowDetail={handleShowBalanceDetail}
      />

      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader className="bg-yellow-400 rounded-t-lg py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Pending Requests ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-2 max-h-48 overflow-auto">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-2 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-xs">
                      {request.leave_type_name.split(' ')[0]}
                    </span>
                    <Badge className={`${getStatusColor(request.status)} text-xs px-1.5 py-0.5`}>
                      {getStatusLabel(request.status)}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(parseISO(request.start_date), 'dd/MM/yyyy')} -{' '}
                    {format(parseISO(request.end_date), 'dd/MM/yyyy')}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full mt-2 h-7 text-xs"
                    onClick={() => handleCancelRequest(request.id)}
                  >
                    Cancel
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-800">Leaves</h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  {profile?.display_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()} | {profile?.department || '-'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Mobile: Balance Sheet Button */}
              <Sheet open={showMobileBalanceSheet} onOpenChange={setShowMobileBalanceSheet}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden relative">
                    <User className="w-4 h-4" />
                    {pendingRequests.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {pendingRequests.length}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[85vw] sm:w-[350px] overflow-y-auto">
                  <SheetHeader className="mb-4">
                    <SheetTitle>Leave Balance</SheetTitle>
                  </SheetHeader>
                  <BalanceSheetContent />
                </SheetContent>
              </Sheet>

              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshAll()}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>

              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {(profile?.display_name || profile?.first_name || 'U').charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Summary Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Available Leaves Card */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
                    <span className="text-2xl sm:text-3xl font-bold text-green-600">{totalAvailableLeaves.toFixed(0)}</span>
                    <span className="text-[10px] text-green-600 font-medium uppercase">Days</span>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Available</p>
                    <p className="text-gray-800 font-semibold text-lg">Leaves</p>
                  </div>
                </div>
                <Button
                  onClick={handleAddLeave}
                  variant="outline"
                  className="border-green-500 text-green-600 hover:bg-green-50"
                  disabled={holidays.length < 13}
                >
                  Apply
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pending Requests Card */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-xl">
                    <span className="text-2xl sm:text-3xl font-bold text-amber-600">{pendingRequests.length}</span>
                    <span className="text-[10px] text-amber-600 font-medium uppercase">Pending</span>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Pending</p>
                    <p className="text-gray-800 font-semibold text-lg">Requests</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-amber-500 text-amber-600 hover:bg-amber-50"
                  onClick={() => setShowMobileBalanceSheet(true)}
                >
                  View
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Used Days Card */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                    <span className="text-2xl sm:text-3xl font-bold text-blue-600">
                      {leaveBalances.reduce((sum, b) => sum + (b.used_days || 0), 0).toFixed(0)}
                    </span>
                    <span className="text-[10px] text-blue-600 font-medium uppercase">Days</span>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Used</p>
                    <p className="text-gray-800 font-semibold text-lg">This Year</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                  onClick={() => setShowMobileBalanceSheet(true)}
                >
                  Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Section - Team Time Off & Next Holidays */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Team Time Off Card */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {profile?.department || 'Team'} Time Off
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setTeamTimeOffIndex(Math.max(0, teamTimeOffIndex - 4))}
                    disabled={teamTimeOffIndex === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setTeamTimeOffIndex(Math.min(teamTimeOffByDay.length - 4, teamTimeOffIndex + 4))}
                    disabled={teamTimeOffIndex >= teamTimeOffByDay.length - 4}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {teamTimeOffByDay.slice(teamTimeOffIndex, teamTimeOffIndex + 4).map((day, idx) => (
                  <div key={idx} className="text-center">
                    <p className="text-xs text-gray-500 mb-2">
                      {isSameDay(day.date, new Date()) ? 'Today' : format(day.date, 'EEE dd MMM', { locale: th })}
                    </p>
                    <div className="flex flex-wrap justify-center gap-1 min-h-[40px]">
                      {day.leaves.length > 0 ? (
                        day.leaves.slice(0, 4).map((leave, i) => (
                          <div
                            key={i}
                            className={`w-8 h-8 rounded-full ${getAvatarColor(leave.employee_name)} flex items-center justify-center text-white text-xs font-medium`}
                            title={leave.employee_name}
                          >
                            {getInitials(leave.employee_name)}
                          </div>
                        ))
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                          -
                        </div>
                      )}
                      {day.leaves.length > 4 && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium">
                          +{day.leaves.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Next Holidays Card */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  Next Holidays
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setHolidayIndex(Math.max(0, holidayIndex - 1))}
                    disabled={holidayIndex === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setHolidayIndex(Math.min(upcomingHolidays.length - 1, holidayIndex + 1))}
                    disabled={holidayIndex >= upcomingHolidays.length - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {upcomingHolidays.length > 0 ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-red-100 to-pink-100 rounded-xl flex items-center justify-center mb-3">
                    <Gift className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-lg">
                    {upcomingHolidays[holidayIndex]?.name_th}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {upcomingHolidays[holidayIndex]?.name_en}
                  </p>
                  <p className="text-indigo-600 font-medium mt-2">
                    {format(parseISO(upcomingHolidays[holidayIndex]?.date), 'd MMM yyyy')} - {format(parseISO(upcomingHolidays[holidayIndex]?.date), 'EEE')}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No upcoming holidays
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 p-3 bg-white rounded-xl shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-medium text-gray-600">Location:</span>
            <Select
              value={selectedLocation}
              onValueChange={(value) => setSelectedLocation(value as typeof selectedLocation)}
            >
              <SelectTrigger className="w-24 sm:w-28 h-8 sm:h-9 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((loc) => (
                  <SelectItem key={loc} value={loc} className="text-xs sm:text-sm">
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-xs sm:text-sm font-medium text-gray-600">Dept:</span>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-full sm:w-40 lg:w-48 h-8 sm:h-9 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEAMS.map((team) => (
                  <SelectItem key={team.id} value={team.name} className="text-xs sm:text-sm">
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Grid - Calendar & Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Left Sidebar - Desktop Only */}
          <div className="hidden lg:block lg:col-span-3 xl:col-span-3 space-y-4">
            <LeaveBalanceList
              balances={leaveBalances}
              leaveTypes={leaveTypes}
              employeeName={profile?.display_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || ''}
              employeePosition={profile?.position || ''}
              employeeEmail={profile?.email || ''}
              onShowDetail={handleShowBalanceDetail}
            />

            {/* Pending Requests - Desktop */}
            {pendingRequests.length > 0 && (
              <Card className="border-0 shadow-md">
                <CardHeader className="bg-gradient-to-r from-amber-400 to-yellow-400 rounded-t-lg py-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-white">
                    <FileText className="w-4 h-4" />
                    Pending Requests ({pendingRequests.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {pendingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="p-2 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">
                            {request.leave_type_name.split(' ')[0]}
                          </span>
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusLabel(request.status)}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(parseISO(request.start_date), 'dd/MM/yyyy')} -{' '}
                          {format(parseISO(request.end_date), 'dd/MM/yyyy')}
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full mt-2 h-7 text-xs"
                          onClick={() => handleCancelRequest(request.id)}
                        >
                          Cancel Request
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Content - Calendar */}
          <div className="lg:col-span-9 xl:col-span-9">
            <LeaveCalendar
              leaves={calendarEvents.leaves}
              holidays={calendarEvents.holidays}
              currentDate={new Date(currentYear, currentMonth - 1)}
              onDateChange={handleDateChange}
              onAddLeave={handleAddLeave}
              onAddLeaveWithDate={handleAddLeaveWithDate}
              showAddButton={holidays.length >= 13}
            />

            {holidays.length < 13 && (
              <div className="mt-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                <p className="text-red-600 font-medium text-sm sm:text-base">
                  **ไม่สามารถทำการลาได้
                  <br />
                  กรุณาติดต่อ HR**
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Holiday List */}
        <div className="mt-6">
          <HolidayList holidays={holidays} year={currentYear} />
        </div>
      </div>

      {/* Leave Request Form Dialog */}
      <Dialog open={showLeaveForm} onOpenChange={handleCloseLeaveForm}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Submit Leave Request
              {preselectedDate && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  - {format(preselectedDate, 'dd MMMM yyyy')}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <LeaveRequestForm
            leaveTypes={leaveTypes}
            leaveBalances={leaveBalances}
            onSubmit={handleSubmitLeave}
            onCancel={handleCloseLeaveForm}
            isSubmitting={isSubmitting}
            checkConflict={handleCheckConflict}
            defaultStartDate={preselectedDate || undefined}
            defaultEndDate={preselectedDate || undefined}
          />
        </DialogContent>
      </Dialog>

      {/* Balance Detail Dialog */}
      <Dialog open={showBalanceDetail} onOpenChange={setShowBalanceDetail}>
        <DialogContent className="w-[95vw] max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {selectedBalance?.leave_type?.name_en} Balance Detail
            </DialogTitle>
          </DialogHeader>
          {selectedBalance && (
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div className="text-xs sm:text-sm text-gray-500">Total Days</div>
                  <div className="text-xl sm:text-2xl font-bold">
                    {selectedBalance.total_days}
                  </div>
                </div>
                <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div className="text-xs sm:text-sm text-gray-500">Used Days</div>
                  <div className="text-xl sm:text-2xl font-bold text-orange-600">
                    {selectedBalance.used_days}
                  </div>
                </div>
                <div className="p-3 sm:p-4 bg-green-50 rounded-lg">
                  <div className="text-xs sm:text-sm text-gray-500">Remaining</div>
                  <div className="text-xl sm:text-2xl font-bold text-green-600">
                    {selectedBalance.remaining_days}
                  </div>
                </div>
                <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                  <div className="text-xs sm:text-sm text-gray-500">Carry Over</div>
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">
                    {selectedBalance.carry_over_days}
                  </div>
                </div>
              </div>

              {selectedBalance.carry_over_expiry && (
                <div className="p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <span className="text-yellow-800 text-xs sm:text-sm">
                    Carry over expires on:{' '}
                    {format(parseISO(selectedBalance.carry_over_expiry), 'dd/MM/yyyy')}
                  </span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaveCalendarPage;
