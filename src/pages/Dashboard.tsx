import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, Play } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getActiveAnnouncements, type Announcement } from '@/services/announcementApi';
import { convertToYouTubeEmbed } from '@/utils/youtubeUtils';
import { AnnouncementHTMLViewer } from '@/components/dashboard/AnnouncementHTMLViewer';

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Get user information with priority to profile data
  const displayName = profile?.display_name ||
    `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    "User";

  // Load announcements from API
  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        setLoading(true);
        const announcementsData = await getActiveAnnouncements();
        setAnnouncements(announcementsData);
      } catch (error) {
        console.error('Error loading announcements:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncements();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <Layout>
      <div className="animate-fade-in space-y-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            สวัสดี, {displayName}
          </h1>
          <p className="text-gray-600">
            ยินดีต้อนรับสู่ระบบจัดการสวัสดิการและบัญชี
          </p>
        </div>

        {/* Company Announcements */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5" />
            ประกาศจากบริษัท
          </h2>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">กำลังโหลดประกาศ...</div>
            ) : announcements.length > 0 ? (
              announcements.map((announcement) => (
                announcement.generated_html_content ? (
                  <AnnouncementHTMLViewer key={announcement.id} announcement={announcement} />
                ) : (
                  <Card key={announcement.id} className={`border-l-4 ${getPriorityColor(announcement.priority)}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          {announcement.title}
                          {announcement.youtube_embed_url && (
                            <Play className="h-4 w-4 text-red-600" />
                          )}
                        </h3>
                        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                          {new Date(announcement.created_at).toLocaleDateString('th-TH')}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm mb-3">{announcement.content}</p>
                      
                      {announcement.youtube_embed_url && (
                        <div className="mt-4">
                          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
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
                    </CardContent>
                  </Card>
                )
              ))
            ) : (
              <Card>
                <CardContent className="p-4 text-center text-gray-500">
                  ไม่มีประกาศในขณะนี้
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;