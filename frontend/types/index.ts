export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'hr' | 'manager' | 'employee'
  created_at: string
  updated_at: string
}

export interface JobPosting {
  id: string
  title: string
  department_id: string
  hiring_manager_id: string
  description: string
  requirements: string
  status: 'draft' | 'published' | 'closed' | 'archived'
  deadline: string
  published_at: string | null
  created_by: string
}

export interface Application {
  id: string
  job_posting_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  resume_url: string
  cover_letter: string
  current_stage: 'applied' | 'screening' | 'shortlisted' | 'interview_scheduled' | 'interview_completed' | 'assessment' | 'offer_sent' | 'hired' | 'rejected'
  status: 'active' | 'withdrawn' | 'rejected'
}

export interface Employee {
  id: string
  employee_code: string
  department_id: string
  position_id: string
  full_name: string
  email: string
  phone: string
  salary: number
  hire_date: string
  status: 'active' | 'on_leave' | 'suspended' | 'terminated'
}

export interface Payroll {
  id: string
  employee_id: string
  period: string
  gross_salary: number
  deductions: number
  net_salary: number
  status: 'draft' | 'review' | 'approved' | 'paid'
}