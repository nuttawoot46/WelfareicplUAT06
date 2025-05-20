
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  ChartBar, 
  File, 
  LogIn, 
  LogOut, 
  Settings, 
  CheckSquare, 
  Bell,
  Menu,
  X,
  Users,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Define team data
const teams = [
  { id: 'all', name: 'ทุกทีม' },
  { id: 'strategy', name: 'Strategy' },
  { id: 'inspiration', name: 'Inspiration' },
  { id: 'registration', name: 'Registration/Procurement' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'finance', name: 'Accounting & Finance' }
];

// Define mock employee data - restructured to avoid circular dependency
const employeesData = {
  strategy: [
    { id: 'all-strategy', name: 'ทุกคนในทีม Strategy', team: 'strategy' },
    { id: 's1', name: 'สมชาย ใจดี', team: 'strategy' },
    { id: 's2', name: 'ณัฐพร รักษ์ไทย', team: 'strategy' },
    { id: 's3', name: 'วิชัย พัฒนา', team: 'strategy' }
  ],
  inspiration: [
    { id: 'all-inspiration', name: 'ทุกคนในทีม Inspiration', team: 'inspiration' },
    { id: 'i1', name: 'มานี มีหัวใจ', team: 'inspiration' },
    { id: 'i2', name: 'สุชาติ สร้างสรรค์', team: 'inspiration' },
    { id: 'i3', name: 'นภาพร ดาวเด่น', team: 'inspiration' }
  ],
  registration: [
    { id: 'all-registration', name: 'ทุกคนในทีม Registration/Procurement', team: 'registration' },
    { id: 'r1', name: 'รัชนี จัดซื้อ', team: 'registration' },
    { id: 'r2', name: 'พรชัย เอกสาร', team: 'registration' },
    { id: 'r3', name: 'อนุสรณ์ พัสดุ', team: 'registration' }
  ],
  marketing: [
    { id: 'all-marketing', name: 'ทุกคนในทีม Marketing', team: 'marketing' },
    { id: 'm1', name: 'กัญญา โฆษณา', team: 'marketing' },
    { id: 'm2', name: 'ไพศาล ขายเก่ง', team: 'marketing' },
    { id: 'm3', name: 'ศิริลักษณ์ สื่อสาร', team: 'marketing' }
  ],
  finance: [
    { id: 'all-finance', name: 'ทุกคนในทีม Accounting & Finance', team: 'finance' },
    { id: 'f1', name: 'กนกวรรณ บัญชี', team: 'finance' },
    { id: 'f2', name: 'ประเสริฐ การเงิน', team: 'finance' },
    { id: 'f3', name: 'จิตรา ภาษี', team: 'finance' }
  ]
};

// Helper function to get employees by team
function getEmployeesByTeam(teamId) {
  if (teamId === 'all') return [];
  return employeesData[teamId].filter(emp => emp.id !== `all-${teamId}`);
}

// Create combined employee list
const allEmployees = [
  { id: 'all', name: 'ทุกคน' },
  ...Object.keys(employeesData).flatMap(teamId => 
    getEmployeesByTeam(teamId)
  )
];

// Define complete employees object
const employees = {
  all: allEmployees,
  strategy: employeesData.strategy,
  inspiration: employeesData.inspiration,
  registration: employeesData.registration,
  marketing: employeesData.marketing,
  finance: employeesData.finance
};

