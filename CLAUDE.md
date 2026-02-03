# Vibrant Welfare Hub - Project Knowledge Base

## Overview
ระบบจัดการสวัสดิการพนักงานของ ICP Ladda Co., Ltd. เป็น Web Application สำหรับการเบิกสวัสดิการ, เงินทดลอง, ลางาน และการอนุมัติคำขอต่างๆ

**Project Statistics:**
- Total TypeScript/TSX Files: 209
- Components: 119
- Pages/Routes: 44
- Context Providers: 5
- Service APIs: 9
- Custom Hooks: 6

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 18.3 + TypeScript (Strict Mode) |
| Build Tool | Vite + SWC |
| Routing | React Router DOM v6 |
| State Management | React Context API + TanStack Query v5 |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth + Microsoft Azure OAuth |
| UI Components | shadcn/ui + Radix UI + Tailwind CSS |
| Form Handling | React Hook Form + Zod validation |
| PDF Generation | jsPDF, pdf-lib, html2canvas, html2pdf.js |
| Charts | Chart.js, Recharts |
| Animation | Framer Motion |
| Icons | Lucide React |

---

## Project Structure

```
vibrant-welfare-hub/
├── src/
│   ├── components/              # 119 UI Components
│   │   ├── admin/               # Admin panel components
│   │   ├── animation/           # Loader, TreeAnimation
│   │   ├── auth/                # ProtectedRoute, RoleProtectedRoute
│   │   ├── chatbot/             # N8n chatbot integration
│   │   ├── dashboard/           # Dashboard cards & charts (12 files)
│   │   ├── effects/             # Particles, AnimatedBorderShadow
│   │   ├── forms/               # 12 welfare/advance/expense forms
│   │   ├── layout/              # MainLayout, Sidebar, Header
│   │   ├── leave/               # Leave system components
│   │   ├── notifications/       # NotificationBadge, NotificationList
│   │   ├── pdf/                 # 12 specialized PDF generators
│   │   ├── signature/           # SignaturePopup, SignatureDisplay
│   │   ├── teamSelection/       # EmployeeSelector, TeamSelector
│   │   ├── theme/               # Dark mode toggle
│   │   ├── ui/                  # 50+ shadcn/ui primitives
│   │   └── workflow/            # WorkflowTimeline
│   │
│   ├── context/                 # 5 Context Providers
│   │   ├── AuthContext.tsx      # Authentication & user profile
│   │   ├── WelfareContext.tsx   # Welfare requests (5-min cache)
│   │   ├── InternalTrainingContext.tsx
│   │   ├── LeaveContext.tsx     # Leave system state
│   │   └── NotificationContext.tsx
│   │
│   ├── pages/                   # 44 Route Pages
│   │   ├── admin/               # Admin management pages
│   │   ├── superadmin/          # SuperAdmin pages
│   │   └── auth/                # OAuth callback pages
│   │
│   ├── services/                # 9 API Services
│   │   ├── welfareApi.ts        # Welfare budgets & requests
│   │   ├── leaveApi.ts          # Leave system (683 lines)
│   │   ├── announcementApi.ts   # Company announcements
│   │   ├── formVisibilityApi.ts # Form access control
│   │   ├── specialApprovalApi.ts # Special approval (>10K THB)
│   │   ├── supportApi.ts        # Support ticket system
│   │   ├── openaiApi.ts         # AI integration
│   │   ├── employeeApi.ts       # Employee data
│   │   └── welfareLimitApi.ts   # Budget configurations
│   │
│   ├── hooks/                   # 6 Custom Hooks
│   │   ├── useWelfareRequests.ts
│   │   ├── useAccountingRequests.ts
│   │   ├── usePDFOperations.ts
│   │   ├── useTeamEmployeeData.ts
│   │   ├── use-toast.ts
│   │   └── use-mobile.tsx
│   │
│   ├── types/                   # TypeScript Definitions
│   │   ├── index.ts             # Main types (491 lines)
│   │   ├── database.types.ts    # Supabase DB types
│   │   └── supabase.ts          # Supabase specific types
│   │
│   ├── utils/                   # 13 Utility Modules
│   │   ├── pdfManager.ts        # Core PDF utilities
│   │   ├── pdfUtils.ts          # PDF helpers
│   │   ├── advancePdfManager.ts
│   │   ├── expenseClearingPdfManager.ts
│   │   ├── internalTrainingPdfManager.ts
│   │   ├── externalTrainingPdfManager.ts
│   │   ├── externalTrainingPdfSpecial.ts
│   │   ├── welfarePdfManager.ts
│   │   ├── externalTrainingDataMapper.ts
│   │   ├── numberFormat.ts      # Thai currency formatting
│   │   ├── rolePermissions.ts   # RBAC utilities
│   │   ├── debounce.ts
│   │   └── youtubeUtils.ts
│   │
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client setup
│   │   └── utils.ts             # Common utilities (cn, formatDate)
│   │
│   ├── integrations/supabase/   # Supabase integration
│   ├── App.tsx                  # Main app with routing
│   └── main.tsx                 # Entry point
│
├── supabase/
│   ├── config.toml              # Project ID: tpqetfmwiydzsaltvyxo
│   └── migrations/              # 30 SQL migrations
│
└── Configuration Files
    ├── vite.config.ts           # Port: 8080, alias: @/src
    ├── tsconfig.json            # Strict mode enabled
    ├── tailwind.config.ts       # ICP colors + Thai fonts
    ├── components.json          # shadcn/ui config
    └── package.json
```

