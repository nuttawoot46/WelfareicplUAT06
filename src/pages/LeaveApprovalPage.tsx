import React, { useState, useCallback } from 'react';
import { useLeave } from '@/context/LeaveContext';
import { useAuth } from '@/context/AuthContext';
import { LeaveRequest } from '@/types';
import { format, parseISO } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DigitalSignature } from '@/components/signature/DigitalSignature';
import {
  Check,
  X,
  Eye,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export const LeaveApprovalPage: React.FC = () => {
  const {
    leaveRequests,
    leaveTypes,
    isLoading,
    refreshLeaveRequests,
    approveLeaveRequest,
    rejectLeaveRequest,
    getPendingManagerRequests,
    getPendingHRRequests,
  } = useLeave();

  const { profile } = useAuth();

  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [signature, setSignature] = useState<string>('');
  const [comment, setComment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const userRole = (profile as any)?.Role;
  const isManager = userRole === 'manager' || userRole === 'admin' || userRole === 'superadmin';
  const isHR = userRole === 'hr' || userRole === 'admin' || userRole === 'superadmin';

  // Get pending requests based on role
  const pendingManagerRequests = getPendingManagerRequests();
  const pendingHRRequests = getPendingHRRequests();

  // Filter requests
  const filterRequests = useCallback(
    (requests: LeaveRequest[]) => {
      return requests.filter((request) => {
        // Search filter
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          const matchesSearch =
            request.employee_name?.toLowerCase().includes(searchLower) ||
            request.leave_type_name?.toLowerCase().includes(searchLower) ||
            request.reason?.toLowerCase().includes(searchLower);
          if (!matchesSearch) return false;
        }

        // Status filter
        if (statusFilter !== 'all' && request.status !== statusFilter) {
          return false;
        }

        // Leave type filter
        if (leaveTypeFilter !== 'all' && request.leave_type_id.toString() !== leaveTypeFilter) {
          return false;
        }

        return true;
      });
    },
    [searchQuery, statusFilter, leaveTypeFilter]
  );

  const filteredPendingManager = filterRequests(pendingManagerRequests);
  const filteredPendingHR = filterRequests(pendingHRRequests);
  const filteredAll = filterRequests(leaveRequests);

  const getStatusBadge = (status: string, compact = false) => {
    const statusConfig: Record<string, { color: string; label: string; shortLabel: string; icon: React.ReactNode }> = {
      pending_manager: {
        color: 'bg-yellow-100 text-yellow-800',
        label: 'Pending Manager',
        shortLabel: 'Pending',
        icon: <Clock className="w-3 h-3" />,
      },
      pending_hr: {
        color: 'bg-blue-100 text-blue-800',
        label: 'Pending HR',
        shortLabel: 'HR',
        icon: <Clock className="w-3 h-3" />,
      },
      completed: {
        color: 'bg-green-100 text-green-800',
        label: 'Approved',
        shortLabel: 'OK',
        icon: <CheckCircle className="w-3 h-3" />,
      },
      rejected_manager: {
        color: 'bg-red-100 text-red-800',
        label: 'Rejected by Manager',
        shortLabel: 'Rejected',
        icon: <XCircle className="w-3 h-3" />,
      },
      rejected_hr: {
        color: 'bg-red-100 text-red-800',
        label: 'Rejected by HR',
        shortLabel: 'Rejected',
        icon: <XCircle className="w-3 h-3" />,
      },
      cancelled: {
        color: 'bg-gray-100 text-gray-800',
        label: 'Cancelled',
        shortLabel: 'Cancel',
        icon: <XCircle className="w-3 h-3" />,
      },
    };

    const config = statusConfig[status] || {
      color: 'bg-gray-100 text-gray-800',
      label: status,
      shortLabel: status,
      icon: null,
    };

    return (
      <Badge className={`${config.color} flex items-center gap-1 text-xs`}>
        {config.icon}
        <span className={compact ? 'hidden sm:inline' : ''}>{compact ? config.shortLabel : config.label}</span>
        {compact && <span className="sm:hidden">{config.shortLabel}</span>}
      </Badge>
    );
  };

  const handleViewDetail = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setShowDetailDialog(true);
  };

  const handleApproveClick = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setSignature('');
    setComment('');
    setShowApproveDialog(true);
  };

  const handleRejectClick = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setComment('');
    setShowRejectDialog(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    if (!signature) {
      toast.error('Please provide your signature');
      return;
    }

    setIsProcessing(true);
    try {
      const success = await approveLeaveRequest(selectedRequest.id, signature, comment);
      if (success) {
        setShowApproveDialog(false);
        setSelectedRequest(null);
        toast.success('Leave request approved successfully');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    if (!comment.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setIsProcessing(true);
    try {
      const success = await rejectLeaveRequest(selectedRequest.id, comment);
      if (success) {
        setShowRejectDialog(false);
        setSelectedRequest(null);
        toast.success('Leave request rejected');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Mobile Card View Component
  const RequestCard: React.FC<{ request: LeaveRequest; showActions?: boolean }> = ({
    request,
    showActions = true,
  }) => (
    <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm truncate">{request.employee_name}</div>
          <div className="text-xs text-gray-500 truncate">{request.employee_team}</div>
        </div>
        {getStatusBadge(request.status, true)}
      </div>

      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: request.leave_type?.color || '#add8e6' }}
        />
        <span className="text-xs text-gray-600 truncate">
          {request.leave_type_name.split('(')[0].trim()}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="text-gray-600">
          {format(parseISO(request.start_date), 'dd/MM/yy')}
          {request.start_date !== request.end_date && (
            <> - {format(parseISO(request.end_date), 'dd/MM/yy')}</>
          )}
          <span className="ml-1 font-medium">({request.total_days}d)</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1 pt-1 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleViewDetail(request)}
          className="h-7 px-2"
        >
          <Eye className="w-3.5 h-3.5" />
        </Button>
        {showActions &&
          (request.status === 'pending_manager' || request.status === 'pending_hr') && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-green-600 hover:text-green-700 hover:bg-green-50 h-7 px-2"
                onClick={() => handleApproveClick(request)}
              >
                <Check className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                onClick={() => handleRejectClick(request)}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
      </div>
    </div>
  );

  // Desktop Table View Component
  const RequestsTable: React.FC<{ requests: LeaveRequest[]; showActions?: boolean }> = ({
    requests,
    showActions = true,
  }) => (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-2">
        {requests.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No leave requests found
          </div>
        ) : (
          requests.map((request) => (
            <RequestCard key={request.id} request={request} showActions={showActions} />
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Employee</TableHead>
              <TableHead>Leave Type</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No leave requests found
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{request.employee_name}</div>
                      <div className="text-xs text-gray-500">{request.employee_team}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: request.leave_type?.color || '#add8e6' }}
                      />
                      <span className="text-sm truncate max-w-[120px]">
                        {request.leave_type_name.split('(')[0].trim()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(parseISO(request.start_date), 'dd/MM/yyyy')}
                      {request.start_date !== request.end_date && (
                        <> - {format(parseISO(request.end_date), 'dd/MM/yyyy')}</>
                      )}
                    </div>
                    {request.is_half_day && (
                      <div className="text-xs text-gray-500">
                        Half day ({request.half_day_period})
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{request.total_days}</span>
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="text-sm text-gray-500">
                      {format(parseISO(request.created_at), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetail(request)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {showActions &&
                        (request.status === 'pending_manager' || request.status === 'pending_hr') && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 w-8 p-0"
                              onClick={() => handleApproveClick(request)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                              onClick={() => handleRejectClick(request)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );

  // Filter Sheet for Mobile
  const FilterContent = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Status</label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending_manager">Pending Manager</SelectItem>
            <SelectItem value="pending_hr">Pending HR</SelectItem>
            <SelectItem value="completed">Approved</SelectItem>
            <SelectItem value="rejected_manager">Rejected</SelectItem>
            <SelectItem value="rejected_hr">Rejected</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Leave Type</label>
        <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Leave Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {leaveTypes.map((type) => (
              <SelectItem key={type.id} value={type.id.toString()}>
                {type.name_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setStatusFilter('all');
          setLeaveTypeFilter('all');
        }}
      >
        Clear Filters
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Leave Approval</h1>
          <p className="text-sm text-gray-500">Review and approve leave requests</p>
        </div>
        <Button
          variant="outline"
          onClick={() => refreshLeaveRequests()}
          disabled={isLoading}
          size="sm"
          className="self-end sm:self-auto"
        >
          <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-4 sm:mb-6">
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            {/* Search Input */}
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-sm"
              />
            </div>

            {/* Desktop Filters */}
            <div className="hidden sm:flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 lg:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending_manager">Pending Manager</SelectItem>
                  <SelectItem value="pending_hr">Pending HR</SelectItem>
                  <SelectItem value="completed">Approved</SelectItem>
                  <SelectItem value="rejected_manager">Rejected</SelectItem>
                  <SelectItem value="rejected_hr">Rejected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
                <SelectTrigger className="w-36 lg:w-40">
                  <SelectValue placeholder="Leave Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mobile Filter Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="sm:hidden flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                  {(statusFilter !== 'all' || leaveTypeFilter !== 'all') && (
                    <Badge className="ml-1 bg-purple-500 text-white h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {(statusFilter !== 'all' ? 1 : 0) + (leaveTypeFilter !== 'all' ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto max-h-[70vh]">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="w-full sm:w-auto flex overflow-x-auto">
          {isManager && (
            <TabsTrigger value="pending" className="relative flex-1 sm:flex-none text-xs sm:text-sm">
              <span className="hidden sm:inline">Pending Manager</span>
              <span className="sm:hidden">Manager</span>
              {filteredPendingManager.length > 0 && (
                <Badge className="ml-1 sm:ml-2 bg-yellow-500 h-5 min-w-[20px] flex items-center justify-center text-xs">
                  {filteredPendingManager.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
          {isHR && (
            <TabsTrigger value="hr_pending" className="relative flex-1 sm:flex-none text-xs sm:text-sm">
              <span className="hidden sm:inline">Pending HR</span>
              <span className="sm:hidden">HR</span>
              {filteredPendingHR.length > 0 && (
                <Badge className="ml-1 sm:ml-2 bg-blue-500 h-5 min-w-[20px] flex items-center justify-center text-xs">
                  {filteredPendingHR.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger value="all" className="flex-1 sm:flex-none text-xs sm:text-sm">
            <span className="hidden sm:inline">All Requests</span>
            <span className="sm:hidden">All</span>
          </TabsTrigger>
        </TabsList>

        {isManager && (
          <TabsContent value="pending">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Pending Manager Approval</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Leave requests waiting for your approval
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
                <RequestsTable requests={filteredPendingManager} showActions={true} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isHR && (
          <TabsContent value="hr_pending">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Pending HR Approval</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Leave requests waiting for HR approval
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
                <RequestsTable requests={filteredPendingHR} showActions={true} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="all">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">All Leave Requests</CardTitle>
              <CardDescription className="text-xs sm:text-sm">View all leave requests history</CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
              <RequestsTable requests={filteredAll} showActions={false} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              Leave Request Detail
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {/* Employee Info */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-xs sm:text-sm text-gray-500">Employee</div>
                  <div className="font-medium text-sm sm:text-base">{selectedRequest.employee_name}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-gray-500">Position</div>
                  <div className="font-medium text-sm sm:text-base">{selectedRequest.employee_position}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-gray-500">Team</div>
                  <div className="font-medium text-sm sm:text-base">{selectedRequest.employee_team}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-gray-500">Email</div>
                  <div className="font-medium text-sm sm:text-base truncate">{selectedRequest.employee_email}</div>
                </div>
              </div>

              {/* Leave Info */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <div className="text-xs sm:text-sm text-gray-500">Leave Type</div>
                  <div className="font-medium flex items-center gap-2 text-sm sm:text-base">
                    <div
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
                      style={{ backgroundColor: selectedRequest.leave_type?.color || '#add8e6' }}
                    />
                    <span className="truncate">{selectedRequest.leave_type_name}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-gray-500">Status</div>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-gray-500">Period</div>
                  <div className="font-medium text-sm sm:text-base">
                    {format(parseISO(selectedRequest.start_date), 'dd/MM/yyyy')} -{' '}
                    {format(parseISO(selectedRequest.end_date), 'dd/MM/yyyy')}
                  </div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-gray-500">Total Days</div>
                  <div className="font-medium text-sm sm:text-base">{selectedRequest.total_days} days</div>
                </div>
              </div>

              {/* Reason */}
              {selectedRequest.reason && (
                <div>
                  <div className="text-xs sm:text-sm text-gray-500">Reason</div>
                  <div className="p-2 sm:p-3 bg-gray-50 rounded-lg text-sm">{selectedRequest.reason}</div>
                </div>
              )}

              {/* Attachments */}
              {selectedRequest.attachment_urls && selectedRequest.attachment_urls.length > 0 && (
                <div>
                  <div className="text-xs sm:text-sm text-gray-500 mb-2">Attachments</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.attachment_urls.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-xs sm:text-sm"
                      >
                        Attachment {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Approval History */}
              <div>
                <div className="text-xs sm:text-sm text-gray-500 mb-2">Approval History</div>
                <div className="space-y-2">
                  {selectedRequest.manager_approval_date && (
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-sm">Manager Approval</div>
                        <div className="text-xs text-gray-500 truncate">
                          {selectedRequest.manager_name}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <Badge
                          className={cn(
                            'text-xs',
                            selectedRequest.manager_approval_status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          )}
                        >
                          {selectedRequest.manager_approval_status}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          {format(
                            parseISO(selectedRequest.manager_approval_date),
                            'dd/MM/yy HH:mm'
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedRequest.hr_approval_date && (
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-sm">HR Approval</div>
                        <div className="text-xs text-gray-500 truncate">
                          {selectedRequest.hr_approver_name}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <Badge
                          className={cn(
                            'text-xs',
                            selectedRequest.hr_approval_status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          )}
                        >
                          {selectedRequest.hr_approval_status}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          {format(
                            parseISO(selectedRequest.hr_approval_date),
                            'dd/MM/yy HH:mm'
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* User Signature */}
              {selectedRequest.user_signature && (
                <div>
                  <div className="text-xs sm:text-sm text-gray-500 mb-2">Employee Signature</div>
                  <img
                    src={selectedRequest.user_signature}
                    alt="Employee Signature"
                    className="max-h-16 sm:max-h-20 border rounded-lg p-2"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600 text-base sm:text-lg">
              <Check className="w-4 h-4 sm:w-5 sm:h-5" />
              Approve Leave Request
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedRequest && (
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-sm sm:text-base">{selectedRequest.employee_name}</div>
                <div className="text-xs sm:text-sm text-gray-500">{selectedRequest.leave_type_name}</div>
                <div className="text-xs sm:text-sm">
                  {format(parseISO(selectedRequest.start_date), 'dd/MM/yyyy')} -{' '}
                  {format(parseISO(selectedRequest.end_date), 'dd/MM/yyyy')} (
                  {selectedRequest.total_days} days)
                </div>
              </div>
            )}

            <div>
              <label className="text-xs sm:text-sm font-medium">Comment (Optional)</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="mt-1 text-sm"
              />
            </div>

            <div>
              <label className="text-xs sm:text-sm font-medium">Your Signature *</label>
              {signature ? (
                <div className="border rounded-lg p-2 mt-1">
                  <img src={signature} alt="Signature" className="max-h-16 sm:max-h-20 mx-auto" />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setSignature('')}
                  >
                    Clear Signature
                  </Button>
                </div>
              ) : (
                <div className="mt-1">
                  <DigitalSignature
                    onSave={(sig) => setSignature(sig)}
                    onClear={() => setSignature('')}
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowApproveDialog(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isProcessing || !signature}
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
            >
              {isProcessing ? 'Processing...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 text-base sm:text-lg">
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
              Reject Leave Request
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedRequest && (
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-sm sm:text-base">{selectedRequest.employee_name}</div>
                <div className="text-xs sm:text-sm text-gray-500">{selectedRequest.leave_type_name}</div>
                <div className="text-xs sm:text-sm">
                  {format(parseISO(selectedRequest.start_date), 'dd/MM/yyyy')} -{' '}
                  {format(parseISO(selectedRequest.end_date), 'dd/MM/yyyy')} (
                  {selectedRequest.total_days} days)
                </div>
              </div>
            )}

            <div>
              <label className="text-xs sm:text-sm font-medium">Reason for Rejection *</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Please provide a reason..."
                className="mt-1 text-sm"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={isProcessing || !comment.trim()}
              variant="destructive"
              className="w-full sm:w-auto"
            >
              {isProcessing ? 'Processing...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaveApprovalPage;
