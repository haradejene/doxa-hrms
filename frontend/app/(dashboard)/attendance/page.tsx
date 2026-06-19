'use client';

import { useState } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Users,
  TrendingUp,
  Download,
  Plus,
  MoreVertical,
} from 'lucide-react';

interface AttendanceRecord {
  id: number;
  employee: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  overtime: number;
  department: string;
}

interface LeaveRequest {
  id: number;
  employee: string;
  type: 'annual' | 'sick' | 'emergency' | 'maternity' | 'unpaid';
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  days: number;
}

const mockAttendance: AttendanceRecord[] = [
  { id: 1, employee: 'Alice Johnson', employeeId: 'EMP001', date: '2024-01-19', checkIn: '08:45', checkOut: '17:30', status: 'present', overtime: 0.5, department: 'Design' },
  { id: 2, employee: 'Bob Smith', employeeId: 'EMP002', date: '2024-01-19', checkIn: '09:15', checkOut: '17:45', status: 'late', overtime: 0, department: 'Engineering' },
  { id: 3, employee: 'Carol White', employeeId: 'EMP003', date: '2024-01-19', checkIn: '-', checkOut: '-', status: 'absent', overtime: 0, department: 'Product' },
  { id: 4, employee: 'David Brown', employeeId: 'EMP004', date: '2024-01-19', checkIn: '08:30', checkOut: '17:00', status: 'present', overtime: 0, department: 'Engineering' },
  { id: 5, employee: 'Eva Martinez', employeeId: 'EMP005', date: '2024-01-19', checkIn: '08:00', checkOut: '13:00', status: 'half-day', overtime: 0, department: 'HR' },
];

const mockLeaveRequests: LeaveRequest[] = [
  { id: 1, employee: 'Carol White', type: 'sick', startDate: '2024-01-22', endDate: '2024-01-23', status: 'pending', days: 2 },
  { id: 2, employee: 'Bob Smith', type: 'annual', startDate: '2024-02-01', endDate: '2024-02-05', status: 'approved', days: 5 },
  { id: 3, employee: 'Alice Johnson', type: 'emergency', startDate: '2024-01-25', endDate: '2024-01-25', status: 'rejected', days: 1 },
];

export default function AttendancePage() {
  const [attendance, setAttendance] = useState(mockAttendance);
  const [leaveRequests, setLeaveRequests] = useState(mockLeaveRequests);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState('2024-01-19');
  const [activeTab, setActiveTab] = useState<'attendance' | 'leaves'>('attendance');

  const filteredAttendance = attendance.filter(record => {
    const matchesSearch = record.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-700';
      case 'late': return 'bg-yellow-100 text-yellow-700';
      case 'absent': return 'bg-red-100 text-red-700';
      case 'half-day': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="h-4 w-4" />;
      case 'late': return <AlertCircle className="h-4 w-4" />;
      case 'absent': return <XCircle className="h-4 w-4" />;
      case 'half-day': return <Clock className="h-4 w-4" />;
      default: return null;
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'annual': return 'bg-blue-100 text-blue-700';
      case 'sick': return 'bg-red-100 text-red-700';
      case 'emergency': return 'bg-orange-100 text-orange-700';
      case 'maternity': return 'bg-purple-100 text-purple-700';
      case 'unpaid': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getLeaveStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Attendance & Leave</h1>
          <p className="mt-1 text-sm text-gray-500">Track employee attendance and manage leave requests</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </button>
          <button className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Request Leave
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`py-2 px-1 border-b-2 text-sm font-medium ${
              activeTab === 'attendance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Attendance
          </button>
          <button
            onClick={() => setActiveTab('leaves')}
            className={`py-2 px-1 border-b-2 text-sm font-medium ${
              activeTab === 'leaves'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Leave Requests
            <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
              {leaveRequests.filter(l => l.status === 'pending').length}
            </span>
          </button>
        </nav>
      </div>

      {activeTab === 'attendance' ? (
        <>
          {/* Filters */}
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
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="half-day">Half Day</option>
            </select>
          </div>

          {/* Attendance Table */}
          <div className="overflow-hidden rounded-lg bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Check In</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Check Out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Overtime</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredAttendance.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{record.employee}</div>
                      <div className="text-xs text-gray-500">{record.employeeId} • {record.department}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{record.date}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{record.checkIn}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{record.checkOut}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(record.status)}`}>
                        {getStatusIcon(record.status)}
                        {record.status === 'half-day' ? 'Half Day' : record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{record.overtime > 0 ? `${record.overtime}h` : '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        // Leave Requests
        <div className="space-y-4">
          {leaveRequests.map((request) => (
            <div key={request.id} className="rounded-lg bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{request.employee}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getLeaveTypeColor(request.type)}`}>
                        {request.type.charAt(0).toUpperCase() + request.type.slice(1)}
                      </span>
                      <span>•</span>
                      <span>{request.startDate} - {request.endDate}</span>
                      <span>•</span>
                      <span>{request.days} days</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getLeaveStatusColor(request.status)}`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <button className="rounded bg-green-100 px-3 py-1 text-sm text-green-700 hover:bg-green-200">
                        Approve
                      </button>
                      <button className="rounded bg-red-100 px-3 py-1 text-sm text-red-700 hover:bg-red-200">
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}