---

## Key Features

### 1. Welfare Benefits (สวัสดิการ)

| Type | Thai Name | Budget Limit |
|------|-----------|--------------|
| `wedding` | สวัสดิการงานสมรส | 3,000 THB |
| `training` | ค่าอบรมภายนอก | Dynamic (per employee) |
| `childbirth` | ค่าคลอดบุตร | 8,000 THB (max 2 children) |
| `funeral` | ค่าช่วยเหลืองานศพ | 10,000 THB |
| `glasses` | ค่าตัดแว่นสายตา | 2,000 THB (shared with dental) |
| `dental` | ค่ารักษาทัตกรรม | 2,000 THB (shared with glasses) |
| `fitness` | ค่าออกกำลังกาย | 300 THB |
| `medical` | ของเยี่ยมกรณีเจ็บป่วย | 1,000 THB |
| `internal_training` | อบรมภายใน | N/A |

### 2. Advance Payment (เบิกเงินทดลอง)

| Form | Purpose | Target Users |
|------|---------|--------------|
| `AdvanceForm` | เบิกเงินทดลองสำหรับฝ่ายขาย | Sales team |
| `GeneralAdvanceForm` | เบิกเงินทดลองทั่วไป | All employees |
| `ExpenseClearingForm` | ปรับปรุงค่าใช้จ่าย (ฝ่ายขาย) | Sales team |
| `GeneralExpenseClearingForm` | ปรับปรุงค่าใช้จ่ายทั่วไป | All employees |

### 3. Leave System (ระบบลางาน)

- Multiple leave types (configurable via admin)
- Leave balance tracking per employee/year
- Holiday calendar (Office/Factory locations)
- Half-day leave support (morning/afternoon)
- Leave conflict detection
- Manager and HR approval workflow
- PDF generation with signatures

### 4. Approval Workflow

```
Employee Submit → Manager Approve → HR Approve → Accounting Approve → Completed
                                                         ↓
                            (if amount > 10,000 THB) → Special Approve
```

**Status Types:**
- `pending_manager` → `pending_hr` → `pending_accounting` → `completed`
- `pending_special_approval` (for amounts > 10,000 THB)
- `rejected_manager` / `rejected_hr` / `rejected_accounting` / `rejected_special_approval`

**Special Approver:** kanin.s@icpladda.com (Deputy Managing Director)

### 5. Digital Signature & PDF

- Canvas-based signature capture
- Stored as Base64 in database
- Embedded in PDF documents
- Storage buckets: `welfare-pdfs`, `welfare-pdfs-manager`, `welfare-pdfs-hr`

---

## User Roles & Permissions

| Role | Thai Name | Permissions |
|------|-----------|-------------|
| `employee` | พนักงานทั่วไป | Submit welfare/leave requests |
| `manager` | หัวหน้าทีม | Approve team requests |
| `hr` | ฝ่าย HR | Approve all requests, manage leave |
| `accounting` | ฝ่ายบัญชี | Approve payments |
| `accountingandmanager` | บทบาทรวม | Both accounting + manager |
| `admin` | ผู้ดูแลระบบ | System management |
| `superadmin` | Super Admin | Full access |

**Role Permissions (src/utils/rolePermissions.ts):**
```typescript
type UserRole = 'employee' | 'admin' | 'manager' | 'hr' | 'accounting' | 'accountingandmanager' | 'superadmin';

getRolePermissions(role): Permission
hasPermission(role, permission): boolean
canAccessRoute(role, route): boolean
```

