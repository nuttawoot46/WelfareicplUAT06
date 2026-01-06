# Vibrant Welfare Hub - Project Knowledge Base

## Overview
ระบบจัดการสวัสดิการพนักงานของ ICP Ladda Co., Ltd. เป็น Web Application สำหรับการเบิกสวัสดิการ, เงินทดลอง, ลางาน และการอนุมัติคำขอต่างๆ

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 18.3 + TypeScript |
| Build Tool | Vite |
| Routing | React Router DOM v6 |
| State Management | React Context API + TanStack Query v5 |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth + Microsoft Azure OAuth |
| UI Components | shadcn/ui + Radix UI + Tailwind CSS |
| Form Handling | React Hook Form + Zod validation |
| PDF Generation | jsPDF, html2canvas, html2pdf.js |
| Charts | Chart.js, Recharts |

---

## Project Structure

```
src/
├── components/           # UI Components
│   ├── admin/           # Admin panel components
│   ├── auth/            # Authentication (Login, ProtectedRoute)
│   ├── dashboard/       # Dashboard charts and cards
│   ├── forms/           # Welfare/Advance/Expense forms
│   ├── layout/          # MainLayout, Sidebar, Header
│   ├── leave/           # Leave system components
│   ├── pdf/             # PDF generator components
│   ├── signature/       # Digital signature capture
│   └── ui/              # shadcn UI primitives
├── context/             # React Context providers
│   ├── AuthContext.tsx           # User session & profile
│   ├── WelfareContext.tsx        # Welfare requests state
│   ├── InternalTrainingContext.tsx
│   ├── LeaveContext.tsx          # Leave system state
│   └── NotificationContext.tsx
├── pages/               # Route pages
│   ├── admin/          # Admin pages
│   └── superadmin/     # Super admin pages
├── services/            # API layer
│   ├── welfareApi.ts
│   ├── leaveApi.ts
│   ├── formVisibilityApi.ts
│   ├── announcementApi.ts
│   └── supportApi.ts
├── types/               # TypeScript definitions
│   └── index.ts        # All interfaces & types
├── utils/               # Utilities
│   ├── pdfManager.ts   # PDF generation
│   ├── advancePdfManager.ts
│   ├── expenseClearingPdfManager.ts
│   ├── internalTrainingPdfManager.ts
│   └── numberFormat.ts # Thai currency formatting
├── hooks/               # Custom React hooks
└── lib/                 # Library configs
    └── supabase.ts     # Supabase client
```

---

## Key Features

### 1. Welfare Benefits (สวัสดิการ)
ประเภทสวัสดิการที่รองรับ:
- **Wedding** (วิวาห์)
- **Training/External Training** (อบรมภายนอก)
- **Childbirth** (คลอดบุตร)
- **Funeral** (งานศพ)
- **Glasses & Dental** (แว่นตา/ทันตกรรม) - งบประมาณร่วมกัน
- **Fitness** (ออกกำลังกาย)
- **Medical** (รักษาพยาบาล)
- **Internal Training** (อบรมภายใน)

### 2. Advance Payment (เบิกเงินทดลอง)
- **AdvanceForm** - เบิกเงินทดลองสำหรับเดินทาง/ทำงานนอกสถานที่
- **GeneralAdvanceForm** - เบิกเงินทดลองทั่วไป
- **ExpenseClearingForm** - ปรับปรุงค่าใช้จ่าย (เชื่อมกับใบเบิกเงินทดลอง)
- **GeneralExpenseClearingForm** - ปรับปรุงค่าใช้จ่ายทั่วไป

### 3. Leave System (ระบบลางาน)
- หลายประเภทการลา (ลาป่วย, ลาพักร้อน, ลาไม่รับค่าจ้าง)
- ติดตามโควต้าลาคงเหลือ
- ปฏิทินวันหยุด (Office/Factory)
- รองรับลาครึ่งวัน (เช้า/บ่าย)
- ตรวจสอบการลาซ้ำซ้อน

### 4. Approval Workflow (ขั้นตอนอนุมัติ)
```
Employee Submit → Manager Approve → HR Approve → Accounting Approve → Completed
                                                        ↓
                               (ถ้า >10,000 บาท) → Special Approve
```

**Status Flow:**
- `pending_manager` → `pending_hr` → `pending_accounting` → `completed`
- สามารถ reject ได้ทุกขั้นตอน

### 5. Digital Signature & PDF
- เซ็นชื่อดิจิทัลผ่าน Canvas
- เก็บเป็น Base64 ใน Database
- สร้าง PDF พร้อมลายเซ็นอัตโนมัติ
- เก็บ PDF ใน Supabase Storage

---

## User Roles

