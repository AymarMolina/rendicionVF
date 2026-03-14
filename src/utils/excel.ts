import * as XLSX from "xlsx";

export type ExcelColumn<T = any> = {
  header: string;
  key: keyof T | string;
  width?: number;
  formatter?: (value: any, row: T) => any;
};

type ExportExcelOptions<T> = {
  columns: ExcelColumn<T>[];
  rows: T[];
  fileName?: string;
  sheetName?: string;
};

export function exportar<T>({
  columns,
  rows,
  fileName = "reporte.xlsx",
  sheetName = "Hoja1",
}: ExportExcelOptions<T>) {
  const data = rows.map((row) => {
    const obj: Record<string, any> = {};
    columns.forEach((col) => {
      let value = (row as any)[col.key];
      if (col.formatter) value = col.formatter(value, row);
      if (value === null || value === undefined) value = "";
      if (typeof value === "boolean") value = value ? "Sí" : "No";
      obj[col.header] = value;
    });

    return obj;
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const colWidths = columns.map((col) => ({
    wch:
      col.width ??
      Math.max(
        col.header.length,
        ...data.map((row) => String(row[col.header]).length)
      ) + 2,
  }));

  worksheet["!cols"] = colWidths;
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  XLSX.writeFile(workbook, fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`);
}
