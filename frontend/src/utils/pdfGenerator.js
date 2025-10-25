// PDF Generation Utility
// This is a simple implementation without external dependencies
// For production, consider using libraries like jsPDF or pdfmake

export const generateReportPDF = async (reportData, stats, currencyPrefs, reportConfig) => {
  try {
    // Create a simple HTML template for PDF
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Energy Usage Report</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
                line-height: 1.6;
                color: #333;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #333;
            }
            .header h1 {
                color: #000;
                margin-bottom: 10px;
            }
            .summary {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            .summary-card {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #dee2e6;
            }
            .summary-card h3 {
                margin: 0 0 10px 0;
                color: #495057;
                font-size: 14px;
            }
            .summary-card .value {
                font-size: 24px;
                font-weight: bold;
                color: #000;
            }
            .table-container {
                margin-top: 30px;
                overflow-x: auto;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
                font-size: 12px;
            }
            th, td {
                padding: 8px 12px;
                text-align: left;
                border: 1px solid #dee2e6;
            }
            th {
                background-color: #f8f9fa;
                font-weight: bold;
                color: #495057;
            }
            tr:nth-child(even) {
                background-color: #f8f9fa;
            }
            .status-connected {
                color: #28a745;
                font-weight: bold;
            }
            .status-local {
                color: #fd7e14;
                font-weight: bold;
            }
            .connection-wifi {
                color: #007bff;
                font-weight: bold;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #dee2e6;
                text-align: center;
                color: #6c757d;
                font-size: 12px;
            }
            @media print {
                body { margin: 0; }
                .no-print { display: none; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Energy Usage Report</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>Report Type: ${getReportTypeLabel(reportConfig.reportType)}</p>
            <p>Currency: ${currencyPrefs?.selectedCurrency || 'USD'}</p>
        </div>

        <div class="summary">
            <div class="summary-card">
                <h3>Total Energy Usage</h3>
                <div class="value">${stats?.totalUsage || '0'} kWh</div>
            </div>
            <div class="summary-card">
                <h3>Total Cost</h3>
                <div class="value">${stats?.totalCost || '$0.00'}</div>
            </div>
            <div class="summary-card">
                <h3>Average Daily Cost</h3>
                <div class="value">${stats?.avgDailyCost || '$0.00'}</div>
            </div>
            <div class="summary-card">
                <h3>Total Devices</h3>
                <div class="value">${stats?.deviceCount || '0'}</div>
            </div>
            <div class="summary-card">
                <h3>Report Period</h3>
                <div class="value">${stats?.dateCount || '0'} Days</div>
            </div>
            <div class="summary-card">
                <h3>Electricity Rate</h3>
                <div class="value">${currencyPrefs?.electricityRate || '0.12'} per kWh</div>
            </div>
        </div>

        <div class="table-container">
            <h2>Detailed Usage Data</h2>
            <table>
                <thead>
                    <tr>
                        <th>Device Name</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Usage (kWh)</th>
                        <th>Cost (${currencyPrefs?.selectedCurrency || 'USD'})</th>
                        <th>Connection</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportData.map(item => `
                        <tr>
                            <td>${item.deviceName}</td>
                            <td>${item.deviceType}</td>
                            <td>${new Date(item.date).toLocaleDateString()}</td>
                            <td>${item.usage.toFixed(2)}</td>
                            <td>${item.cost.toFixed(2)}</td>
                            <td class="connection-${item.connectionType.toLowerCase()}">${item.connectionType}</td>
                            <td class="status-${item.status}">${item.status}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p>This report was generated by PowerAI Energy Management System</p>
            <p>For questions or support, contact your system administrator</p>
        </div>
    </body>
    </html>
    `;

    // Create a new window with the HTML content
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load, then trigger print dialog
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Close window after printing
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      }, 500);
    };

    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};

function getReportTypeLabel(reportType) {
  const labels = {
    'today': 'Today',
    'specific': 'Specific Date',
    'range': 'Date Range',
    'weekly': 'Last 7 Days',
    'monthly': 'Last 30 Days',
    'yearly': 'Last 365 Days'
  };
  return labels[reportType] || reportType;
}

export const downloadReportAsHTML = (reportData, stats, currencyPrefs, reportConfig) => {
  const htmlContent = generateHTMLContent(reportData, stats, currencyPrefs, reportConfig);
  
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `energy-report-${reportConfig.reportType}-${new Date().toISOString().split('T')[0]}.html`;
  a.click();
  URL.revokeObjectURL(url);
};

function generateHTMLContent(reportData, stats, currencyPrefs, reportConfig) {
  // Same HTML template as above but for file download
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Energy Usage Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .summary-card { background: #f8f9fa; padding: 15px; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
        th { background-color: #f8f9fa; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Energy Usage Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
    </div>
    <div class="summary">
        <div class="summary-card">
            <h3>Total Usage: ${stats?.totalUsage || '0'} kWh</h3>
        </div>
        <div class="summary-card">
            <h3>Total Cost: ${stats?.totalCost || '$0.00'}</h3>
        </div>
    </div>
    <table>
        <tr>
            <th>Device</th><th>Date</th><th>Usage (kWh)</th><th>Cost</th><th>Status</th>
        </tr>
        ${reportData.map(item => `
            <tr>
                <td>${item.deviceName}</td>
                <td>${new Date(item.date).toLocaleDateString()}</td>
                <td>${item.usage.toFixed(2)}</td>
                <td>${item.cost.toFixed(2)}</td>
                <td>${item.status}</td>
            </tr>
        `).join('')}
    </table>
</body>
</html>`;
}