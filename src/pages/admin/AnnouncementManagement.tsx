import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar } from 'lucide-react';
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
}

const initialFormData: AnnouncementFormData = {
  title: '',
  content: '',
  priority: 'medium',
  type: 'general',
  is_active: true,
  start_date: new Date().toISOString().split('T')[0],
  end_date: ''
};

export const AnnouncementManagement = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AnnouncementFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);

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
        end_date: formData.end_date || null
      };

      if (editingId) {
        await updateAnnouncement({ id: editingId, ...submitData });
      } else {
        await createAnnouncement(submitData);
      }

      await loadAnnouncements();
      resetForm();
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
      end_date: announcement.end_date || ''
    });
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

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'กำลังบันทึก...' : editingId ? 'อัปเดต' : 'บันทึก'}
                </Button>
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