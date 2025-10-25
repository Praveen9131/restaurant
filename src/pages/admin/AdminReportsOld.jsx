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
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState(null);
  const [reportType, setReportType] = useState('seven-days'); // 'seven-days' or 'custom'
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [expandedOrders, setExpandedOrders] = useState(new Set());

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate('/admin/login');
      return;
    }

    fetchReportData();
  }, [user, isAdmin, navigate]);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let response;
      
      if (reportType === 'seven-days') {
        response = await adminAPI.getSevenDayReport();
      } else {
        if (!customDateRange.startDate || !customDateRange.endDate) {
          setError('Please select both start and end dates for custom report');
          setLoading(false);
          return;
        }
        response = await adminAPI.getCustomDateReport(
          customDateRange.startDate, 
          customDateRange.endDate
        );
      }
      
      if (response.data.success) {
        setReportData(response.data);
      } else {
        setError('Failed to fetch report data');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  }, [reportType, customDateRange]);

  const handleReportTypeChange = (type) => {
    setReportType(type);
    if (type === 'seven-days') {
      fetchReportData();
    }
  };

  const handleDateChange = (field, value) => {
    setCustomDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenerateReport = () => {
    if (reportType === 'custom' && (!customDateRange.startDate || !customDateRange.endDate)) {
      setError('Please select both start and end dates');
      return;
    }
    fetchReportData();
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

  const downloadReport = (format) => {
    if (!reportData) {
      alert('No report data available. Please generate a report first.');
      return;
    }
    
    const reportTitle = reportType === 'seven-days' 
      ? 'Seven Day Report' 
      : `Custom Report (${customDateRange.startDate} to ${customDateRange.endDate})`;
    
    console.log('Downloading report:', format, 'Title:', reportTitle);
    
    if (format === 'pdf') {
      downloadAsPDF(reportTitle);
    } else if (format === 'excel') {
      downloadAsExcel(reportTitle);
    }
  };

  const testPDF = () => {
    console.log('Testing PDF generation...');
    const testData = {
      summary: {
        total_orders: 1,
        total_revenue: 50,
        average_order_value: 50,
        status_summary: {
          pending_orders_count: 19,
          confirmed_orders_count: 62,
          preparing_orders_count: 0,
          out_for_delivery_orders_count: 4,
          delivered_orders_count: 1,
          cancelled_orders_count: 3
        },
        report_period: {
          start_date: '2025-10-18',
          end_date: '2025-10-24',
          days: 7
        }
      },
      sales_trend: [
        { date: '2025-10-19', day_name: 'Sunday', orders: 1, revenue: 50 }
      ],
      top_selling_items: [
        { menu_item__name: 'chicken praveen', menu_item__category__name: 'Fried Chicken', quantity_sold: 1, revenue: 50 }
      ],
      top_categories: [
        { menu_item__category__name: 'Fried Chicken', total_orders: 1, total_items_sold: 1, total_revenue: 50 }
      ],
      order_type_analysis: [
        { order_type: 'walk_in', total_orders: 1, total_revenue: 50, average_order_value: 50, status_summary: { delivered_orders_count: 1, pending_orders_count: 11 } }
      ],
      revenue_criteria: 'Only includes: Delivery (delivered) + Walk-in (confirmed)'
    };
    
    setReportData(testData);
    setTimeout(() => {
      downloadAsPDF('Test Report');
    }, 100);
  };

  // Simple number formatting for PDF (no separators)
  const formatNumberForPDF = (num) => {
    if (typeof num === 'string') {
      num = parseFloat(num);
    }
    if (isNaN(num)) return '0';
    return Math.round(num).toString();
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
      
      // Create new PDF document
      const doc = new jsPDF('p', 'mm', 'a4');
      console.log('PDF document created successfully');
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Colors
      const primaryColor = [252, 128, 25]; // #FC8019 - Sea Side Bake orange
      const secondaryColor = [28, 28, 28]; // #1C1C1C - Dark gray
      const lightGray = [156, 156, 156]; // #9C9C9C - Light gray
      
      let yPosition = 20;
      
      // Header with restaurant branding
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 30, 'F');
      
      // Restaurant name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('SEA SIDE BAKE', pageWidth / 2, 15, { align: 'center' });
      
      // Tagline
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Live • Fresh • Delicious', pageWidth / 2, 22, { align: 'center' });
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      yPosition = 40;
      
      // Report title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('RESTAURANT REPORT', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
      
      // Report period
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report Period: ${summary.report_period.start_date} to ${summary.report_period.end_date} (${summary.report_period.days} days)`, 20, yPosition);
      yPosition += 8;
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Revenue Criteria: ${reportData.revenue_criteria}`, 20, yPosition);
      yPosition += 15;
      
      // Summary section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('SUMMARY', 20, yPosition);
      yPosition += 10;
      
      const summaryData = [
        ['Total Orders', formatNumberForPDF(summary.total_orders)],
        ['Total Revenue', `₹${formatNumberForPDF(summary.total_revenue)}`],
        ['Average Order Value', `₹${formatNumberForPDF(summary.average_order_value)}`]
      ];
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
        styles: { fontSize: 10 },
        margin: { left: 20, right: 20 }
      });
      
      yPosition = doc.lastAutoTable.finalY + 15;
      
      // Status breakdown
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ORDER STATUS BREAKDOWN', 20, yPosition);
      yPosition += 10;
      
      const statusData = Object.entries(summary.status_summary).map(([status, count]) => [
        status.replace('_orders_count', '').replace('_', ' ').toUpperCase(),
        formatNumberForPDF(count)
      ]);
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Status', 'Count']],
        body: statusData,
        theme: 'grid',
        headStyles: { fillColor: secondaryColor, textColor: [255, 255, 255] },
        styles: { fontSize: 10 },
        margin: { left: 20, right: 20 }
      });
      
      yPosition = doc.lastAutoTable.finalY + 15;
      
      // Order type analysis
      if (order_type_analysis && order_type_analysis.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('ORDER TYPE ANALYSIS', 20, yPosition);
        yPosition += 10;
        
        const orderTypeData = order_type_analysis.map(type => [
          type.order_type.replace('_', ' ').toUpperCase(),
          formatNumberForPDF(type.total_orders),
          `₹${formatNumberForPDF(type.total_revenue)}`,
          `₹${formatNumberForPDF(type.average_order_value)}`,
          formatNumberForPDF(type.status_summary.delivered_orders_count),
          formatNumberForPDF(type.status_summary.pending_orders_count)
        ]);
        
        autoTable(doc, {
          startY: yPosition,
          head: [['Order Type', 'Orders', 'Revenue', 'Avg Value', 'Delivered', 'Pending']],
          body: orderTypeData,
          theme: 'grid',
          headStyles: { fillColor: [75, 85, 99], textColor: [255, 255, 255] },
          styles: { fontSize: 9 },
          margin: { left: 20, right: 20 }
        });
        
        yPosition = doc.lastAutoTable.finalY + 15;
      }
      
      // Sales trend
      if (sales_trend && sales_trend.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('SALES TREND', 20, yPosition);
        yPosition += 10;
        
        const salesData = sales_trend.map(day => [
          day.date,
          day.day_name,
          formatNumberForPDF(day.orders),
          `₹${formatNumberForPDF(day.revenue)}`
        ]);
        
        autoTable(doc, {
          startY: yPosition,
          head: [['Date', 'Day', 'Orders', 'Revenue']],
          body: salesData,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
          styles: { fontSize: 10 },
          margin: { left: 20, right: 20 }
        });
        
        yPosition = doc.lastAutoTable.finalY + 15;
      }
      
      // Top selling items
      if (top_selling_items && top_selling_items.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('TOP SELLING ITEMS', 20, yPosition);
        yPosition += 10;
        
        const itemsData = top_selling_items.map((item, index) => [
          formatNumberForPDF(index + 1),
          item.menu_item__name,
          item.menu_item__category__name,
          formatNumberForPDF(item.quantity_sold),
          `₹${formatNumberForPDF(item.revenue)}`
        ]);
        
        autoTable(doc, {
          startY: yPosition,
          head: [['#', 'Item Name', 'Category', 'Qty Sold', 'Revenue']],
          body: itemsData,
          theme: 'grid',
          headStyles: { fillColor: [34, 197, 94], textColor: [255, 255, 255] },
          styles: { fontSize: 9 },
          margin: { left: 20, right: 20 }
        });
        
        yPosition = doc.lastAutoTable.finalY + 15;
      }
      
      // Top categories
      if (top_categories && top_categories.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('TOP CATEGORIES', 20, yPosition);
        yPosition += 10;
        
        const categoriesData = top_categories.map((category, index) => [
          formatNumberForPDF(index + 1),
          category.menu_item__category__name,
          formatNumberForPDF(category.total_orders),
          formatNumberForPDF(category.total_items_sold),
          `₹${formatNumberForPDF(category.total_revenue)}`
        ]);
        
        autoTable(doc, {
          startY: yPosition,
          head: [['#', 'Category', 'Orders', 'Items Sold', 'Revenue']],
          body: categoriesData,
          theme: 'grid',
          headStyles: { fillColor: [147, 51, 234], textColor: [255, 255, 255] },
          styles: { fontSize: 9 },
          margin: { left: 20, right: 20 }
        });
      }
      
      // Detailed Orders section
      if (report.detailed_orders && report.detailed_orders.length > 0) {
        doc.addPage();
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('DETAILED ORDERS', 20, 30);
        
        const ordersData = report.detailed_orders.slice(0, 30).map(order => {
          // Calculate delivery fee as the difference between total and subtotal
          const subtotal = parseFloat(order.subtotal) || 0;
          const totalAmount = parseFloat(order.total_amount) || 0;
          const calculatedDeliveryFee = totalAmount - subtotal;
          
          return [
            order.order_number || 'N/A',
            order.customer_name || 'N/A',
            order.order_date || 'N/A',
            order.order_type || 'N/A',
            order.status || 'N/A',
            formatNumberForPDF(order.items_count || 0),
            `₹${formatNumberForPDF(subtotal)}`,
            `₹${formatNumberForPDF(calculatedDeliveryFee)}`,
            `₹${formatNumberForPDF(totalAmount)}`
          ];
        });

        autoTable(doc, {
          startY: 40,
          head: [['Order #', 'Customer', 'Date', 'Type', 'Status', 'Items', 'Subtotal', 'Delivery Fee', 'Total']],
          body: ordersData,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
          styles: { fontSize: 8 },
          margin: { left: 20, right: 20 },
          columnStyles: {
            6: { halign: 'right' }, // Subtotal
            7: { halign: 'right' }, // Delivery Fee
            8: { halign: 'right' }  // Total
          }
        });
        
        // Add totals row
        const totalSubtotal = report.detailed_orders.reduce((sum, order) => sum + (parseFloat(order.subtotal) || 0), 0);
        const totalAmount = report.detailed_orders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0);
        const totalDeliveryFee = totalAmount - totalSubtotal;
        
        const totalsData = [
          ['TOTAL', '', '', '', '', formatNumberForPDF(report.detailed_orders.length), `₹${formatNumberForPDF(totalSubtotal)}`, `₹${formatNumberForPDF(totalDeliveryFee)}`, `₹${formatNumberForPDF(totalAmount)}`]
        ];
        
        autoTable(doc, {
          startY: 40 + (ordersData.length * 15) + 20, // Approximate position after orders table
          body: totalsData,
          theme: 'grid',
          headStyles: { fillColor: [252, 128, 25], textColor: [255, 255, 255] },
          bodyStyles: { fillColor: [252, 128, 25], textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 9 },
          margin: { left: 20, right: 20 },
          columnStyles: {
            6: { halign: 'right' }, // Subtotal
            7: { halign: 'right' }, // Delivery Fee
            8: { halign: 'right' }  // Total
          }
        });
      }
      
      // Footer
      const footerY = pageHeight - 20;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...lightGray);
      doc.text('Report generated by Sea Side Bake Restaurant Management System', 20, footerY);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth - 20, footerY, { align: 'right' });
      
      // Save the PDF
      console.log('Saving PDF...');
      doc.save(`${title}.pdf`);
      console.log('PDF saved successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please check the console for details.');
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

  const generateReportText = () => {
    if (!reportData) return '';
    
    const { summary, sales_trend, top_selling_items, top_categories, order_type_analysis } = reportData;
    
    let content = `╔══════════════════════════════════════════════════════════════════════════════════╗\n`;
    content += `║                                    SEA SIDE BAKE                                    ║\n`;
    content += `║                              Live • Fresh • Delicious                              ║\n`;
    content += `╠══════════════════════════════════════════════════════════════════════════════════╣\n`;
    content += `║                                    RESTAURANT REPORT                               ║\n`;
    content += `╚══════════════════════════════════════════════════════════════════════════════════╝\n\n`;
    
    content += `Report Period: ${summary.report_period.start_date} to ${summary.report_period.end_date} (${summary.report_period.days} days)\n`;
    content += `Generated: ${new Date().toLocaleString()}\n`;
    content += `Revenue Criteria: ${reportData.revenue_criteria}\n\n`;
    
    // Summary Table
    content += `╔══════════════════════════════════════════════════════════════════════════════════╗\n`;
    content += `║                                    SUMMARY                                        ║\n`;
    content += `╠══════════════════════════════════════════════════════════════════════════════════╣\n`;
    content += `║ Total Orders: ${String(summary.total_orders).padStart(8)} │ Total Revenue: ₹${String(summary.total_revenue).padStart(10)} │ Avg Order Value: ₹${String(summary.average_order_value).padStart(8)} ║\n`;
    content += `╚══════════════════════════════════════════════════════════════════════════════════╝\n\n`;
    
    // Status Breakdown Table
    content += `╔══════════════════════════════════════════════════════════════════════════════════╗\n`;
    content += `║                                ORDER STATUS BREAKDOWN                            ║\n`;
    content += `╠══════════════════════════════════════════════════════════════════════════════════╣\n`;
    content += `║ Pending: ${String(summary.status_summary.pending_orders_count).padStart(8)} │ Confirmed: ${String(summary.status_summary.confirmed_orders_count).padStart(8)} │ Preparing: ${String(summary.status_summary.preparing_orders_count).padStart(8)} ║\n`;
    content += `║ Out for Delivery: ${String(summary.status_summary.out_for_delivery_orders_count).padStart(4)} │ Delivered: ${String(summary.status_summary.delivered_orders_count).padStart(8)} │ Cancelled: ${String(summary.status_summary.cancelled_orders_count).padStart(8)} ║\n`;
    content += `╚══════════════════════════════════════════════════════════════════════════════════╝\n\n`;
    
    // Order Type Analysis Table
    if (order_type_analysis && order_type_analysis.length > 0) {
      content += `╔══════════════════════════════════════════════════════════════════════════════════╗\n`;
      content += `║                               ORDER TYPE ANALYSIS                               ║\n`;
      content += `╠══════════════════════════════════════════════════════════════════════════════════╣\n`;
      order_type_analysis.forEach(type => {
        const orderType = type.order_type.replace('_', ' ').toUpperCase();
        content += `║ ${orderType.padEnd(15)} │ Orders: ${String(type.total_orders).padStart(6)} │ Revenue: ₹${String(type.total_revenue).padStart(8)} │ Avg: ₹${String(type.average_order_value).padStart(8)} ║\n`;
      });
      content += `╚══════════════════════════════════════════════════════════════════════════════════╝\n\n`;
    }
    
    // Sales Trend Table
    if (sales_trend && sales_trend.length > 0) {
      content += `╔══════════════════════════════════════════════════════════════════════════════════╗\n`;
      content += `║                                   SALES TREND                                   ║\n`;
      content += `╠══════════════════════════════════════════════════════════════════════════════════╣\n`;
      content += `║ Date       │ Day        │ Orders │ Revenue ║\n`;
      content += `╠══════════════════════════════════════════════════════════════════════════════════╣\n`;
      sales_trend.forEach(day => {
        content += `║ ${day.date.padEnd(10)} │ ${day.day_name.padEnd(10)} │ ${String(day.orders).padStart(6)} │ ₹${String(day.revenue).padStart(6)} ║\n`;
      });
      content += `╚══════════════════════════════════════════════════════════════════════════════════╝\n\n`;
    }
    
    // Top Selling Items Table
    if (top_selling_items && top_selling_items.length > 0) {
      content += `╔══════════════════════════════════════════════════════════════════════════════════╗\n`;
      content += `║                               TOP SELLING ITEMS                                 ║\n`;
      content += `╠══════════════════════════════════════════════════════════════════════════════════╣\n`;
      content += `║ # │ Item Name                    │ Category        │ Qty Sold │ Revenue ║\n`;
      content += `╠══════════════════════════════════════════════════════════════════════════════════╣\n`;
      top_selling_items.forEach((item, index) => {
        const itemName = item.menu_item__name.length > 25 ? item.menu_item__name.substring(0, 22) + '...' : item.menu_item__name;
        const category = item.menu_item__category__name.length > 12 ? item.menu_item__category__name.substring(0, 9) + '...' : item.menu_item__category__name;
        content += `║ ${String(index + 1).padStart(2)} │ ${itemName.padEnd(25)} │ ${category.padEnd(12)} │ ${String(item.quantity_sold).padStart(8)} │ ₹${String(item.revenue).padStart(6)} ║\n`;
      });
      content += `╚══════════════════════════════════════════════════════════════════════════════════╝\n\n`;
    }
    
    // Top Categories Table
    if (top_categories && top_categories.length > 0) {
      content += `╔══════════════════════════════════════════════════════════════════════════════════╗\n`;
      content += `║                                TOP CATEGORIES                                   ║\n`;
      content += `╠══════════════════════════════════════════════════════════════════════════════════╣\n`;
      content += `║ # │ Category Name               │ Orders │ Items Sold │ Revenue ║\n`;
      content += `╠══════════════════════════════════════════════════════════════════════════════════╣\n`;
      top_categories.forEach((category, index) => {
        const categoryName = category.menu_item__category__name.length > 22 ? category.menu_item__category__name.substring(0, 19) + '...' : category.menu_item__category__name;
        content += `║ ${String(index + 1).padStart(2)} │ ${categoryName.padEnd(25)} │ ${String(category.total_orders).padStart(6)} │ ${String(category.total_items_sold).padStart(10)} │ ₹${String(category.total_revenue).padStart(6)} ║\n`;
      });
      content += `╚══════════════════════════════════════════════════════════════════════════════════╝\n\n`;
    }
    
    content += `\n═══════════════════════════════════════════════════════════════════════════════════════\n`;
    content += `Report generated by Sea Side Bake Restaurant Management System\n`;
    content += `Generated on: ${new Date().toLocaleString()}\n`;
    content += `═══════════════════════════════════════════════════════════════════════════════════════\n`;
    
    return content;
  };

  const generateReportCSV = () => {
    if (!reportData) return '';
    
    const { summary, sales_trend, top_selling_items, top_categories } = reportData;
    
    let csv = 'Report Type,Value\n';
    csv += `Report Period,"${summary.report_period.start_date} to ${summary.report_period.end_date}"\n`;
    csv += `Total Orders,${summary.total_orders}\n`;
    csv += `Total Revenue,${summary.total_revenue}\n`;
    csv += `Average Order Value,${summary.average_order_value}\n`;
    csv += `Pending Orders,${summary.status_summary.pending_orders_count}\n`;
    csv += `Confirmed Orders,${summary.status_summary.confirmed_orders_count}\n`;
    csv += `Preparing Orders,${summary.status_summary.preparing_orders_count}\n`;
    csv += `Out for Delivery,${summary.status_summary.out_for_delivery_orders_count}\n`;
    csv += `Delivered Orders,${summary.status_summary.delivered_orders_count}\n`;
    csv += `Cancelled Orders,${summary.status_summary.cancelled_orders_count}\n\n`;
    
    if (sales_trend && sales_trend.length > 0) {
      csv += 'Date,Day,Orders,Revenue\n';
      sales_trend.forEach(day => {
        csv += `${day.date},${day.day_name},${day.orders},${day.revenue}\n`;
      });
      csv += '\n';
    }
    
    if (top_selling_items && top_selling_items.length > 0) {
      csv += 'Item Name,Category,Quantity Sold,Revenue\n';
      top_selling_items.forEach(item => {
        csv += `"${item.menu_item__name}","${item.menu_item__category__name}",${item.quantity_sold},${item.revenue}\n`;
      });
      csv += '\n';
    }
    
    if (top_categories && top_categories.length > 0) {
      csv += 'Category,Total Orders,Total Revenue\n';
      top_categories.forEach(category => {
        csv += `"${category.menu_item__category__name}",${category.total_orders},${category.total_revenue}\n`;
      });
    }
    
    return csv;
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Reports</h1>
          <p className="text-gray-600">Generate and download comprehensive restaurant reports</p>
        </div>

        {/* Report Type Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Report Type</h2>
          <div className="flex space-x-4 mb-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="reportType"
                value="seven-days"
                checked={reportType === 'seven-days'}
                onChange={(e) => handleReportTypeChange(e.target.value)}
                className="mr-2"
              />
              <span className="text-gray-700">Seven Day Report</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="reportType"
                value="custom"
                checked={reportType === 'custom'}
                onChange={(e) => handleReportTypeChange(e.target.value)}
                className="mr-2"
              />
              <span className="text-gray-700">Custom Date Range</span>
            </label>
          </div>

          {/* Custom Date Range */}
          {reportType === 'custom' && (
            <div className="flex space-x-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customDateRange.startDate}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={customDateRange.endDate}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleGenerateReport}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Generate Report
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Report Data */}
        {reportData && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Orders</h3>
                <p className="text-3xl font-bold text-blue-600">{reportData.report.summary.total_orders}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {reportData.report.summary.report_period.days} days
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Revenue</h3>
                <p className="text-3xl font-bold text-green-600">₹{reportData.report.summary.total_revenue}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Avg: ₹{reportData.report.summary.average_order_value}
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Delivered Orders</h3>
                <p className="text-3xl font-bold text-green-600">
                  {reportData.report.summary.status_summary.delivered_orders_count}
                </p>
                <p className="text-sm text-gray-500 mt-1">Completed</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Pending Orders</h3>
                <p className="text-3xl font-bold text-yellow-600">
                  {reportData.report.summary.status_summary.pending_orders_count}
                </p>
                <p className="text-sm text-gray-500 mt-1">Awaiting</p>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Order Status Breakdown
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries(reportData.report.summary.status_summary).map(([status, count]) => (
                  <div key={status} className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-150">
                    <div className="text-2xl font-bold text-gray-800">{count}</div>
                    <div className="text-sm text-gray-600 capitalize">
                      {status.replace('_orders_count', '').replace('_', ' ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Type Analysis */}
            {reportData.report.order_type_analysis && reportData.report.order_type_analysis.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Order Type Analysis
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-indigo-50 to-blue-50">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-indigo-200">Order Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-indigo-200">Orders</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-indigo-200">Revenue</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-indigo-200">Avg Order Value</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-indigo-200">Delivered</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-indigo-200">Pending</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.report.order_type_analysis.map((type, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              {type.order_type.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {type.total_orders}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">₹{type.total_revenue}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{type.average_order_value}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {type.status_summary.delivered_orders_count}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {type.status_summary.pending_orders_count}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sales Trend */}
            {reportData.report.sales_trend && reportData.report.sales_trend.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Sales Trend
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-blue-200">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-blue-200">Day</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-blue-200">Orders</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-blue-200">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.report.sales_trend.map((day, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{day.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.day_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {day.orders}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">₹{day.revenue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Top Selling Items */}
            {reportData.report.top_selling_items && reportData.report.top_selling_items.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  Top Selling Items
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-green-50 to-emerald-50">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-green-200">#</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-green-200">Item Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-green-200">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-green-200">Quantity Sold</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-green-200">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.report.top_selling_items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 text-sm font-bold">
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.menu_item__name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {item.menu_item__category__name}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {item.quantity_sold}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">₹{item.revenue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Top Categories */}
            {reportData.report.top_categories && reportData.report.top_categories.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Top Categories
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-purple-50 to-violet-50">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-purple-200">#</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-purple-200">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-purple-200">Total Orders</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-purple-200">Items Sold</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-purple-200">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.report.top_categories.map((category, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-800 text-sm font-bold">
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.menu_item__category__name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {category.total_orders}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {category.total_items_sold}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">₹{category.total_revenue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Detailed Orders with Expandable Items */}
            {reportData.report.detailed_orders && reportData.report.detailed_orders.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Detailed Orders ({reportData.report.detailed_orders.length} orders)
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-slate-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-gray-200">Order #</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-gray-200">Customer</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-gray-200">Date/Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-gray-200">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-gray-200">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-gray-200">Items</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-gray-200">Subtotal</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-gray-200">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-gray-200">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.report.detailed_orders.slice(0, 20).map((order, index) => (
                        <React.Fragment key={index}>
                          {/* Order Row */}
                          <tr className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {order.order_number}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                              <div className="text-sm text-gray-500">{order.customer_phone}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              <div>{order.order_date}</div>
                              <div className="text-xs text-gray-500">{order.order_time}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                order.order_type === 'online' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {order.order_type.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {order.items_count} item{order.items_count !== 1 ? 's' : ''}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              ₹{order.subtotal}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                              ₹{order.total_amount}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => toggleOrderExpansion(order.order_id)}
                                className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
                              >
                                <svg 
                                  className={`w-4 h-4 transition-transform duration-200 ${
                                    expandedOrders.has(order.order_id) ? 'rotate-180' : ''
                                  }`} 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                                <span>{expandedOrders.has(order.order_id) ? 'Hide' : 'View'} Items</span>
                              </button>
                            </td>
                          </tr>
                          
                          {/* Expandable Items Row */}
                          {expandedOrders.has(order.order_id) && order.items && (
                            <tr className="bg-gray-50">
                              <td colSpan="9" className="px-4 py-4">
                                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                                      <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                      </svg>
                                      Order Items ({order.items.length} items)
                                    </h4>
                                    
                                    {/* TOP SECTION - Item Details Table */}
                                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
                                      <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                          <thead className="bg-gray-50">
                                            <tr>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Details</th>
                                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                                            </tr>
                                          </thead>
                                          <tbody className="bg-white divide-y divide-gray-200">
                                            {order.items.map((item, itemIndex) => (
                                              <tr key={itemIndex} className="hover:bg-gray-50 transition-colors duration-150">
                                                <td className="px-4 py-4">
                                                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                                  <div className="text-xs text-gray-500 mt-1">₹{item.price} per item</div>
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
                                                  ₹{item.subtotal}
                                                </td>
                                                <td className="px-4 py-4 text-right text-sm font-bold text-green-600">
                                                  ₹{item.subtotal}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                    
                                    {/* BOTTOM SECTION - Order Summary Box */}
                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                      <h4 className="text-sm font-semibold text-gray-800 mb-3">Order Summary</h4>
                                      <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                          <span className="text-gray-600">Subtotal ({order.items_count} items)</span>
                                          <span className="font-semibold text-gray-900">₹{order.subtotal}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-gray-600">Delivery Fee</span>
                                          <span className="font-semibold text-blue-600">
                                            {(() => {
                                              const subtotal = parseFloat(order.subtotal) || 0;
                                              const totalAmount = parseFloat(order.total_amount) || 0;
                                              const calculatedDeliveryFee = totalAmount - subtotal;
                                              return `₹${calculatedDeliveryFee.toFixed(2)}`;
                                            })()}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                                          <span className="text-lg font-bold text-gray-900">Total Amount</span>
                                          <span className="text-2xl font-bold text-green-600">₹{order.total_amount}</span>
                                        </div>
                                      </div>
                                    </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                      
                      {/* Total Row */}
                      <tr className="bg-gradient-to-r from-orange-50 to-yellow-50 border-t-4 border-orange-300">
                        <td className="px-4 py-4 text-sm font-bold text-gray-900" colSpan="7">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            GRAND TOTAL ({reportData.report.detailed_orders.length} orders)
                          </div>
                        </td>
                        <td className="px-4 py-4 text-lg font-bold text-orange-600">
                          ₹{reportData.report.detailed_orders.reduce((sum, order) => sum + (parseFloat(order.subtotal) || 0), 0)}
                        </td>
                        <td className="px-4 py-4 text-xl font-bold text-orange-600">
                          ₹{reportData.report.detailed_orders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0)}
                        </td>
                        <td className="px-4 py-4"></td>
                      </tr>
                    </tbody>
                  </table>
                  {reportData.report.detailed_orders.length > 20 && (
                    <div className="text-center py-4 text-sm text-gray-500">
                      Showing first 20 orders of {reportData.report.detailed_orders.length} total orders
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Download Options */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Download Report</h3>
              <div className="flex space-x-4 flex-wrap">
                <button
                  onClick={() => downloadReport('pdf')}
                  className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF Report
                </button>
                <button
                  onClick={() => downloadReport('excel')}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Excel
                </button>
                <button
                  onClick={testPDF}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Test PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No Data Message */}
        {!loading && !reportData && !error && (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-500">No report data available. Generate a report to view data.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
