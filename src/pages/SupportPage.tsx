import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { supportApi } from "@/services/supportApi";
import { SupportTicket, CreateTicketData } from "@/types";
import {
  HelpCircle,
  MessageSquare,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertTriangle,
  Bug,
  Lightbulb,
  Settings,
  Monitor,
  Wifi,
  Printer,
  Shield,
  Database,
  Send,
  FileText,
  ExternalLink,
  Bot,
  Users,
  User,
  File,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SupportPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState("contact");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [ticketForm, setTicketForm] = useState<CreateTicketData>({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium'
  });

  // Tickets state
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  const categories = [
    { id: 'account', name: 'บัญชีผู้ใช้', icon: Shield },
    { id: 'system', name: 'ระบบงาน', icon: Monitor },
    { id: 'network', name: 'เครือข่าย/อินเทอร์เน็ต', icon: Wifi },
    { id: 'printer', name: 'เครื่องพิมพ์', icon: Printer },
    { id: 'software', name: 'โปรแกรม/ซอฟต์แวร์', icon: Settings },
    { id: 'database', name: 'ฐานข้อมูล', icon: Database },
    { id: 'bug', name: 'รายงานข้อผิดพลาด', icon: Bug },
    { id: 'feature', name: 'ขอฟีเจอร์ใหม่', icon: Lightbulb },
    { id: 'other', name: 'อื่นๆ', icon: HelpCircle }
  ];

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

  // Load user tickets
  useEffect(() => {
    if (user?.id && activeTab === 'status') {
      loadUserTickets();
    }
  }, [user?.id, activeTab]);

  const loadUserTickets = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const userTickets = await supportApi.getUserTickets(user.id);
      setTickets(userTickets);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await supportApi.createTicket(ticketForm);
      
      setSubmitSuccess(true);
      setTicketForm({
        title: '',
        description: '',
        category: 'other',
        priority: 'medium'
      });
      
      // Reload tickets if on status tab
      if (activeTab === 'status') {
        loadUserTickets();
      }
      
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error('Error submitting ticket:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="w-full max-w-4xl mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
              <HelpCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
              ศูนย์ช่วยเหลือและสนับสนุน
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              ติดต่อฝ่าย IT และขอความช่วยเหลือเกี่ยวกับระบบงาน เราพร้อมช่วยเหลือคุณตลอด 24 ชั่วโมง
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex justify-center mb-6">
              <TabsList className="grid w-full max-w-2xl grid-cols-4 h-12 bg-white/90 backdrop-blur-sm border shadow-lg rounded-xl">
                <TabsTrigger 
                  value="contact" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white font-medium"
                >
                  ติดต่อเรา
                </TabsTrigger>
                <TabsTrigger 
                  value="ticket"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white font-medium"
                >
                  แจ้งปัญหา
                </TabsTrigger>
                <TabsTrigger 
                  value="status"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white font-medium"
                >
                  สถานะคำร้อง
                </TabsTrigger>
                <TabsTrigger 
                  value="faq"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white font-medium"
                >
                  คำถามที่พบบ่อย
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Contact Information Tab */}
            <TabsContent value="contact" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Contact Methods */}
                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="p-1.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                        <Phone className="h-4 w-4 text-white" />
                      </div>
                      ช่องทางการติดต่อ
                    </CardTitle>
                    <CardDescription className="text-sm">
                      เลือกช่องทางที่สะดวกสำหรับคุณ
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 hover:shadow-md transition-all duration-200">
                      <div className="p-2 bg-blue-600 rounded-full">
                        <Phone className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-blue-900 text-sm">โทรศัพท์</p>
                        <p className="text-blue-700 text-xs">02-123-4567 ต่อ 101</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200 hover:shadow-md transition-all duration-200">
                      <div className="p-2 bg-green-600 rounded-full">
                        <Mail className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-green-900 text-sm">อีเมล</p>
                        <p className="text-green-700 text-xs">it@icpladda.com</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200 hover:shadow-md transition-all duration-200">
                      <div className="p-2 bg-purple-600 rounded-full">
                        <MessageSquare className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-purple-900 text-sm">Line</p>
                        <p className="text-purple-700 text-xs">nutbbc18</p>
                      </div>
                    </div>

                    
                  </CardContent>
                </Card>

                {/* Working Hours */}
                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="p-1.5 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg">
                        <Clock className="h-4 w-4 text-white" />
                      </div>
                      เวลาทำการ
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg border border-green-200">
                        <span className="font-medium text-green-900 text-sm">จันทร์ - ศุกร์</span>
                        <span className="font-bold text-green-700 text-sm">08:30 - 17:30</span>
                      </div>
                      
                    </div>
                    
                    <Alert className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800 font-medium text-sm">
                        สำหรับปัญหาเร่งด่วนนอกเวลาทำการ กรุณาโทร <span className="font-bold">082-991-4578</span>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="max-w-4xl mx-auto">
                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="p-1.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                        <Settings className="h-4 w-4 text-white" />
                      </div>
                      การดำเนินการด่วน
                    </CardTitle>
                    <CardDescription className="text-sm">
                      ปัญหาที่พบบ่อยและวิธีแก้ไขเบื้องต้น
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                    
                    
                    <Link to="/user-guide">
                      <Button
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-center gap-2 border-2 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 group w-full"
                      >
                        <div className="p-2 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
                          <FileText className="h-5 w-5 text-purple-600" />
                        </div>
                        <span className="font-medium text-sm">คู่มือการใช้งาน</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
              </div>
            </TabsContent>

            {/* Submit Ticket Tab */}
            <TabsContent value="ticket" className="space-y-6">
              <div className="max-w-4xl mx-auto">
                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader className="pb-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-red-600 to-pink-600 rounded-full mb-4 mx-auto">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl">แจ้งปัญหาหรือขอความช่วยเหลือ</CardTitle>
                  <CardDescription className="text-base max-w-2xl mx-auto">
                    กรุณากรอกข้อมูลให้ครบถ้วนเพื่อให้เราสามารถช่วยเหลือคุณได้อย่างรวดเร็ว
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  {submitSuccess && (
                    <Alert className="mb-8 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <AlertDescription className="text-green-800 font-medium text-base">
                        ✅ ส่งคำร้องเรียบร้อยแล้ว! เราจะติดต่อกลับภายใน 24 ชั่วโมง
                      </AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleSubmitTicket} className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          ชื่อผู้แจ้ง
                        </label>
                        <Input 
                          value={profile?.display_name || `${profile?.first_name} ${profile?.last_name}` || ''}
                          disabled
                          className="bg-gray-50 border-gray-200 h-12 text-base"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          อีเมล
                        </label>
                        <Input 
                          value={user?.email || ''}
                          disabled
                          className="bg-gray-50 border-gray-200 h-12 text-base"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        หัวข้อปัญหา *
                      </label>
                      <Input
                        value={ticketForm.title}
                        onChange={(e) => setTicketForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="สรุปปัญหาในหัวข้อสั้นๆ เช่น ไม่สามารถเข้าสู่ระบบได้"
                        required
                        className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        หมวดหมู่ *
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {categories.map((category) => {
                          const Icon = category.icon;
                          const isSelected = ticketForm.category === category.id;
                          return (
                            <Button
                              key={category.id}
                              type="button"
                              variant={isSelected ? "default" : "outline"}
                              className={cn(
                                "h-auto p-4 flex flex-col items-center gap-3 transition-all duration-200",
                                isSelected 
                                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg" 
                                  : "hover:border-blue-300 hover:bg-blue-50"
                              )}
                              onClick={() => setTicketForm(prev => ({ ...prev, category: category.id }))}
                            >
                              <Icon className="h-5 w-5" />
                              <span className="text-xs font-medium text-center leading-tight">{category.name}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        ระดับความสำคัญ *
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { value: 'low', label: 'ต่ำ', color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-50 border-green-200' },
                          { value: 'medium', label: 'ปานกลาง', color: 'from-yellow-500 to-amber-500', bgColor: 'bg-yellow-50 border-yellow-200' },
                          { value: 'high', label: 'สูง', color: 'from-orange-500 to-red-500', bgColor: 'bg-orange-50 border-orange-200' },
                          { value: 'urgent', label: 'เร่งด่วน', color: 'from-red-500 to-pink-500', bgColor: 'bg-red-50 border-red-200' }
                        ].map((priority) => {
                          const isSelected = ticketForm.priority === priority.value;
                          return (
                            <Button
                              key={priority.value}
                              type="button"
                              variant="outline"
                              className={cn(
                                "h-12 font-medium transition-all duration-200",
                                isSelected 
                                  ? `bg-gradient-to-r ${priority.color} text-white border-0 shadow-lg` 
                                  : `${priority.bgColor} hover:shadow-md`
                              )}
                              onClick={() => setTicketForm(prev => ({ ...prev, priority: priority.value as any }))}
                            >
                              {priority.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        รายละเอียดปัญหา *
                      </label>
                      <Textarea
                        value={ticketForm.description}
                        onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="อธิบายปัญหาที่พบ ขั้นตอนที่ทำ และข้อผิดพลาดที่เกิดขึ้น&#10;&#10;ตัวอย่าง:&#10;- ปัญหาที่เกิดขึ้น: ไม่สามารถเข้าสู่ระบบได้&#10;- ขั้นตอนที่ทำ: กรอกอีเมลและรหัสผ่าน แล้วกดเข้าสู่ระบบ&#10;- ข้อผิดพลาด: ขึ้นข้อความ 'Invalid credentials'"
                        rows={8}
                        required
                        className="text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                      />
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800 font-medium mb-2">💡 เคล็ดลับการแจ้งปัญหา:</p>
                        <ul className="text-xs text-blue-700 space-y-1">
                          <li>• ระบุข้อความ error ที่ปรากฏ (ถ้ามี)</li>
                          <li>• อธิบายขั้นตอนที่ทำก่อนเกิดปัญหา</li>
                          <li>• ระบุเบราว์เซอร์และอุปกรณ์ที่ใช้</li>
                          <li>• แนบภาพหน้าจอ (ถ้าเป็นไปได้)</li>
                        </ul>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200" 
                      disabled={isSubmitting || !ticketForm.title || !ticketForm.category || !ticketForm.description}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                          กำลังส่งคำร้อง...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5 mr-3" />
                          ส่งคำร้องขอความช่วยเหลือ
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
              </div>
            </TabsContent>

            {/* Ticket Status Tab */}
            <TabsContent value="status" className="space-y-6">
              <div className="max-w-4xl mx-auto">
                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader className="pb-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-600 to-teal-600 rounded-full mb-4 mx-auto">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl">สถานะคำร้องของคุณ</CardTitle>
                  <CardDescription className="text-base">
                    ติดตามความคืบหน้าของคำร้องที่ส่งไว้
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  {isLoading ? (
                    <div className="text-center py-16">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6" />
                      <p className="text-gray-500 text-lg">กำลังโหลดข้อมูล...</p>
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                        <HelpCircle className="h-10 w-10 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">ยังไม่มีคำร้องที่ส่งไว้</h3>
                      <p className="text-gray-500 mb-6">เมื่อคุณส่งคำร้องขอความช่วยเหลือ จะแสดงสถานะที่นี่</p>
                      <Button 
                        onClick={() => setActiveTab('ticket')}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        แจ้งปัญหาใหม่
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {tickets.map((ticket) => (
                        <div key={ticket.id} className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">{ticket.title}</h3>
                              <p className="text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              <Badge className={cn("text-xs font-medium px-3 py-1", priorityColors[ticket.priority])}>
                                {ticket.priority === 'low' && 'ต่ำ'}
                                {ticket.priority === 'medium' && 'ปานกลาง'}
                                {ticket.priority === 'high' && 'สูง'}
                                {ticket.priority === 'urgent' && 'เร่งด่วน'}
                              </Badge>
                              <Badge className={cn("text-xs font-medium px-3 py-1", statusColors[ticket.status])}>
                                {ticket.status === 'open' && 'เปิด'}
                                {ticket.status === 'in-progress' && 'กำลังดำเนินการ'}
                                {ticket.status === 'resolved' && 'แก้ไขแล้ว'}
                                {ticket.status === 'closed' && 'ปิด'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-200">
                            <span className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              สร้างเมื่อ: {new Date(ticket.created_at).toLocaleDateString('th-TH', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <span className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              อัปเดตล่าสุด: {new Date(ticket.updated_at).toLocaleDateString('th-TH', {
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              </div>
            </TabsContent>

            {/* FAQ Tab */}
            <TabsContent value="faq" className="space-y-6">
              <div className="max-w-4xl mx-auto">
                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader className="pb-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full mb-4 mx-auto">
                    <Lightbulb className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl">คำถามที่พบบ่อย (FAQ)</CardTitle>
                  <CardDescription className="text-base">
                    คำตอบสำหรับปัญหาที่พบบ่อยในการใช้งานระบบ
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8 space-y-6">
                  {[
                    {
                      question: "ลืมรหัสผ่านเข้าระบบ",
                      answer: "คลิกที่ 'ลืมรหัสผ่าน' ในหน้าเข้าสู่ระบบ หรือติดต่อฝ่าย IT เพื่อขอรีเซ็ตรหัสผ่าน",
                      icon: Shield
                    },
                    {
                      question: "ไม่สามารถอัปโหลดไฟล์ได้",
                      answer: "ตรวจสอบขนาดไฟล์ (ไม่เกิน 10MB) และประเภทไฟล์ที่รองรับ (PDF, JPG, PNG, DOC, DOCX)",
                      icon: File
                    },
                    {
                      question: "ระบบช้าหรือค้าง",
                      answer: "ลองรีเฟรชหน้าเว็บ หรือล้าง cache ของเบราว์เซอร์ หากยังไม่ได้ให้แจ้งฝ่าย IT",
                      icon: Monitor
                    },
                    {
                      question: "ไม่เห็นเมนูบางส่วน",
                      answer: "อาจเป็นเรื่องสิทธิ์การเข้าถึง กรุณาติดต่อผู้ดูแลระบบเพื่อตรวจสอบสิทธิ์ของคุณ",
                      icon: Users
                    }
                  ].map((faq, index) => {
                    const Icon = faq.icon;
                    return (
                      <div key={index} className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200">
                        <h3 className="font-semibold mb-3 flex items-center gap-3 text-gray-900">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Icon className="h-5 w-5 text-blue-600" />
                          </div>
                          {faq.question}
                        </h3>
                        <p className="text-gray-600 ml-11 leading-relaxed">{faq.answer}</p>
                      </div>
                    );
                  })}
                  
                  <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <ExternalLink className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-lg font-semibold text-blue-900">คู่มือการใช้งาน</span>
                    </div>
                    <p className="text-blue-800 mb-4 leading-relaxed">
                      ดาวน์โหลดคู่มือการใช้งานระบบฉบับเต็ม พร้อมคำแนะนำและเทคนิคการใช้งานต่างๆ
                    </p>
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0">
                      <FileText className="h-4 w-4 mr-2" />
                      ดาวน์โหลด PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}