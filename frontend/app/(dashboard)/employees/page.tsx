'use client';

import { useState } from 'react';
import { Plus, Search, Filter, UserPlus, Mail, Phone, MoreVertical, Edit, Trash2 } from 'lucide-react';

interface Employee {
  id: number;
  name: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  status: 'active' | 'on_leave' | 'terminated';
  joinDate: string;
}

const mockEmployees: Employee[] = [
  { id: 1, name: 'Alice Johnson', position: 'Senior UX Designer', department: 'Design', email: 'alice@company.com', phone: '+1 234 567 890', status: 'active', joinDate: '2023-06-15' },
  { id: 2, name: 'Bob Smith', position: 'Full Stack Developer', department: 'Engineering', email: 'bob@company.com', phone: '+1 234 567 891', status: 'active', joinDate: '2023-07-01' },
  { id: 3, name: 'Carol White', position: 'Product Manager', department: 'Product', email: 'carol@company.com', phone: '+1 234 567 892', status: 'on_leave', joinDate: '2023-05-20' },
  { id: 4, name: 'David Brown', position: 'DevOps Engineer', department: 'Engineering', email: 'david@company.com', phone: '+1 234 567 893', status: 'active', joinDate: '2023-08-10' },
  { id: 5, name: 'Eva Martinez', position: 'HR Specialist', department: 'Human Resources', email: 'eva@company.com', phone: '+1 234 567 894', status: 'active', joinDate: '2023-09-05' },
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState(mockEmployees);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const departments = ['all', ...new Set(employees.map(e => e.department))];
  const statuses = ['all', 'active', 'on_leave', 'terminated'];

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || emp.department === filterDepartment;
    const matchesStatus = filterStatus === 'all' || emp.status === filterStatus;
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'on_leave': return 'bg-yellow-100 text-yellow-700';
      case 'terminated': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Employees</h1>
          <p className="mt-1 text-sm text-gray-500">Manage employee records and information</p>
        </div>
        <button className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Employee
        </button>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {departments.map(dept => (
            <option key={dept} value={dept}>
              {dept === 'all' ? 'All Departments' : dept}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {statuses.map(status => (
            <option key={status} value={status}>
              {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredEmployees.map((employee) => (
          <div key={employee.id} className="rounded-lg bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-lg">
                  {employee.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{employee.name}</h3>
                  <p className="text-sm text-gray-500">{employee.position}</p>
                </div>
              </div>
              <button className="rounded p-1 text-gray-400 hover:bg-gray-100">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
            
            <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
              <div className="flex items-center text-sm text-gray-500">
                <span className="font-medium text-gray-700 w-24">Department:</span>
                {employee.department}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <span className="font-medium text-gray-700 w-24">Email:</span>
                <a href={`mailto:${employee.email}`} className="text-blue-600 hover:underline">
                  {employee.email}
                </a>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <span className="font-medium text-gray-700 w-24">Phone:</span>
                {employee.phone}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(employee.status)}`}>
                  {employee.status === 'on_leave' ? 'On Leave' : employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                </span>
                <span className="text-xs text-gray-400">Joined: {employee.joinDate}</span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button className="flex-1 rounded border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50">
                <Mail className="inline h-3 w-3 mr-1" />
                Email
              </button>
              <button className="flex-1 rounded border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50">
                <Phone className="inline h-3 w-3 mr-1" />
                Call
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}