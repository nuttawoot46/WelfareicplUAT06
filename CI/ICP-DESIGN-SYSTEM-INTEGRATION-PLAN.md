# 📘 ICP Design System - Integration Plan

> **Version:** 1.0.0
> **Source:** [banoffeestudio/icp-design-system](https://github.com/banoffeestudio/icp-design-system.git)
> **Based on:** Daya - Multipurpose UI Kit (Figma)
> **Created:** 2026-01-29

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Design Tokens](#design-tokens)
4. [Component Inventory](#component-inventory)
5. [Integration Guide](#integration-guide)
6. [Usage Guidelines](#usage-guidelines)
7. [Migration from shadcn/ui](#migration-from-shadcnui)
8. [Best Practices](#best-practices)
9. [File Structure](#file-structure)
10. [Checklist](#checklist)

---

## 🎯 Overview

### What is ICP Design System?

ICP Design System เป็น component library ที่พัฒนาโดยทีม UI ของ Banoffee Studio โดยอิงจาก **Daya UI Kit** จาก Figma ซึ่งมีลักษณะเฉพาะดังนี้:

| Feature | Description |
|---------|-------------|
| **Design Source** | Daya - Multipurpose UI Kit (Figma) |
| **Component Count** | 62 components |
| **Base Framework** | shadcn/ui + Radix UI primitives |
| **Styling** | Tailwind CSS v4 with CSS Variables |
| **Font** | Public Sans |
| **Border Radius** | 10px (consistent across all components) |

### Key Differentiators from Default shadcn/ui

| Aspect | Default shadcn/ui | ICP Design System |
|--------|-------------------|-------------------|
| Color Palette | Neutral (Slate/Zinc) | Daya Brand Colors (Primary Blue #3E59EA) |
| Font | System fonts | Public Sans |
| Border Radius | 6px | 10px |
| Variant Naming | `default`, `destructive` | `primary`, `danger`, `success` |
| Additional Variants | Limited | Extensive (outline, tertiary, soft) |

---

## 🛠 Tech Stack

### Core Dependencies

```json
{
  "next": "15.2.6",
  "react": "^19",
  "react-dom": "^19",
  "tailwindcss": "^4.1.9",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.5.5"
}
```

### UI Libraries

```json
{
  "@radix-ui/react-accordion": "1.2.2",
  "@radix-ui/react-alert-dialog": "1.1.4",
  "@radix-ui/react-avatar": "1.1.2",
  "@radix-ui/react-checkbox": "1.1.3",
  "@radix-ui/react-dialog": "1.1.4",
  "@radix-ui/react-dropdown-menu": "2.1.4",
  "@radix-ui/react-popover": "1.1.4",
  "@radix-ui/react-select": "2.1.4",
  "@radix-ui/react-switch": "1.1.2",
  "@radix-ui/react-tabs": "1.1.2",
  "@radix-ui/react-toast": "1.2.4",
  "@radix-ui/react-tooltip": "1.1.6"
}
```

### Form & Validation

```json
{
  "react-hook-form": "^7.60.0",
  "@hookform/resolvers": "^3.10.0",
  "zod": "3.25.76"
}
```

### Additional Libraries

```json
{
  "lucide-react": "^0.454.0",
  "recharts": "latest",
  "sonner": "latest",
  "date-fns": "4.1.0",
  "next-themes": "latest",
  "embla-carousel-react": "latest"
}
```

---

## 🎨 Design Tokens

### Primary Colors (Brand)

```css
--color-primary-50:  #ECEFFE;  /* Light backgrounds, hover states */
--color-primary-100: #D4DBFC;  /* Light backgrounds */
--color-primary-200: #A9B7F9;  /* Light accents */
--color-primary-300: #7E93F6;  /* Medium accents */
--color-primary-400: #536FF3;  /* Medium emphasis */
--color-primary-500: #3E59EA;  /* ⭐ MAIN BRAND COLOR */
--color-primary-600: #2843D4;  /* Hover states */
--color-primary-700: #1E32A0;  /* Active/pressed states */
--color-primary-800: #14216B;  /* Dark accents */
--color-primary-900: #0A1135;  /* Very dark accents */
```

### Secondary Colors (Cyan/Teal)

```css
--color-cyan-50:  #E6F9F9;
--color-cyan-100: #CDF3F4;
--color-cyan-200: #9BE7E9;
--color-cyan-300: #69DBDE;
--color-cyan-400: #37CFD3;
--color-cyan-500: #33BDC1;  /* ⭐ SECONDARY COLOR */
--color-cyan-600: #29979A;
--color-cyan-700: #1F7174;
--color-cyan-800: #144B4D;
--color-cyan-900: #0A2627;
```

### Semantic Colors

#### Grey (Neutral)
```css
--color-grey-50:  #F1F2F4;  /* Disabled backgrounds, muted areas */
--color-grey-100: #E3E5E8;
--color-grey-200: #C7CBD1;
--color-grey-300: #ABB1BA;
--color-grey-400: #8F97A3;
--color-grey-500: #707A8F;  /* Placeholder text, secondary text */
--color-grey-600: #5A6272;
--color-grey-700: #434956;
--color-grey-800: #2D3139;
--color-grey-900: #16181D;
```

#### Black
```css
--color-black-50:  #E8E8E9;  /* Borders, dividers */
--color-black-100: #D1D1D3;
--color-black-200: #A3A3A7;
--color-black-300: #75757B;
--color-black-400: #47474F;
--color-black-500: #14181F;  /* ⭐ Primary text, headings */
--color-black-600: #101319;
--color-black-700: #0C0E13;
--color-black-800: #080A0C;
--color-black-900: #040506;
```

#### Red (Error/Danger)
```css
--color-red-50:  #FCEEEA;  /* Error backgrounds */
--color-red-500: #E3562B;  /* ⭐ Error text, destructive actions */
```

#### Green (Success)
```css
--color-green-50:  #E6F7ED;  /* Success backgrounds */
--color-green-500: #1DAF55;  /* ⭐ Success states */
```

#### Yellow (Warning)
```css
--color-yellow-50:  #FEF9E6;  /* Warning backgrounds */
--color-yellow-500: #F5C518;  /* ⭐ Warning states */
```

#### Orange (Alert)
```css
--color-orange-500: #E98305;  /* Alerts, attention */
```

#### Purple (Accent)
```css
--color-purple-500: #8B5CF6;  /* Special accents, charts */
```

### Typography

| Token | Value | Usage |
|-------|-------|-------|
| **Font Family** | `Public Sans` | All UI text |
| **Text XS** | 10px / 14px | Captions, labels |
| **Text S** | 12px / 18px | Small text, error messages |
| **Text M** | 14px / 20px | **Default** - body text, inputs |
| **Text L** | 16px / 24px | Large body text |
| **Text XL** | 18px / 28px | Subheadings |

#### Font Weights
| Weight | Value | Usage |
|--------|-------|-------|
| Regular | 400 | Default body text |
| Medium | 500 | Emphasis |
| Semi-bold | 600 | Buttons |
| Bold | 700 | Headings |

### Spacing & Layout

#### Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| `radius` | 10px | **Default** - inputs, buttons, cards |
| `radius-sm` | 6px | Small elements |
| `radius-lg` | 12px | Large cards |
| `radius-full` | 9999px | Pills, badges, avatars |

#### Spacing Scale (4px grid)
```
1 = 4px    4 = 16px
2 = 8px    6 = 24px
3 = 12px   8 = 32px
```

#### Component Padding
| Component | Horizontal | Vertical |
|-----------|------------|----------|
| Input | 12px | 8px |
| Button | 16px | 8px |
| Badge | 10px | 2px |

---

## 📦 Component Inventory

### Total: 62 Components

#### Form Inputs (12)
| Component | File | Variants |
|-----------|------|----------|
| Input | `input.tsx` | default, error + sizes (sm, default, lg) |
| Textarea | `textarea.tsx` | default, error |
| Checkbox | `checkbox.tsx` | default, disabled |
| Radio Group | `radio-group.tsx` | default |
| Select | `select.tsx` | default, error |
| Combobox | `combobox.tsx` | searchable select |
| Switch | `switch.tsx` | default, success, danger + sizes |
| Slider | `slider.tsx` | default |
| Calendar | `calendar.tsx` | date picker |
| Input OTP | `input-otp.tsx` | verification codes |
| Input Group | `input-group.tsx` | with addons |
| Native Select | `native-select.tsx` | native dropdown |

#### Buttons & Actions (4)
| Component | File | Variants |
|-----------|------|----------|
| Button | `button.tsx` | primary, secondary, tertiary, danger, success, gray, ghost, link + outline variants |
| Button Group | `button-group.tsx` | grouped buttons |
| Toggle | `toggle.tsx` | pressed/unpressed |
| Toggle Group | `toggle-group.tsx` | multiple toggles |

#### Data Display (9)
| Component | File | Variants |
|-----------|------|----------|
| Table | `table.tsx` | default, striped, bordered |
| Badge | `badge.tsx` | blue, green, red, orange, yellow, purple, gray, cyan + outline, soft |
| Avatar | `avatar.tsx` | with image, initials |
| Card | `card.tsx` | default, sm |
| Progress | `progress.tsx` | linear progress |
| Chart | `chart.tsx` | recharts wrapper |
| Empty | `empty.tsx` | empty state |
| Skeleton | `skeleton.tsx` | loading placeholder |
| Separator | `separator.tsx` | horizontal/vertical |

#### Navigation (8)
| Component | File | Variants |
|-----------|------|----------|
| Tabs | `tabs.tsx` | line, pills, default |
| Pagination | `pagination.tsx` | with indicator |
| Breadcrumb | `breadcrumb.tsx` | path navigation |
| Navigation Menu | `navigation-menu.tsx` | top nav |
| Menubar | `menubar.tsx` | menu bar |
| Sidebar | `sidebar.tsx` | side navigation |
| Accordion | `accordion.tsx` | collapsible sections |
| Collapsible | `collapsible.tsx` | expand/collapse |

#### Overlays & Modals (8)
| Component | File | Description |
|-----------|------|-------------|
| Dialog | `dialog.tsx` | Modal dialog |
| Alert Dialog | `alert-dialog.tsx` | Confirmation dialog |
| Sheet | `sheet.tsx` | Slide-out panel |
| Drawer | `drawer.tsx` | Bottom drawer |
| Popover | `popover.tsx` | Floating content |
| Tooltip | `tooltip.tsx` | Hover info |
| Hover Card | `hover-card.tsx` | Rich hover |
| Context Menu | `context-menu.tsx` | Right-click menu |

#### Menus (2)
| Component | File | Description |
|-----------|------|-------------|
| Dropdown Menu | `dropdown-menu.tsx` | Click menu |
| Command | `command.tsx` | Command palette |

#### Feedback (5)
| Component | File | Description |
|-----------|------|-------------|
| Alert | `alert.tsx` | Inline alerts |
| Toast | `toast.tsx` | Toast notifications |
| Toaster | `toaster.tsx` | Toast container |
| Sonner | `sonner.tsx` | Sonner integration |
| Spinner | `spinner.tsx` | Loading spinner |

#### Layout (5)
| Component | File | Description |
|-----------|------|-------------|
| Aspect Ratio | `aspect-ratio.tsx` | Fixed ratio container |
| Scroll Area | `scroll-area.tsx` | Custom scrollbar |
| Resizable | `resizable.tsx` | Resizable panels |
| Carousel | `carousel.tsx` | Image/content carousel |
| Field | `field.tsx` | Form field wrapper |

#### Other (6)
| Component | File | Description |
|-----------|------|-------------|
| Form | `form.tsx` | React Hook Form integration |
| Label | `label.tsx` | Form labels |
| Item | `item.tsx` | List item |
| Kbd | `kbd.tsx` | Keyboard shortcut |
| Menu Calendar | `menu-calendar.tsx` | Calendar in menu |
| Use Mobile | `use-mobile.tsx` | Mobile detection hook |

#### Utility (3)
| Component | File | Description |
|-----------|------|-------------|
| Theme Provider | `theme-provider.tsx` | Dark/light mode |
| Example | `example.tsx` | Demo component |
| Preview | `preview.tsx` | Component preview |

---

## 🔧 Integration Guide

### Step 1: Clone the Design System

```bash
git clone https://github.com/banoffeestudio/icp-design-system.git
```

### Step 2: Copy Required Files

```bash
# Copy components folder
cp -r icp-design-system/components/ui ./components/

# Copy styles
cp icp-design-system/app/globals.css ./app/

# Copy lib utilities
cp icp-design-system/lib/utils.ts ./lib/

# Copy component config
cp icp-design-system/components.json ./
```

### Step 3: Install Dependencies

```bash
npm install class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-popover @radix-ui/react-select @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-tooltip
npm install lucide-react
```

### Step 4: Configure Font

In `app/layout.tsx`:

```tsx
import { Public_Sans } from 'next/font/google'

const publicSans = Public_Sans({
  subsets: ['latin'],
  variable: '--font-public-sans',
  display: 'swap',
})

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={publicSans.variable}>
      <body>{children}</body>
    </html>
  )
}
```

### Step 5: Update Tailwind Config

Ensure `tailwind.config.ts` includes:

```ts
export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-public-sans)', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '10px',
      },
    },
  },
}
```

---

## 📐 Usage Guidelines

### Button Usage

```tsx
import { Button } from "@/components/ui/button"

// Primary (default)
<Button>บันทึก</Button>

// Secondary
<Button variant="secondary">รอง</Button>

// Outlined
<Button variant="primary-outline">Outlined</Button>

// Danger
<Button variant="danger">ลบ</Button>

// Success
<Button variant="success">ยืนยัน</Button>

// Sizes
<Button size="sm">เล็ก</Button>
<Button size="default">ปกติ</Button>
<Button size="lg">ใหญ่</Button>

// Icon button
<Button variant="primary" size="icon">
  <PlusIcon />
</Button>
```

### Input Usage

```tsx
import { Input } from "@/components/ui/input"

// Default
<Input placeholder="กรอกข้อมูล..." />

// With error
<Input error errorMessage="กรุณากรอกข้อมูล" />

// Disabled
<Input disabled placeholder="ไม่สามารถแก้ไขได้" />

// Sizes
<Input inputSize="sm" />
<Input inputSize="default" />
<Input inputSize="lg" />
```

### Badge Usage

```tsx
import { Badge, NotificationBadge } from "@/components/ui/badge"

// Filled
<Badge variant="blue">ใหม่</Badge>
<Badge variant="green">เสร็จสิ้น</Badge>
<Badge variant="red">ด่วน</Badge>

// Outline
<Badge variant="blue-outline">Outline</Badge>

// Soft
<Badge variant="blue-soft">Soft</Badge>

// Notification
<NotificationBadge count={5} />
<NotificationBadge count={100} max={99} /> // แสดง "99+"
```

### Table Usage

```tsx
import {
  Table, TableHeader, TableBody, TableRow,
  TableHead, TableCell
} from "@/components/ui/table"

// Default
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>ชื่อ</TableHead>
      <TableHead>อีเมล</TableHead>
      <TableHead>สถานะ</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>สมชาย ใจดี</TableCell>
      <TableCell>somchai@example.com</TableCell>
      <TableCell><Badge variant="green">ใช้งาน</Badge></TableCell>
    </TableRow>
  </TableBody>
</Table>

// Striped
<Table variant="striped">...</Table>

// Bordered
<Table variant="bordered">...</Table>
```

### Tabs Usage

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

// Line style
<Tabs defaultValue="tab1">
  <TabsList variant="line">
    <TabsTrigger value="tab1" variant="line">ข้อมูลทั่วไป</TabsTrigger>
    <TabsTrigger value="tab2" variant="line">การตั้งค่า</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">เนื้อหา 1</TabsContent>
  <TabsContent value="tab2">เนื้อหา 2</TabsContent>
</Tabs>

// Pills style
<Tabs defaultValue="tab1">
  <TabsList variant="pills">
    <TabsTrigger value="tab1" variant="pills">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2" variant="pills">Tab 2</TabsTrigger>
  </TabsList>
</Tabs>
```

---

## 🔄 Migration from shadcn/ui

### Variant Name Changes

| shadcn/ui | ICP Design System |
|-----------|-------------------|
| `default` | `primary` |
| `destructive` | `danger` |
| `outline` | `primary-outline` |
| `secondary` | `secondary` (different color) |
| `ghost` | `ghost` |
| `link` | `link` |

### Color Token Changes

| shadcn/ui | ICP Design System |
|-----------|-------------------|
| `bg-primary` | `bg-primary-500` |
| `text-destructive` | `text-red-500` |
| `border-input` | `border-black-50` |
| `text-muted-foreground` | `text-grey-500` |

### Migration Checklist

- [ ] Update `globals.css` with Daya color tokens
- [ ] Add Public Sans font to `layout.tsx`
- [ ] Replace component files with ICP versions
- [ ] Update variant names in JSX:
  - `variant="default"` → `variant="primary"`
  - `variant="destructive"` → `variant="danger"`
  - `variant="outline"` → `variant="primary-outline"`
- [ ] Update hardcoded colors to design tokens
- [ ] Test all components for visual consistency

---

## ✨ Best Practices

### 1. Always Use Design Tokens

```tsx
// ✅ Good - Use design tokens
<div className="bg-primary-500 text-white">

// ❌ Bad - Hardcoded colors
<div className="bg-[#3E59EA] text-white">
```

### 2. Use Component Variants

```tsx
// ✅ Good - Use variants
<Button variant="danger">ลบ</Button>

// ❌ Bad - Custom styling
<button className="bg-red-500 text-white ...">ลบ</button>
```

### 3. Follow Naming Conventions

- **Variant names:** kebab-case (`primary-outline`, `blue-soft`)
- **Props:** camelCase (`inputSize`, `errorMessage`)
- **CSS classes:** Design tokens (`bg-primary-500`, `text-grey-500`)

### 4. Maintain Consistency

```tsx
// Border radius: Always use rounded-[10px]
<div className="rounded-[10px]">

// Font: Always include Public Sans
<span className="font-['Public_Sans',sans-serif]">

// Transitions: Use standard duration
<button className="transition-colors duration-200">
```

### 5. Accessibility

- Always include `focus-visible` states
- Use `aria-invalid` for error states
- Ensure proper contrast ratios (WCAG 2.1 AA)
- Include proper `aria-label` for icon-only buttons

### 6. Thai Language Support

```tsx
// ✅ Use Thai for UI labels
<Button>บันทึก</Button>
<Button variant="danger">ลบ</Button>

// ✅ Use Thai error messages
<Input error errorMessage="กรุณากรอกข้อมูลให้ครบถ้วน" />

// ✅ Use Thai placeholder
<Input placeholder="ค้นหา..." />
```

---

## 📁 File Structure

```
project/
├── app/
│   ├── globals.css          # Design tokens & base styles
│   ├── layout.tsx           # Root layout with fonts
│   └── page.tsx
├── components/
│   ├── ui/                   # ICP Design System components
│   │   ├── accordion.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── alert.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── breadcrumb.tsx
│   │   ├── button-group.tsx
│   │   ├── button.tsx
│   │   ├── calendar.tsx
│   │   ├── card.tsx
│   │   ├── carousel.tsx
│   │   ├── chart.tsx
│   │   ├── checkbox.tsx
│   │   ├── collapsible.tsx
│   │   ├── combobox.tsx
│   │   ├── command.tsx
│   │   ├── context-menu.tsx
│   │   ├── dialog.tsx
│   │   ├── drawer.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── empty.tsx
│   │   ├── field.tsx
│   │   ├── form.tsx
│   │   ├── hover-card.tsx
│   │   ├── input-group.tsx
│   │   ├── input-otp.tsx
│   │   ├── input.tsx
│   │   ├── item.tsx
│   │   ├── kbd.tsx
│   │   ├── label.tsx
│   │   ├── menubar.tsx
│   │   ├── navigation-menu.tsx
│   │   ├── pagination.tsx
│   │   ├── popover.tsx
│   │   ├── progress.tsx
│   │   ├── radio-group.tsx
│   │   ├── resizable.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── sidebar.tsx
│   │   ├── skeleton.tsx
│   │   ├── slider.tsx
│   │   ├── sonner.tsx
│   │   ├── spinner.tsx
│   │   ├── switch.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   ├── toaster.tsx
│   │   ├── toggle-group.tsx
│   │   ├── toggle.tsx
│   │   ├── tooltip.tsx
│   │   └── use-mobile.tsx
│   ├── example.tsx
│   ├── preview.tsx
│   └── theme-provider.tsx
├── hooks/
│   └── ...                   # Custom hooks
├── lib/
│   └── utils.ts              # cn() utility
├── styles/
│   └── ...                   # Additional styles
├── components.json           # shadcn config
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## ✅ Integration Checklist

### Phase 1: Setup
- [ ] Clone ICP Design System repository
- [ ] Copy `components/ui/` folder
- [ ] Copy `globals.css` with design tokens
- [ ] Copy `lib/utils.ts`
- [ ] Copy `components.json`

### Phase 2: Dependencies
- [ ] Install all Radix UI packages
- [ ] Install `class-variance-authority`
- [ ] Install `clsx` and `tailwind-merge`
- [ ] Install `lucide-react` for icons
- [ ] Install form libraries if needed (react-hook-form, zod)

### Phase 3: Configuration
- [ ] Configure Public Sans font in `layout.tsx`
- [ ] Update `tailwind.config.ts` with design tokens
- [ ] Configure `next-themes` for dark mode (if needed)

### Phase 4: Migration (if upgrading from shadcn/ui)
- [ ] Update variant names in existing code
- [ ] Update color tokens
- [ ] Test all existing components
- [ ] Fix any visual inconsistencies

### Phase 5: Verification
- [ ] Build passes (`npm run build`)
- [ ] No TypeScript errors
- [ ] All components render correctly
- [ ] Dark mode works (if configured)
- [ ] Responsive design works
- [ ] Accessibility checks pass

---

## 📊 Quick Reference Card

### Button Variants
```
primary | secondary | tertiary | danger | success | gray | ghost | link
primary-outline | secondary-outline | danger-outline | success-outline | gray-outline
danger-tertiary | success-tertiary | gray-tertiary | dark
```

### Button Sizes
```
sm | default | lg | icon | icon-sm | icon-lg
```

### Badge Variants
```
blue | green | red | orange | yellow | purple | gray | cyan
blue-outline | green-outline | red-outline | ...
blue-soft | green-soft | red-soft | ...
```

### Input Sizes
```
sm | default | lg
```

### Table Variants
```
default | striped | bordered
```

### Tabs Variants
```
default | line | pills
```

### Switch Variants
```
default | success | danger
```

---

## 📞 Support & Resources

| Resource | Link |
|----------|------|
| **Repository** | https://github.com/banoffeestudio/icp-design-system |
| **Figma Source** | Daya - Multipurpose UI Kit |
| **shadcn/ui Docs** | https://ui.shadcn.com |
| **Radix UI Docs** | https://www.radix-ui.com |
| **Tailwind CSS** | https://tailwindcss.com |

---

## 🌙 Dark Mode Configuration

### Setup ThemeProvider

```tsx
// app/layout.tsx
import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({ children }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### Dark Mode Color Tokens

Design System รองรับ Dark Mode โดยอัตโนมัติผ่าน CSS variables:

```css
.dark {
  --background: oklch(0.1450 0 0);
  --foreground: oklch(0.9850 0 0);
  --card: oklch(0.2050 0 0);
  --card-foreground: oklch(0.9850 0 0);
  --primary: oklch(0.9220 0 0);
  --primary-foreground: oklch(0.2050 0 0);
  --muted: oklch(0.2690 0 0);
  --muted-foreground: oklch(0.7080 0 0);
  --border: oklch(0.2750 0 0);
  --input: oklch(0.3250 0 0);
}
```

### Toggle Theme Button

```tsx
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}
```

---

## 📝 Form Validation Patterns

### Basic Form with Zod

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form, FormField, FormItem, FormLabel,
  FormControl, FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// Define schema
const formSchema = z.object({
  name: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  phone: z.string().regex(/^0[0-9]{8,9}$/, "เบอร์โทรไม่ถูกต้อง"),
})

function MyForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ชื่อ</FormLabel>
              <FormControl>
                <Input placeholder="กรอกชื่อ..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>อีเมล</FormLabel>
              <FormControl>
                <Input type="email" placeholder="example@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">บันทึก</Button>
      </form>
    </Form>
  )
}
```

### Common Validation Messages (Thai)

```typescript
const validationMessages = {
  required: "กรุณากรอกข้อมูล",
  email: "รูปแบบอีเมลไม่ถูกต้อง",
  minLength: (min: number) => `ต้องมีอย่างน้อย ${min} ตัวอักษร`,
  maxLength: (max: number) => `ต้องไม่เกิน ${max} ตัวอักษร`,
  phone: "เบอร์โทรศัพท์ไม่ถูกต้อง",
  password: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
  confirmPassword: "รหัสผ่านไม่ตรงกัน",
  number: "กรุณากรอกตัวเลข",
  url: "รูปแบบ URL ไม่ถูกต้อง",
}
```

---

## 🎬 Animation & Transition Guidelines

### Standard Transitions

```css
/* Duration Scale */
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;

/* Standard transition classes */
.transition-colors { transition: color, background-color, border-color 200ms ease; }
.transition-opacity { transition: opacity 200ms ease; }
.transition-transform { transition: transform 200ms ease; }
.transition-all { transition: all 200ms ease; }
```

### Component Animations

```tsx
// Button hover
<Button className="transition-colors duration-200 hover:bg-primary-600">

// Card hover with scale
<Card className="transition-transform duration-200 hover:scale-[1.02]">

// Fade in animation
<div className="animate-in fade-in duration-300">

// Slide in from bottom
<div className="animate-in slide-in-from-bottom-4 duration-300">
```

### Micro-interactions

```tsx
// Icon rotation on click
<ChevronDown className="transition-transform duration-200 data-[state=open]:rotate-180" />

// Loading spinner
<Spinner className="animate-spin" />

// Pulse for notifications
<Badge className="animate-pulse">ใหม่</Badge>

// Scale on press
<Button className="active:scale-95 transition-transform">
```

### Animation Best Practices

| Do | Don't |
|----|-------|
| ✅ Use 200ms for standard interactions | ❌ Use animations longer than 500ms |
| ✅ Use ease-out for enter animations | ❌ Use bounce/elastic for UI elements |
| ✅ Use ease-in for exit animations | ❌ Animate layout-causing properties |
| ✅ Respect `prefers-reduced-motion` | ❌ Use jarring or distracting animations |

```tsx
// Respect reduced motion preference
<div className="motion-safe:animate-in motion-safe:fade-in">
```

---

## 🔍 Ultra Thinking Review Summary

### ✅ Verified Components
- [x] 62 components documented with variants
- [x] Color tokens match source `globals.css`
- [x] Button variants verified against `button.tsx`
- [x] Input variants verified against `input.tsx`
- [x] Dependencies match `package.json`

### ✅ Completeness Check
- [x] Overview & Philosophy
- [x] Complete Tech Stack
- [x] Full Design Tokens (Colors, Typography, Spacing)
- [x] Component Inventory (62 components)
- [x] Step-by-step Integration Guide
- [x] Usage Guidelines with Thai examples
- [x] Migration Guide from shadcn/ui
- [x] Best Practices
- [x] File Structure
- [x] Implementation Checklist
- [x] Dark Mode Configuration
- [x] Form Validation Patterns
- [x] Animation Guidelines

### ✅ Accuracy Verification
- Color codes: Verified against `globals.css`
- Component variants: Verified against source `.tsx` files
- Dependencies: Verified against `package.json`
- Font: Public Sans (confirmed in globals.css)
- Border radius: 10px (confirmed in components)

### ✅ Thai Language Support
- UI labels examples in Thai
- Validation messages in Thai
- Placeholder text examples in Thai

---

*Document created: 2026-01-29*
*Last updated: 2026-01-29*
*Review status: ✅ Ultra Thinking Review Complete*
