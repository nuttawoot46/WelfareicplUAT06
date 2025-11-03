import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Code } from 'lucide-react';
import type { Announcement } from '@/services/announcementApi';

interface AnnouncementHTMLViewerProps {
  announcement: Announcement;
}

export const AnnouncementHTMLViewer = ({ announcement }: AnnouncementHTMLViewerProps) => {
  const [showRaw, setShowRaw] = useState(false);

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

  const handleOpenInNewTab = () => {
    if (!announcement.generated_html_content) return;
    
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(announcement.generated_html_content);
      newWindow.document.close();
    }
  };

  if (!announcement.generated_html_content) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            
            
          </div>
          
        </div>

        {showRaw ? (
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-[600px]">
            <pre className="text-xs">
              <code>{announcement.generated_html_content}</code>
            </pre>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <iframe
              srcDoc={announcement.generated_html_content}
              className="w-full"
              style={{ 
                minHeight: '500px',
                height: 'auto',
                border: 'none'
              }}
              title={`HTML Preview: ${announcement.title}`}
              sandbox="allow-same-origin"
              onLoad={(e) => {
                const iframe = e.target as HTMLIFrameElement;
                if (iframe.contentWindow) {
                  try {
                    const height = iframe.contentWindow.document.body.scrollHeight;
                    iframe.style.height = `${height}px`;
                  } catch (error) {
                    // Fallback if can't access iframe content
                    iframe.style.height = '600px';
                  }
                }
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