---

## Database Tables (Supabase)

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `Employee` | Employee master data | email_user, Name, Team, Position, Role, Budget_* |
| `welfare_requests` | All request types | type, status, amount, signatures, pdf_url |
| `leave_types` | Leave type config | name_en, name_th, max_days_per_year, is_paid |
| `holidays` | Holiday calendar | date, name_th, location (All/Office/Factory) |
| `leave_balances` | Leave quotas | employee_id, leave_type_id, year, total_days, used_days |
| `leave_requests` | Leave applications | employee_id, status, signatures, pdf_url |
| `announcements` | Company announcements | title, content, priority, is_active |
| `form_visibility` | Form access control | form_type, is_visible |
| `support_tickets` | IT support tickets | category, priority, status |
| `support_ticket_comments` | Ticket comments | ticket_id, comment |
| `data_dealer` | Dealer data | For sales advance forms |
| `sales_data` | Sales records | Sales tracking |
| `welfare_settings` | Welfare limits | Budget configurations |

### Important Database Patterns

**Double-quoted column names (reserved words):**
```typescript
.eq('"email_user"', user.email)  // Use double quotes
```

**Nested queries (joins):**
```typescript
.select(`
  *,
  Employee!employee_id (Team, Name)
`)
```

**Complex OR conditions:**
```typescript
.or(`end_date.is.null,end_date.gte.${date}`)
```

---

## Type Definitions (src/types/index.ts)

### WelfareType
```typescript
type WelfareType =
  | "wedding" | "training" | "childbirth" | "funeral"
  | "glasses" | "dental" | "fitness" | "medical"
  | "internal_training" | "advance" | "general-advance"
  | "expense-clearing" | "general-expense-clearing"
  | "employment-approval";
```

### StatusType
```typescript
type StatusType =
  | "pending_manager" | "pending_hr" | "pending_accounting"
  | "pending_special_approval" | "completed"
  | "rejected_manager" | "rejected_hr" | "rejected_accounting"
  | "rejected_special_approval";
```

### WelfareRequest (Main Interface)
```typescript
interface WelfareRequest {
  // Basic fields
  id: number;
  userId: string;
  userName: string;
  userDepartment: string;
  type: WelfareType;
  status: StatusType;
  amount: number;
  date: string;
  details: string;
  runNumber?: string;  // Document number

  // Approval chain
  managerApproverId?: string;
  managerApproverName?: string;
  managerApproverPosition?: string;
  managerApprovedAt?: string;
  managerSignature?: string;  // Base64

  hrApproverId?: string;
  hrApproverName?: string;
  hrApproverPosition?: string;
  hrApprovedAt?: string;
  hrSignature?: string;  // Base64

  accountingApproverId?: string;
  accountingApproverName?: string;
  accountingApprovedAt?: string;

  // Special approval (>10,000 THB)
  specialApproverId?: string;
  specialApproverName?: string;
  specialApprovedAt?: string;
  specialSignature?: string;  // Base64
  requiresSpecialApproval?: boolean;

  // User signature
  userSignature?: string;  // Base64

  // PDF storage
  pdfUrl?: string;
  pdf_url?: string;
  pdf_request_manager?: string;
  pdf_request_hr?: string;

  // Type-specific fields... (see full definition in types/index.ts)
}
```

### Leave System Types
```typescript
type LeaveStatusType =
  'pending_manager' | 'pending_hr' | 'completed'
  | 'rejected_manager' | 'rejected_hr' | 'cancelled';

interface LeaveType {
  id: number;
  name_en: string;
  name_th: string;
  color: string;
  max_days_per_year: number | null;
  is_paid: boolean;
  requires_attachment: boolean;
  min_days_in_advance: number;
  is_active: boolean;
}

interface LeaveRequest {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_email: string;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  is_half_day: boolean;
  half_day_period?: 'morning' | 'afternoon';
  total_days: number;
  reason?: string;
  status: LeaveStatusType;
  user_signature?: string;
  manager_signature?: string;
  hr_signature?: string;
  pdf_url?: string;
}
```

---

## Context Providers

### AuthContext
```typescript
// src/context/AuthContext.tsx
interface AuthContextType {
  session: Session | null;
  user: SupabaseUser | null;
  profile: Profile | null;  // Employee data with budgets
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  isAuthenticated: boolean;
}
```

