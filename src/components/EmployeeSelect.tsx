import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Employee {
  name: string
  team: string
  email: string
}

interface EmployeeOption {
  value: string
  label: string
  data: Employee
}

export function EmployeeSelect() {
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch employees from Supabase
  async function fetchEmployees() {
    try {
      console.log('Fetching employees from Supabase...')
      const { data, error } = await supabase
        .from('employees')
        .select('name, team, email')
        .order('name')
      
      if (error) {
        console.error('Supabase error:', error)
        throw new Error(`Failed to fetch employees: ${error.message}`)
      }

      if (!data || data.length === 0) {
        console.log('No employees found in the database')
        return []
      }

      console.log('Successfully fetched employees:', data)
      return data
    } catch (error) {
      console.error('Error in fetchEmployees:', error)
      throw error // Re-throw to handle in loadEmployees
    }
  }

  // Convert employees data to dropdown options
  async function getEmployeeOptions() {
    try {
      const employees = await fetchEmployees()
      
      if (employees.length === 0) {
        return []
      }

      const options = employees.map((employee: Employee) => ({
        value: employee.email,
        label: `${employee.name} (${employee.team})`,
        data: employee
      }))

      console.log('Converted to options:', options)
      return options
    } catch (error) {
      console.error('Error in getEmployeeOptions:', error)
      throw error // Re-throw to handle in loadEmployees
    }
  }

  // Load employees on component mount
  useEffect(() => {
    async function loadEmployees() {
      try {
        setLoading(true)
        setError(null)
        const options = await getEmployeeOptions()
        setEmployees(options)
      } catch (err: any) {
        console.error('Error in loadEmployees:', err)
        setError(err.message || 'ไม่สามารถโหลดข้อมูลพนักงานได้')
      } finally {
        setLoading(false)
      }
    }

    loadEmployees()
  }, [])

  // Filter employees based on selected department
  const filteredEmployees = selectedDepartment 
    ? employees.filter(emp => emp.data.team === selectedDepartment)
    : employees

  // Get unique departments
  const departments = [...new Set(employees.map(emp => emp.data.team))]

  if (loading) return (
    <div className="text-center py-4">
      <div className="animate-pulse">กำลังโหลดข้อมูลพนักงาน...</div>
    </div>
  )

  if (error) return (
    <div className="text-red-500 py-4">
      <div>เกิดข้อผิดพลาด:</div>
      <div className="text-sm">{error}</div>
    </div>
  )

  if (employees.length === 0) {
    return (
      <div className="text-yellow-600 py-4">
        ไม่พบข้อมูลพนักงานในระบบ
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <label htmlFor="department-select" className="text-sm font-medium">
          เลือกทีม
        </label>
        <select
          id="department-select"
          className="w-full rounded-md border border-gray-300 p-2"
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
        >
          <option value="">ทั้งหมด</option>
          {departments.map(team => (
            <option key={team} value={team}>{team}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col space-y-2">
        <label htmlFor="employee-select" className="text-sm font-medium">
          เลือกพนักงาน
        </label>
        <select
          id="employee-select"
          className="w-full rounded-md border border-gray-300 p-2"
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
        >
          <option value="">เลือกพนักงาน</option>
          {filteredEmployees.map(employee => (
            <option key={employee.value} value={employee.value}>
              {employee.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
} 