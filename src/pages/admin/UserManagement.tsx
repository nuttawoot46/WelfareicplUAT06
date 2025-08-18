import { useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, MoreHorizontal, Download } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tables } from '@/types/database.types';
import { Link } from 'react-router-dom';

type Employee = Tables<'Employee'>;

export const UserManagement = () => {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('Employee').select('*').order('id', { ascending: true });
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถโหลดข้อมูลพนักงานได้', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleModalOpen = (employee: Employee | null = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setIsCreateMode(false);
    } else {
      // Reset to a default structure for creation
      const newEmployee: Partial<Employee> = {
        Name: '',
        "email_user": '',
        Team: 'General', // Required field with default value
        Position: '',
        Role: 'user',
        "Email.Manager": 'manager@company.com', // Required field with default value
        budget_wedding: 3000,
        budget_childbirth: 6000,
        budget_funeral_employee: 10000,
        budget_funeral_family: 10000,
        budget_funeral_child: 10000,
        budget_dentalglasses: 2000,
        budget_fitness: 300,
        budget_medical: 1000,
        Budget_Training: 5000,
        Original_Budget_Training: 5000,
      };
      setEditingEmployee(newEmployee as Employee);
      setIsCreateMode(true);
    }
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const handleSave = async () => {
    if (!editingEmployee) {
      console.warn('No employee data to save.');
      return;
    }

    try {
      let error = null; // Initialize error to null

      if (isCreateMode) {
        // Create new employee without auth user first (simplified approach)
        console.log('Attempting to create new employee:', editingEmployee);

        // Validate required fields
        if (!editingEmployee['email_user'] || !editingEmployee.Name || !editingEmployee.Team || !editingEmployee['Email.Manager']) {
          throw new Error('กรุณากรอกข้อมูลที่จำเป็น: ชื่อ, อีเมล, ทีม, และอีเมลผู้จัดการ');
        }

        // Check if email already exists in Employee table
        const { data: existingEmployees, error: checkError } = await supabase
          .from('Employee')
          .select('email_user')
          .eq('email_user', editingEmployee['email_user']);

        if (checkError) {
          console.error('Error checking existing email:', checkError);
          throw checkError;
        }

        if (existingEmployees && existingEmployees.length > 0) {
          throw new Error(`อีเมล ${editingEmployee['email_user']} มีอยู่ในระบบแล้ว`);
        }

        // Prepare employee data with proper types
        const employeeData = {
          Name: editingEmployee.Name,
          "email_user": editingEmployee['email_user'],
          Team: editingEmployee.Team,
          Position: editingEmployee.Position || '',
          Role: editingEmployee.Role || 'user',
          "Email.Manager": editingEmployee['Email.Manager'],
          budget_wedding: editingEmployee.budget_wedding || 3000,
          budget_childbirth: editingEmployee.budget_childbirth || 6000,
          budget_funeral_employee: editingEmployee.budget_funeral_employee || 10000,
          budget_funeral_family: editingEmployee.budget_funeral_family || 10000,
          budget_funeral_child: editingEmployee.budget_funeral_child || 10000,
          budget_dentalglasses: editingEmployee.budget_dentalglasses || 2000,
          budget_fitness: editingEmployee.budget_fitness || 300,
          budget_medical: editingEmployee.budget_medical || 1000,
          Budget_Training: editingEmployee.Budget_Training || 5000,
          Original_Budget_Training: editingEmployee.Original_Budget_Training || 5000,
          auth_uid: null // Create without auth user for now
        };

        console.log('Employee data to insert:', employeeData);

        // Insert employee record first
        const { data: insertData, error: insertError } = await supabase
          .from('Employee')
          .insert(employeeData)
          .select()
          .single();
        
        if (insertError) {
          console.error('Employee Insert Error:', insertError);
          throw insertError;
        }

        console.log('Employee created successfully:', insertData);

        // Try to create auth user using Edge Function first, then fallback to admin client
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const { data: functionResult, error: functionError } = await supabase.functions.invoke('create-user', {
              body: { 
                employeeData: {
                  email_user: editingEmployee['email_user'],
                  password: 'changeme123!'
                }
              },
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            });

            if (!functionError && functionResult && !functionResult.error) {
              // Update employee with auth_uid from function result
              if (functionResult.auth_uid) {
                await supabase
                  .from('Employee')
                  .update({ auth_uid: functionResult.auth_uid })
                  .eq('id', insertData.id);
                
                console.log('Auth user created via Edge Function and linked successfully');
              }
            } else {
              console.warn('Edge Function failed, trying admin client:', functionError);
              throw new Error('Edge Function failed');
            }
          } else {
            throw new Error('No session');
          }
        } catch (edgeFunctionError) {
          // Fallback to admin client
          if (supabaseAdmin) {
            try {
              const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: editingEmployee['email_user'],
                password: 'changeme123!',
                email_confirm: true,
              });

              if (!authError && authData.user) {
                // Update employee with auth_uid
                await supabase
                  .from('Employee')
                  .update({ auth_uid: authData.user.id })
                  .eq('id', insertData.id);
                
                console.log('Auth user created via admin client and linked successfully');
              } else {
                console.warn('Failed to create auth user via admin client:', authError);
              }
            } catch (authError) {
              console.warn('Auth user creation failed completely, but employee record exists:', authError);
            }
          }
        }

      } else {
        // Update existing profile
        if (!editingEmployee.id) {
          console.error('Attempted to update employee without an ID:', editingEmployee);
          throw new Error('Employee ID is missing for update operation.');
        }
        console.log('Attempting to update employee:', editingEmployee);
        const { error: updateError } = await supabase.from('Employee').update(editingEmployee).eq('id', editingEmployee.id);
        error = updateError;
        console.log('Supabase Update Operation Result:', { updateError });
        
        if (error) {
          console.error('Supabase Operation Error:', error);
          throw error;
        }
      }

      toast({ 
        title: 'สำเร็จ', 
        description: isCreateMode 
          ? `สร้างพนักงานใหม่เรียบร้อยแล้ว รหัสผ่านเริ่มต้น: changeme123!` 
          : `บันทึกข้อมูลพนักงานเรียบร้อยแล้ว` 
      });
      fetchEmployees(); // Refresh data
      handleModalClose();

    } catch (error: any) {
      console.error('Caught error during save operation:', error);
      toast({ title: 'เกิดข้อผิดพลาด', description: error.message || 'ไม่สามารถบันทึกข้อมูลได้', variant: 'destructive' });
    }
  };

  const handleDelete = async (employeeId: number, authUid: string | null) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบพนักงานคนนี้? การกระทำนี้ไม่สามารถย้อนกลับได้')) return;

    try {
      // 1. Delete from Employee table
      const { error: profileError } = await supabase.from('Employee').delete().eq('id', employeeId);
      if (profileError) throw profileError;

      // 2. Delete from auth.users if auth_uid exists
      if (authUid) {
        const { error: authError } = await supabase.auth.admin.deleteUser(authUid);
        // Ignore error if user not found in auth, might have been deleted already
        if (authError && !authError.message.includes('User not found')) {
          throw authError;
        }
      }

      toast({ title: 'สำเร็จ', description: 'ลบข้อมูลพนักงานเรียบร้อยแล้ว' });
      fetchEmployees(); // Refresh data

    } catch (error: any) {
      console.error('Error deleting employee:', error);
      toast({ title: 'เกิดข้อผิดพลาด', description: error.message || 'ไม่สามารถลบข้อมูลได้', variant: 'destructive' });
    }
  };

  const renderFormField = (key: keyof Employee, value: any) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumberField = typeof editingEmployee?.[name as keyof Employee] === 'number';
        setEditingEmployee(prev => prev ? { ...prev, [name]: isNumberField ? Number(value) : value } : null);
    };

    // Skip system fields in create mode
    if (isCreateMode && (key === 'id' || key === 'auth_uid' || key === 'created_at' || key === 'manager_id' || key === 'Pin')) {
        return null;
    }

    if (key === 'id' || key === 'auth_uid' || key === 'created_at') {
        return <Input name={key} value={value || ''} onChange={handleChange} disabled />;
    }
    
    if (key === 'Role') {
        return (
            <Select name={key} value={value || 'user'} onValueChange={(val) => setEditingEmployee(prev => prev ? { ...prev, Role: val } : null)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="accounting">Accounting</SelectItem>
                    <SelectItem value="accountingandmanager">AccountingAndManager</SelectItem>
                </SelectContent>
            </Select>
        );
    }

    if (key === 'Team') {
        return (
            <Select name={key} value={value || 'General'} onValueChange={(val) => setEditingEmployee(prev => prev ? { ...prev, Team: val } : null)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Management">Management</SelectItem>
                    <SelectItem value="Strategy">Strategy</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Accounting">Accounting</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                </SelectContent>
            </Select>
        );
    }

    // Required fields styling
    const isRequired = ['Name', 'email_user', 'Team', 'Email.Manager'].includes(key);
    const inputClassName = isRequired ? 'border-red-200 focus:border-red-500' : '';

    return <Input 
      name={key} 
      value={value || ''} 
      onChange={handleChange} 
      placeholder={`${key}${isRequired ? ' *' : ''}`}
      className={inputClassName}
      type={key === 'email_user' || key === 'Email.Manager' ? 'email' : 'text'}
    />;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>จัดการข้อมูลพนักงาน</CardTitle>
          <CardDescription>เพิ่ม ลบ หรือแก้ไขข้อมูลพนักงานในระบบ</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleModalOpen()} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            เพิ่มพนักงานใหม่
          </Button>
          <Link to="/admin/report">
            <Button variant="outline" className="flex items-center gap-2">
              
              Report ภาพรวม
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>ตำแหน่ง</TableHead>
                    <TableHead>ทีม</TableHead>
                    <TableHead>บทบาท</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center">กำลังโหลด...</TableCell></TableRow>
                ) : employees.length > 0 ? (
                    employees.map((employee) => (
                    <TableRow key={employee.id} onDoubleClick={() => handleModalOpen(employee)}>
                        <TableCell>{employee.id}</TableCell>
                        <TableCell className="font-medium">{employee.Name}</TableCell>
                        <TableCell>{employee["email_user"]}</TableCell>
                        <TableCell>{employee.Position}</TableCell>
                        <TableCell>{employee.Team}</TableCell>
                        <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${employee.Role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted'}`}>
                                {employee.Role}
                            </span>
                        </TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onSelect={() => handleModalOpen(employee)}>แก้ไข</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleDelete(employee.id, employee.auth_uid)} className="text-destructive">ลบ</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow><TableCell colSpan={7} className="text-center">ไม่พบข้อมูลพนักงาน</TableCell></TableRow>
                )}
                </TableBody>
            </Table>
        </div>
      </CardContent>

      {/* Edit/Create Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isCreateMode ? 'เพิ่มพนักงานใหม่' : 'แก้ไขข้อมูลพนักงาน'}</DialogTitle></DialogHeader>
          {editingEmployee && (
            <div className="grid gap-4 py-4">
              {Object.entries(editingEmployee).map(([key, value]) => {
                const fieldComponent = renderFormField(key as keyof Employee, value);
                if (!fieldComponent) return null;
                
                const isRequired = ['Name', 'email_user', 'Team', 'Email.Manager'].includes(key);
                const displayName = key === 'email_user' ? 'อีเมล' : 
                                  key === 'Email.Manager' ? 'อีเมลผู้จัดการ' :
                                  key === 'Name' ? 'ชื่อ' :
                                  key === 'Team' ? 'ทีม' :
                                  key === 'Position' ? 'ตำแหน่ง' :
                                  key === 'Role' ? 'บทบาท' : key;
                
                return (
                  <div className="grid grid-cols-4 items-center gap-4" key={key}>
                    <label className={`text-right font-medium ${isRequired ? 'text-red-600' : ''}`}>
                      {displayName}{isRequired ? ' *' : ''}
                    </label>
                    <div className="col-span-3">
                      {fieldComponent}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleModalClose}>ยกเลิก</Button>
            <Button onClick={handleSave}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default UserManagement;
