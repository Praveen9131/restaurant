import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Generate HTML content for the report
export const generateReportHTML = (title, report) => {
  const { summary, sales_trend, top_selling_items, top_categories, order_type_analysis } = report;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          background: white;
          padding: 40px 20px 40px 20px;
          margin: 0;
        }
        
        .report-container {
          max-width: 100%;
          margin: 0 auto;
          background: white;
          padding-top: 20px;
          padding-bottom: 40px;
        }
        
        .header {
          position: relative;
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #FC8019;
          padding-bottom: 20px;
        }
        
        .header-logo {
          position: absolute;
          left: 0;
          top: 0;
          height: 60px;
          width: auto;
          max-width: 200px;
        }
        
        .header h1 {
          color: #FC8019;
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .header .subtitle {
          color: #666;
          font-size: 14px;
          margin-bottom: 5px;
        }
        
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        
        .section-title {
          background: #FC8019;
          color: white;
          padding: 10px 15px;
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 15px;
          border-radius: 5px;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .summary-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          border: 2px solid #FC8019;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(252, 128, 25, 0.1);
        }
        
        .summary-card .label {
          font-size: 12px;
          color: #666;
          margin-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .summary-card .value {
          font-size: 24px;
          font-weight: bold;
          color: #FC8019;
        }
        
        .table-container {
          overflow-x: auto;
          margin-bottom: 20px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 12px;
          border: 1px solid #ddd;
        }
        
        th {
          background: linear-gradient(135deg, #FC8019 0%, #e6690a 100%);
          color: white;
          padding: 12px 8px;
          text-align: left;
          font-weight: bold;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: 1px solid #FC8019;
        }
        
        td {
          padding: 10px 8px;
          border: 1px solid #e9ecef;
          vertical-align: top;
        }
        
        tr:nth-child(even) {
          background: #fff8f3;
        }
        
        tr:nth-child(odd) {
          background: #ffffff;
        }
        
        .number {
          text-align: right;
          font-weight: bold;
        }
        
        .currency {
          color: #28a745;
          font-weight: bold;
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .status-pending { background: #fff3cd; color: #856404; }
        .status-confirmed { background: #d1ecf1; color: #0c5460; }
        .status-delivered { background: #d4edda; color: #155724; }
        .status-cancelled { background: #f8d7da; color: #721c24; }
        
        .totals-row {
          background: #FC8019 !important;
          color: white !important;
          font-weight: bold;
        }
        
        .totals-row td {
          border: 1px solid #FC8019 !important;
          padding: 15px 8px;
        }
        
        .page-break {
          page-break-before: always;
        }
        
        @media print {
          body { padding: 0; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="report-container">
        <!-- Header -->
        <div class="header">
          <h1>RESTAURANT REPORT</h1>
          <div class="subtitle">${title}</div>
          <div class="subtitle">Generated: ${new Date().toLocaleString()}</div>
          <div class="subtitle">Period: ${summary.report_period.start_date} to ${summary.report_period.end_date}</div>
        </div>
        
        <!-- Summary Section -->
        <div class="section">
          <div class="section-title">SUMMARY</div>
          <div class="summary-grid">
            <div class="summary-card">
              <div class="label">Total Orders</div>
              <div class="value">${summary.total_orders}</div>
            </div>
            <div class="summary-card">
              <div class="label">Total Revenue</div>
              <div class="value currency">₹${summary.total_revenue}</div>
            </div>
            <div class="summary-card">
              <div class="label">Average Order Value</div>
              <div class="value currency">₹${summary.average_order_value}</div>
            </div>
          </div>
        </div>
        
        <!-- Status Breakdown -->
        <div class="section">
          <div class="section-title">ORDER STATUS BREAKDOWN</div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(summary.status_summary).map(([status, count]) => `
                  <tr>
                    <td>${status.replace('_orders_count', '').replace('_', ' ').toUpperCase()}</td>
                    <td class="number">${count}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Order Type Analysis -->
        <div class="section">
          <div class="section-title">ORDER TYPE ANALYSIS</div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order Type</th>
                  <th>Orders</th>
                  <th>Revenue</th>
                  <th>Avg Value</th>
                  <th>Delivered</th>
                  <th>Pending</th>
                </tr>
              </thead>
              <tbody>
                ${order_type_analysis.map(type => `
                  <tr>
                    <td>${type.order_type.replace('_', ' ').toUpperCase()}</td>
                    <td class="number">${type.total_orders}</td>
                    <td class="number currency">₹${type.total_revenue}</td>
                    <td class="number currency">₹${type.average_order_value}</td>
                    <td class="number">${type.status_summary.delivered_orders_count}</td>
                    <td class="number">${type.status_summary.pending_orders_count}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Sales Trend -->
        <div class="section">
          <div class="section-title">SALES TREND</div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Orders</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${sales_trend.map(day => `
                  <tr>
                    <td>${day.date}</td>
                    <td>${day.day_name}</td>
                    <td class="number">${day.orders}</td>
                    <td class="number currency">₹${day.revenue}</td>
                  </tr>
                `).join('')}
                <tr class="totals-row">
                  <td><strong>Total</strong></td>
                  <td><strong>Total</strong></td>
                  <td class="number"><strong>${sales_trend.reduce((sum, day) => sum + (day.orders || 0), 0)}</strong></td>
                  <td class="number"><strong>₹${sales_trend.reduce((sum, day) => sum + (day.revenue || 0), 0)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Top Selling Items -->
        <div class="section">
          <div class="section-title">TOP SELLING ITEMS</div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Qty Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${top_selling_items.map((item, index) => `
                  <tr>
                    <td class="number">${index + 1}</td>
                    <td>${item.menu_item__name}</td>
                    <td>${item.menu_item__category__name}</td>
                    <td class="number">${item.quantity_sold}</td>
                    <td class="number currency">₹${item.revenue}</td>
                  </tr>
                `).join('')}
                <tr class="totals-row">
                  <td><strong>Total</strong></td>
                  <td><strong>Total</strong></td>
                  <td><strong>Total</strong></td>
                  <td class="number"><strong>${top_selling_items.reduce((sum, item) => sum + (item.quantity_sold || 0), 0)}</strong></td>
                  <td class="number"><strong>₹${top_selling_items.reduce((sum, item) => sum + (item.revenue || 0), 0)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Top Categories -->
        <div class="section">
          <div class="section-title">TOP CATEGORIES</div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Category</th>
                  <th>Orders</th>
                  <th>Items Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${top_categories.map((category, index) => `
                  <tr>
                    <td class="number">${index + 1}</td>
                    <td>${category.menu_item__category__name}</td>
                    <td class="number">${category.total_orders}</td>
                    <td class="number">${category.total_items_sold}</td>
                    <td class="number currency">₹${category.total_revenue}</td>
                  </tr>
                `).join('')}
                <tr class="totals-row">
                  <td><strong>Total</strong></td>
                  <td><strong>Total</strong></td>
                  <td class="number"><strong>${top_categories.reduce((sum, category) => sum + (category.total_orders || 0), 0)}</strong></td>
                  <td class="number"><strong>${top_categories.reduce((sum, category) => sum + (category.total_items_sold || 0), 0)}</strong></td>
                  <td class="number"><strong>₹${top_categories.reduce((sum, category) => sum + (category.total_revenue || 0), 0)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Detailed Orders -->
        ${report.detailed_orders && report.detailed_orders.length > 0 ? `
          <div class="section page-break">
            <div class="section-title">DETAILED ORDERS</div>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Items</th>
                    <th>Subtotal</th>
                    <th>Delivery Fee</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${report.detailed_orders.map(order => {
                    const subtotal = parseFloat(order.subtotal) || 0;
                    const totalAmount = parseFloat(order.total_amount) || 0;
                    const calculatedDeliveryFee = totalAmount - subtotal;
                    
                    return `
                      <tr>
                        <td>${order.order_number || 'N/A'}</td>
                        <td>${order.customer_name || 'N/A'}</td>
                        <td>${order.order_date || 'N/A'}</td>
                        <td>${order.order_type || 'N/A'}</td>
                        <td>${(order.status || 'pending').toUpperCase()}</td>
                        <td class="number">${order.items_count || 0}</td>
                        <td class="number currency">₹${subtotal}</td>
                        <td class="number currency">₹${calculatedDeliveryFee.toFixed(2)}</td>
                        <td class="number currency">₹${totalAmount}</td>
                      </tr>
                    `;
                  }).join('')}
                  <tr class="totals-row">
                    <td colspan="5"><strong>TOTAL</strong></td>
                    <td class="number"><strong>${report.detailed_orders.length}</strong></td>
                    <td class="number"><strong>₹${report.detailed_orders.reduce((sum, order) => sum + (parseFloat(order.subtotal) || 0), 0)}</strong></td>
                    <td class="number"><strong>₹${(report.detailed_orders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0) - report.detailed_orders.reduce((sum, order) => sum + (parseFloat(order.subtotal) || 0), 0)).toFixed(2)}</strong></td>
                    <td class="number"><strong>₹${report.detailed_orders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
};

// Generate PDF using HTML/CSS approach
export const generatePDF = async (title, reportData) => {
  if (!reportData) {
    console.error('No report data available for PDF generation');
    return;
  }
  
  try {
    console.log('Starting HTML-based PDF generation...');
    const { report } = reportData;
    
    // Create HTML content for PDF
    const htmlContent = generateReportHTML(title, report);
    
    // Create a temporary div to render the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '210mm'; // A4 width
    tempDiv.style.backgroundColor = 'white';
    document.body.appendChild(tempDiv);
    
    // Generate canvas from HTML
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794, // A4 width in pixels at 96 DPI
      height: tempDiv.scrollHeight
    });
    
    // Remove temporary div
    document.body.removeChild(tempDiv);
    
    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    // Save the PDF
    pdf.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    console.log('PDF generated successfully using HTML/CSS');
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Error generating PDF: ' + error.message);
  }
};