export function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  
  // Mobile responsive management
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Team and employee filters
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [filteredEmployees, setFilteredEmployees] = useState(employees.all);
  
  // Handle team selection change
  useEffect(() => {
    if (selectedTeam === 'all') {
      setFilteredEmployees(employees.all);
    } else {
      setFilteredEmployees(employees[selectedTeam]);
    }
    // Reset employee selection when team changes
    setSelectedEmployee('all');
  }, [selectedTeam]);
  
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };
  
  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const isActive = (path: string) => location.pathname === path;

  // If not logged in, don't show sidebar
  if (!user) return null;

  return (
    <>
      {/* Mobile menu button */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleMobileSidebar} 
        className="fixed top-4 left-4 z-50 md:hidden bg-primary text-white rounded-full shadow-lg"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </Button>
      
      {/* Sidebar container */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 bg-gradient-primary shadow-xl transition-all duration-300 flex flex-col",
        isOpen ? "w-64" : "w-20",
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Logo and title */}
        <div className="p-4 border-b border-white/20 flex items-center justify-between">
          <div className={cn(
            "flex items-center gap-3 transition-all duration-300 overflow-hidden",
            isOpen ? "w-auto" : "w-12"
          )}>
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-primary font-bold text-xl">
              WF
            </div>
            {isOpen && (
              <h1 className="text-white font-bold text-xl animate-fade-in">Welfare</h1>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="text-white hover:bg-white/10 hidden md:flex"
          >
            {isOpen ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </Button>
        </div>
        
        {/* Team and Employee Selection */}
        {isOpen && (
          <div className="p-4 space-y-4 border-b border-white/20">
            <div className="space-y-1">
              <label className="text-xs font-medium text-white/70">เลือกทีม</label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="เลือกทีม" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-white/70">เลือกพนักงาน</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="เลือกพนักงาน" />
                </SelectTrigger>
                <SelectContent>
                  {filteredEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* Dashboard */}
          <Link to="/dashboard" className={cn(
            "nav-link group",
            isActive('/dashboard') && "nav-link-active"
          )}>
            <ChartBar className="h-5 w-5 flex-shrink-0" />
            {isOpen && (
              <span className="transition-all duration-300">แดชบอร์ด</span>
            )}
          </Link>
          
          {/* Team filter shortcut */}
          {!isOpen && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "nav-link group w-full",
                  selectedTeam !== 'all' && "nav-link-active"
                )}>
                  <Users className="h-5 w-5 flex-shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="right">
                {teams.map((team) => (
                  <DropdownMenuItem key={team.id} onClick={() => setSelectedTeam(team.id)}>
                    {team.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {/* Employee filter shortcut */}
          {!isOpen && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "nav-link group w-full",
                  selectedEmployee !== 'all' && "nav-link-active"
                )}>
                  <User className="h-5 w-5 flex-shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="right">
                {filteredEmployees.map((employee) => (
                  <DropdownMenuItem key={employee.id} onClick={() => setSelectedEmployee(employee.id)}>
                    {employee.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {/* Welfare Forms */}
          <Link to="/forms" className={cn(
            "nav-link group",
            isActive('/forms') && "nav-link-active"
          )}>
            <File className="h-5 w-5 flex-shrink-0" />
            {isOpen && (
              <span className="transition-all duration-300">แบบฟอร์มขอสวัสดิการ</span>
            )}
          </Link>
          
          {/* Admin Panel (only for admin) */}
          {user.role === 'admin' && (
            <Link to="/admin" className={cn(
              "nav-link group",
              isActive('/admin') && "nav-link-active"
            )}>
              <CheckSquare className="h-5 w-5 flex-shrink-0" />
              {isOpen && (
                <span className="transition-all duration-300">อนุมัติคำร้อง</span>
              )}
            </Link>
          )}
          
          {/* Notifications */}
          <Link to="/notifications" className={cn(
            "nav-link group",
            isActive('/notifications') && "nav-link-active"
          )}>
            <Bell className="h-5 w-5 flex-shrink-0" />
            {isOpen && (
              <span className="transition-all duration-300">การแจ้งเตือน</span>
            )}
          </Link>
          
          {/* Settings */}
          <Link to="/settings" className={cn(
            "nav-link group",
            isActive('/settings') && "nav-link-active"
          )}>
            <Settings className="h-5 w-5 flex-shrink-0" />
            {isOpen && (
              <span className="transition-all duration-300">ตั้งค่า</span>
            )}
          </Link>
        </nav>
        
        {/* User profile & logout */}
        <div className="p-4 border-t border-white/20">
          <div className={cn(
            "flex items-center gap-3 mb-4",
            isOpen ? "justify-start" : "justify-center"
          )}>
            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-primary font-bold">
              {user.name.charAt(0)}
            </div>
            
            {isOpen && (
              <div className="overflow-hidden">
                <p className="text-sm text-white font-medium truncate">{user.name}</p>
                <p className="text-xs text-white/70 truncate">{user.department}</p>
              </div>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            onClick={logout}
            className={cn(
              "w-full text-white hover:bg-white/10 flex items-center gap-2",
              !isOpen && "justify-center"
            )}
          >
            <LogOut className="h-4 w-4" />
            {isOpen && <span>ออกจากระบบ</span>}
          </Button>
        </div>
      </div>
    </>
  );
}

// Helper icon components
function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m15 18-6-6 6-6"/>
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
