import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar, Youtube, FileDown, Sparkles, ExternalLink } from 'lucide-react';
import { isValidYouTubeUrl, convertToYouTubeEmbed } from '@/utils/youtubeUtils';
import { generateAnnouncementHtmlWithAI, type OpenAIModel } from '@/services/openaiApi';
import { 
  getAllAnnouncements, 
  createAnnouncement, 
  updateAnnouncement, 
  deleteAnnouncement, 
  toggleAnnouncementStatus,
  type Announcement,
  type CreateAnnouncementData 
} from '@/services/announcementApi';

interface AnnouncementFormData {
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  type: 'system' | 'welfare' | 'training' | 'general';
  is_active: boolean;
  start_date: string;
  end_date: string;
  youtube_embed_url: string;
}

const initialFormData: AnnouncementFormData = {
  title: '',
  content: '',
  priority: 'medium',
  type: 'general',
  is_active: true,
  start_date: new Date().toISOString().split('T')[0],
  end_date: '',
  youtube_embed_url: ''
};

export const AnnouncementManagement = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AnnouncementFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<OpenAIModel>('gpt-4o-mini');

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await getAllAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const submitData: CreateAnnouncementData = {
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        type: formData.type,
        is_active: formData.is_active,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        youtube_embed_url: formData.youtube_embed_url || null,
        generated_html_content: generatedHtml || null
      };

      if (editingId) {
        await updateAnnouncement({ id: editingId, ...submitData });
      } else {
        await createAnnouncement(submitData);
      }

      await loadAnnouncements();
      resetForm();
      
      if (generatedHtml) {
        alert('บันทึกประกาศพร้อม HTML ที่ AI สร้างสำเร็จ!');
      }
    } catch (error) {
      console.error('Error saving announcement:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      type: announcement.type,
      is_active: announcement.is_active,
      start_date: announcement.start_date || '',
      end_date: announcement.end_date || '',
      youtube_embed_url: announcement.youtube_embed_url || ''
    });
    setGeneratedHtml(announcement.generated_html_content || null);
    setEditingId(announcement.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบประกาศนี้?')) {
      try {
        await deleteAnnouncement(id);
        await loadAnnouncements();
      } catch (error) {
        console.error('Error deleting announcement:', error);
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleAnnouncementStatus(id, !currentStatus);
      await loadAnnouncements();
    } catch (error) {
      console.error('Error toggling announcement status:', error);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setShowForm(false);
    setGeneratedHtml(null);
  };

  const handleGenerateHtmlWithAI = async () => {
    if (!formData.title || !formData.content) {
      alert('กรุณากรอกหัวข้อและเนื้อหาประกาศก่อน');
      return;
    }

    setGenerating(true);
    console.log('Starting HTML generation with model:', selectedModel);
    
    try {
      const html = await generateAnnouncementHtmlWithAI({
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        type: formData.type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        youtube_embed_url: formData.youtube_embed_url,
        model: selectedModel
      });
      
      console.log('HTML generated successfully, length:', html?.length);
      
      if (!html || html.length === 0) {
        throw new Error('Generated HTML is empty');
      }
      
      setGeneratedHtml(html);
      alert('สร้าง HTML สำเร็จ! คุณสามารถดูตัวอย่างหรือดาวน์โหลดได้');
    } catch (error: any) {
      console.error('Error generating HTML:', error);
      console.error('Error stack:', error.stack);
      
      // แสดง error message ที่ละเอียดขึ้น
      const errorMessage = error.message || 'ไม่สามารถสร้าง HTML ได้';
      alert(`เกิดข้อผิดพลาด (Model: ${selectedModel}):\n\n${errorMessage}\n\nกรุณาเปิด Console (F12) เพื่อดูรายละเอียดเพิ่มเติม`);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadGeneratedHtml = () => {
    if (!generatedHtml) return;
    
    const blob = new Blob([generatedHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `announcement-${formData.title.replace(/[^a-zA-Z0-9ก-๙]/g, '-')}-${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePreviewGeneratedHtml = () => {
    if (!generatedHtml) return;
    
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(generatedHtml);
      newWindow.document.close();
    }
  };

  const handleGenerateHtmlForAnnouncement = async (announcement: Announcement) => {
    const confirmed = confirm('ต้องการสร้าง HTML ด้วย AI สำหรับประกาศนี้หรือไม่?');
    if (!confirmed) return;

    setGenerating(true);
    try {
      const html = await generateAnnouncementHtmlWithAI({
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        type: announcement.type,
        start_date: announcement.start_date || undefined,
        end_date: announcement.end_date || undefined,
        youtube_embed_url: announcement.youtube_embed_url || undefined,
        model: selectedModel
      });

      // Auto download
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `announcement-${announcement.title.replace(/[^a-zA-Z0-9ก-๙]/g, '-')}-${Date.now()}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('สร้างและดาวน์โหลด HTML สำเร็จ!');
    } catch (error: any) {
      console.error('Error generating HTML:', error);
      alert(`เกิดข้อผิดพลาด: ${error.message || 'ไม่สามารถสร้าง HTML ได้'}`);
    } finally {
      setGenerating(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'system': return 'bg-blue-100 text-blue-800';
      case 'welfare': return 'bg-purple-100 text-purple-800';
      case 'training': return 'bg-orange-100 text-orange-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">กำลังโหลด...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการประกาศ</h1>
          <p className="text-gray-600">จัดการประกาศที่แสดงในหน้าแดชบอร์ด</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          เพิ่มประกาศใหม่
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'แก้ไขประกาศ' : 'เพิ่มประกาศใหม่'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">หัวข้อประกาศ</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">ประเภท</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">ทั่วไป</SelectItem>
                      <SelectItem value="system">ระบบ</SelectItem>
                      <SelectItem value="welfare">สวัสดิการ</SelectItem>
                      <SelectItem value="training">การอบรม</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">เนื้อหาประกาศ</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtube_embed_url" className="flex items-center gap-2">
                  <Youtube className="h-4 w-4 text-red-600" />
                  YouTube URL (ไม่บังคับ)
                </Label>
                <Input
                  id="youtube_embed_url"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... หรือ https://youtu.be/..."
                  value={formData.youtube_embed_url}
                  onChange={(e) => setFormData({ ...formData, youtube_embed_url: e.target.value })}
                />
                {formData.youtube_embed_url && !isValidYouTubeUrl(formData.youtube_embed_url) && (
                  <p className="text-sm text-red-600">กรุณาใส่ URL ของ YouTube ที่ถูกต้อง</p>
                )}
                {formData.youtube_embed_url && isValidYouTubeUrl(formData.youtube_embed_url) && (
                  <p className="text-sm text-green-600">✓ URL ถูกต้อง</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">ระดับความสำคัญ</Label>
                  <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">ต่ำ</SelectItem>
                      <SelectItem value="medium">กลาง</SelectItem>
                      <SelectItem value="high">สูง</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_date">วันที่เริ่มแสดง</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">วันที่สิ้นสุด</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">เปิดใช้งาน</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai_model" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  AI Model สำหรับ Generate HTML
                </Label>
                <Select value={selectedModel} onValueChange={(value: any) => setSelectedModel(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-5">
                      <div className="flex flex-col">
                        <span className="font-medium">🌟 GPT-5</span>
                        <span className="text-xs text-gray-500">ล่าสุด! คุณภาพสูงสุด, ฉลาดที่สุด</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="gpt-5-mini">
                      <div className="flex flex-col">
                        <span className="font-medium">⚡ GPT-5 Mini</span>
                        <span className="text-xs text-gray-500">รุ่นใหม่ล่าสุด, เร็วและคุ้มค่า</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="o1">
                      <div className="flex flex-col">
                        <span className="font-medium">🧠 o1</span>
                        <span className="text-xs text-gray-500">Reasoning model, คิดลึก วิเคราะห์ซับซ้อน</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="o1-mini">
                      <div className="flex flex-col">
                        <span className="font-medium">💡 o1-mini</span>
                        <span className="text-xs text-gray-500">Reasoning เร็ว, เหมาะงานทั่วไป</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="gpt-4o">
                      <div className="flex flex-col">
                        <span className="font-medium">GPT-4o</span>
                        <span className="text-xs text-gray-500">คุณภาพสูง ($2.50/1M tokens)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="gpt-4o-mini">
                      <div className="flex flex-col">
                        <span className="font-medium">GPT-4o Mini</span>
                        <span className="text-xs text-gray-500">เร็ว, ราคาถูก ($0.15/1M tokens) - แนะนำ</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="gpt-4-turbo">
                      <div className="flex flex-col">
                        <span className="font-medium">GPT-4 Turbo</span>
                        <span className="text-xs text-gray-500">สมดุล ($10/1M tokens)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="gpt-3.5-turbo">
                      <div className="flex flex-col">
                        <span className="font-medium">GPT-3.5 Turbo</span>
                        <span className="text-xs text-gray-500">ถูกที่สุด ($0.50/1M tokens)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Model ที่เลือก: <span className="font-medium">{selectedModel}</span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={submitting || generating}>
                  {submitting ? 'กำลังบันทึก...' : editingId ? 'อัปเดต' : 'บันทึก'}
                </Button>
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={handleGenerateHtmlWithAI}
                  disabled={!formData.title || !formData.content || generating}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {generating ? 'กำลังสร้าง...' : 'Generate HTML ด้วย AI'}
                </Button>
                {generatedHtml && (
                  <>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handlePreviewGeneratedHtml}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      ดูตัวอย่าง
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleDownloadGeneratedHtml}
                      className="flex items-center gap-2"
                    >
                      <FileDown className="h-4 w-4" />
                      ดาวน์โหลด HTML
                    </Button>
                  </>
                )}
                <Button type="button" variant="outline" onClick={resetForm}>
                  ยกเลิก
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {announcements.map((announcement) => (
          <Card key={announcement.id} className={`${!announcement.is_active ? 'opacity-60' : ''}`}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{announcement.title}</h3>
                    <Badge className={getPriorityColor(announcement.priority)}>
                      {announcement.priority === 'high' ? 'สูง' : 
                       announcement.priority === 'medium' ? 'กลาง' : 'ต่ำ'}
                    </Badge>
                    <Badge className={getTypeColor(announcement.type)}>
                      {announcement.type === 'system' ? 'ระบบ' :
                       announcement.type === 'welfare' ? 'สวัสดิการ' :
                       announcement.type === 'training' ? 'การอบรม' : 'ทั่วไป'}
                    </Badge>
                    {announcement.is_active ? (
                      <Badge className="bg-green-100 text-green-800">เปิดใช้งาน</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">ปิดใช้งาน</Badge>
                    )}
                  </div>
                  <p className="text-gray-700 mb-2">{announcement.content}</p>
                  {announcement.youtube_embed_url && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 text-sm text-red-600 mb-2">
                        <Youtube className="h-4 w-4" />
                        มีวิดีโอ YouTube แนบ
                      </div>
                      <div className="relative w-full max-w-md" style={{ paddingBottom: '56.25%', maxWidth: '400px' }}>
                        <iframe
                          className="absolute top-0 left-0 w-full h-full rounded-lg"
                          src={convertToYouTubeEmbed(announcement.youtube_embed_url) || announcement.youtube_embed_url}
                          title={`YouTube video: ${announcement.title}`}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )}
                  {announcement.generated_html_content && (
                    <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-purple-700 mb-2">
                        <Sparkles className="h-4 w-4" />
                        <span className="font-medium">มี HTML ที่ AI สร้างไว้แล้ว</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newWindow = window.open('', '_blank');
                            if (newWindow && announcement.generated_html_content) {
                              newWindow.document.write(announcement.generated_html_content);
                              newWindow.document.close();
                            }
                          }}
                          className="text-xs"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          ดูตัวอย่าง HTML
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (announcement.generated_html_content) {
                              const blob = new Blob([announcement.generated_html_content], { type: 'text/html;charset=utf-8' });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `announcement-${announcement.title.replace(/[^a-zA-Z0-9ก-๙]/g, '-')}-${Date.now()}.html`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              URL.revokeObjectURL(url);
                            }
                          }}
                          className="text-xs"
                        >
                          <FileDown className="h-3 w-3 mr-1" />
                          ดาวน์โหลด
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {announcement.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(announcement.start_date).toLocaleDateString('th-TH')}
                      </span>
                    )}
                    {announcement.end_date && (
                      <span>ถึง {new Date(announcement.end_date).toLocaleDateString('th-TH')}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateHtmlForAnnouncement(announcement)}
                    title="Generate HTML ด้วย AI"
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleStatus(announcement.id, announcement.is_active)}
                  >
                    {announcement.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(announcement)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(announcement.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {announcements.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">ยังไม่มีประกาศในระบบ</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};