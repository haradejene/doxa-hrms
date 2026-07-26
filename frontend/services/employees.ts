import api from './api'

export interface Employee {
  id: number
  user_id: number
  department_id: number
  position_id: number
  manager_id: number | null
  employee_number: string
  first_name: string
  last_name: string
  email: string
  phone: string
  hire_date: string
  employment_type: string
  status: string
  base_salary: number
  department: { name: string }
  position: { title: string }
  manager: Employee | null
  full_name: string
}

export const employeeService = {
  getEmployees: async () => {
    const response = await api.get<Employee[]>('/api/employees')
    return response.data
  },

  getEmployee: async (id: number) => {
    const response = await api.get<Employee>(`/api/employees/${id}`)
    return response.data
  },

  createEmployee: async (data: Partial<Employee>) => {
    const response = await api.post<Employee>('/api/employees', data)
    return response.data
  },

  updateEmployee: async (id: number, data: Partial<Employee>) => {
    const response = await api.put<Employee>(`/api/employees/${id}`, data)
    return response.data
  },

  deleteEmployee: async (id: number) => {
    await api.delete(`/api/employees/${id}`)
  },
}