### WelfareContext
```typescript
// src/context/WelfareContext.tsx
// Cache duration: 5 minutes
interface WelfareContextType {
  welfareRequests: WelfareRequest[];
  getRequestsByUser(userId): WelfareRequest[];
  getRequestsByStatus(status): WelfareRequest[];
  getRequestsByType(type): WelfareRequest[];
  submitRequest(data): Promise<WelfareRequest | null>;
  updateRequest(id, data): Promise<void>;
  updateRequestStatus(id, status, comment): Promise<{success, data, error}>;
  refreshRequests(forceRefresh): Promise<void>;
  isLoading: boolean;
  getWelfareLimit(type): { amount, condition?, monthly? };
  getRemainingBudget(userId, type?): number;
  getChildbirthCount(userId): { total, remaining };
  trainingBudget: number | null;
}
```

### LeaveContext
```typescript
// src/context/LeaveContext.tsx
interface LeaveContextType {
  leaveTypes: LeaveType[];
  holidays: Holiday[];
  leaveBalances: LeaveBalance[];
  leaveRequests: LeaveRequest[];
  currentYear: number;
  currentMonth: number;
  selectedLocation: 'All' | 'Office' | 'Factory';
  selectedTeam: string;
  isLoading: boolean;
  isSubmitting: boolean;

  // Actions
  submitLeaveRequest(formData): Promise<LeaveRequest | null>;
  cancelLeaveRequest(id): Promise<boolean>;
  approveLeaveRequest(id, signature?, comment?): Promise<boolean>;
  rejectLeaveRequest(id, comment?): Promise<boolean>;
  refreshAll(): Promise<void>;

  // Helpers
  getLeaveBalance(leaveTypeId): LeaveBalance | undefined;
  getRemainingDays(leaveTypeId): number;
  checkLeaveConflict(startDate, endDate): Promise<LeaveRequest[]>;
  getCalendarEvents(): Promise<{leaves, holidays}>;
  getPendingManagerRequests(): LeaveRequest[];
  getPendingHRRequests(): LeaveRequest[];
}
```

---

## Routing (src/App.tsx)

### Employee Routes
| Path | Component | Description |
|------|-----------|-------------|
| `/` | Index | Login page |
| `/dashboard` | Dashboard | Main dashboard + announcements |
| `/welfare-dashboard` | WelfareDashboard | Welfare summary |
| `/welfare-forms` | WelfareFormsPage | Select welfare type |
| `/forms` | Forms | Additional forms |

### Approval Routes
| Path | Component | Description |
|------|-----------|-------------|
| `/approve` | ApprovalPage | Manager approval |
| `/manager-approve` | ManagerApprovalPage | Manager-specific |
| `/hr-approve` | HRApprovalPage | HR approval |
| `/special-approval` | SpecialApprovalPage | >10K THB approval |
| `/accounting-approve` | AccountingApprovalPage | Accounting approval |
| `/accounting-review` | AccountingReviewPage | Accounting review |

### Leave Routes
| Path | Component | Description |
|------|-----------|-------------|
| `/leave-calendar` | LeaveCalendarPage | Leave calendar |
| `/leave-approve` | LeaveApprovalPage | Leave approval |
| `/leave-report` | LeaveReportPage | Leave reports |

### Admin Routes
| Path | Component | Description |
|------|-----------|-------------|
| `/admin` | Admin | Admin dashboard |
| `/admin/announcements` | AnnouncementManagement | Manage announcements |
| `/admin/forms` | FormManagement | Form visibility |
| `/admin/users` | UserManagement | User management |
| `/superadmin/*` | SuperAdmin pages | Full system access |

---

## API Services

### welfareApi.ts
```typescript
getBenefitLimits(): Promise<BenefitLimit[]>
getEmployeeData(email): Promise<Employee>
```

### leaveApi.ts (683 lines)
```typescript
// Leave Types
getLeaveTypes(): Promise<LeaveType[]>
createLeaveType(data): Promise<LeaveType>
updateLeaveType(id, data): Promise<LeaveType>

// Holidays
getHolidays(year): Promise<Holiday[]>
createHoliday(data): Promise<Holiday>

// Leave Requests
submitLeaveRequest(data): Promise<LeaveRequest>
approveLeaveRequest(id, signature, comment): Promise<void>
rejectLeaveRequest(id, reason): Promise<void>
checkLeaveConflict(startDate, endDate): Promise<LeaveRequest[]>

// Leave Balances
getLeaveBalances(employeeId, year): Promise<LeaveBalance[]>
```

