import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { th } from 'date-fns/locale';
import { FileText, Eye, CheckCircle2, XCircle, Download, Filter, BarChart3, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { StatusType } from '@/types/database.types';

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
  // HR approval fields
  hr_approver_id?: string;
  hr_approver_name?: string;
  hr_approved_at?: string;
  // Accounting approval fields
  accounting_id?: string;
  accounting_name?: string;
  accounting_approved_at?: string;
  accounting_notes?: string;
  // Legacy approval fields
  approver_id?: string;
  approver_at?: string;
  // Manager approval fields
  manager_approver_id?: string;
  manager_approver_name?: string;
  manager_approved_at?: string;
}

type FilterState = {
  search: string;
  welfareType: string;
  dateFrom: string;
  dateTo: string;
};

const initialFilter: FilterState = {
  search: '',
  welfareType: '',
  dateFrom: '',
  dateTo: '',
};

import { Layout } from '@/components/layout/Layout';
import { ArrowLeft } from 'lucide-react';

const AccountingReviewPage: React.FC = () => {
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
  const [showHistory, setShowHistory] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<'month' | 'year'>('month');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedYear, setSelectedYear] = useState(format(new Date(), 'yyyy'));
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportSummary, setReportSummary] = useState<{
    totalAmount: number;
    totalRequests: number;
    byType: { [key: string]: { count: number; amount: number } };
  }>({ totalAmount: 0, totalRequests: 0, byType: {} });

  useEffect(() => {
    fetchRequests();
  }, [showHistory]);

  useEffect(() => {
    filterRequests();
  }, [requests, filter, showHistory]);

  useEffect(() => {
    if (showReport) {
      fetchReportData();
    }
  }, [showReport, reportPeriod, selectedMonth, selectedYear]);

  const fetchRequests = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('welfare_requests')
      .select('*')
      .in('status', showHistory ? ['pending_accounting', 'completed', 'rejected_accounting'] : ['pending_accounting']);
    
    console.log('AccountingReviewPage - Fetched data:', data);
    console.log('AccountingReviewPage - Error:', error);
    
    if (data) {
      setRequests(data);
    }
    setIsLoading(false);
  };

  const filterRequests = () => {
    let filtered = [...(showHistory ? requests : requests.filter(r => r.status === 'pending_accounting'))];
    if (filter.search) {
      filtered = filtered.filter(r =>
        r.employee_name?.toLowerCase().includes(filter.search.toLowerCase()) ||
        r.request_type?.toLowerCase().includes(filter.search.toLowerCase())
      );
    }
    if (filter.welfareType) {
      filtered = filtered.filter(r => r.request_type === filter.welfareType);
    }
    if (filter.dateFrom) {
      filtered = filtered.filter(r => new Date(r.created_at) >= new Date(filter.dateFrom));
    }
    if (filter.dateTo) {
      filtered = filtered.filter(r => new Date(r.created_at) <= new Date(filter.dateTo));
    }
    setFilteredRequests(filtered);
  };

  const fetchReportData = async () => {
    setIsLoading(true);
    
    let startDate: Date;
    let endDate: Date;
    
    if (reportPeriod === 'month') {
      startDate = startOfMonth(new Date(selectedMonth + '-01'));
      endDate = endOfMonth(new Date(selectedMonth + '-01'));
    } else {
      startDate = startOfYear(new Date(selectedYear + '-01-01'));
      endDate = endOfYear(new Date(selectedYear + '-01-01'));
    }

    const { data, error } = await supabase
      .from('welfare_requests')
      .select('*')
      .eq('status', 'completed')
      .gte('accounting_approved_at', startDate.toISOString())
      .lte('accounting_approved_at', endDate.toISOString())
      .order('accounting_approved_at', { ascending: false });

    if (data && !error) {
      setReportData(data);
      
      // คำนวณสรุปข้อมูล
      const totalAmount = data.reduce((sum, item) => sum + (item.amount || 0), 0);
      const totalRequests = data.length;
      
      const byType: { [key: string]: { count: number; amount: number } } = {};
      data.forEach(item => {
        const type = item.request_type || 'ไม่ระบุ';
        if (!byType[type]) {
          byType[type] = { count: 0, amount: 0 };
        }
        byType[type].count += 1;
        byType[type].amount += item.amount || 0;
      });

      setReportSummary({ totalAmount, totalRequests, byType });
    }
    
    setIsLoading(false);
  };

  const exportReportToCSV = () => {
    if (!reportData.length) return;
    const header = ['วันที่อนุมัติ', 'ชื่อพนักงาน', 'ประเภทสวัสดิการ', 'จำนวนเงิน', 'ผู้อนุมัติ (บัญชี)'];
    const rows = reportData.map(r => [
      r.accounting_approved_at ? format(new Date(r.accounting_approved_at), 'dd/MM/yyyy', { locale: th }) : '',
      r.employee_name,
      r.request_type,
      r.amount?.toLocaleString('th-TH', { style: 'currency', currency: 'THB' }),
      r.accounting_approver_name || 'บัญชี'
    ]);
    const csv = [header, ...rows].map(e => e.map(v => '"' + (v?.toString().replace(/"/g, '""') || '') + '"').join(",")).join("\r\n");
    const csvWithBom = '\uFEFF' + csv;
    const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `รายงานการเบิก_${reportPeriod === 'month' ? selectedMonth : selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const handleApprove = async (id: number) => {
    const currentDateTime = new Date().toISOString();
    await supabase.from('welfare_requests').update({ 
      status: 'completed',
      accounting_approver_id: profile?.id || null,
      accounting_approver_name: profile?.display_name || 'Accounting',
      accounting_approved_at: currentDateTime
    }).eq('id', id);
    fetchRequests();
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
    closeDetails();
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    const currentDateTime = new Date().toISOString();
    await supabase.from('welfare_requests').update({ 
      status: 'completed',
      accounting_approver_id: profile?.id || null,
      accounting_approver_name: profile?.display_name || 'Accounting',
      accounting_approved_at: currentDateTime
    }).in('id', selectedIds);
    fetchRequests();
    setSelectedIds([]);
  };

  const exportToCSV = () => {
    if (!filteredRequests.length) return;
    const header = ['วันที่ยื่น', 'ชื่อพนักงาน', 'ประเภทสวัสดิการ', 'จำนวนเงิน', 'ผู้จัดการที่อนุมัติ', 'วันที่ผู้จัดการอนุมัติ', 'HR ที่อนุมัติ', 'วันที่ HR อนุมัติ', 'สถานะ'];
    const rows = filteredRequests.map(r => [
      format(new Date(r.created_at), 'dd MMM yyyy', { locale: th }),
      r.employee_name,
      r.request_type,
      r.amount?.toLocaleString('th-TH', { style: 'currency', currency: 'THB' }),
      r.manager_approver_name || r.manager_name || '',
      r.manager_approved_at ? format(new Date(r.manager_approved_at), 'dd MMM yyyy HH:mm', { locale: th }) : '',
      r.hr_approver_name || 'HR อนุมัติแล้ว',
      r.hr_approved_at ? format(new Date(r.hr_approved_at), 'dd MMM yyyy HH:mm', { locale: th }) : '',
      r.status
    ]);
    const csv = [header, ...rows].map(e => e.map(v => '"' + (v?.toString().replace(/"/g, '""') || '') + '"').join(",")).join("\r\n");
    const csvWithBom = '\uFEFF' + csv;
    const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'accounting_review.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <div className="flex gap-4 mb-4">
        <button
          className={`px-4 py-2 rounded-t ${!showHistory && !showReport ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => { setShowHistory(false); setShowReport(false); }}
        >
          รายการรอตรวจสอบ
        </button>
        <button
          className={`px-4 py-2 rounded-t ${showHistory && !showReport ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => { setShowHistory(true); setShowReport(false); }}
        >
          ประวัติการขอ
        </button>
        <button
          className={`px-4 py-2 rounded-t ${showReport ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => { setShowReport(true); setShowHistory(false); }}
        >
          <BarChart3 className="h-4 w-4 mr-1 inline" />
          รายงานการเบิก
        </button>
      </div>
      <h1 className="text-2xl font-bold mb-4">
        {showReport ? 'รายงานการเบิกสวัสดิการ' : (showHistory ? 'ประวัติการขอ' : 'รายการรอตรวจสอบ (บัญชี)')}
      </h1>

      {showReport ? (
        <>
          {/* Report Controls */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">ช่วงเวลา:</span>
                <select 
                  value={reportPeriod} 
                  onChange={e => setReportPeriod(e.target.value as 'month' | 'year')}
                  className="px-3 py-1 border rounded"
                >
                  <option value="month">รายเดือน</option>
                  <option value="year">รายปี</option>
                </select>
              </div>
              
              {reportPeriod === 'month' ? (
                <div className="flex items-center gap-2">
                  <span>เดือน:</span>
                  <input 
                    type="month" 
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="px-3 py-1 border rounded"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>ปี:</span>
                  <input 
                    type="number" 
                    value={selectedYear}
                    onChange={e => setSelectedYear(e.target.value)}
                    min="2020"
                    max="2030"
                    className="px-3 py-1 border rounded w-20"
                  />
                </div>
              )}
              
              <Button variant="outline" onClick={exportReportToCSV} disabled={reportData.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export รายงาน
              </Button>
            </div>
          </div>

          {/* Report Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-purple-600 text-sm font-medium">ยอดเฉลี่ยต่อรายการ</div>
              <div className="text-2xl font-bold text-purple-800">
                {reportSummary.totalRequests > 0 
                  ? (reportSummary.totalAmount / reportSummary.totalRequests).toLocaleString('th-TH', { style: 'currency', currency: 'THB' })
                  : '฿0'
                }
              </div>
            </div>
          </div>

          {/* Report by Type */}
          {Object.keys(reportSummary.byType).length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">สรุปตามประเภทสวัสดิการ</h3>
              <div className="bg-white rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
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
                      .sort(([,a], [,b]) => b.amount - a.amount)
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
                          {((data.amount / reportSummary.totalAmount) * 100).toFixed(1)}%
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
              <h3 className="text-lg font-semibold">รายละเอียดการเบิก</h3>
            </div>
            {reportData.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>วันที่อนุมัติ</TableHead>
                      <TableHead>ชื่อพนักงาน</TableHead>
                      <TableHead>ประเภทสวัสดิการ</TableHead>
                      <TableHead className="text-right">จำนวนเงิน</TableHead>
                      <TableHead>ผู้อนุมัติ (บัญชี)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map(r => (
                      <TableRow key={r.id}>
                        <TableCell>
                          {r.accounting_approved_at 
                            ? format(new Date(r.accounting_approved_at), 'dd/MM/yyyy', { locale: th })
                            : '-'
                          }
                        </TableCell>
                        <TableCell>{r.employee_name}</TableCell>
                        <TableCell>{r.request_type}</TableCell>
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
      ) : (
        <>
          {/* Search & Filter */}
          <div className="mb-4 flex flex-wrap gap-2 items-center">
            <Input placeholder="ค้นหาชื่อ/ประเภทสวัสดิการ" value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} className="w-60" />
            <Input type="date" value={filter.dateFrom} onChange={e => setFilter(f => ({ ...f, dateFrom: e.target.value }))} />
            <Input type="date" value={filter.dateTo} onChange={e => setFilter(f => ({ ...f, dateTo: e.target.value }))} />
            <Input placeholder="ประเภทสวัสดิการ" value={filter.welfareType} onChange={e => setFilter(f => ({ ...f, welfareType: e.target.value }))} className="w-40" />
            <Button variant="outline" onClick={exportToCSV} className="ml-auto"><Download className="mr-2 h-4 w-4" />Export</Button>
          </div>
          {/* Bulk Actions */}
          {!showHistory && (
            <div className="mb-2">
              <Button variant="default" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleBulkApprove} disabled={selectedIds.length === 0}>อนุมัติทั้งหมด ({selectedIds.length})</Button>
            </div>
          )}
          {/* Request List Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><input type="checkbox" checked={selectedIds.length === filteredRequests.length && filteredRequests.length > 0} onChange={handleSelectAll} /></TableHead>
                  <TableHead>วันที่ยื่น</TableHead>
                  <TableHead>ชื่อพนักงาน</TableHead>
                  <TableHead>ประเภทสวัสดิการ</TableHead>
                  <TableHead>จำนวนเงิน</TableHead>
                  <TableHead>ผู้จัดการที่อนุมัติ</TableHead>
                  <TableHead>HR อนุมัติ</TableHead>
                  <TableHead>ไฟล์แนบ</TableHead>
                  <TableHead>ดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>{!showHistory && <input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => handleSelect(r.id)} />}</TableCell>
                    <TableCell>{format(new Date(r.created_at), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{r.employee_name}</TableCell>
                    <TableCell>{r.request_type}</TableCell>
                    <TableCell>{r.amount?.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}</TableCell>
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
                    <TableCell>{r.attachment_url || (r.attachments && r.attachments.length > 0) ? <FileText className="text-blue-600 inline" /> : '-'}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => openDetails(r)}><Eye className="h-4 w-4 mr-1" />ตรวจสอบ</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredRequests.length === 0 && <div className="text-center text-gray-500 py-6">ไม่มีรายการรอตรวจสอบ</div>}
          </div>
        </>
      )}

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>รายละเอียดคำขอ</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-2 text-sm">
              <div><b>ชื่อพนักงาน:</b> {selectedRequest.employee_name}</div>
              <div><b>ประเภทสวัสดิการ:</b> {selectedRequest.request_type}</div>
              <div><b>จำนวนเงิน:</b> {selectedRequest.amount?.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}</div>
              <div><b>วันที่ยื่น:</b> {format(new Date(selectedRequest.created_at), 'dd/MM/yyyy')}</div>
              <div><b>ผู้จัดการที่อนุมัติ:</b> {selectedRequest.manager_approver_name || selectedRequest.manager_name || '-'}</div>
              {selectedRequest.manager_approved_at && (
                <div><b>วันที่ผู้จัดการอนุมัติ:</b> {format(new Date(selectedRequest.manager_approved_at), 'dd/MM/yyyy HH:mm')}</div>
              )}
              <div><b>HR อนุมัติ:</b> {selectedRequest.hr_approver_name || 'อนุมัติแล้ว'}</div>
              {selectedRequest.hr_approved_at && (
                <div><b>วันที่ HR อนุมัติ:</b> {format(new Date(selectedRequest.hr_approved_at), 'dd/MM/yyyy HH:mm')}</div>
              )}
              <div><b>รายละเอียด:</b> {selectedRequest.details || '-'}</div>
              <div><b>ไฟล์แนบ:</b> {selectedRequest.attachment_url ? <a href={selectedRequest.attachment_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">ดูไฟล์</a> : (selectedRequest.attachments && selectedRequest.attachments.length > 0 ? selectedRequest.attachments.map((url, i) => <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline mr-2">ไฟล์ {i+1}</a>) : '-')}
              </div>
              <div><b>หมายเหตุจากผู้จัดการ:</b> {selectedRequest.manager_notes || '-'}</div>
              {/* Audit Trail */}
              <div className="bg-gray-100 rounded p-2 mt-2">
                <div><b>ประวัติการอนุมัติ</b></div>
                <div>- พนักงานยื่นคำขอ: {format(new Date(selectedRequest.created_at), 'dd/MM/yyyy HH:mm')}</div>
                {selectedRequest.manager_approver_name && selectedRequest.manager_approved_at && (
                  <div>- ผู้จัดการอนุมัติ: {selectedRequest.manager_approver_name} ({format(new Date(selectedRequest.manager_approved_at), 'dd/MM/yyyy HH:mm')}) {selectedRequest.manager_notes ? `(หมายเหตุ: ${selectedRequest.manager_notes})` : ''}</div>
                )}
                {selectedRequest.hr_approved_at && (
                  <div>- HR อนุมัติ: {selectedRequest.hr_approver_name || 'อนุมัติแล้ว'} ({format(new Date(selectedRequest.hr_approved_at), 'dd/MM/yyyy HH:mm')})</div>
                )}
              </div>
              <div className="flex flex-col gap-2 mt-2">
                <Button variant="default" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(selectedRequest.id)}><CheckCircle2 className="h-4 w-4 mr-1" />อนุมัติ</Button>
                <div>
                  <Input placeholder="เหตุผลการปฏิเสธ (จำเป็น)" value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                  <Button variant="destructive" className="mt-1" disabled={!rejectReason} onClick={() => handleReject(selectedRequest.id)}><XCircle className="h-4 w-4 mr-1" />ปฏิเสธ</Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">ปิด</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </Layout>
  );
};

export { AccountingReviewPage };
