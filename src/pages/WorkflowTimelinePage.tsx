import React, { useState } from 'react';
import { WorkflowTimeline } from '@/components/workflow/WorkflowTimeline';
import { DragDropDemo } from '@/components/workflow/DragDropDemo';
import { ArrowLeft, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TimelineItem {
  id: string;
  title: string;
  description: string;
  date: string;
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  image?: string;
}

export default function WorkflowTimelinePage() {
  const [viewMode, setViewMode] = useState<'demo' | 'simple'>('demo');

  const handleItemUpdate = (id: string, updates: Partial<TimelineItem>) => {
    setTimelineItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const handleImageUpload = async (id: string, file: File) => {
    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // สร้าง URL สำหรับแสดงรูปภาพ (ในการใช้งานจริงควรอัปโหลดไปยัง server)
      const imageUrl = URL.createObjectURL(file);
      
      handleItemUpdate(id, { image: imageUrl });
      
      // แสดงข้อความแจ้งเตือน
      const item = timelineItems.find(item => item.id === id);
      console.log(`✅ อัปโหลดรูปภาพสำเร็จสำหรับขั้นตอน: ${item?.title}`);
      console.log(`📁 ขนาดไฟล์: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`🖼️ ประเภทไฟล์: ${file.type}`);
      
      // ในการใช้งานจริง ควรอัปโหลดไฟล์ไปยัง server หรือ cloud storage
      // const uploadedUrl = await uploadToSupabase(file, 'workflow-images', `${id}/${file.name}`);
      // handleItemUpdate(id, { image: uploadedUrl });
      
    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ:', error);
      throw error; // Re-throw to be handled by the component
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับ
          </Button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Workflow Timeline
              </h1>
              <p className="text-gray-600">
                ติดตามสถานะการดำเนินงานและแนบรูปภาพประกอบแต่ละขั้นตอน
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'demo' ? 'default' : 'outline'}
                onClick={() => setViewMode('demo')}
                size="sm"
              >
                <Zap className="w-4 h-4 mr-2" />
                โหมดสาธิต
              </Button>
              <Button
                variant={viewMode === 'simple' ? 'default' : 'outline'}
                onClick={() => setViewMode('simple')}
                size="sm"
              >
                โหมดธรรมดา
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'demo' ? (
          <DragDropDemo />
        ) : (
          <SimpleWorkflowView />
        )}
      </div>
    </div>
  );
}