| Role | Description | Access |
|------|-------------|--------|
| `employee` | พนักงานทั่วไป | เบิกสวัสดิการ, ลางาน |
| `manager` | หัวหน้าทีม | อนุมัติคำขอทีม |
| `hr` | ฝ่าย HR | อนุมัติทุกคำขอ |
| `accounting` | ฝ่ายบัญชี | อนุมัติการเงิน |
| `accountingandmanager` | บทบาทรวม | ทั้ง accounting และ manager |
| `admin` | ผู้ดูแลระบบ | จัดการระบบ |
| `superadmin` | Super Admin | สิทธิ์เต็ม |

---

## Database Tables (Supabase)

### Core Tables
- **Employee** - ข้อมูลพนักงาน, งบประมาณ, บทบาท
- **welfare_requests** - คำขอสวัสดิการ/เบิกเงิน/ค่าใช้จ่าย
- **leave_types** - ประเภทการลา (configurable)
- **holidays** - วันหยุดประจำปี
- **leave_balances** - โควต้าลาแต่ละปี
- **leave_requests** - คำขอลางาน
- **announcements** - ประกาศบริษัท
- **form_visibility** - การมองเห็นฟอร์ม

### Key Interfaces (src/types/index.ts)

```typescript
// ประเภทสวัสดิการ
type WelfareType =
  | "wedding" | "training" | "childbirth" | "funeral"
  | "glasses" | "dental" | "fitness" | "medical"
  | "internal_training" | "advance" | "general_advance"
  | "expense_clearing" | "general_expense_clearing"
  | "employment_approval";

// สถานะคำขอ
type StatusType =
  | "pending_manager" | "pending_hr" | "pending_accounting"
  | "pending_special_approval" | "completed" | "rejected";

// WelfareRequest - โครงสร้างหลัก
interface WelfareRequest {
  id: number;
  userId: string;
  userName: string;
  type: WelfareType;
  status: StatusType;
  amount: number;
  date: string;
  details: string;

  // Approval chain
  managerApproverId?: string;
  hrApproverId?: string;
  accountingApproverId?: string;

  // Signatures (Base64)
  userSignature?: string;
  managerSignature?: string;
  hrSignature?: string;

  pdfUrl?: string;

  // Type-specific fields...
}
```

---

## Context Providers

### AuthContext (src/context/AuthContext.tsx)
```typescript
// ข้อมูลที่ให้บริการ
- user: User | null           // Supabase user
- session: Session | null     // Auth session
- profile: EmployeeProfile    // Employee data + budgets
- signOut: () => void
- isLoading: boolean
```

### WelfareContext (src/context/WelfareContext.tsx)
```typescript
// ข้อมูลที่ให้บริการ
- welfareRequests: WelfareRequest[]
- benefitLimits: BenefitLimits
- submitRequest(request): Promise<void>
- updateStatus(id, status, comment): Promise<void>
- getRequestsByType(type): WelfareRequest[]
- refreshRequests(): Promise<void>
```

### LeaveContext (src/context/LeaveContext.tsx)
```typescript
// ข้อมูลที่ให้บริการ
- leaveTypes: LeaveType[]
- holidays: Holiday[]
- leaveBalances: LeaveBalance[]
- leaveRequests: LeaveRequest[]
- submitLeaveRequest(data): Promise<void>
- approveLeaveRequest(id, signature): Promise<void>
- getCalendarEvents(): CalendarEvent[]
```

---

## Routing (src/App.tsx)

### Protected Routes (ต้อง Login)
| Path | Page | Description |
|------|------|-------------|
| `/dashboard` | Dashboard | หน้าหลัก + ประกาศ |
| `/welfare-dashboard` | WelfareDashboard | สรุปสวัสดิการ |
| `/welfare-forms` | WelfareFormSelector | เลือกฟอร์มสวัสดิการ |
| `/forms` | Forms | ฟอร์มทั่วไป |
| `/approve` | ApprovalPage | อนุมัติ (Manager/HR) |
| `/accounting-approve` | AccountingApprovalPage | อนุมัติบัญชี |
| `/hr-approve` | HRApprovalPage | อนุมัติ HR |
| `/leave-calendar` | LeaveCalendarPage | ปฏิทินลางาน |
| `/leave-approve` | LeaveApprovalPage | อนุมัติการลา |
| `/admin/*` | Admin pages | จัดการระบบ |

### Public Routes
| Path | Page |
|------|------|
| `/` | Login/Index |

---

## Forms Guide

### Creating Welfare Request
1. User เลือกประเภทสวัสดิการใน `WelfareFormSelector`
2. กรอกข้อมูลในฟอร์มที่เกี่ยวข้อง
3. เซ็นชื่อดิจิทัล
4. Submit → สร้าง PDF → บันทึก DB
5. Status = `pending_manager`

