import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/context/AuthContext';
import { PaymentNotification } from '@/types';
import { paymentNotificationApi } from '@/services/paymentNotificationApi';
import { formatNumberWithCommas } from '@/utils/numberFormat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Loader2, Eye, FileText, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function PaymentNotificationListPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const userRole = profile?.role?.toLowerCase() || '';
  const isAccounting = ['accounting', 'accountingandmanager', 'admin', 'superadmin'].includes(userRole);

  const [notifications, setNotifications] = useState<PaymentNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('my');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedNotification, setSelectedNotification] = useState<PaymentNotification | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState<number | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Fetch employee ID
  useEffect(() => {
    const fetchEmployeeId = async () => {
      if (!user?.email) return;
      try {
        const { data, error } = await (supabase
          .from('Employee')
          .select('id') as any)
          .eq('email_user', user.email)
          .single();

        if (!error && data) {
          setEmployeeId(data.id);
        }
      } catch (error) {
        console.error('Error fetching employee id:', error);
      }
    };
    fetchEmployeeId();
  }, [user?.email]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      let data: PaymentNotification[];
      if (activeTab === 'my' && employeeId) {
        data = await paymentNotificationApi.getMyNotifications(employeeId);
      } else {
        data = await paymentNotificationApi.getAllNotifications({
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          searchTerm: searchTerm || undefined,
        });
      }
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, employeeId, dateFrom, dateTo, searchTerm]);

  useEffect(() => {
    if (employeeId !== null || activeTab === 'all') {
      fetchNotifications();
    }
  }, [fetchNotifications, employeeId]);

  // Filter for "my" tab with local search
  const filteredNotifications = activeTab === 'my' && searchTerm
    ? notifications.filter(n =>
        n.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (n.run_number && n.run_number.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : notifications;

  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'เช็คฝากล่วงหน้า': return 'bg-purple-100 text-purple-800';
      case 'เครดิต': return 'bg-blue-100 text-blue-800';
      case 'เงินสด': return 'bg-green-100 text-green-800';
      case 'โอนเงิน': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'เช็ค': return 'bg-indigo-100 text-indigo-800';
      case 'โอนเงิน': return 'bg-teal-100 text-teal-800';
      case 'เงินสด': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const openDetail = (notification: PaymentNotification) => {
    setSelectedNotification(notification);
    setDetailsOpen(true);
  };

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">รายการแจ้งชำระเงิน</h1>
          <p className="text-gray-500 text-sm">รายการแจ้งการชำระเงินจากลูกค้า</p>
        </div>
        <Button
          onClick={() => navigate('/payment-notification')}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          แจ้งชำระเงินใหม่
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(1); }}>
        <TabsList className="mb-4">
          <TabsTrigger value="my">รายการของฉัน</TabsTrigger>
          {isAccounting && <TabsTrigger value="all">รายการทั้งหมด</TabsTrigger>}
        </TabsList>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="ค้นหาลูกค้า, เลขที่..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">จาก</span>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">ถึง</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
              className="w-40"
            />
          </div>
        </div>

        <TabsContent value="my">
          <NotificationTable
            notifications={paginatedNotifications}
            isLoading={isLoading}
            formatDate={formatDate}
            getConditionColor={getConditionColor}
            getTypeColor={getTypeColor}
            onViewDetail={openDetail}
          />
        </TabsContent>

        {isAccounting && (
          <TabsContent value="all">
            <NotificationTable
              notifications={paginatedNotifications}
              isLoading={isLoading}
              formatDate={formatDate}
              getConditionColor={getConditionColor}
              getTypeColor={getTypeColor}
              onViewDetail={openDetail}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            แสดง {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredNotifications.length)} จาก {filteredNotifications.length} รายการ
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              ก่อนหน้า
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              ถัดไป
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>รายละเอียดการแจ้งชำระเงิน</DialogTitle>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="เลขที่" value={selectedNotification.run_number || '-'} />
                <DetailItem label="วันที่แจ้ง" value={formatDate(selectedNotification.payment_date)} />
                <DetailItem label="ชื่อลูกค้า" value={selectedNotification.customer_name} />
                <DetailItem label="ทีมขาย" value={selectedNotification.team || '-'} />
                <DetailItem label="จำนวนเงิน" value={`${formatNumberWithCommas(selectedNotification.amount)} บาท`} />
                <DetailItem label="เงื่อนไขการชำระ" value={selectedNotification.payment_condition} />
                <DetailItem label="ประเภทการจ่ายชำระ" value={selectedNotification.payment_type} />
                <DetailItem label="ผู้แจ้ง" value={selectedNotification.employee_name} />
                {selectedNotification.transfer_date && (
                  <DetailItem label="วันที่โอน" value={formatDate(selectedNotification.transfer_date)} />
                )}
                {selectedNotification.check_date && (
                  <DetailItem label="วันที่เช็ค" value={formatDate(selectedNotification.check_date)} />
                )}
                {selectedNotification.late_payment_days > 0 && (
                  <DetailItem label="ชำระล่าช้า" value={`${selectedNotification.late_payment_days} วัน`} />
                )}
              </div>

              {selectedNotification.document_numbers.length > 0 && selectedNotification.document_numbers.some(d => d.value) && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">เลขที่เอกสาร</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedNotification.document_numbers
                      .filter(d => d.value)
                      .map((doc, idx) => (
                        <Badge key={idx} variant="outline" className="text-sm">
                          {doc.value}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}

              {selectedNotification.attachment_urls.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">เอกสารแนบ</p>
                  <div className="space-y-2">
                    {selectedNotification.attachment_urls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        ไฟล์แนบ #{idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedNotification.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">หมายเหตุ</p>
                  <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg">{selectedNotification.notes}</p>
                </div>
              )}

              <div className="text-xs text-gray-400 pt-2 border-t">
                สร้างเมื่อ: {formatDate(selectedNotification.created_at)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

// Sub-components
function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-sm text-gray-800 font-medium">{value}</p>
    </div>
  );
}

function NotificationTable({
  notifications,
  isLoading,
  formatDate,
  getConditionColor,
  getTypeColor,
  onViewDetail,
}: {
  notifications: PaymentNotification[];
  isLoading: boolean;
  formatDate: (d: string) => string;
  getConditionColor: (c: string) => string;
  getTypeColor: (t: string) => string;
  onViewDetail: (n: PaymentNotification) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-500">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">ไม่พบรายการแจ้งชำระเงิน</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-semibold">เลขที่</TableHead>
            <TableHead className="font-semibold">วันที่แจ้ง</TableHead>
            <TableHead className="font-semibold">ชื่อลูกค้า</TableHead>
            <TableHead className="font-semibold">ชื่อผู้แจ้ง</TableHead>
            <TableHead className="font-semibold text-right">จำนวนเงิน</TableHead>
            <TableHead className="font-semibold">เงื่อนไข</TableHead>
            <TableHead className="font-semibold">ประเภท</TableHead>
            <TableHead className="font-semibold">เลขที่เอกสาร</TableHead>
            <TableHead className="font-semibold text-center">รายละเอียด</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notifications.map((n) => (
            <TableRow key={n.id} className="hover:bg-gray-50">
              <TableCell className="font-mono text-sm">{n.run_number || '-'}</TableCell>
              <TableCell>{formatDate(n.payment_date)}</TableCell>
              <TableCell className="max-w-[200px] truncate" title={n.customer_name}>
                {n.customer_name}
              </TableCell>
              <TableCell>{n.employee_name || '-'}</TableCell>
              <TableCell className="text-right font-medium">
                {formatNumberWithCommas(n.amount)}
              </TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getConditionColor(n.payment_condition)}`}>
                  {n.payment_condition}
                </span>
              </TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(n.payment_type)}`}>
                  {n.payment_type}
                </span>
              </TableCell>
              <TableCell className="max-w-[150px] truncate text-sm" title={n.document_numbers.map(d => d.value).filter(Boolean).join(', ')}>
                {n.document_numbers.filter(d => d.value).length > 0
                  ? n.document_numbers.filter(d => d.value).map(d => d.value).join(', ')
                  : '-'
                }
              </TableCell>
              <TableCell className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDetail(n)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  ดู
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
