# N8N Chatbot Integration Summary

## การเพิ่ม N8N Chatbot ไว้ทุกหน้า

### สิ่งที่ได้ทำ:

1. **สร้าง MainLayout Component**
   - สร้างไฟล์ `src/components/layout/MainLayout.tsx`
   - รวม N8nChatbot component เข้าไปใน layout
   - ใช้สำหรับหน้าหลักทั้งหมด

2. **อัปเดต App.tsx**
   - เพิ่ม import MainLayout
   - ครอบ MainLayout ไว้ในทุก protected routes
   - ลบ imports ที่ไม่ได้ใช้ (ManagerPDFApprovalPage, HRPDFApprovalPage, WorkflowTimelinePage)

3. **อัปเดต Layout Component**
   - เพิ่ม N8nChatbot ใน `src/components/layout/Layout.tsx`
   - ใช้สำหรับหน้า Admin และ SuperAdmin ที่มี nested routes

4. **ปรับปรุง N8nChatbot Component**
   - เพิ่ม useRef เพื่อป้องกันการ initialize หลายครั้ง
   - เพิ่มการตรวจสอบ CSS และ styles ที่มีอยู่แล้ว
   - เพิ่ม @ts-ignore สำหรับ dynamic import
   - เพิ่ม timeout เพื่อให้ DOM พร้อม

### หน้าที่มี Chatbot:

#### ผ่าน MainLayout:
- `/dashboard` - Dashboard หลัก
- `/welfare-dashboard` - Dashboard สวัสดิการ
- `/accounting-dashboard` - Dashboard บัญชี
- `/forms` - หน้าฟอร์ม
- `/welfare-forms` - ฟอร์มสวัสดิการ
- `/accounting-forms` - ฟอร์มบัญชี
- `/notifications` - การแจ้งเตือน
- `/settings` - การตั้งค่า
- `/approve` - หน้าอนุมัติ
- `/hr-approve` - หน้าอนุมัติ HR
- `/accounting-review` - ตรวจสอบบัญชี
- `/welfare-accounting-review` - ตรวจสอบบัญชีสวัสดิการ
- `/general-accounting-review` - ตรวจสอบบัญชีทั่วไป
- `/support` - หน้าสนับสนุน

#### ผ่าน Layout Component:
- `/admin/*` - หน้า Admin ทั้งหมด
  - `/admin/users` - จัดการผู้ใช้
  - `/admin/support` - จัดการการสนับสนุน
  - `/admin/report` - รายงาน
- `/superadmin/*` - หน้า SuperAdmin ทั้งหมด
  - `/superadmin/dashboard` - Dashboard SuperAdmin
  - `/superadmin/users` - จัดการผู้ใช้
  - `/superadmin/system` - ตั้งค่าระบบ
  - `/superadmin/database` - จัดการฐานข้อมูล
  - `/superadmin/security` - ตั้งค่าความปลอดภัย
  - `/superadmin/audit` - บันทึกการตรวจสอบ
  - `/superadmin/report` - รายงาน

### หน้าที่ไม่มี Chatbot:
- `/` - หน้า Login (Public Route)
- `*` - หน้า 404 (NotFound)

### การตั้งค่า Chatbot:
- **Webhook URL**: `https://n8n.icpladda.com/webhook/f3fe133a-dc33-42df-8135-11962a4a2f31/chat`
- **ชื่อ Bot**: จินนี่
- **ข้อความต้อนรับ**: "สวัสดี ฉันชื่อ จินนี่ สามารถสอบถามข้อมูลสวัสดิการได้ 24 ชม."
- **หัวข้อ**: "สวัสดีชาว ICPLadda"
- **คำอธิบาย**: "คุณสามารถคุยกับฉันได้ 24 ชม."

### ผลลัพธ์:
✅ N8N Chatbot ถูกเพิ่มไว้ในทุกหน้าที่ผู้ใช้เข้าถึงได้หลังจาก login
✅ Chatbot จะปรากฏเป็น floating button ที่มุมล่างขวา
✅ ผู้ใช้สามารถสอบถามข้อมูลสวัสดิการได้ตลอด 24 ชั่วโมง
✅ การตั้งค่าสีและธีมตรงกับแบรนด์ ICPLadda