import React from 'react';

const AuthCallback = () => {
  // คอมโพเนนต์นี้ไม่ต้องทำอะไรเลย นอกจากแสดงข้อความรอ
  // Logic การจัดการ Session และการเปลี่ยนหน้าทั้งหมด
  // จะถูกควบคุมโดย onAuthStateChange listener ใน AuthContext ของคุณ

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">กำลังตรวจสอบการยืนยันตัวตน...</h1>
        <p className="text-gray-600">กรุณารอสักครู่ ระบบกำลังนำท่านไปยังหน้าหลัก</p>
        {/* คุณสามารถเพิ่ม Spinner สวยๆ ตรงนี้ได้ */}
      </div>
    </div>
  );
};

export default AuthCallback;