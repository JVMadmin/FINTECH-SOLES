import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Utility to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount || 0);
};

// Utility to format date
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("es-MX");
};

// Export to Excel
export const exportToExcel = (data, columns, filename, sheetName = "Reporte") => {
  // Transform data based on columns
  const transformedData = data.map((row) => {
    const newRow = {};
    columns.forEach((col) => {
      let value = row[col.key];
      if (col.format === "currency") {
        value = formatCurrency(value);
      } else if (col.format === "date") {
        value = formatDate(value);
      }
      newRow[col.header] = value;
    });
    return newRow;
  });

  // Create workbook and worksheet
  const ws = XLSX.utils.json_to_sheet(transformedData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Auto-size columns
  const colWidths = columns.map((col) => ({
    wch: Math.max(col.header.length, 15),
  }));
  ws["!cols"] = colWidths;

  // Generate file
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const dataBlob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(dataBlob, `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`);
};

// Logo URL for PDF
const LOGO_URL = "/logo.png";

// Helper function to load image as base64
const loadImageAsBase64 = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
};

// Export to PDF
export const exportToPDF = async (data, columns, filename, title, summary = null) => {
  const doc = new jsPDF();
  
  // Try to add logo
  try {
    const logoBase64 = await loadImageAsBase64(LOGO_URL);
    doc.addImage(logoBase64, "PNG", 14, 8, 25, 25);
  } catch (e) {
    console.log("Logo not loaded, continuing without it");
  }
  
  // Header - adjusted position for logo
  doc.setFontSize(18);
  doc.setTextColor(41, 128, 185);
  doc.text("SOLES CORPORATIVO", 115, 15, { align: "center" });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Sistema de Créditos", 115, 22, { align: "center" });
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(title, 115, 30, { align: "center" });
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generado: ${new Date().toLocaleString("es-MX")}`, 196, 10, { align: "right" });

  // Summary section if provided
  let startY = 42;
  if (summary) {
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    let yPos = startY;
    Object.entries(summary).forEach(([key, value]) => {
      doc.text(`${key}: ${value}`, 14, yPos);
      yPos += 6;
    });
    startY = yPos + 5;
  }

  // Transform data for table
  const tableData = data.map((row) => {
    return columns.map((col) => {
      let value = row[col.key];
      if (col.format === "currency") {
        value = formatCurrency(value);
      } else if (col.format === "date") {
        value = formatDate(value);
      }
      return value || "-";
    });
  });

  // Create table
  autoTable(doc, {
    head: [columns.map((col) => col.header)],
    body: tableData,
    startY: startY,
    theme: "striped",
    headStyles: {
      fillColor: [234, 179, 8], // Yellow
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  doc.save(`${filename}_${new Date().toISOString().split("T")[0]}.pdf`);
};

// Predefined report configurations
export const REPORT_CONFIGS = {
  cobranza: {
    columns: [
      { key: "cliente_nombre", header: "Cliente" },
      { key: "monto_pendiente", header: "Monto", format: "currency" },
      { key: "fecha_pago", header: "Fecha Pago", format: "date" },
      { key: "tipo_credito", header: "Tipo" },
      { key: "dias_atraso", header: "Días Atraso" },
      { key: "asesor_nombre", header: "Asesor" },
    ],
    title: "Reporte de Cobranza",
  },
  cartera: {
    columns: [
      { key: "cliente_nombre", header: "Cliente" },
      { key: "monto_otorgado", header: "Monto Otorgado", format: "currency" },
      { key: "saldo_pendiente", header: "Saldo Pendiente", format: "currency" },
      { key: "fecha_inicio", header: "Inicio", format: "date" },
      { key: "tipo_credito", header: "Tipo" },
      { key: "estatus", header: "Estado" },
      { key: "asesor_nombre", header: "Asesor" },
    ],
    title: "Reporte de Cartera",
  },
  pagos: {
    columns: [
      { key: "cliente_nombre", header: "Cliente" },
      { key: "monto", header: "Monto Pagado", format: "currency" },
      { key: "fecha_pago", header: "Fecha", format: "date" },
      { key: "metodo_pago", header: "Método" },
      { key: "registrado_por_nombre", header: "Registrado Por" },
    ],
    title: "Reporte de Pagos",
  },
  clientes: {
    columns: [
      { key: "nombre_completo", header: "Nombre" },
      { key: "telefono", header: "Teléfono" },
      { key: "direccion", header: "Dirección" },
      { key: "region", header: "Localidad" },
      { key: "creditos_activos", header: "Créditos Activos" },
      { key: "fecha_registro", header: "Fecha Registro", format: "date" },
    ],
    title: "Reporte de Clientes",
  },
};
