import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, Play } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getActiveAnnouncements, type Announcement } from '@/services/announcementApi';
import { convertToYouTubeEmbed } from '@/utils/youtubeUtils';
import { AnnouncementHTMLViewer } from '@/components/dashboard/AnnouncementHTMLViewer';

import { AccountingBenefitSummary } from '@/components/dashboard/AccountingBenefitSummary';
import { BirthdayCard } from '@/components/dashboard/BirthdayCard';
import { BenefitLimitSummary } from '@/components/dashboard/BenefitLimitSummary';
import { HolidayList } from '@/components/leave/HolidayList';
import { getHolidays } from '@/services/leaveApi';
import { Holiday } from '@/types';

const Dashboard = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const currentYear = new Date().getFullYear();

  // Load announcements and holidays in parallel
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

    const loadHolidays = async () => {
      try {
        const data = await getHolidays(currentYear);
        setHolidays(data);
      } catch (error) {
        console.error('Error loading holidays:', error);
      }
    };

    loadAnnouncements();
    loadHolidays();
  }, [currentYear]);

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
      <div className="animate-fade-in space-y-4 md:space-y-6">
        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Left Column */}
          <div className="space-y-4 md:space-y-6">
            {/* Company Announcements */}
            <div>
              <div className="bg-[#004F9F] text-white rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <h2 className="text-xl font-semibold">ประกาศจากบริษัท</h2>
              </div>
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

          {/* Right Column */}
          <div className="space-y-6">
            {/* Holiday List */}
            <HolidayList holidays={holidays} year={currentYear} />

            {/* Birthday Card */}
            <BirthdayCard />

            {/* Benefit Limit Summary */}
            <BenefitLimitSummary limit={4} />

            {/* Accounting Benefit Summary */}
            <AccountingBenefitSummary />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
