import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { th } from 'date-fns/locale';
import { FileText, CheckCircle2, Download, Filter, BarChart3, Calendar, ArrowLeft, Check, X, ClipboardCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { StatusType } from '@/types/database.types';
import { getWelfareTypeLabel } from '@/lib/utils';
import { WelfareAIInsights } from '@/components/dashboard/WelfareAIInsights';

interface WelfareRequestItem {
  id: number;
  employee_id: number;
  employee_name: string;
  request_type: string;
  status: StatusType;
  amount: number;
  created_at: string;
  manager_name?: string;
  details?: string;
  manager_notes?: string;
  attachment_url?: string;
  attachments?: string[];
  pdf_request_hr?: string;
  pdf_request_manager?: string;
  pdf_url?: string;
  department_user?: string;
  department_request?: string;
  hr_approver_id?: string;
  hr_approver_name?: string;
  hr_approved_at?: string;
  accounting_id?: string;
  accounting_name?: string;
  accounting_approved_at?: string;
  accounting_notes?: string;
  accounting_approver_name?: string;
  approver_id?: string;
  approver_at?: string;
  manager_approver_id?: string;
  manager_approver_name?: string;
  manager_approved_at?: string;
}

type FilterState = {
  search: string;
  welfareType: string;
  dateFrom: string;
  dateTo: string;
  status: string;
  department: string;
  amountMin: string;
  amountMax: string;
  manager: string;
  quickFilter: string;
};

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
};

const initialFilter: FilterState = {
  search: '',
  welfareType: '',
  dateFrom: '',
  dateTo: '',
  status: '',
  department: '',
  amountMin: '',
  amountMax: '',
  manager: '',
  quickFilter: '',
};

const WelfareAccountingReviewPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<WelfareRequestItem[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<WelfareRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedRequest, setSelectedRequest] = useState<WelfareRequestItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [filter, setFilter] = useState<FilterState>(initialFilter);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'checklist' | 'history' | 'report'>('pending');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);

  // Sorting states
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'created_at', direction: 'desc' });

  // Badge count states
  const [pendingCount, setPendingCount] = useState(0);
  const [checklistCount, setChecklistCount] = useState(0);

  // Checklist states
  const [checklistSelectedIds, setChecklistSelectedIds] = useState<number[]>([]);
  const [isChecklistProcessing, setIsChecklistProcessing] = useState(false);

  // Loading states
  const [isFiltering, setIsFiltering] = useState(false);
  const [isBulkProcessing, setBulkProcessing] = useState(false);

  // Report states
  const [reportDateFrom, setReportDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [reportDateTo, setReportDateTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [reportData, setReportData] = useState<any[]>([]);
  const [filteredReportData, setFilteredReportData] = useState<any[]>([]);
  const [reportEmployeeFilter, setReportEmployeeFilter] = useState('');
  const [reportWelfareTypeFilter, setReportWelfareTypeFilter] = useState('');
  const [reportSummary, setReportSummary] = useState<{
    totalAmount: number;
    totalRequests: number;
    byType: { [key: string]: { count: number; amount: number } };
  }>({ totalAmount: 0, totalRequests: 0, byType: {} });

  // Accounting types to exclude (these are shown in GeneralAccountingReviewPage)
  const accountingTypes = ['advance', 'general-advance', 'expense-clearing', 'general-expense-clearing'];

  // Fetch badge counts on mount
  useEffect(() => {
    fetchCounts();
  }, []);

  useEffect(() => {
    if (activeTab === 'report') {
      fetchReportData();
    } else {
      fetchRequests();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'report') {
      filterRequests();
    }
  }, [requests, filter, currentPage, itemsPerPage, sortConfig]);

  useEffect(() => {
    if (activeTab === 'report') {
      filterReportData();
    }
  }, [reportData, reportEmployeeFilter, reportWelfareTypeFilter]);

  useEffect(() => {
    if (activeTab === 'report') {
      fetchReportData();
    }
  }, [reportDateFrom, reportDateTo]);

  const fetchCounts = async () => {
    // Fetch pending count
    const pendingResult: any = await supabase
      .from('welfare_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending_accounting')
      .not('request_type', 'in', `(${accountingTypes.join(',')})`);
    setPendingCount(pendingResult.count || 0);

    // Fetch checklist count (completed but not yet keyed into accounting system)
    const checklistQuery: any = supabase
      .from('welfare_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');
    const checklistResult = await checklistQuery
      .eq('accounting_checklist_done', false)
      .not('request_type', 'in', `(${accountingTypes.join(',')})`);
    setChecklistCount(checklistResult.count || 0);
  };

  const fetchRequests = async () => {
    setIsLoading(true);

    let query: any = supabase
      .from('welfare_requests')
      .select('*, department_request')
      .not('request_type', 'in', `(${accountingTypes.join(',')})`);

    if (activeTab === 'checklist') {
      query = query
        .eq('status', 'completed')
        .eq('accounting_checklist_done', false)
        .order('accounting_approved_at', { ascending: false });
    } else if (activeTab === 'history') {
      query = query
        .in('status', ['completed', 'rejected_accounting'])
        .order('created_at', { ascending: false });
    } else {
      // pending
      query = query
        .in('status', ['pending_accounting'])
        .order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching requests:', error);
      setRequests([]);
      setIsLoading(false);
      return;
    }

    if (data) {
      const mapped = data.map((req: any) => {
        let attachments: string[] = [];
        try {
          if (Array.isArray(req.attachment_url)) {
            attachments = req.attachment_url.filter((url: any) => url && typeof url === 'string');
          } else if (typeof req.attachment_url === 'string' && req.attachment_url.trim()) {
            try {
              const parsed = JSON.parse(req.attachment_url);
              if (Array.isArray(parsed)) {
                attachments = parsed.filter(url => url && typeof url === 'string');
              } else if (typeof parsed === 'string') {
                attachments = [parsed];
              }
            } catch {
              attachments = [req.attachment_url];
            }
          }
        } catch (error) {
          console.warn('Error processing attachments for request:', req.id, error);
          attachments = [];
        }
        return { ...req, attachments };
      });
      setRequests(mapped as WelfareRequestItem[]);
    }
    setIsLoading(false);
  };

  const fetchReportData = async () => {
    setIsLoading(true);

    const startDate = new Date(reportDateFrom + 'T00:00:00');
    const endDate = new Date(reportDateTo + 'T23:59:59');

    const { data, error } = await supabase
      .from('welfare_requests')
      .select('*, department_request')
      .eq('status', 'completed')
      .not('request_type', 'in', `(${accountingTypes.join(',')})`)
      .gte('accounting_approved_at', startDate.toISOString())
      .lte('accounting_approved_at', endDate.toISOString())
      .order('accounting_approved_at', { ascending: false });

    if (data && !error) {
      const mapped = data.map((req: any) => {
        let attachments: string[] = [];
        try {
          if (Array.isArray(req.attachment_url)) {
            attachments = req.attachment_url.filter((url: any) => url && typeof url === 'string');
          } else if (typeof req.attachment_url === 'string' && req.attachment_url.trim()) {
            try {
              const parsed = JSON.parse(req.attachment_url);
              if (Array.isArray(parsed)) {
                attachments = parsed.filter(url => url && typeof url === 'string');
              } else if (typeof parsed === 'string') {
                attachments = [parsed];
              }
            } catch {
              attachments = [req.attachment_url];
            }
          }
        } catch (error) {
          console.warn('Error processing attachments for report request:', req.id, error);
          attachments = [];
        }
        return { ...req, attachments };
      });
      setReportData(mapped as WelfareRequestItem[]);
    }
    setIsLoading(false);
  };

  const filterRequests = () => {
    setIsFiltering(true);
    setTimeout(() => {
      let filtered = [...requests];

      // Apply filters
      if (filter.search) {
        filtered = filtered.filter(r =>
          r.employee_name?.toLowerCase().includes(filter.search.toLowerCase()) ||
          r.request_type?.toLowerCase().includes(filter.search.toLowerCase())
        );
      }
      if (filter.welfareType) {
        filtered = filtered.filter(r => r.request_type === filter.welfareType);
      }
      if (filter.status) {
        filtered = filtered.filter(r => r.status === filter.status);
      }
      if (filter.department) {
        filtered = filtered.filter(r => r.department_request?.toLowerCase().includes(filter.department.toLowerCase()));
      }
      if (filter.manager) {
        filtered = filtered.filter(r =>
          (r.manager_approver_name || r.manager_name || '').toLowerCase().includes(filter.manager.toLowerCase())
        );
      }
      if (filter.amountMin) {
        filtered = filtered.filter(r => r.amount >= parseFloat(filter.amountMin));
      }
      if (filter.amountMax) {
        filtered = filtered.filter(r => r.amount <= parseFloat(filter.amountMax));
      }
      if (filter.dateFrom) {
        filtered = filtered.filter(r => new Date(r.created_at) >= new Date(filter.dateFrom));
      }
      if (filter.dateTo) {
        filtered = filtered.filter(r => new Date(r.created_at) <= new Date(filter.dateTo));
      }

      // Apply sorting
      filtered.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof WelfareRequestItem];
        let bValue: any = b[sortConfig.key as keyof WelfareRequestItem];

        if (sortConfig.key === 'created_at' || sortConfig.key === 'manager_approved_at' || sortConfig.key === 'hr_approved_at' || sortConfig.key === 'accounting_approved_at') {
          aValue = new Date(aValue || 0).getTime();
          bValue = new Date(bValue || 0).getTime();
        } else if (sortConfig.key === 'amount') {
          aValue = aValue || 0;
          bValue = bValue || 0;
        } else {
          aValue = (aValue || '').toString().toLowerCase();
          bValue = (bValue || '').toString().toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });

      setTotalItems(filtered.length);

      // Apply pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage);

      setFilteredRequests(paginatedData);
      setIsFiltering(false);
    }, 300);
  };

  const filterReportData = () => {
    let filtered = [...reportData];
    if (reportEmployeeFilter) {
      filtered = filtered.filter(r =>
        r.employee_name?.toLowerCase().includes(reportEmployeeFilter.toLowerCase())
      );
    }
    if (reportWelfareTypeFilter) {
      filtered = filtered.filter(r =>
        r.request_type?.toLowerCase().includes(reportWelfareTypeFilter.toLowerCase())
      );
    }
    setFilteredReportData(filtered);

    const totalAmount = filtered.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalRequests = filtered.length;

    const byType: { [key: string]: { count: number; amount: number } } = {};
    filtered.forEach(item => {
      const type = item.request_type || 'ไม่ระบุ';
      if (!byType[type]) {
        byType[type] = { count: 0, amount: 0 };
      }
      byType[type].count += 1;
      byType[type].amount += item.amount || 0;
    });

    setReportSummary({ totalAmount, totalRequests, byType });
  };

  const handleApprove = async (id: number) => {
    const currentDateTime = new Date().toISOString();
    await supabase.from('welfare_requests').update({
      status: 'completed',
      accounting_approver_id: profile?.id || null,
      accounting_approver_name: profile?.display_name || 'Accounting',
      accounting_approved_at: currentDateTime
    }).eq('id', id);
    fetchRequests();
    fetchCounts();
    closeDetails();
  };

  const handleReject = async (id: number) => {
    if (!rejectReason) return;
    const currentDateTime = new Date().toISOString();
    await supabase.from('welfare_requests').update({
      status: 'rejected_accounting',
      accounting_notes: rejectReason,
      accounting_approver_id: profile?.id || null,
      accounting_approver_name: profile?.display_name || 'Accounting',
      accounting_approved_at: currentDateTime
    }).eq('id', id);
    fetchRequests();
    fetchCounts();
    closeDetails();
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setBulkProcessing(true);

    try {
      const currentDateTime = new Date().toISOString();
      await supabase.from('welfare_requests').update({
        status: 'completed',
        accounting_approver_id: profile?.id || null,
        accounting_approver_name: profile?.display_name || 'Accounting',
        accounting_approved_at: currentDateTime
      }).in('id', selectedIds);

      fetchRequests();
      fetchCounts();
      setSelectedIds([]);
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    const reason = prompt('กรุณาระบุเหตุผลการไม่อนุมัติ:');
    if (!reason) return;

    setBulkProcessing(true);

    try {
      const currentDateTime = new Date().toISOString();
      await supabase.from('welfare_requests').update({
        status: 'rejected_accounting',
        accounting_notes: reason,
        accounting_approver_id: profile?.id || null,
        accounting_approver_name: profile?.display_name || 'Accounting',
        accounting_approved_at: currentDateTime
      }).in('id', selectedIds);

      fetchRequests();
      fetchCounts();
      setSelectedIds([]);
    } finally {
      setBulkProcessing(false);
    }
  };

  // Checklist handlers
  const handleChecklistDone = async (id: number) => {
    await supabase
      .from('welfare_requests')
      .update({ accounting_checklist_done: true } as any)
      .eq('id', id);
    fetchRequests();
    fetchCounts();
  };

  const handleBulkChecklistDone = async () => {
    if (checklistSelectedIds.length === 0) return;
    setIsChecklistProcessing(true);
    try {
      await supabase
        .from('welfare_requests')
        .update({ accounting_checklist_done: true } as any)
        .in('id', checklistSelectedIds);
      setChecklistSelectedIds([]);
      fetchRequests();
      fetchCounts();
    } finally {
      setIsChecklistProcessing(false);
    }
  };

  const handleChecklistSelect = (id: number) => {
    setChecklistSelectedIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
  };

  const handleChecklistSelectAll = () => {
    if (checklistSelectedIds.length === filteredRequests.length) {
      setChecklistSelectedIds([]);
    } else {
      setChecklistSelectedIds(filteredRequests.map(r => r.id));
    }
  };

  const openDetails = (request: WelfareRequestItem) => {
    setSelectedRequest(request);
    setDetailsOpen(true);
    setRejectReason('');
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedRequest(null);
    setRejectReason('');
  };

  const handleSort = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedIds([]);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const clearFilters = () => {
    setFilter(initialFilter);
    setCurrentPage(1);
  };

  const handleSelect = (id: number) => {
    setSelectedIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredRequests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRequests.map(r => r.id));
    }
  };

  const exportToCSV = () => {
    if (!filteredRequests.length) return;
    const header = ['วันที่ยื่น', 'ชื่อพนักงาน', 'แผนก/ฝ่าย', 'ประเภทสวัสดิการ', 'จำนวนเงิน', 'ผู้จัดการที่อนุมัติ', 'วันที่ผู้จัดการอนุมัติ', 'HR อนุมัติ', 'วันที่ HR อนุมัติ', 'สถานะ', 'วันที่-เวลาที่บัญชีอนุมัติ', 'หมายเหตุบัญชี'];
    const rows = filteredRequests.map(r => [
      format(new Date(r.created_at), 'dd MMM yyyy', { locale: th }),
      r.employee_name,
      r.department_request || '',
      getWelfareTypeLabel(r.request_type),
      r.amount?.toLocaleString('th-TH', { style: 'currency', currency: 'THB' }),
      r.manager_approver_name || r.manager_name || '',
      r.manager_approved_at ? format(new Date(r.manager_approved_at), 'dd MMM yyyy HH:mm', { locale: th }) : '',
      r.hr_approver_name || 'HR อนุมัติแล้ว',
      r.hr_approved_at ? format(new Date(r.hr_approved_at), 'dd MMM yyyy HH:mm', { locale: th }) : '',
      r.status === 'completed' ? 'อนุมัติแล้ว' : r.status === 'rejected_accounting' ? 'ไม่อนุมัติ' : r.status,
      r.accounting_approved_at ? format(new Date(r.accounting_approved_at), 'dd MMM yyyy HH:mm', { locale: th }) : '',
      r.accounting_notes || ''
    ]);
    const csv = [header, ...rows].map(e => e.map(v => '"' + (v?.toString().replace(/"/g, '""') || '') + '"').join(",")).join("\r\n");
    const csvWithBom = '\uFEFF' + csv;
    const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'welfare_accounting_review.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportReportToCSV = () => {
    if (!filteredReportData.length) return;
    const header = ['วันที่อนุมัติ', 'ชื่อพนักงาน', 'แผนก/ฝ่าย', 'ประเภทสวัสดิการ', 'จำนวนเงิน', 'ผู้จัดการที่อนุมัติ', 'วันที่ผู้จัดการอนุมัติ', 'HR อนุมัติ', 'วันที่ HR อนุมัติ', 'ผู้อนุมัติ (บัญชี)', 'วันที่-เวลาที่บัญชีอนุมัติ'];
    const rows = filteredReportData.map(r => [
      r.accounting_approved_at ? format(new Date(r.accounting_approved_at), 'dd/MM/yyyy', { locale: th }) : '',
      r.employee_name,
      r.department_request || '',
      getWelfareTypeLabel(r.request_type),
      r.amount?.toLocaleString('th-TH', { style: 'currency', currency: 'THB' }),
      r.manager_approver_name || r.manager_name || '',
      r.manager_approved_at ? format(new Date(r.manager_approved_at), 'dd/MM/yyyy HH:mm', { locale: th }) : '',
      r.hr_approver_name || 'HR อนุมัติแล้ว',
      r.hr_approved_at ? format(new Date(r.hr_approved_at), 'dd/MM/yyyy HH:mm', { locale: th }) : '',
      r.accounting_approver_name || 'บัญชี',
      r.accounting_approved_at ? format(new Date(r.accounting_approved_at), 'dd/MM/yyyy HH:mm', { locale: th }) : ''
    ]);
    const csv = [header, ...rows].map(e => e.map(v => '"' + (v?.toString().replace(/"/g, '""') || '') + '"').join(",")).join("\r\n");
    const csvWithBom = '\uFEFF' + csv;
    const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `รายงานการเบิกสวัสดิการ_${reportDateFrom}_${reportDateTo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <Layout>
      <div className="p-6">
        <button
          className="mb-4 flex items-center text-gray-600 hover:text-blue-600 transition"
          onClick={() => window.history.length > 1 ? window.history.back() : navigate('/dashboard')}
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          กลับ
        </button>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            className={`px-4 py-2 rounded-t relative ${activeTab === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setActiveTab('pending')}
          >
            รายการรอตรวจสอบ (สวัสดิการ)
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            className={`px-4 py-2 rounded-t relative ${activeTab === 'checklist' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setActiveTab('checklist')}
          >
            <ClipboardCheck className="h-4 w-4 mr-1 inline" />
            Checklist
            {checklistCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                {checklistCount}
              </span>
            )}
          </button>
          <button
            className={`px-4 py-2 rounded-t ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setActiveTab('history')}
          >
            ประวัติการขอ (สวัสดิการ)
          </button>
          <button
            className={`px-4 py-2 rounded-t ${activeTab === 'report' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setActiveTab('report')}
          >
            <BarChart3 className="h-4 w-4 mr-1 inline" />
            รายงานการเบิก (สวัสดิการ)
          </button>
        </div>

        <h1 className="text-2xl font-bold mb-4">
          {activeTab === 'report' ? 'รายงานการเบิกสวัสดิการ' :
           activeTab === 'history' ? 'ประวัติการขอสวัสดิการ' :
           activeTab === 'checklist' ? 'Checklist - รายการที่ต้อง Key ข้อมูลเข้าระบบบัญชี' :
           'รายการรอตรวจสอบสวัสดิการ (บัญชี)'}
        </h1>

        {activeTab === 'report' ? (
          <>
            {/* Report Controls */}
            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">วันที่เริ่มต้น:</span>
                  <Input
                    type="date"
                    value={reportDateFrom}
                    onChange={e => setReportDateFrom(e.target.value)}
                    className="w-44"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-medium">วันที่สิ้นสุด:</span>
                  <Input
                    type="date"
                    value={reportDateTo}
                    onChange={e => setReportDateTo(e.target.value)}
                    className="w-44"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span>ชื่อพนักงาน:</span>
                  <Input
                    placeholder="ค้นหาชื่อพนักงาน"
                    value={reportEmployeeFilter}
                    onChange={e => setReportEmployeeFilter(e.target.value)}
                    className="w-48"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span>ประเภทสวัสดิการ:</span>
                  <Input
                    placeholder="ค้นหาประเภทสวัสดิการ"
                    value={reportWelfareTypeFilter}
                    onChange={e => setReportWelfareTypeFilter(e.target.value)}
                    className="w-48"
                  />
                </div>

                <Button variant="outline" onClick={exportReportToCSV} disabled={filteredReportData.length === 0}>
                  <Download className="mr-2 h-4 w-4" />
                  Export รายงาน
                </Button>
              </div>
            </div>

            {/* Report Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-blue-600 text-sm font-medium">จำนวนการเบิกทั้งหมด</div>
                <div className="text-2xl font-bold text-blue-800">{reportSummary.totalRequests} รายการ</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-green-600 text-sm font-medium">ยอดเงินที่เบิกทั้งหมด</div>
                <div className="text-2xl font-bold text-green-800">
                  {reportSummary.totalAmount.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <WelfareAIInsights
              reportData={filteredReportData}
              reportSummary={reportSummary}
              reportPeriod="month"
              selectedMonth={reportDateFrom.substring(0, 7)}
              selectedYear={reportDateFrom.substring(0, 4)}
            />

            {/* Report by Type */}
            {Object.keys(reportSummary.byType).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">สรุปตามประเภทสวัสดิการ</h3>
                <div className="bg-white rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-welfare-blue/100 [&_th]:text-white">
                      <TableRow>
                        <TableHead>ประเภทสวัสดิการ</TableHead>
                        <TableHead className="text-center">จำนวนรายการ</TableHead>
                        <TableHead className="text-right">ยอดเงินรวม</TableHead>
                        <TableHead className="text-right">ยอดเฉลี่ย</TableHead>
                        <TableHead className="text-center">สัดส่วน</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(reportSummary.byType)
                        .sort(([, a], [, b]) => b.amount - a.amount)
                        .map(([type, data]) => (
                          <TableRow key={type}>
                            <TableCell className="font-medium">{type}</TableCell>
                            <TableCell className="text-center">{data.count}</TableCell>
                            <TableCell className="text-right">
                              {data.amount.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}
                            </TableCell>
                            <TableCell className="text-right">
                              {(data.amount / data.count).toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}
                            </TableCell>
                            <TableCell className="text-center">
                              {reportSummary.totalAmount !== 0 ? ((data.amount / reportSummary.totalAmount) * 100).toFixed(1) : 0}%
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Detailed Report Table */}
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b">
                <h3 className="text-lg font-semibold">รายละเอียดการเบิกสวัสดิการ</h3>
              </div>
              {filteredReportData.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-welfare-blue/100 [&_th]:text-white">
                      <TableRow>
                        <TableHead>วันที่อนุมัติ</TableHead>
                        <TableHead>ชื่อพนักงาน</TableHead>
                        <TableHead>แผนก/ฝ่าย</TableHead>
                        <TableHead>ประเภทสวัสดิการ</TableHead>
                        <TableHead className="text-right">จำนวนเงิน</TableHead>
                        <TableHead>ผู้อนุมัติ (บัญชี)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReportData.map(r => (
                        <TableRow key={r.id}>
                          <TableCell>
                            {r.accounting_approved_at
                              ? format(new Date(r.accounting_approved_at), 'dd/MM/yyyy', { locale: th })
                              : '-'
                            }
                          </TableCell>
                          <TableCell>{r.employee_name}</TableCell>
                          <TableCell>{r.department_request || '-'}</TableCell>
                          <TableCell>{getWelfareTypeLabel(r.request_type)}</TableCell>
                          <TableCell className="text-right">
                            {r.amount?.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}
                          </TableCell>
                          <TableCell>{r.accounting_approver_name || 'บัญชี'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  {isLoading ? 'กำลังโหลดข้อมูล...' : 'ไม่มีข้อมูลการเบิกในช่วงเวลาที่เลือก'}
                </div>
              )}
            </div>
          </>
        ) : activeTab === 'checklist' ? (
          <>
            {/* Checklist Tab */}
            <div className="mb-4 flex flex-wrap gap-2 items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant="default"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleBulkChecklistDone}
                  disabled={checklistSelectedIds.length === 0 || isChecklistProcessing}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {isChecklistProcessing ? 'กำลังประมวลผล...' : `ดำเนินการแล้ว (${checklistSelectedIds.length})`}
                </Button>
              </div>
              <div className="text-sm text-gray-600">
                {isLoading ? 'กำลังโหลดข้อมูล...' : `พบ ${totalItems} รายการ`}
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-welfare-blue/100 [&_th]:text-white">
                  <TableRow>
                    <TableHead>
                      <input
                        type="checkbox"
                        checked={checklistSelectedIds.length === filteredRequests.length && filteredRequests.length > 0}
                        onChange={handleChecklistSelectAll}
                      />
                    </TableHead>
                    <TableHead>วันที่อนุมัติ</TableHead>
                    <TableHead>ชื่อพนักงาน</TableHead>
                    <TableHead>แผนก/ฝ่าย</TableHead>
                    <TableHead>ประเภทสวัสดิการ</TableHead>
                    <TableHead className="text-right">จำนวนเงิน</TableHead>
                    <TableHead>การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={checklistSelectedIds.includes(r.id)}
                          onChange={() => handleChecklistSelect(r.id)}
                        />
                      </TableCell>
                      <TableCell>
                        {r.accounting_approved_at
                          ? format(new Date(r.accounting_approved_at), 'dd/MM/yyyy HH:mm')
                          : '-'}
                      </TableCell>
                      <TableCell>{r.employee_name}</TableCell>
                      <TableCell>{r.department_request || '-'}</TableCell>
                      <TableCell>{getWelfareTypeLabel(r.request_type)}</TableCell>
                      <TableCell className="text-right">
                        {r.amount?.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-300 hover:bg-green-50"
                          onClick={() => handleChecklistDone(r.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          เสร็จสิ้น
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {isLoading ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  กำลังโหลดข้อมูล...
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center text-gray-500 py-6">
                  ไม่มีรายการที่ต้องทำ Checklist
                </div>
              ) : null}
            </div>

            {/* Pagination */}
            {totalItems > 0 && (
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  แสดงรายการ {startItem}-{endItem} จาก {totalItems} รายการ
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    ก่อนหน้า
                  </Button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    ถัดไป
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Advanced Search & Filter */}
            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">วันที่เริ่มต้น</label>
                  <Input
                    type="date"
                    value={filter.dateFrom}
                    onChange={e => setFilter(f => ({ ...f, dateFrom: e.target.value }))}
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">วันที่สิ้นสุด</label>
                  <Input
                    type="date"
                    value={filter.dateTo}
                    onChange={e => setFilter(f => ({ ...f, dateTo: e.target.value }))}
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">ค้นหา</label>
                  <Input
                    placeholder="ชื่อพนักงาน หรือ ประเภทสวัสดิการ"
                    value={filter.search}
                    onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">แผนก/ฝ่าย</label>
                  <Input
                    placeholder="ค้นหาแผนก"
                    value={filter.department}
                    onChange={e => setFilter(f => ({ ...f, department: e.target.value }))}
                    className="text-sm"
                  />
                </div>

                {activeTab === 'history' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">สถานะ</label>
                    <select
                      value={filter.status}
                      onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="">ทุกสถานะ</option>
                      <option value="completed">อนุมัติแล้ว</option>
                      <option value="rejected_accounting">ไม่อนุมัติ</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">ประเภทสวัสดิการ</label>
                  <Input
                    placeholder="ค้นหาประเภทสวัสดิการ"
                    value={filter.welfareType}
                    onChange={e => setFilter(f => ({ ...f, welfareType: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <Filter className="mr-2 h-4 w-4" />
                  ล้างตัวกรอง
                </Button>
                <div className="text-sm text-gray-600">
                  {isFiltering ? 'กำลังกรองข้อมูล...' : `พบ ${totalItems} รายการ`}
                </div>
                <Button variant="outline" onClick={exportToCSV} className="ml-auto">
                  <Download className="mr-2 h-4 w-4" />Export
                </Button>
              </div>
            </div>

            {/* Bulk Actions & Pagination Controls */}
            <div className="mb-4 flex flex-wrap gap-2 items-center justify-between">
              <div className="flex gap-2">
                {activeTab === 'pending' && (
                  <>
                    <Button
                      variant="default"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={handleBulkApprove}
                      disabled={selectedIds.length === 0 || isBulkProcessing}
                    >
                      {isBulkProcessing ? 'กำลังประมวลผล...' : `อนุมัติ (${selectedIds.length})`}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleBulkReject}
                      disabled={selectedIds.length === 0 || isBulkProcessing}
                    >
                      {isBulkProcessing ? 'กำลังประมวลผล...' : `ไม่อนุมัติ (${selectedIds.length})`}
                    </Button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">แสดง</span>
                <select
                  value={itemsPerPage}
                  onChange={e => handleItemsPerPageChange(Number(e.target.value))}
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-600">รายการต่อหน้า</span>
              </div>
            </div>

            {/* Request List Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-welfare-blue/100 [&_th]:text-white">
                  <TableRow>
                    <TableHead>
                      {activeTab === 'pending' && (
                        <input
                          type="checkbox"
                          checked={selectedIds.length === filteredRequests.length && filteredRequests.length > 0}
                          onChange={handleSelectAll}
                        />
                      )}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-1">
                        วันที่ยื่น
                        {sortConfig.key === 'created_at' && (
                          <span className="text-xs">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('employee_name')}
                    >
                      <div className="flex items-center gap-1">
                        ชื่อพนักงาน
                        {sortConfig.key === 'employee_name' && (
                          <span className="text-xs">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead>แผนก/ฝ่าย</TableHead>
                    <TableHead>ประเภทสวัสดิการ</TableHead>
                    <TableHead className="text-right">จำนวนเงิน</TableHead>
                    <TableHead>ผู้จัดการที่อนุมัติ</TableHead>
                    <TableHead>HR อนุมัติ</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>ไฟล์แนบ</TableHead>
                    <TableHead>PDF</TableHead>
                    <TableHead>การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>
                        {activeTab === 'pending' && (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(r.id)}
                            onChange={() => handleSelect(r.id)}
                          />
                        )}
                      </TableCell>
                      <TableCell>{format(new Date(r.created_at), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{r.employee_name}</TableCell>
                      <TableCell>{r.department_request || '-'}</TableCell>
                      <TableCell>{getWelfareTypeLabel(r.request_type)}</TableCell>
                      <TableCell className="text-right">
                        {r.amount?.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{r.manager_approver_name || r.manager_name || '-'}</div>
                          {r.manager_approved_at && (
                            <div className="text-xs text-gray-500">
                              {format(new Date(r.manager_approved_at), 'dd/MM/yyyy HH:mm')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{r.hr_approver_name || 'HR อนุมัติแล้ว'}</div>
                          {r.hr_approved_at && (
                            <div className="text-xs text-gray-500">
                              {format(new Date(r.hr_approved_at), 'dd/MM/yyyy HH:mm')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          r.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : r.status === 'rejected_accounting'
                              ? 'bg-red-100 text-red-800'
                              : r.status === 'pending_accounting'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}>
                          {r.status === 'completed' ? 'อนุมัติแล้ว' :
                           r.status === 'rejected_accounting' ? 'ไม่อนุมัติ' :
                           r.status === 'pending_accounting' ? 'รอบัญชีตรวจสอบ' : r.status}
                        </span>
                        {r.accounting_approved_at && (
                          <div className="text-xs text-gray-500 mt-1">
                            {format(new Date(r.accounting_approved_at), 'dd/MM/yyyy HH:mm')}
                          </div>
                        )}
                        {r.accounting_notes && (
                          <div className="text-xs text-gray-600 mt-1" title={r.accounting_notes}>
                            หมายเหตุ: {r.accounting_notes.length > 20 ?
                              r.accounting_notes.substring(0, 20) + '...' : r.accounting_notes}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-wrap gap-1 justify-center items-center">
                          {r.attachments && r.attachments.length > 0 && r.attachments.map((file, idx) => (
                            <Button asChild variant="ghost" size="icon" key={idx}>
                              <a
                                href={file}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`View attachment ${idx + 1}`}
                                className="text-blue-600 hover:text-blue-800"
                                title={`ดูเอกสารแนบ ${idx + 1}`}
                              >
                                <FileText className="h-4 w-4" />
                              </a>
                            </Button>
                          ))}

                          {(!r.attachments || r.attachments.length === 0) && (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-wrap gap-1 justify-center items-center">
                          {(() => {
                            // เลือก PDF URL ตามสถานะ
                            let pdfUrl = null;
                            let pdfTitle = "ดู PDF เอกสาร";

                            if (r.status === 'pending_manager' && r.pdf_url) {
                              pdfUrl = r.pdf_url;
                              pdfTitle = "ดู PDF เอกสาร";
                            } else if ((r.status as string) === 'pending_hr' && r.pdf_request_manager) {
                              pdfUrl = r.pdf_request_manager;
                              pdfTitle = "ดู PDF ที่ Manager อนุมัติแล้ว";
                            } else if ((r.status === 'pending_accounting' || r.status === 'completed') && r.pdf_request_hr) {
                              pdfUrl = r.pdf_request_hr;
                              pdfTitle = "ดู PDF ที่ HR อนุมัติแล้ว";
                            }

                            return pdfUrl ? (
                              <Button asChild variant="ghost" size="icon">
                                <a
                                  href={pdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-red-600 hover:text-red-800"
                                  title={pdfTitle}
                                >
                                  <FileText className="h-4 w-4" />
                                </a>
                              </Button>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            );
                          })()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetails(r)}
                        >
                          ดูรายละเอียด
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {isFiltering ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  กำลังกรองข้อมูล...
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center text-gray-500 py-6">
                  {totalItems === 0 ? 'ไม่มีรายการ' : 'ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา'}
                </div>
              ) : null}
            </div>

            {/* Pagination */}
            {totalItems > 0 && (
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  แสดงรายการ {startItem}-{endItem} จาก {totalItems} รายการ
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    ก่อนหน้า
                  </Button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    ถัดไป
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Details Modal - Full Screen with PDF Preview */}
        {selectedRequest && (
          <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
            <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
              {/* Header สรุปข้อมูล */}
              <div className="px-6 pt-6 pb-3 border-b bg-gray-50/80 rounded-t-lg flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <DialogHeader className="p-0 space-y-0">
                    <DialogTitle className="text-lg">
                      {selectedRequest.employee_name} — {getWelfareTypeLabel(selectedRequest.request_type)}
                    </DialogTitle>
                  </DialogHeader>
                  <Badge
                    className={`text-sm px-3 py-1 ${
                      selectedRequest.status === 'pending_accounting' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                      selectedRequest.status === 'completed' ? 'bg-green-100 text-green-800 border-green-300' :
                      selectedRequest.status === 'rejected_accounting' ? 'bg-red-100 text-red-800 border-red-300' :
                      'bg-gray-100 text-gray-800 border-gray-300'
                    }`}
                    variant="outline"
                  >
                    {selectedRequest.status === 'pending_accounting' ? 'รอบัญชีตรวจสอบ' :
                     selectedRequest.status === 'completed' ? 'อนุมัติแล้ว' :
                     selectedRequest.status === 'rejected_accounting' ? 'ไม่อนุมัติ' :
                     selectedRequest.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
                  <span>แผนก: <strong className="text-foreground">{selectedRequest.department_request || '-'}</strong></span>
                  <span>วันที่ยื่น: <strong className="text-foreground">{format(new Date(selectedRequest.created_at), 'dd/MM/yyyy')}</strong></span>
                  <span>จำนวนเงิน: <strong className="text-blue-700 text-base">{selectedRequest.amount?.toLocaleString('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 2 })}</strong></span>
                  {selectedRequest.manager_approver_name && (
                    <span>ผู้จัดการ: <strong className="text-foreground">{selectedRequest.manager_approver_name}</strong>
                      {selectedRequest.manager_approved_at && (
                        <span className="text-xs ml-1">({format(new Date(selectedRequest.manager_approved_at), 'dd/MM/yyyy HH:mm')})</span>
                      )}
                    </span>
                  )}
                  {selectedRequest.hr_approver_name && (
                    <span>HR: <strong className="text-foreground">{selectedRequest.hr_approver_name}</strong>
                      {selectedRequest.hr_approved_at && (
                        <span className="text-xs ml-1">({format(new Date(selectedRequest.hr_approved_at), 'dd/MM/yyyy HH:mm')})</span>
                      )}
                    </span>
                  )}
                  {selectedRequest.details && (
                    <span>รายละเอียด: <strong className="text-foreground">{selectedRequest.details}</strong></span>
                  )}
                  {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                    <span className="flex items-center gap-1">
                      เอกสารแนบ:
                      {selectedRequest.attachments.map((file, idx) => (
                        <a key={idx} href={file} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium">
                          <FileText className="h-3.5 w-3.5" />ไฟล์ {idx + 1}
                        </a>
                      ))}
                    </span>
                  )}
                  {selectedRequest.manager_notes && (
                    <span>หมายเหตุผู้จัดการ: <strong className="text-foreground">{selectedRequest.manager_notes}</strong></span>
                  )}
                </div>
              </div>

              {/* PDF Preview */}
              <div className="flex-1 min-h-0 px-6 py-3">
                {(() => {
                  const pdfUrl = selectedRequest.pdf_request_hr || selectedRequest.pdf_request_manager || selectedRequest.pdf_url;
                  if (pdfUrl) {
                    return (
                      <iframe
                        src={pdfUrl}
                        className="w-full h-full rounded-lg border"
                        title="PDF Preview"
                      />
                    );
                  }
                  return (
                    <div className="w-full h-full flex items-center justify-center border rounded-lg bg-gray-50">
                      <div className="text-center text-muted-foreground">
                        <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">ไม่มี PDF สำหรับแสดงตัวอย่าง</p>
                        <p className="text-sm mt-1">PDF จะถูกสร้างหลังจากมีการอนุมัติ</p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Footer — ปุ่ม Action */}
              {activeTab === 'pending' && selectedRequest.status === 'pending_accounting' && (
                <div className="px-6 py-3 border-t bg-gray-50/80 rounded-b-lg flex-shrink-0">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="ระบุเหตุผลการไม่อนุมัติ (ถ้ามี)..."
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        className="bg-white"
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        onClick={() => handleApprove(selectedRequest.id)}
                        className="bg-green-600 hover:bg-green-700 px-6"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        อนุมัติ
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleReject(selectedRequest.id)}
                        disabled={!rejectReason}
                        className="px-6"
                      >
                        <X className="h-4 w-4 mr-2" />
                        ไม่อนุมัติ
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
};

export { WelfareAccountingReviewPage };
