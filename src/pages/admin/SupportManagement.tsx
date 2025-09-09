import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supportApi } from "@/services/supportApi";
import { SupportTicket } from "@/types";
import {
  HelpCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Calendar,
  MessageSquare,
  Filter,
  Search,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SupportManagement() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [stats, setStats] = useState<any>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  const statusColors = {
    open: 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800'
  };

  const statusLabels = {
    open: 'เปิด',
    'in-progress': 'กำลังดำเนินการ',
    resolved: 'แก้ไขแล้ว',
    closed: 'ปิด'
  };

  const priorityLabels = {
    low: 'ต่ำ',
    medium: 'ปานกลาง',
    high: 'สูง',
    urgent: 'เร่งด่วน'
  };

  const categoryLabels = {
    account: 'บัญชีผู้ใช้',
    system: 'ระบบงาน',
    network: 'เครือข่าย',
    printer: 'เครื่องพิมพ์',
    software: 'ซอฟต์แวร์',
    database: 'ฐานข้อมูล',
    bug: 'ข้อผิดพลาด',
    feature: 'ฟีเจอร์ใหม่',
    other: 'อื่นๆ'
  };

  useEffect(() => {
    loadTickets();
    loadStats();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, statusFilter, priorityFilter, categoryFilter, searchQuery]);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const allTickets = await supportApi.getAllTickets();
      setTickets(allTickets);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const ticketStats = await supportApi.getTicketStats();
      setStats(ticketStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const filterTickets = () => {
    let filtered = [...tickets];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.category === categoryFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTickets(filtered);
  };

  const handleStatusUpdate = async (ticketId: string, newStatus: SupportTicket['status']) => {
    try {
      await supportApi.updateTicketStatus(ticketId, newStatus);
      await loadTickets();
      await loadStats();
      
      // Update selected ticket if it's the one being updated
      if (selectedTicket?.id === ticketId) {
        const updatedTicket = tickets.find(t => t.id === ticketId);
        if (updatedTicket) {
          setSelectedTicket({ ...updatedTicket, status: newStatus });
        }
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">จัดการคำร้องขอความช่วยเหลือ</h1>
          <p className="text-gray-600">ติดตามและจัดการคำร้องจากผู้ใช้งาน</p>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">ทั้งหมด</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">เปิด</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">กำลังดำเนินการ</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">แก้ไขแล้ว</p>
                  <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">ปิด</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="tickets" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tickets">คำร้องทั้งหมด</TabsTrigger>
          <TabsTrigger value="analytics">สถิติ</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                ตัวกรอง
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">ค้นหา</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="ค้นหาหัวข้อหรือรายละเอียด"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">สถานะ</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      <SelectItem value="open">เปิด</SelectItem>
                      <SelectItem value="in-progress">กำลังดำเนินการ</SelectItem>
                      <SelectItem value="resolved">แก้ไขแล้ว</SelectItem>
                      <SelectItem value="closed">ปิด</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">ความสำคัญ</label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      <SelectItem value="urgent">เร่งด่วน</SelectItem>
                      <SelectItem value="high">สูง</SelectItem>
                      <SelectItem value="medium">ปานกลาง</SelectItem>
                      <SelectItem value="low">ต่ำ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">หมวดหมู่</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tickets List */}
          <Card>
            <CardHeader>
              <CardTitle>คำร้องขอความช่วยเหลือ ({filteredTickets.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                  <p className="text-gray-500">กำลังโหลด...</p>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="text-center py-8">
                  <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">ไม่พบคำร้องที่ตรงกับเงื่อนไข</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTickets.map((ticket) => (
                    <div key={ticket.id} className="border rounded-lg p-4 space-y-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{ticket.title}</h3>
                            <Badge className={cn("text-xs", priorityColors[ticket.priority])}>
                              {priorityLabels[ticket.priority]}
                            </Badge>
                            <Badge className={cn("text-xs", statusColors[ticket.status])}>
                              {statusLabels[ticket.status]}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {(ticket as any).profiles?.display_name || (ticket as any).profiles?.email || 'ไม่ระบุ'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(ticket.created_at).toLocaleDateString('th-TH')}
                            </span>
                            <span>{categoryLabels[ticket.category]}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {ticket.status === 'open' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(ticket.id, 'in-progress')}
                            >
                              รับเรื่อง
                            </Button>
                          )}
                          {ticket.status === 'in-progress' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(ticket.id, 'resolved')}
                            >
                              แก้ไขแล้ว
                            </Button>
                          )}
                          {ticket.status === 'resolved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(ticket.id, 'closed')}
                            >
                              ปิดเรื่อง
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stats && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>สถิติตามหมวดหมู่</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(stats.byCategory).map(([category, count]) => (
                        <div key={category} className="flex justify-between items-center">
                          <span>{categoryLabels[category as keyof typeof categoryLabels]}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>สถิติตามความสำคัญ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(stats.byPriority).map(([priority, count]) => (
                        <div key={priority} className="flex justify-between items-center">
                          <span>{priorityLabels[priority as keyof typeof priorityLabels]}</span>
                          <Badge 
                            className={cn("text-xs", priorityColors[priority as keyof typeof priorityColors])}
                          >
                            {count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Ticket Detail Modal would go here */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedTicket.title}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Badge className={cn("text-xs", priorityColors[selectedTicket.priority])}>
                  {priorityLabels[selectedTicket.priority]}
                </Badge>
                <Badge className={cn("text-xs", statusColors[selectedTicket.status])}>
                  {statusLabels[selectedTicket.status]}
                </Badge>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">รายละเอียด</h4>
                <p className="text-sm text-gray-600">{selectedTicket.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">หมวดหมู่:</span> {categoryLabels[selectedTicket.category]}
                </div>
                <div>
                  <span className="font-medium">สร้างเมื่อ:</span> {new Date(selectedTicket.created_at).toLocaleString('th-TH')}
                </div>
              </div>

              {selectedTicket.resolution && (
                <div>
                  <h4 className="font-medium mb-2">การแก้ไข</h4>
                  <p className="text-sm text-gray-600">{selectedTicket.resolution}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}