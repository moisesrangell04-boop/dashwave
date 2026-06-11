export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  headers: { key: keyof T; label: string }[],
  filename: string,
) {
  if (data.length === 0) return;
  const headerRow = headers.map((h) => `"${h.label}"`).join(',');
  const dataRows = data.map((row) =>
    headers.map((h) => {
      const val = row[h.key];
      const str = val == null ? '' : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(','),
  );
  const csv = [headerRow, ...dataRows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
