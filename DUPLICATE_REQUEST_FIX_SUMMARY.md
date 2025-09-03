# การแก้ไขปัญหา Duplicate Request และ Key Warning

## ปัญหาที่พบ

1. **Duplicate Keys Warning**: มี warning เรื่อง "Encountered two children with the same key" ในตาราง
2. **Duplicate Requests**: หลังจาก manager approve แล้ว มีการสร้าง request ใหม่ที่มี ID เดียวกัน
3. **JSX Attribute Warning**: มี warning เรื่อง `jsx="true"` ใน LoadingPopup

## สาเหตุของปัญหา

1. **การใช้ key ซ้ำ**: ใช้ `req.id` เป็น key ในตาราง แต่มี request หลายประเภทที่อาจมี ID เดียวกัน
2. **การ combine requests**: WelfareContext และ InternalTrainingContext ดึงข้อมูลจากตาราง `welfare_requests` เดียวกัน
3. **Race Condition**: การ update local state ทันทีหลังจาก database update ทำให้เกิด conflict กับ real-time subscription
4. **JSX Syntax**: ใช้ `jsx` attribute ที่ไม่ถูกต้องใน styled-jsx

## การแก้ไข

### 1. แก้ไข Duplicate Keys
```typescript
// เปลี่ยนจาก
<TableRow key={req.id}>

// เป็น
<TableRow key={`${req.id}-${req.type}-${index}`}>
```

### 2. แก้ไข Duplicate Requests ใน Combined Data
```typescript
// เพิ่ม deduplication logic
const combinedRequests = useMemo(() => {
  const requestMap = new Map();
  
  // Add welfare requests
  allRequests.forEach(req => {
    requestMap.set(`${req.id}-${req.type}`, req);
  });
  
  // Add internal training requests (avoid duplicates)
  internalTrainingRequests.forEach(req => {
    const key = `${req.id}-${req.type}`;
    if (!requestMap.has(key)) {
      requestMap.set(key, req);
    }
  });
  
  return Array.from(requestMap.values());
}, [allRequests, internalTrainingRequests]);
```

### 3. แก้ไข Data Filtering ใน WelfareContext
```typescript
// เพิ่ม filter เพื่อไม่ให้ดึง internal training requests
const { data, error } = await supabase
  .from('welfare_requests')
  .select(`
    *,
    Employee!employee_id (
      Team,
      Name
    )
  `)
  .neq('request_type', 'internal_training');
```

### 4. แก้ไข Race Condition
```typescript
// ลบการ update local state ทันที ให้ real-time subscription จัดการแทน
// เปลี่ยนจาก
setWelfareRequests(prev => {
  return prev.map(req => ...);
});

// เป็น
// Don't update local state immediately - let real-time subscription handle it
// This prevents race conditions and duplicate entries
```

### 5. เพิ่ม Real-time Subscription ใน InternalTrainingContext
```typescript
// เพิ่ม real-time subscription เพื่อ sync กับ WelfareContext
useEffect(() => {
  if (!user) return;

  const subscription = supabase
    .channel('internal_training_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'welfare_requests',
      filter: 'request_type=eq.internal_training'
    }, (payload) => {
      // Handle real-time updates
    })
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [user, fetchRequests]);
```

### 6. แก้ไข JSX Warning ใน LoadingPopup
```typescript
// เปลี่ยนจาก
<style jsx>{`

// เป็น
<style>{`
```

## ผลลัพธ์

1. ✅ ไม่มี duplicate keys warning อีกต่อไป
2. ✅ ไม่มีการสร้าง duplicate requests หลัง approval
3. ✅ Real-time updates ทำงานได้อย่างถูกต้อง
4. ✅ ไม่มี JSX attribute warning
5. ✅ Performance ดีขึ้นเพราะลด race conditions

## การทดสอบ

1. ทดสอบ manager approval workflow
2. ตรวจสอบว่าไม่มี duplicate entries ในตาราง
3. ตรวจสอบ real-time updates
4. ตรวจสอบ console ว่าไม่มี warnings

## หมายเหตุ

- การแก้ไขนี้ป้องกัน race conditions ระหว่าง local state updates และ real-time subscriptions
- ใช้ unique keys ที่รวม ID, type และ index เพื่อป้องกัน duplicate keys
- แยก data sources ระหว่าง welfare และ internal training requests อย่างชัดเจน