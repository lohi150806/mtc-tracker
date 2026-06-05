import { RouteAggregate } from '../types';
import { currency, number } from './analytics';

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const exportCsv = (rows: RouteAggregate[]) => {
  const headers = ['Route Number', 'Route Name', 'Depot', 'Revenue', 'Cost', 'Profit', 'Load Factor', 'Passengers', 'Status'];
  const body = rows.map((route) => [
    route.routeNumber,
    route.routeName,
    route.depot,
    route.revenue,
    route.cost,
    route.profit,
    `${route.loadFactor}%`,
    route.passengers,
    route.status,
  ]);
  const csv = [headers, ...body].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'mtc-route-performance.csv');
};

export const exportExcel = (rows: RouteAggregate[]) => {
  const headers = ['Route Number', 'Route Name', 'Depot', 'Revenue', 'Cost', 'Profit', 'Load Factor', 'Passengers', 'Status'];
  const cells = rows
    .map(
      (route) => `
        <tr>
          <td>${route.routeNumber}</td>
          <td>${route.routeName}</td>
          <td>${route.depot}</td>
          <td>${route.revenue}</td>
          <td>${route.cost}</td>
          <td>${route.profit}</td>
          <td>${route.loadFactor}%</td>
          <td>${route.passengers}</td>
          <td>${route.status}</td>
        </tr>`,
    )
    .join('');
  const workbook = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head><meta charset="UTF-8" /></head>
      <body>
        <table>
          <thead><tr>${headers.map((header) => `<th>${header}</th>`).join('')}</tr></thead>
          <tbody>${cells}</tbody>
        </table>
      </body>
    </html>`;
  downloadBlob(new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8' }), 'mtc-route-performance-report.xls');
};

export const exportPdf = (rows: RouteAggregate[]) => {
  const totalRevenue = rows.reduce((sum, route) => sum + route.revenue, 0);
  const totalProfit = rows.reduce((sum, route) => sum + route.profit, 0);
  const totalPassengers = rows.reduce((sum, route) => sum + route.passengers, 0);
  const topRoutes = [...rows].sort((a, b) => b.profit - a.profit).slice(0, 8);
  const lines = [
    'MTC Chennai Route Performance Dashboard',
    `Generated: ${new Date().toLocaleDateString('en-IN')}`,
    `Routes: ${rows.length}`,
    `Total Revenue: ${currency(totalRevenue)}`,
    `Total Profit: ${currency(totalProfit)}`,
    `Total Passengers: ${number(totalPassengers)}`,
    '',
    'Top Profitable Routes',
    ...topRoutes.map((route, index) => `${index + 1}. ${route.routeNumber} - ${route.routeName} | ${currency(route.profit)} | Load ${route.loadFactor}%`),
  ];
  downloadBlob(createSimplePdf(lines), 'mtc-route-performance-report.pdf');
};

const pdfEscape = (value: string) => value.replace(/[\\()]/g, (match) => `\\${match}`).replace(/[^\x20-\x7E]/g, ' ');

const createSimplePdf = (lines: string[]) => {
  const text = lines
    .map((line, index) => {
      const fontSize = index === 0 ? 16 : index === 7 ? 13 : 10;
      const y = 790 - index * 22;
      return `BT /F1 ${fontSize} Tf 50 ${y} Td (${pdfEscape(line)}) Tj ET`;
    })
    .join('\n');
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${text.length} >> stream\n${text}\nendstream endobj`,
  ];
  let output = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object) => {
    offsets.push(output.length);
    output += `${object}\n`;
  });
  const xref = output.length;
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    output += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  output += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([output], { type: 'application/pdf' });
};
