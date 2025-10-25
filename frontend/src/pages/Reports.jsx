import { useState, useEffect } from 'react';
import { 
  Download, Calendar, Clock, FileText, TrendingUp, 
  Filter, Zap, DollarSign, ChevronDown, AlertCircle,
  CheckCircle, RefreshCw, Mail
} from 'lucide-react';
import { generateReportPDF, downloadReportAsHTML } from '../utils/pdfGenerator';

export default function Reports() {
  const [devices, setDevices] = useState([]);
  const [wifiDevices, setWifiDevices] = useState([]);
  const [currencyPrefs, setCurrencyPrefs] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Report Configuration
  const [reportType, setReportType] = useState('today'); // today, specific, range, weekly, monthly, yearly
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDevices, setSelectedDevices] = useState('all'); // all, wifi, local, specific
  const [specificDeviceIds, setSpecificDeviceIds] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [devicesRes, wifiRes, currencyRes] = await Promise.all([
        fetch('http://localhost:5000/api/devices', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/wifi-management/devices', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/currency', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (devicesRes.ok) {
        const devicesData = await devicesRes.json();
        if (devicesData.success) {
          setDevices(devicesData.data);
        }
      }

      if (wifiRes.ok) {
        const wifiData = await wifiRes.json();
        if (wifiData.success) {
          setWifiDevices(wifiData.data);
        }
      }

      if (currencyRes.ok) {
        const currencyData = await currencyRes.json();
        if (currencyData.success) {
          setCurrencyPrefs(currencyData.data);
        }
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const formatCurrency = (amount, decimals = 2) => {
    if (!currencyPrefs) return `$${amount.toFixed(decimals)}`;
    
    const symbol = currencyPrefs.currencySymbol || '$';
    const rate = currencyPrefs.electricityRate || 0.12;
    const conversionRate = currencyPrefs.conversionRates?.[currencyPrefs.selectedCurrency] || 1;
    const convertedAmount = amount * conversionRate * (rate / 0.12);
    
    return `${symbol}${convertedAmount.toFixed(decimals)}`;
  };

  const generateReport = async () => {
    setLoading(true);
    
    try {
      // Generate mock report data based on selected parameters
      const reportData = [];
      const deviceList = getFilteredDevices();
      
      const dateRange = getDateRange();
      
      for (let device of deviceList) {
        for (let date of dateRange) {
          const dailyUsage = Math.random() * 10 + 5; // 5-15 kWh
          const cost = calculateCost(dailyUsage);
          
          reportData.push({
            deviceId: device.id || device._id,
            deviceName: device.deviceName || device.name,
            deviceType: device.deviceType || 'Unknown',
            date: date,
            usage: dailyUsage,
            cost: cost,
            status: getDeviceStatus(device),
            connectionType: getConnectionType(device)
          });
        }
      }
      
      setReportData(reportData);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredDevices = () => {
    switch (selectedDevices) {
      case 'wifi':
        return wifiDevices.filter(d => d.connectionStatus === 'connected');
      case 'local':
        return devices.filter(d => !wifiDevices.some(wd => wd.deviceId === d._id));
      case 'specific':
        return devices.filter(d => specificDeviceIds.includes(d._id));
      default:
        return devices;
    }
  };

  const getDateRange = () => {
    const dates = [];
    let start, end;

    switch (reportType) {
      case 'today':
        start = new Date();
        end = new Date();
        break;
      case 'specific':
        start = new Date(selectedDate);
        end = new Date(selectedDate);
        break;
      case 'range':
        start = new Date(startDate);
        end = new Date(endDate);
        break;
      case 'weekly':
        start = new Date();
        start.setDate(start.getDate() - 7);
        end = new Date();
        break;
      case 'monthly':
        start = new Date();
        start.setMonth(start.getMonth() - 1);
        end = new Date();
        break;
      case 'yearly':
        start = new Date();
        start.setFullYear(start.getFullYear() - 1);
        end = new Date();
        break;
      default:
        start = new Date();
        end = new Date();
    }

    const currentDate = new Date(start);
    while (currentDate <= end) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  };

  const calculateCost = (usage) => {
    const rate = currencyPrefs?.electricityRate || 0.12;
    return usage * rate;
  };

  const getDeviceStatus = (device) => {
    const wifiDevice = wifiDevices.find(wd => wd.deviceId === device._id);
    if (wifiDevice) {
      return wifiDevice.connectionStatus;
    }
    return 'local';
  };

  const getConnectionType = (device) => {
    const wifiDevice = wifiDevices.find(wd => wd.deviceId === device._id);
    return wifiDevice ? 'WiFi' : 'Local';
  };

  const downloadCSV = () => {
    if (reportData.length === 0) {
      alert('Please generate a report first');
      return;
    }

    const headers = ['Device Name', 'Type', 'Date', 'Usage (kWh)', `Cost (${currencyPrefs?.selectedCurrency || 'USD'})`, 'Status', 'Connection'];
    const csvContent = [
      headers.join(','),
      ...reportData.map(row => [
        row.deviceName,
        row.deviceType,
        row.date,
        row.usage.toFixed(2),
        row.cost.toFixed(2),
        row.status,
        row.connectionType
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `energy-report-${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    if (reportData.length === 0) {
      alert('Please generate a report first');
      return;
    }

    const reportSummary = {
      reportType,
      generatedDate: new Date().toISOString(),
      totalDevices: getFilteredDevices().length,
      dateRange: getDateRange(),
      currency: currencyPrefs?.selectedCurrency || 'USD',
      totalUsage: reportData.reduce((sum, item) => sum + item.usage, 0),
      totalCost: reportData.reduce((sum, item) => sum + item.cost, 0),
      data: reportData
    };

    const blob = new Blob([JSON.stringify(reportSummary, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `energy-report-${reportType}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = async () => {
    if (reportData.length === 0) {
      alert('Please generate a report first');
      return;
    }

    const success = await generateReportPDF(
      reportData, 
      getSummaryStats(), 
      currencyPrefs, 
      { reportType, selectedDate, startDate, endDate }
    );

    if (!success) {
      // Fallback to HTML download
      downloadReportAsHTML(
        reportData, 
        getSummaryStats(), 
        currencyPrefs, 
        { reportType, selectedDate, startDate, endDate }
      );
    }
  };

  const sendReportEmail = async () => {
    if (reportData.length === 0) {
      alert('Please generate a report first');
      return;
    }

    setLoading(true);
    try {
      // Generate PDF blob first
      const htmlContent = await generatePDFContent();
      
      // Convert HTML to PDF using the browser's print functionality
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Use the browser's built-in PDF generation
      const pdfBlob = await new Promise((resolve) => {
        printWindow.addEventListener('afterprint', () => {
          printWindow.close();
        });
        
        // Create a simple PDF-like content
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 800;
        canvas.height = 1100;
        
        // Fill with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add title
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Energy Usage Report', canvas.width / 2, 50);
        
        // Add date
        ctx.font = '16px Arial';
        const dateRange = getDateRangeString();
        ctx.fillText(`Period: ${dateRange}`, canvas.width / 2, 80);
        ctx.fillText(`Generated: ${new Date().toLocaleDateString()}`, canvas.width / 2, 100);
        
        // Add summary stats
        const stats = getSummaryStats();
        if (stats) {
          ctx.textAlign = 'left';
          ctx.font = 'bold 18px Arial';
          ctx.fillText('Summary Statistics:', 50, 150);
          
          ctx.font = '14px Arial';
          ctx.fillText(`Total Usage: ${stats.totalUsage} kWh`, 50, 180);
          ctx.fillText(`Total Cost: ${stats.totalCost}`, 50, 200);
          ctx.fillText(`Average Daily Cost: ${stats.avgDailyCost}`, 50, 220);
          ctx.fillText(`Number of Devices: ${stats.deviceCount}`, 50, 240);
          ctx.fillText(`Report Period: ${stats.dateCount} days`, 50, 260);
        }
        
        // Add device data table header
        ctx.font = 'bold 14px Arial';
        ctx.fillText('Device Data:', 50, 300);
        
        ctx.font = '12px Arial';
        const tableStartY = 330;
        const rowHeight = 20;
        
        // Table headers
        ctx.fillText('Device Name', 50, tableStartY);
        ctx.fillText('Type', 200, tableStartY);
        ctx.fillText('Usage (kWh)', 350, tableStartY);
        ctx.fillText('Cost', 450, tableStartY);
        ctx.fillText('Status', 550, tableStartY);
        
        // Draw header line
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(50, tableStartY + 5);
        ctx.lineTo(700, tableStartY + 5);
        ctx.stroke();
        
        // Add sample data rows (first 20 items)
        const displayData = reportData.slice(0, 20);
        displayData.forEach((item, index) => {
          const y = tableStartY + 20 + (index * rowHeight);
          if (y > canvas.height - 50) return; // Don't overflow page
          
          ctx.fillText(item.deviceName || 'Unknown', 50, y);
          ctx.fillText(item.deviceType || 'N/A', 200, y);
          ctx.fillText(item.usage.toFixed(2), 350, y);
          ctx.fillText(`$${item.cost.toFixed(2)}`, 450, y);
          ctx.fillText(item.status || 'active', 550, y);
        });
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png');
      });
      
      // Convert to a simple PDF format (for demo purposes, we'll send the data)
      const formData = new FormData();
      
      // Create a simple text-based PDF content
      const pdfContent = createSimplePDFContent();
      const pdfBlob2 = new Blob([pdfContent], { type: 'application/pdf' });
      
      formData.append('pdfFile', pdfBlob2, `energy-report-${reportType}-${new Date().toISOString().split('T')[0]}.pdf`);
      formData.append('reportMetadata', JSON.stringify({
        reportType,
        selectedDate,
        startDate,
        endDate,
        reportData: reportData.slice(0, 100), // Limit data size for email
        generateDate: new Date().toISOString()
      }));

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/reports/send-pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ Report sent successfully to itzrvm2337@gmail.com`);
      } else {
        alert(`❌ Failed to send report: ${result.message}`);
      }

    } catch (error) {
      console.error('Error sending report:', error);
      alert('Error sending report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createSimplePDFContent = () => {
    const stats = getSummaryStats();
    const dateRange = getDateRangeString();
    
    return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 500
>>
stream
BT
/F1 12 Tf
72 720 Td
(Energy Usage Report) Tj
0 -20 Td
(Period: ${dateRange}) Tj
0 -20 Td
(Generated: ${new Date().toLocaleDateString()}) Tj
0 -40 Td
(Summary Statistics:) Tj
0 -20 Td
(Total Usage: ${stats ? stats.totalUsage : '0'} kWh) Tj
0 -20 Td
(Total Cost: ${stats ? stats.totalCost : '$0.00'}) Tj
0 -20 Td
(Device Count: ${stats ? stats.deviceCount : '0'}) Tj
0 -20 Td
(Report Period: ${stats ? stats.dateCount : '0'} days) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000824 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
901
%%EOF`;
  };

  const generatePDFContent = async () => {
    const stats = getSummaryStats();
    const dateRange = getDateRangeString();
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Energy Report - ${dateRange}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
            .stat { background: #f5f5f5; padding: 15px; border-radius: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Energy Usage Report</h1>
            <p>Period: ${dateRange}</p>
            <p>Generated: ${new Date().toLocaleDateString()}</p>
        </div>
        
        ${stats ? `
        <div class="stats">
            <div class="stat">
                <h3>Total Usage</h3>
                <p>${stats.totalUsage} kWh</p>
            </div>
            <div class="stat">
                <h3>Total Cost</h3>
                <p>${stats.totalCost}</p>
            </div>
            <div class="stat">
                <h3>Average Daily Cost</h3>
                <p>${stats.avgDailyCost}</p>
            </div>
            <div class="stat">
                <h3>Device Count</h3>
                <p>${stats.deviceCount}</p>
            </div>
        </div>
        ` : ''}
        
        <table>
            <thead>
                <tr>
                    <th>Device Name</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Usage (kWh)</th>
                    <th>Cost</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${reportData.slice(0, 50).map(item => `
                    <tr>
                        <td>${item.deviceName || 'Unknown'}</td>
                        <td>${item.deviceType || 'N/A'}</td>
                        <td>${new Date(item.date).toLocaleDateString()}</td>
                        <td>${item.usage.toFixed(2)}</td>
                        <td>$${item.cost.toFixed(2)}</td>
                        <td>${item.status || 'active'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </body>
    </html>`;
  };

  const getDateRangeString = () => {
    switch (reportType) {
      case 'specific':
        return new Date(selectedDate).toLocaleDateString();
      case 'range':
        return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
      default:
        return reportType.charAt(0).toUpperCase() + reportType.slice(1);
    }
  };

  const getSummaryStats = () => {
    if (reportData.length === 0) return null;

    const totalUsage = reportData.reduce((sum, item) => sum + item.usage, 0);
    const totalCost = reportData.reduce((sum, item) => sum + item.cost, 0);
    const avgDailyCost = totalCost / (getDateRange().length || 1);
    const deviceCount = getFilteredDevices().length;

    return {
      totalUsage: totalUsage.toFixed(2),
      totalCost: formatCurrency(totalCost),
      avgDailyCost: formatCurrency(avgDailyCost),
      deviceCount,
      dateCount: getDateRange().length
    };
  };

  const stats = getSummaryStats();

  return (
    <div className="p-4 md:p-8 pb-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-black mb-2">Energy Reports</h1>
          <p className="text-sm md:text-base text-gray-600">Generate and download detailed energy usage reports</p>
        </div>

        {/* Report Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Report Configuration</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Time Period Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="today">Today</option>
                <option value="specific">Specific Date</option>
                <option value="range">Date Range</option>
                <option value="weekly">Last 7 Days</option>
                <option value="monthly">Last 30 Days</option>
                <option value="yearly">Last 365 Days</option>
              </select>
            </div>

            {reportType === 'specific' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            )}

            {reportType === 'range' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              </>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Device Filter</label>
                  <select
                    value={selectedDevices}
                    onChange={(e) => setSelectedDevices(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="all">All Devices ({devices.length})</option>
                    <option value="wifi">WiFi Connected ({wifiDevices.filter(d => d.connectionStatus === 'connected').length})</option>
                    <option value="local">Local Only ({devices.length - wifiDevices.filter(d => d.connectionStatus === 'connected').length})</option>
                    <option value="specific">Specific Devices</option>
                  </select>
                </div>

                {selectedDevices === 'specific' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Devices</label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                      {devices.map(device => (
                        <label key={device._id} className="flex items-center gap-2 text-sm py-1">
                          <input
                            type="checkbox"
                            checked={specificDeviceIds.includes(device._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSpecificDeviceIds([...specificDeviceIds, device._id]);
                              } else {
                                setSpecificDeviceIds(specificDeviceIds.filter(id => id !== device._id));
                              }
                            }}
                            className="rounded border-gray-300 text-black focus:ring-black"
                          />
                          {device.deviceName}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Generate Report Button */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={generateReport}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Generate Report
                </>
              )}
            </button>

            <button
              onClick={fetchInitialData}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Report Summary */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Usage</p>
                  <p className="text-lg font-bold text-gray-900">{stats.totalUsage} kWh</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Cost</p>
                  <p className="text-lg font-bold text-gray-900">{stats.totalCost}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Daily Cost</p>
                  <p className="text-lg font-bold text-gray-900">{stats.avgDailyCost}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Period</p>
                  <p className="text-lg font-bold text-gray-900">{stats.dateCount} Days</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Send Report via Email */}
        {reportData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📧 Send Report via Email</h3>
            <p className="text-sm text-gray-600 mb-4">
              Send PDF report to <strong>itzrvm2337@gmail.com</strong> for demo purposes
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={sendReportEmail}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Send PDF Report
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Download Options */}
        {reportData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📁 Download Options</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={downloadCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>

              <button
                onClick={downloadJSON}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                Download JSON
              </button>

              <button
                onClick={downloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </div>
          </div>
        )}

        {/* Report Data Table */}
        {reportData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Report Data</h3>
              <p className="text-sm text-gray-600 mt-1">
                Showing {reportData.length} entries for {stats.deviceCount} devices over {stats.dateCount} days
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage (kWh)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Connection</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.slice(0, 50).map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.deviceName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.deviceType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.usage.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.cost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.connectionType === 'WiFi' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.connectionType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                          item.status === 'connected' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {item.status === 'connected' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {reportData.length > 50 && (
              <div className="px-6 py-3 bg-gray-50 text-center text-sm text-gray-500">
                Showing first 50 entries. Download full report for complete data.
              </div>
            )}
          </div>
        )}

        {/* No Data State */}
        {reportData.length === 0 && !loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Generated</h3>
            <p className="text-gray-500 mb-4">Configure your report settings and click "Generate Report" to view data.</p>
          </div>
        )}
      </div>
    </div>
  );
}