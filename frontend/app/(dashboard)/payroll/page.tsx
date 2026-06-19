'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  MoreVertical,
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  FileText,
} from 'lucide-react';

interface PayrollRecord {
  id: number;
  employee: string;
  employeeId: string;
  period: string;
  grossSalary: number;
  deductions: number;
  netSalary: number;
  status: 'draft' | 'review' | 'approved' | 'paid';
  paymentDate?: string;
}

interface PayrollSummary {
  totalEmployees: number;
  totalPayroll: number;
  averageSalary: number;
  pendingApprovals: number;
}

const mockPayrolls: PayrollRecord[] = [
  { id: 1, employee: 'Alice Johnson', employeeId: 'EMP001', period: 'January 2024', grossSalary: 7500, deductions: 1200, netSalary: 6300, status: 'paid', paymentDate: '2024-01-31' },
  { id: 2, employee: 'Bob Smith', employeeId: 'EMP002', period: 'January 2024', grossSalary: 8200, deductions: 1350, netSalary: 6850, status: 'paid', paymentDate: '2024-01-31' },
  { id: 3, employee: 'Carol White', employeeId: 'EMP003', period: 'January 2024', grossSalary: 6800, deductions: 1100, netSalary: 5700, status: 'approved' },
  { id: 4, employee: 'David Brown', employeeId: 'EMP004', period: 'January 2024', grossSalary: 9000, deductions: 1500, netSalary: 7500, status: 'review' },
  { id: 5, employee: 'Eva Martinez', employeeId: 'EMP005', period: 'January 2024', grossSalary: 7200, deductions: 1150, netSalary: 6050, status: 'draft' },
];

const summaryData: PayrollSummary = {
  totalEmployees: 156,
  totalPayroll: 1247500,
  averageSalary: 7996,
  pendingApprovals: 12,
};

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState(mockPayrolls);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('January 2024');

  const filteredPayrolls = payrolls.filter(payroll => {
    const matchesSearch = payroll.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payroll.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || payroll.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'approved': return 'bg-blue-100 text-blue-700';
      case 'review': return 'bg-yellow-100 text-yellow-700';
      case 'draft': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'review': return <Clock className="h-4 w-4" />;
      case 'draft': return <FileText className="h-4 w-4" />;
      default: return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payroll</h1>
          <p className="mt-1 text-sm text-gray-500">Manage payroll processing and employee compensation</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Download className="mr-2 h-4 w-4" />
            Export
          </button>
          <button className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Generate Payroll
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
              <Users className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Employees</p>
              <p className="text-2xl font-semibold text-gray-900">{summaryData.totalEmployees}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-green-100 p-3 text-green-600">
              <DollarSign className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Payroll</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(summaryData.totalPayroll)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-purple-100 p-3 text-purple-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Average Salary</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(summaryData.averageSalary)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-yellow-100 p-3 text-yellow-600">
              <Clock className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
              <p className="text-2xl font-semibold text-gray-900">{summaryData.pendingApprovals}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search payroll records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="January 2024">January 2024</option>
          <option value="December 2023">December 2023</option>
          <option value="November 2023">November 2023</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="review">Review</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
        </select>
        <button className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <Filter className="mr-2 h-4 w-4" />
          More Filters
        </button>
      </div>

      {/* Payroll Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Period</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Gross Salary</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Deductions</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Net Salary</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredPayrolls.map((payroll) => (
              <tr key={payroll.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{payroll.employee}</div>
                  <div className="text-xs text-gray-500">{payroll.employeeId}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{payroll.period}</td>
                <td className="px-6 py-4 text-right text-sm text-gray-900">{formatCurrency(payroll.grossSalary)}</td>
                <td className="px-6 py-4 text-right text-sm text-red-600">-{formatCurrency(payroll.deductions)}</td>
                <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{formatCurrency(payroll.netSalary)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(payroll.status)}`}>
                    {getStatusIcon(payroll.status)}
                    {payroll.status.charAt(0).toUpperCase() + payroll.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                      <Download className="h-4 w-4" />
                    </button>
                    <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}