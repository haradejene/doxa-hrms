'use client';

import { useState } from 'react';
import {
  TrendingUp,
  Users,
  Star,
  Calendar,
  Search,
  Filter,
  Plus,
  Download,
  MoreVertical,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
} from 'lucide-react';

interface PerformanceReview {
  id: number;
  employee: string;
  position: string;
  department: string;
  reviewPeriod: string;
  rating: number;
  status: 'pending' | 'completed' | 'scheduled';
  reviewer: string;
  reviewDate: string;
  comments?: string;
}

interface KPI {
  id: number;
  name: string;
  department: string;
  target: string;
  progress: number;
  status: 'on-track' | 'at-risk' | 'behind';
  assignedTo: string;
  dueDate: string;
}

const mockReviews: PerformanceReview[] = [
  { id: 1, employee: 'Alice Johnson', position: 'Senior UX Designer', department: 'Design', reviewPeriod: 'Q4 2023', rating: 4.5, status: 'completed', reviewer: 'John Manager', reviewDate: '2023-12-15', comments: 'Excellent performance, exceeded targets.' },
  { id: 2, employee: 'Bob Smith', position: 'Full Stack Developer', department: 'Engineering', reviewPeriod: 'Q4 2023', rating: 3.8, status: 'completed', reviewer: 'Sarah Lead', reviewDate: '2023-12-20' },
  { id: 3, employee: 'Carol White', position: 'Product Manager', department: 'Product', reviewPeriod: 'Q1 2024', rating: 0, status: 'scheduled', reviewer: 'Mike Director', reviewDate: '2024-02-01' },
  { id: 4, employee: 'David Brown', position: 'DevOps Engineer', department: 'Engineering', reviewPeriod: 'Q1 2024', rating: 0, status: 'pending', reviewer: 'Sarah Lead', reviewDate: '2024-01-25' },
];

const mockKPIs: KPI[] = [
  { id: 1, name: 'Sales Target Achievement', department: 'Sales', target: '100%', progress: 85, status: 'on-track', assignedTo: 'Sales Team', dueDate: '2024-03-31' },
  { id: 2, name: 'Project Completion Rate', department: 'Engineering', target: '95%', progress: 72, status: 'at-risk', assignedTo: 'Engineering Team', dueDate: '2024-02-28' },
  { id: 3, name: 'Customer Satisfaction Score', department: 'Support', target: '4.5', progress: 4.2, status: 'on-track', assignedTo: 'Support Team', dueDate: '2024-03-15' },
  { id: 4, name: 'Employee Engagement', department: 'HR', target: '85%', progress: 78, status: 'behind', assignedTo: 'HR Team', dueDate: '2024-04-30' },
];

export default function PerformancePage() {
  const [reviews, setReviews] = useState(mockReviews);
  const [kpis, setKpis] = useState(mockKPIs);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState<'reviews' | 'kpis'>('reviews');

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || review.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getKPIStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'bg-green-100 text-green-700';
      case 'at-risk': return 'bg-yellow-100 text-yellow-700';
      case 'behind': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Performance</h1>
          <p className="mt-1 text-sm text-gray-500">Manage KPIs and performance reviews</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </button>
          <button className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            {activeTab === 'reviews' ? 'New Review' : 'New KPI'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-2 px-1 border-b-2 text-sm font-medium ${
              activeTab === 'reviews'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Performance Reviews
          </button>
          <button
            onClick={() => setActiveTab('kpis')}
            className={`py-2 px-1 border-b-2 text-sm font-medium ${
              activeTab === 'kpis'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            KPIs & Metrics
          </button>
        </nav>
      </div>

      {activeTab === 'reviews' ? (
        <>
          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="search"
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="scheduled">Scheduled</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Reviews Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredReviews.map((review) => (
              <div key={review.id} className="rounded-lg bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                      {review.employee.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{review.employee}</h3>
                      <p className="text-sm text-gray-500">{review.position}</p>
                    </div>
                  </div>
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(review.status)}`}>
                    {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Department</span>
                    <span className="font-medium text-gray-900">{review.department}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Review Period</span>
                    <span className="font-medium text-gray-900">{review.reviewPeriod}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Reviewer</span>
                    <span className="font-medium text-gray-900">{review.reviewer}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Rating</span>
                    {review.rating > 0 ? renderStars(review.rating) : <span className="text-gray-400">Not rated</span>}
                  </div>
                  {review.comments && (
                    <div className="mt-2 border-t border-gray-100 pt-2">
                      <p className="text-xs text-gray-500">{review.comments}</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Review Date: {review.reviewDate}</span>
                  <div className="flex gap-2">
                    <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        // KPIs Section
        <div className="space-y-4">
          {kpis.map((kpi) => (
            <div key={kpi.id} className="rounded-lg bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{kpi.name}</h3>
                      <p className="text-sm text-gray-500">{kpi.department}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-medium text-gray-900">{kpi.progress}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                      <div
                        className={`h-2 rounded-full ${
                          kpi.progress >= 80 ? 'bg-green-500' :
                          kpi.progress >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${kpi.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Target</p>
                      <p className="font-medium text-gray-900">{kpi.target}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Due Date</p>
                      <p className="font-medium text-gray-900">{kpi.dueDate}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Assigned To</p>
                      <p className="font-medium text-gray-900">{kpi.assignedTo}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getKPIStatusColor(kpi.status)}`}>
                    {kpi.status === 'on-track' ? 'On Track' : 
                     kpi.status === 'at-risk' ? 'At Risk' : 
                     'Behind'}
                  </span>
                  <div className="flex gap-2">
                    <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}