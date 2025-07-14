
export const WelcomeBanner = () => {
  return (
    <div className="hidden md:block md:w-1/2 bg-gradient-primary relative overflow-hidden java-effect">
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-lg text-white shadow-lg border border-white/20">
          <h2 className="text-3xl font-bold mb-4">ยินดีต้อนรับสู่ระบบสวัสดิการพนักงาน ICP Ladda</h2>
          <p className="mb-6">
            ระบบการจัดการสวัสดิการที่ครบวงจรสำหรับพนักงานทุกคน ช่วยให้การยื่นคำร้องขอสวัสดิการเป็นเรื่องง่าย สะดวก และรวดเร็ว
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">ง่ายต่อการใช้งาน</h3>
              <p className="text-sm">กรอกแบบฟอร์มออนไลน์ได้ทุกที่ทุกเวลา ไม่ต้องกรอกเอกสาร</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">ติดตามสถานะ</h3>
              <p className="text-sm">ดูสถานะคำร้องขอสวัสดิการได้แบบเรียลไทม์</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">การแจ้งเตือน</h3>
              <p className="text-sm">รับการแจ้งเตือนเมื่อมีการอัพเดทสถานะคำขอ</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">รายงานสรุป</h3>
              <p className="text-sm">ดูสรุปการใช้สวัสดิการของคุณได้อย่างชัดเจน</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Animated Objects */}
      <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-welfare-teal/20 animate-bounce" style={{ animationDuration: '6s' }}></div>
      <div className="absolute bottom-20 right-20 w-32 h-32 rounded-full bg-welfare-purple/20 animate-pulse-slow" style={{ animationDuration: '7s' }}></div>
      <div className="absolute top-1/3 right-10 w-16 h-16 rounded bg-welfare-orange/20 animate-spin-slow" style={{ animationDuration: '15s' }}></div>
    </div>
  );
};
