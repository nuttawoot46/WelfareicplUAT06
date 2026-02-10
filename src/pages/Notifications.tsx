
import { Layout } from '@/components/layout/Layout';
import { NotificationList } from '@/components/notifications/NotificationList';
import { ActivityHistoryPage } from '@/pages/ActivityHistoryPage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, History } from 'lucide-react';

const Notifications = () => {
  return (
    <Layout>
      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            การแจ้งเตือน
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            ประวัติกิจกรรม
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <NotificationList />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityHistoryPage />
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default Notifications;