### Approval Process
1. Manager เห็นคำขอใน `ApprovalPage`
2. ตรวจสอบข้อมูล → เซ็นชื่อ → Approve/Reject
3. ถ้า Approve → Status เปลี่ยนเป็น `pending_hr`
4. HR อนุมัติ → `pending_accounting`
5. Accounting อนุมัติ → `completed`

---

## PDF Generation

### PDF Managers (src/utils/)
| File | Purpose |
|------|---------|
| `pdfManager.ts` | Utility functions |
| `advancePdfManager.ts` | เบิกเงินทดลอง |
| `expenseClearingPdfManager.ts` | ปรับปรุงค่าใช้จ่าย |
| `internalTrainingPdfManager.ts` | อบรมภายใน |
| `externalTrainingPdfManager.ts` | อบรมภายนอก |
| `welfarePdfManager.ts` | สวัสดิการทั่วไป |

### PDF Components (src/components/pdf/)
- ใช้ `pdf-lib` สำหรับ annotate PDF
- รองรับภาษาไทย
- วางลายเซ็นตามตำแหน่งที่กำหนด

---

## API Services (src/services/)

### welfareApi.ts
```typescript
getBenefitLimits(userId): BenefitLimits
getEmployeeData(email): Employee
```

### leaveApi.ts
```typescript
// Leave Types
getLeaveTypes(): LeaveType[]
createLeaveType(data): LeaveType
updateLeaveType(id, data): LeaveType

// Holidays
getHolidays(year): Holiday[]
createHoliday(data): Holiday

// Leave Requests
submitLeaveRequest(data): LeaveRequest
approveLeaveRequest(id, signature): void
rejectLeaveRequest(id, reason): void

// Leave Balances
getLeaveBalances(employeeId): LeaveBalance[]
```

### formVisibilityApi.ts
```typescript
getFormVisibility(): FormVisibility[]
updateFormVisibility(formId, visible): void
```

---

## State Caching

- Welfare/Training requests: **5 นาที** cache
- Force refresh ด้วย `refreshRequests()`
- ใช้ timestamp เปรียบเทียบ

```typescript
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const fetchRequests = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && lastFetch && now - lastFetch < CACHE_DURATION) {
    return; // Use cached data
  }
  // Fetch from API...
};
```

---

## Common Patterns

### Amount Input with Formatting
```typescript
// ใช้ numberFormat.ts สำหรับ format เงิน
import { formatNumber, parseNumber } from '@/utils/numberFormat';

// Format on blur
const handleBlur = (value: string) => {
  const num = parseNumber(value);
  return formatNumber(num); // "1,234.56"
};
```

### Digital Signature Capture
```typescript
// SignaturePopup component
<SignaturePopup
  isOpen={showSignature}
  onClose={() => setShowSignature(false)}
  onSave={(signatureBase64) => {
    setSignature(signatureBase64);
  }}
/>
```

### Protected Route
```typescript
// ต้อง login
<ProtectedRoute>
  <MainLayout>
    <YourPage />
  </MainLayout>
</ProtectedRoute>

// ต้องมี role เฉพาะ
<RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
  <AdminPage />
</RoleProtectedRoute>
```

---

## Environment Variables

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_OPENAI_API_KEY=xxx  # สำหรับ AI announcements
```

---

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

---

## Important Files to Know

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main app + routing + providers |
| `src/types/index.ts` | All TypeScript interfaces |
| `src/context/AuthContext.tsx` | Authentication state |
| `src/context/WelfareContext.tsx` | Welfare requests state |
| `src/context/LeaveContext.tsx` | Leave system state |
| `src/components/layout/Sidebar.tsx` | Navigation menu |
| `src/components/forms/WelfareFormSelector.tsx` | Form selection UI |
| `src/pages/ApprovalPage.tsx` | Approval workflow UI |
| `src/services/leaveApi.ts` | Leave system API |
| `src/utils/pdfManager.ts` | PDF utilities |

---

## Database Migrations

อยู่ใน `supabase/migrations/`:
- `20251219000000_create_leave_system.sql` - สร้างระบบลางาน

---

## Notes for Future Development

1. **เพิ่มประเภทสวัสดิการใหม่**: เพิ่มใน `WelfareType` type และสร้าง form component ใหม่
2. **เพิ่ม Role ใหม่**: แก้ไขใน `rolePermissions.ts` และ Sidebar
3. **PDF Template ใหม่**: สร้างไฟล์ใน `src/utils/` pattern เดียวกับที่มี
4. **เพิ่ม Leave Type**: ผ่าน Admin panel หรือ database โดยตรง
