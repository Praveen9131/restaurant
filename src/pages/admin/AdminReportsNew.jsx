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

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('🔄 [AdminReports] Fetching report data...');
      
      const response = await adminAPI.getReports();
      
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
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const downloadReport = (format) => {
    if (!reportData) {
      alert('No report data available for download');
      return;
    }

    const reportTitle = customDateRange.startDate && customDateRange.endDate
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.report.detailed_orders.slice(0, 20).map((order, index) => {
                    const subtotal = parseFloat(order.subtotal) || 0;
                    const totalAmount = parseFloat(order.total_amount) || 0;
                    const calculatedDeliveryFee = totalAmount - subtotal;
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50">
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