### announcementApi.ts
```typescript
getAnnouncements(): Promise<Announcement[]>
getActiveAnnouncements(): Promise<Announcement[]>
createAnnouncement(data): Promise<Announcement>
updateAnnouncement(id, data): Promise<Announcement>
deleteAnnouncement(id): Promise<void>
```

### supportApi.ts
```typescript
createTicket(data): Promise<SupportTicket>
getTickets(userId, filter?): Promise<SupportTicket[]>
updateTicket(id, data): Promise<SupportTicket>
addComment(ticketId, comment): Promise<SupportTicketComment>
// Categories: account, system, network, printer, software, database, bug, feature, other
// Priorities: low, medium, high, urgent
// Status: open, in-progress, resolved, closed
```

---

## Supabase Patterns

### Client Setup (src/lib/supabase.ts)
```typescript
export const supabase = createClient<Database>(
  VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY
);

// Admin client (optional)
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient<Database>(url, supabaseServiceRoleKey)
  : null;
```

### RPC Functions
```typescript
// Calculate working days (excludes weekends + holidays)
const { data } = await supabase.rpc('calculate_working_days', {
  p_start_date: startDate,
  p_end_date: endDate,
  location_filter: location  // 'All' | 'Office' | 'Factory'
});

// Get dealer list
const { data } = await supabase.rpc('get_dealer_list');
```

### Storage Operations
```typescript
// Upload PDF
const { data, error } = await supabase.storage
  .from('welfare-pdfs')
  .upload(`${userId}/${filename}`, blob, {
    contentType: 'application/pdf',
    upsert: true
  });

// Get public URL
const { data: urlData } = supabase.storage
  .from('welfare-pdfs')
  .getPublicUrl(data.path);
```

### Authentication
```typescript
// Microsoft Azure OAuth
await supabase.auth.signInWithOAuth({
  provider: 'azure',
  options: {
    scopes: 'openid profile email',
    redirectTo: window.location.origin + '/dashboard',
  },
});

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// Sign out
await supabase.auth.signOut();
```

---

## PDF Generation

### PDF Managers (src/utils/)

| File | Purpose |
|------|---------|
| `pdfManager.ts` | Core PDF utilities |
| `pdfUtils.ts` | Helper functions |
| `advancePdfManager.ts` | Advance payment PDFs |
| `expenseClearingPdfManager.ts` | Expense clearing PDFs |
| `internalTrainingPdfManager.ts` | Internal training PDFs |
| `externalTrainingPdfManager.ts` | External training PDFs |
| `externalTrainingPdfSpecial.ts` | Special training PDFs |
| `welfarePdfManager.ts` | Standard welfare PDFs |

### PDF Components (src/components/pdf/)
- `WelfarePDFGenerator.tsx`
- `AdvancePDFGenerator.tsx`
- `SalesAdvancePDFGenerator.tsx`
- `ManagerAdvancePDFGenerator.tsx`
- `ExpenseClearingPDFGenerator.tsx`
- `InternalTrainingPDFGenerator.tsx`
- `TrainingPDFGenerator.tsx`
- `EmploymentApprovalPDFGenerator.tsx`
- `PhotoGridPDFGenerator.tsx`

**Features:**
- Thai language support (Sarabun, Kanit fonts)
- Digital signature embedding
- Tax calculations (7% VAT, 3% withholding)
- Company branding

---

## Utility Functions

### Number Formatting (src/utils/numberFormat.ts)
```typescript
formatNumberWithCommas(value): string        // "10,000.00"
formatNumberForInput(value): string          // "10,000"
formatInputWhileTyping(inputValue): string   // Dynamic formatting
formatNumberOnBlur(value): string            // "10,000.00"
parseFormattedNumber(value): number          // Parse back to number
```

### Common Utils (src/lib/utils.ts)
```typescript
cn(...inputs): string              // Tailwind class merging
formatDate(dateString): string     // Thai locale formatting
formatDateTime(dateString): string // Thai locale with time
getStatusColor(status): string     // Tailwind color classes
getWelfareTypeColor(type): string  // Welfare-specific colors
getWelfareTypeLabel(type): string  // Thai labels
```

---

## State Caching

```typescript
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const fetchRequests = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && now - lastFetchTime < CACHE_DURATION) {
    return; // Use cached data
  }
  // Fetch from API...
};
```

---

## Common Patterns

