import React, { useState, useRef, DragEvent } from 'react';
import { Upload, X, Image as ImageIcon, FileImage, CheckCircle, Clock, AlertCircle, AlertTriangle } from 'lucide-react';
import { ImagePreview } from './ImagePreview';
import { validateImageFile, createImagePreview, formatFileSize } from '@/utils/fileUtils';
import './WorkflowTimeline.css';

interface TimelineItem {
  id: string;
  title: string;
  description: string;
  date: string;
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  image?: string;
}

interface WorkflowTimelineProps {
  items: TimelineItem[];
  onItemUpdate: (id: string, updates: Partial<TimelineItem>) => void;
  onImageUpload: (id: string, file: File) => void;
}

export const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({
  items,
  onItemUpdate,
  onImageUpload
}) => {
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  const [uploadingItems, setUploadingItems] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleDragOver = (e: DragEvent<HTMLDivElement>, itemId: string) => {
    e.preventDefault();
    setDraggedOver(itemId);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDraggedOver(null);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>, itemId: string) => {
    e.preventDefault();
    setDraggedOver(null);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFile(itemId, files[0]);
    }
  };

  const handleFileSelect = async (itemId: string, file: File) => {
    if (file) {
      await processFile(itemId, file);
    }
  };

  const processFile = async (itemId: string, file: File) => {
    // Clear previous errors
    setErrors(prev => ({ ...prev, [itemId]: '' }));

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setErrors(prev => ({ ...prev, [itemId]: validation.error || 'ไฟล์ไม่ถูกต้อง' }));
      return;
    }

    try {
      // Set uploading state
      setUploadingItems(prev => new Set([...prev, itemId]));

      // Process the file
      await onImageUpload(itemId, file);
    } catch (error) {
      setErrors(prev => ({ 
        ...prev, 
        [itemId]: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปโหลด' 
      }));
    } finally {
      // Clear uploading state
      setUploadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleRemoveImage = (itemId: string) => {
    onItemUpdate(itemId, { image: undefined });
  };

  const getStatusColor = (status: TimelineItem['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-blue-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: TimelineItem['status']) => {
    switch (status) {
      case 'completed':
        return 'เสร็จสิ้น';
      case 'in-progress':
        return 'กำลังดำเนินการ';
      case 'rejected':
        return 'ถูกปฏิเสธ';
      default:
        return 'รอดำเนินการ';
    }
  };

  return (
    <div className="workflow-timeline">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 timeline-line"></div>

        {items.map((item, index) => (
          <div key={item.id} className="timeline-item relative flex items-start mb-8">
            {/* Timeline dot with icon */}
            <div className={`relative z-10 w-8 h-8 rounded-full ${getStatusColor(item.status)} border-4 border-white shadow-md flex items-center justify-center ${
              item.status === 'in-progress' ? 'status-dot in-progress' : ''
            }`}>
              {item.status === 'completed' && <CheckCircle className="w-4 h-4 text-white" />}
              {item.status === 'in-progress' && <Clock className="w-4 h-4 text-white" />}
              {item.status === 'rejected' && <AlertCircle className="w-4 h-4 text-white" />}
            </div>

            {/* Timeline content */}
            <div className="ml-6 flex-1">
              <div className="timeline-content bg-white rounded-lg shadow-md border border-gray-200 p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    <p className="text-xs text-gray-500 mt-2">{item.date}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.status === 'completed' ? 'bg-green-100 text-green-800' :
                    item.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                    item.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getStatusText(item.status)}
                  </span>
                </div>

                {/* Image drop zone */}
                <div className="mt-4">
                  {item.image ? (
                    <ImagePreview
                      src={item.image}
                      alt={`${item.title} - แนบไฟล์`}
                      onRemove={() => handleRemoveImage(item.id)}
                      className="max-w-md"
                    />
                  ) : (
                    <div
                      className={`drop-zone border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 ${
                        draggedOver === item.id
                          ? 'drag-over border-blue-400 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onDragOver={(e) => handleDragOver(e, item.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, item.id)}
                    >
                      <div className="flex flex-col items-center">
                        <div className="mb-4">
                          {draggedOver === item.id ? (
                            <FileImage className="w-12 h-12 text-blue-500" />
                          ) : (
                            <ImageIcon className="w-12 h-12 text-gray-400" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {draggedOver === item.id
                            ? 'วางรูปภาพที่นี่'
                            : 'ลากและวางรูปภาพที่นี่'}
                        </p>
                        <p className="text-xs text-gray-500 mb-4">หรือ</p>
                        <button
                          onClick={() => fileInputRefs.current[item.id]?.click()}
                          className="upload-button inline-flex items-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-all duration-200"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          เลือกไฟล์
                        </button>
                        <input
                          ref={(el) => (fileInputRefs.current[item.id] = el)}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileSelect(item.id, file);
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};