import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { FileText, Eye, CheckCircle2, XCircle, Download, Filter } from 'lucide-react';
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

  useEffect(() => {
    fetchRequests();
  }, []);

  // Toggle between pending and history
  const displayedRequests = showHistory ? requests : requests.filter(r => r.status === 'pending_accounting');

  useEffect(() => {
    filterRequests();
  }, [requests, filter, showHistory]);

  const fetchRequests = async () => {
    setIsLoading(true);
    // TODO: Replace with real query from supabase
    const { data, error } = await supabase
      .from('welfare_requests')
      .select('*')
      .eq('status', 'pending_accounting');
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
    await supabase.from('welfare_requests').update({ status: 'completed', accounting_id: profile?.employee_id, accounting_name: profile?.name, accounting_approved_at: new Date().toISOString() }).eq('id', id);
    fetchRequests();
    closeDetails();
  };

  const handleReject = async (id: number) => {
    if (!rejectReason) return;
    await supabase.from('welfare_requests').update({ status: 'rejected_accounting', manager_notes: rejectReason }).eq('id', id);
    fetchRequests();
    closeDetails();
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    await supabase.from('welfare_requests').update({ status: 'completed', accounting_id: profile?.employee_id, accounting_name: profile?.name, accounting_approved_at: new Date().toISOString() }).in('id', selectedIds);
    fetchRequests();
    setSelectedIds([]);
  };

  const exportToCSV = () => {
    if (!filteredRequests.length) return;
    const header = ['วันที่ยื่น', 'ชื่อพนักงาน', 'ประเภทสวัสดิการ', 'จำนวนเงิน', 'ผู้จัดการที่อนุมัติ', 'สถานะ'];
    const rows = filteredRequests.map(r => [
      format(new Date(r.created_at), 'dd MMM yyyy', { locale: th }),
      r.employee_name,
      r.request_type,
      r.amount?.toLocaleString('th-TH', { style: 'currency', currency: 'THB' }),
      r.manager_name || '',
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
          className={`px-4 py-2 rounded-t ${!showHistory ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setShowHistory(false)}
        >
          รายการรอตรวจสอบ
        </button>
        <button
          className={`px-4 py-2 rounded-t ${showHistory ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setShowHistory(true)}
        >
          ประวัติการขอ
        </button>
      </div>
      <h1 className="text-2xl font-bold mb-4">{showHistory ? 'ประวัติการขอ' : 'รายการรอตรวจสอบ (บัญชี)'}</h1>
      {/* Search & Filter */}
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <Input placeholder="ค้นหาชื่อ/ประเภทสวัสดิการ" value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} className="w-60" />
        <Input type="date" value={filter.dateFrom} onChange={e => setFilter(f => ({ ...f, dateFrom: e.target.value }))} />
        <Input type="date" value={filter.dateTo} onChange={e => setFilter(f => ({ ...f, dateTo: e.target.value }))} />
        <Input placeholder="ประเภทสวัสดิการ" value={filter.welfareType} onChange={e => setFilter(f => ({ ...f, welfareType: e.target.value }))} className="w-40" />
        <Button variant="outline" onClick={exportToCSV} className="ml-auto"><Download className="mr-2 h-4 w-4" />Export</Button>
      </div>
      {/* Bulk Actions */}
      <div className="mb-2">
        <Button variant="default" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleBulkApprove} disabled={selectedIds.length === 0}>อนุมัติทั้งหมด ({selectedIds.length})</Button>
      </div>
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
                <TableCell>{r.manager_name || '-'}</TableCell>
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
              <div><b>ผู้จัดการที่อนุมัติ:</b> {selectedRequest.manager_name || '-'}</div>
              <div><b>รายละเอียด:</b> {selectedRequest.details || '-'}</div>
              <div><b>ไฟล์แนบ:</b> {selectedRequest.attachment_url ? <a href={selectedRequest.attachment_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">ดูไฟล์</a> : (selectedRequest.attachments && selectedRequest.attachments.length > 0 ? selectedRequest.attachments.map((url, i) => <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline mr-2">ไฟล์ {i+1}</a>) : '-')}
              </div>
              <div><b>หมายเหตุจากผู้จัดการ:</b> {selectedRequest.manager_notes || '-'}</div>
              {/* Audit Trail (for demo, you can expand this as needed) */}
              <div className="bg-gray-100 rounded p-2 mt-2">
                <div><b>ประวัติการอนุมัติ</b></div>
                <div>- พนักงานยื่นคำขอ: {format(new Date(selectedRequest.created_at), 'dd/MM/yyyy HH:mm')}</div>
                <div>- ผู้จัดการอนุมัติ: {selectedRequest.manager_name || '-'} {selectedRequest.manager_notes ? `(หมายเหตุ: ${selectedRequest.manager_notes})` : ''}</div>
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