### Digital Signature Capture
```typescript
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
// Basic login protection
<ProtectedRoute>
  <MainLayout>
    <YourPage />
  </MainLayout>
</ProtectedRoute>

// Role-based protection
<RoleProtectedRoute allowedRoles={['superadmin', 'admin', 'hr']}>
  <AdminPage />
</RoleProtectedRoute>
```

### Amount Input with Formatting
```typescript
import { formatNumberOnBlur, parseFormattedNumber } from '@/utils/numberFormat';

const handleBlur = (value: string) => {
  const formatted = formatNumberOnBlur(value);
  const parsed = parseFormattedNumber(value);
};
```

---

## Environment Variables

```env
VITE_SUPABASE_URL=https://tpqetfmwiydzsaltvyxo.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_SUPABASE_SERVICE_ROLE_KEY=xxx  # Optional, for admin operations
VITE_OPENAI_API_KEY=xxx             # Optional, for AI announcements
```

---

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (port 8080)
npm run build        # Vite production build
npm run preview      # Preview production build
npm run lint         # ESLint validation
```

---

## Database Migrations

Located in `supabase/migrations/` (30 files):

**Key Migrations:**
- `20240612000000_add_pin_hash_to_employee.sql` - PIN security
- `20240621000001_add_manager_employee_relationship.sql` - Manager hierarchy
- `20240627000000_add_welfare_settings.sql` - Welfare limits
- `20241221000002_add_internal_training_columns.sql` - Training fields
- `20241222000000_create_support_tickets.sql` - Support system
- `20241223000000_add_advance_payment_fields.sql` - Advance payments
- `20250109000000_create_announcements_table.sql` - Announcements
- `20250130000000_add_special_approval_fields.sql` - Special approval
- `20250210000000_create_form_visibility_table.sql` - Form access
- `20250211000001_create_get_dealer_list_function.sql` - Dealer RPC
- `20250214000000_add_childbirths_column.sql` - Childbirth tracking
- `20250218000000_add_employment_approval_fields.sql` - Employment approval
- `20251219000000_create_leave_system.sql` - Complete leave system

---

## Important Files Reference

| File | Purpose | Lines |
|------|---------|-------|
| `src/App.tsx` | Main app + routing + providers | - |
| `src/types/index.ts` | All TypeScript interfaces | 491 |
| `src/context/AuthContext.tsx` | Authentication state | - |
| `src/context/WelfareContext.tsx` | Welfare state (5-min cache) | - |
| `src/context/LeaveContext.tsx` | Leave system state | - |
| `src/services/leaveApi.ts` | Leave API service | 683 |
| `src/utils/rolePermissions.ts` | RBAC utilities | - |
| `src/components/layout/Sidebar.tsx` | Navigation menu | - |
| `src/components/forms/WelfareFormSelector.tsx` | Form selection | - |
| `src/pages/ApprovalPage.tsx` | Approval workflow UI | - |

---

## Development Guide

### Adding New Welfare Type
1. Add to `WelfareType` in `src/types/index.ts`
2. Create form component in `src/components/forms/`
3. Create PDF manager in `src/utils/`
4. Add to `WelfareFormSelector.tsx`
5. Update budget limits in `welfareApi.ts`

### Adding New Role
1. Add to `UserRole` type in `rolePermissions.ts`
2. Define permissions in `getRolePermissions()`
3. Update route access in `canAccessRoute()`
4. Add to `Sidebar.tsx` navigation

### Creating New Page
1. Create file in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation in `Sidebar.tsx`
4. Wrap with appropriate `ProtectedRoute`

### Adding Database Table
1. Create migration in `supabase/migrations/`
2. Add types in `src/types/`
3. Create API service in `src/services/`
4. Export from context if needed

---

## Tailwind Theme (tailwind.config.ts)

**ICP Ladda Colors:**
- Primary: #004F9F (ICP Blue)
- Secondary: #0066CC (Light Blue)
- Dark: #003D7A

**Thai Fonts:**
- Kanit (headings)
- Sarabun (body)

**Custom Animations:**
- accordion, fade-in, slide-in, bounce
- pulse-slow, spin-slow, float, shimmer, aurora

---

## Third-Party Integrations

- **Supabase**: Database + Auth + Storage
- **Microsoft Azure**: OAuth provider
- **OpenAI**: AI-generated announcements (optional)
- **N8n**: Chatbot integration
- **jsPDF/pdf-lib**: PDF generation
- **html2canvas**: HTML to image
- **Chart.js/Recharts**: Data visualization
- **Framer Motion**: Animations
