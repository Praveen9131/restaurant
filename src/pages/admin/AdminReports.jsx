import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import Loading from '../../components/common/Loading';
import { generatePDF } from '../../utils/pdfGenerator';

const AdminReports = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState('');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [reportType, setReportType] = useState('sevenDays'); // 'sevenDays' or 'custom'
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showCompleteOrders, setShowCompleteOrders] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  const fetchReportData = useCallback(async (type = reportType, startDate = null, endDate = null) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('🔄 [AdminReports] Fetching report data...', { type, startDate, endDate });
      
      let response;
      
      if (type === 'custom' && startDate && endDate) {
        // Fetch custom date range report
        response = await adminAPI.getCustomDateReport(startDate, endDate);
      } else {
        // Fetch seven days report
        response = await adminAPI.getReports();
      }
      
      console.log('📊 [AdminReports] API Response:', {
        status: response.status,
        success: response.data?.success,
        hasReport: !!response.data?.report,
        reportKeys: response.data?.report ? Object.keys(response.data.report) : []
      });
      
      if (response.data && response.data.success && response.data.report) {
        setReportData(response.data);
      } else {
        throw new Error('Invalid response format from reports API');
      }
      
    } catch (error) {
      console.error('❌ [AdminReports] Error fetching reports:', error);
      
      let errorMessage = '';
      if (error.response?.status === 500) {
        errorMessage = 'Server Error: Unable to fetch reports. Please try again later.';
      } else if (error.response?.status === 404) {
        errorMessage = 'API Endpoint Not Found: The reports endpoint is not available.';
      } else if (error.response?.data?.error) {
        errorMessage = `API Error: ${error.response.data.error}`;
      } else if (error.response?.data?.message) {
        errorMessage = `API Error: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = `Network Error: ${error.message}`;
      } else {
        errorMessage = 'Unknown error occurred while fetching reports.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [reportType]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleReportTypeChange = (type) => {
    setReportType(type);
    if (type === 'sevenDays') {
      fetchReportData('sevenDays');
    }
  };

  const handleDateRangeChange = (field, value) => {
    setCustomDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateCustomReport = async () => {
    if (!customDateRange.startDate || !customDateRange.endDate) {
      alert('Please select both start and end dates');
      return;
    }

    if (new Date(customDateRange.startDate) > new Date(customDateRange.endDate)) {
      alert('Start date cannot be later than end date');
      return;
    }

    setIsGeneratingReport(true);
    try {
      await fetchReportData('custom', customDateRange.startDate, customDateRange.endDate);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
    setShowOrderDetails(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    return new Date(dateTimeString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadReport = (format) => {
    if (!reportData) {
      alert('No report data available for download');
      return;
    }
    
    const reportTitle = reportType === 'custom' && customDateRange.startDate && customDateRange.endDate
      ? `Custom Report (${customDateRange.startDate} to ${customDateRange.endDate})`
      : `Seven Day Report`;
    
    console.log('Downloading report:', format, 'Title:', reportTitle);
    
    if (format === 'pdf') {
      downloadAsPDF(reportTitle);
    } else if (format === 'excel') {
      downloadAsExcel(reportTitle);
    }
  };

  // Generate PDF using HTML/CSS approach
  const downloadAsPDF = async (title) => {
    try {
      await generatePDF(title, reportData);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF: ' + error.message);
    }
  };

  const downloadAsExcel = (title) => {
    // Create a simple CSV download
    const element = document.createElement('a');
    const csvContent = generateReportCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    element.href = url;
    element.download = `${title}.csv`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    window.URL.revokeObjectURL(url);
  };

  const generateReportCSV = () => {
    if (!reportData?.report) return '';
    
    const { summary, sales_trend, top_selling_items, top_categories } = reportData.report;
    
    let csv = 'Report Data\n\n';
    csv += 'SUMMARY\n';
    csv += `Total Orders,${summary.total_orders}\n`;
    csv += `Total Revenue,${summary.total_revenue}\n`;
    csv += `Average Order Value,${summary.average_order_value}\n\n`;
    
    csv += 'SALES TREND\n';
      csv += 'Date,Day,Orders,Revenue\n';
      sales_trend.forEach(day => {
        csv += `${day.date},${day.day_name},${day.orders},${day.revenue}\n`;
      });
    
    csv += '\nTOP SELLING ITEMS\n';
      csv += 'Item Name,Category,Quantity Sold,Revenue\n';
      top_selling_items.forEach(item => {
      csv += `${item.menu_item__name},${item.menu_item__category__name},${item.quantity_sold},${item.revenue}\n`;
    });
    
    return csv;
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Reports</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchReportData}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!reportData?.report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Report Data</h2>
            <p className="text-gray-600 mb-6">No report data available at the moment.</p>
            <button
              onClick={fetchReportData}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { summary, sales_trend, top_selling_items, top_categories, order_type_analysis } = reportData.report;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Reports</h1>
          <p className="text-gray-600">Comprehensive restaurant analytics and insights</p>
        </div>

        {/* Report Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Report Filter</h2>

        {/* Report Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Report Type</label>
            <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="reportType"
                  value="sevenDays"
                  checked={reportType === 'sevenDays'}
                onChange={(e) => handleReportTypeChange(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
                <span className="ml-2 text-sm text-gray-700">Seven Days Report</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="reportType"
                value="custom"
                checked={reportType === 'custom'}
                onChange={(e) => handleReportTypeChange(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
                <span className="ml-2 text-sm text-gray-700">Custom Date Range</span>
            </label>
            </div>
          </div>

          {/* Custom Date Range */}
          {reportType === 'custom' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Select Date Range</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customDateRange.startDate}
                    onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={customDateRange.endDate}
                    onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    max={new Date().toISOString().split('T')[0]}
                    min={customDateRange.startDate}
                />
              </div>
              <div className="flex items-end">
                <button
                    onClick={generateCustomReport}
                    disabled={isGeneratingReport || !customDateRange.startDate || !customDateRange.endDate}
                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    {isGeneratingReport ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span>Generate Report</span>
                      </>
                    )}
                </button>
                </div>
              </div>
            </div>
          )}

          {/* Current Report Info */}
          {reportData && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">
                  Current Report: {reportType === 'custom' && customDateRange.startDate && customDateRange.endDate
                    ? `${customDateRange.startDate} to ${customDateRange.endDate}`
                    : 'Last 7 Days'
                  }
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Download Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Download Reports</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => downloadReport('pdf')}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download PDF</span>
            </button>
            <button
              onClick={() => downloadReport('excel')}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download Excel</span>
            </button>
            <button
              onClick={() => setShowCompleteOrders(!showCompleteOrders)}
              className={`${showCompleteOrders ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span>{showCompleteOrders ? 'Hide Complete Orders' : 'View Complete Orders'}</span>
            </button>
          </div>
        </div>

            {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Orders</h3>
            <p className="text-3xl font-bold text-blue-600">{summary.total_orders}</p>
            <p className="text-sm text-gray-500 mt-1">All time orders</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Revenue</h3>
            <p className="text-3xl font-bold text-green-600">₹{summary.total_revenue}</p>
                <p className="text-sm text-gray-500 mt-1">
              Avg: ₹{summary.average_order_value}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Report Period</h3>
            <p className="text-lg font-bold text-orange-600">
              {summary.report_period.days} days
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {summary.report_period.start_date} to {summary.report_period.end_date}
            </p>
              </div>
            </div>

            {/* Status Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Order Status Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(summary.status_summary).map(([status, count]) => (
              <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-600 capitalize">
                      {status.replace('_orders_count', '').replace('_', ' ')}
                </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sales Trend */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Sales Trend</h3>
                <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                {sales_trend.map((day, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.day_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.orders}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">₹{day.revenue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            {/* Top Selling Items */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Top Selling Items</h3>
                <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty Sold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                {top_selling_items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.menu_item__name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.menu_item__category__name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity_sold}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">₹{item.revenue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            {/* Top Categories */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Top Categories</h3>
                <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items Sold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                {top_categories.map((category, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{category.menu_item__category__name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{category.total_orders}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{category.total_items_sold}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">₹{category.total_revenue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

        {/* Detailed Orders */}
        {reportData.report.detailed_orders && reportData.report.detailed_orders.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Detailed Orders</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Fee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.report.detailed_orders.slice(0, 20).map((order, index) => {
                    const subtotal = parseFloat(order.subtotal) || 0;
                    const totalAmount = parseFloat(order.total_amount) || 0;
                    const calculatedDeliveryFee = totalAmount - subtotal;
                    
                    return (
                      <React.Fragment key={order.order_id || index}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {order.order_number || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.customer_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.order_date || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.order_type || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {order.status || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.items_count || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            ₹{subtotal}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                            ₹{calculatedDeliveryFee.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                            ₹{totalAmount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => viewOrderDetails(order)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Complete Orders View */}
        {showCompleteOrders && reportData.report.detailed_orders && reportData.report.detailed_orders.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Complete Orders Details</h3>
            <p className="text-sm text-gray-600 mb-6">Click on any order to view detailed item information</p>
            
            <div className="space-y-4">
              {reportData.report.detailed_orders.map((order, index) => {
                const subtotal = parseFloat(order.subtotal) || 0;
                const totalAmount = parseFloat(order.total_amount) || 0;
                const calculatedDeliveryFee = totalAmount - subtotal;
                const isExpanded = expandedOrders.has(order.order_id);
                
                return (
                  <div key={order.order_id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Order Header */}
                    <div 
                      className="p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => toggleOrderExpansion(order.order_id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <svg 
                              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <h4 className="text-lg font-semibold text-gray-900">
                              Order #{order.order_number || order.order_id}
                            </h4>
                          </div>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status?.toUpperCase() || 'N/A'}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(totalAmount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.items_count || 0} items
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Customer:</span>
                          <div className="font-medium text-gray-900">{order.customer_name || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Phone:</span>
                          <div className="font-medium text-gray-900">{order.customer_phone || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Date & Time:</span>
                          <div className="font-medium text-gray-900">{formatDateTime(order.order_datetime)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Type:</span>
                          <div className="font-medium text-gray-900 capitalize">{order.order_type || 'N/A'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Order Details */}
                    {isExpanded && (
                      <div className="p-6 bg-white border-t border-gray-200">
                        {/* Order Summary */}
                        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                          <h5 className="text-sm font-semibold text-gray-800 mb-3">Order Summary</h5>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="text-center">
                              <div className="text-gray-500 mb-1">Subtotal</div>
                              <div className="text-lg font-semibold text-gray-900">
                                {formatCurrency(subtotal)}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-gray-500 mb-1">Delivery Fee</div>
                              <div className="text-lg font-semibold text-blue-600">
                                {formatCurrency(calculatedDeliveryFee)}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-gray-500 mb-1">Total Amount</div>
                              <div className="text-xl font-bold text-green-600">
                                {formatCurrency(totalAmount)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Items Details */}
                        <div className="mb-4">
                          <h5 className="text-sm font-semibold text-gray-800 mb-3">Order Items</h5>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Details</th>
                                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {order.items?.map((item, itemIndex) => (
                                  <tr key={itemIndex} className="hover:bg-gray-50">
                                    <td className="px-4 py-4">
                                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                      {item.selected_variation && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          <span className="font-medium">Variation:</span> {item.selected_variation}
                                        </div>
                                      )}
                                      {item.special_instructions && (
                                        <div className="text-xs text-gray-500 mt-1 italic">
                                          <span className="font-medium">Note:</span> {item.special_instructions}
                                        </div>
                                      )}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {item.category}
                                      </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        {item.quantity}x
                                      </span>
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm font-semibold text-gray-900">
                                      {formatCurrency(item.price)}
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm font-bold text-green-600">
                                      {formatCurrency(item.subtotal)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Delivery Address */}
                        {order.delivery_address && order.delivery_address !== 'Walk-in' && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <h5 className="text-sm font-semibold text-gray-800 mb-2">Delivery Address</h5>
                            <p className="text-sm text-gray-700">{order.delivery_address}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Order Details - {selectedOrder.order_number || selectedOrder.order_id}
                  </h2>
                </div>
                <button
                  onClick={closeOrderDetails}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Order Information */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Customer:</span>
                      <div className="font-medium text-gray-900">{selectedOrder.customer_name || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <div className="font-medium text-gray-900">{selectedOrder.customer_phone || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <div className="font-medium text-gray-900">{selectedOrder.customer_email || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Order Type:</span>
                      <div className="font-medium text-gray-900 capitalize">{selectedOrder.order_type || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <div className="mt-1">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          selectedOrder.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          selectedOrder.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedOrder.status?.toUpperCase() || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Date & Time:</span>
                      <div className="font-medium text-gray-900">{formatDateTime(selectedOrder.order_datetime)}</div>
                    </div>
                  </div>
                </div>

                {/* Order Items Summary Box */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h5 className="text-sm font-semibold text-gray-800">Order Items ({selectedOrder.items_count || 0} items)</h5>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-gray-500 mb-1">Subtotal ({selectedOrder.items_count || 0} items)</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(parseFloat(selectedOrder.subtotal) || 0)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500 mb-1">Delivery Fee</div>
                      <div className="text-lg font-semibold text-blue-600">
                        {formatCurrency((parseFloat(selectedOrder.total_amount) || 0) - (parseFloat(selectedOrder.subtotal) || 0))}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500 mb-1">Total Amount</div>
                      <div className="text-xl font-bold text-green-600">
                        {formatCurrency(parseFloat(selectedOrder.total_amount) || 0)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Item Details Table */}
                <div className="mb-4">
                  <h5 className="text-sm font-semibold text-gray-800 mb-3">ITEM DETAILS</h5>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Details</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedOrder.items?.map((item, itemIndex) => (
                          <tr key={itemIndex} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {formatCurrency(item.price)} per item
                              </div>
                              {item.selected_variation && (
                                <div className="text-xs text-gray-500 mt-1">
                                  <span className="font-medium">Variation:</span> {item.selected_variation}
                                </div>
                              )}
                              {item.special_instructions && (
                                <div className="text-xs text-gray-500 mt-1 italic">
                                  <span className="font-medium">Note:</span> {item.special_instructions}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {item.category}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {item.quantity}x
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right text-sm font-semibold text-gray-900">
                              {formatCurrency(item.price)}
                            </td>
                            <td className="px-4 py-4 text-right text-sm font-semibold text-gray-900">
                              {formatCurrency(item.subtotal)}
                            </td>
                            <td className="px-4 py-4 text-right text-sm font-bold text-green-600">
                              {formatCurrency(item.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Delivery Address */}
                {selectedOrder.delivery_address && selectedOrder.delivery_address !== 'Walk-in' && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h5 className="text-sm font-semibold text-gray-800 mb-2">Delivery Address</h5>
                    <p className="text-sm text-gray-700">{selectedOrder.delivery_address}</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                <button
                  onClick={closeOrderDetails}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
