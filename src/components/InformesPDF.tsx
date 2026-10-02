import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { formatCurrency, formatNumber } from '../utils/formatters';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileText,
  Printer,
  Download,
  CheckCircle,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Scale,
  Package,
  BookOpen,
} from 'lucide-react';

export type ReportType = 'completo' | 'inventario' | 'balance' | 'catalogo';

export const InformesPDF: React.FC = () => {
  const {
    products,
    balanceItems,
    period,
    storeInfo,
    totalInventario,
    totalDebe,
    totalHaber,
    utilidad,
    exportDataJSON,
  } = useInventory();

  // Selected report type
  const [reportType, setReportType] = useState<ReportType>('completo');

  const [authorName, setAuthorName] = useState('LUCHO');
  const [reviewName, setReviewName] = useState('GERENCIA / CONTABILIDAD');
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Generate and download a real PDF file using jsPDF and autoTable
  const handleDownloadPDF = () => {
    try {
      setIsGenerating(true);
      setDownloadSuccess(null);

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // 1. Header Banner
      doc.setFillColor(6, 78, 59); // Emerald 900
      doc.rect(0, 0, 210, 24, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text(storeInfo.nombre, 14, 11);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(209, 250, 229); // Emerald 100
      doc.text(storeInfo.subtitulo || 'SISTEMA DE CONTROL DE INVENTARIO Y BALANCE CONTABLE', 14, 17);

      doc.setFontSize(8);
      doc.setTextColor(253, 230, 138); // Amber 200
      doc.text(`PERÍODO: ${period.mes} ${period.ano}`, 196, 11, { align: 'right' });
      doc.setTextColor(255, 255, 255);
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 196, 17, { align: 'right' });

      let startY = 32;

      // Title of Document
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42); // Slate 900

      const reportTitle =
        reportType === 'completo'
          ? 'INFORME COMPLETO: BALANCE CONTABLE E INVENTARIO'
          : reportType === 'balance'
          ? 'BALANCE CONTABLE GENERAL'
          : reportType === 'inventario'
          ? 'REPORTE DE INVENTARIO Y EXISTENCIAS'
          : 'CATÁLOGO MAESTRO DE PRECIOS Y PRODUCTOS';

      doc.text(reportTitle, 14, startY);
      startY += 6;

      // Summary Metrics Card
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, startY, 182, 17, 2, 2, 'FD');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('TOTAL INVENTARIO', 18, startY + 5);
      doc.text('TOTAL DEBE', 65, startY + 5);
      doc.text('TOTAL HABER', 112, startY + 5);
      doc.text('UTILIDAD (DEBE - HABER)', 155, startY + 5);

      doc.setFontSize(10);
      doc.setTextColor(6, 78, 59);
      doc.text(formatCurrency(totalInventario), 18, startY + 12);
      doc.setTextColor(15, 118, 110);
      doc.text(formatCurrency(totalDebe), 65, startY + 12);
      doc.setTextColor(190, 18, 60);
      doc.text(formatCurrency(totalHaber), 112, startY + 12);

      if (utilidad >= 0) {
        doc.setTextColor(4, 120, 87);
      } else {
        doc.setTextColor(190, 18, 60);
      }
      doc.text(formatCurrency(utilidad), 155, startY + 12);

      startY += 24;

      // Section 1: Balance Contable Table
      if (reportType === 'completo' || reportType === 'balance') {
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('1. HOJA DE BALANCE CONTABLE', 14, startY);
        startY += 2;

        const balanceRows: any[] = balanceItems.map((item, idx) => [
          String(idx + 1),
          item.descripcion,
          item.debe > 0 ? formatCurrency(item.debe) : '-',
          item.haber > 0 ? formatCurrency(item.haber) : '-',
        ]);

        balanceRows.push([
          '',
          'TOTALES (DEBE / HABER)',
          formatCurrency(totalDebe),
          formatCurrency(totalHaber),
        ]);

        balanceRows.push([
          '',
          'UTILIDAD NETA (DEBE − HABER)',
          {
            content: formatCurrency(utilidad),
            colSpan: 2,
            styles: {
              halign: 'right',
              fontStyle: 'bold',
              textColor: utilidad >= 0 ? [6, 78, 59] : [190, 18, 60],
            },
          },
        ]);

        autoTable(doc, {
          startY,
          head: [['#', 'DESCRIPCIÓN DE LA CUENTA', 'DEBE ($ COP)', 'HABER ($ COP)']],
          body: balanceRows,
          theme: 'grid',
          headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
          bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
          columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { cellWidth: 92 },
            2: { halign: 'right', cellWidth: 40 },
            3: { halign: 'right', cellWidth: 40 },
          },
          margin: { left: 14, right: 14 },
        });

        startY = (doc as any).lastAutoTable.finalY + 9;
      }

      // Section 2: Products Inventory Table
      if (reportType === 'completo' || reportType === 'inventario' || reportType === 'catalogo') {
        if (startY > 220) {
          doc.addPage();
          startY = 20;
        }

        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(
          reportType === 'completo'
            ? '2. INVENTARIO DE PRODUCTOS (BASE / Tabla1)'
            : 'CATÁLOGO DE PRODUCTOS Y EXISTENCIAS',
          14,
          startY
        );
        startY += 2;

        const totalStockQty = products.reduce((acc, p) => acc + p.stock, 0);

        const productRows: any[] = products.map((p) => [
          p.codigo,
          p.descripcion,
          formatNumber(p.stock),
          formatCurrency(p.valorUnitario),
          formatCurrency(p.total),
          p.categoria || 'General',
        ]);

        productRows.push([
          'TOTAL',
          `TOTAL INVENTARIO (${products.length} productos)`,
          `${formatNumber(totalStockQty)} unid.`,
          '',
          formatCurrency(totalInventario),
          '',
        ]);

        autoTable(doc, {
          startY,
          head: [['CÓDIGO', 'DESCRIPCIÓN DEL PRODUCTO', 'STOCK', 'VALOR UNIT.', 'TOTAL ($)', 'CATEGORÍA']],
          body: productRows,
          theme: 'striped',
          headStyles: { fillColor: [6, 78, 59], textColor: 255, fontStyle: 'bold', fontSize: 7 },
          bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
          columnStyles: {
            0: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
            1: { cellWidth: 64 },
            2: { halign: 'right', cellWidth: 18 },
            3: { halign: 'right', cellWidth: 26 },
            4: { halign: 'right', cellWidth: 28, fontStyle: 'bold' },
            5: { cellWidth: 28 },
          },
          margin: { left: 14, right: 14 },
        });

        startY = (doc as any).lastAutoTable.finalY + 12;
      }

      // Section 3: Signatures Block
      if (startY > 240) {
        doc.addPage();
        startY = 30;
      }

      doc.setDrawColor(148, 163, 184);
      doc.line(30, startY + 12, 90, startY + 12);
      doc.line(120, startY + 12, 180, startY + 12);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(authorName.toUpperCase(), 60, startY + 17, { align: 'center' });
      doc.text(reviewName.toUpperCase(), 150, startY + 17, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('Encargado de Inventario & Almacén', 60, startY + 21, { align: 'center' });
      doc.text('Gerencia / Revisión Contable', 150, startY + 21, { align: 'center' });

      // Page numbers footer on every page
      const pageCount = (doc as any).getNumberOfPages
        ? (doc as any).getNumberOfPages()
        : doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `${storeInfo.nombre} • Reporte Oficial • Período: ${period.mes} ${period.ano} • Página ${i} de ${pageCount}`,
          105,
          290,
          { align: 'center' }
        );
      }

      const cleanStoreFile = storeInfo.nombre.replace(/[^A-Za-z0-9]/g, '_');
      const fileName = `REPORTE_${cleanStoreFile}_${reportType.toUpperCase()}_${period.mes}_${period.ano}.pdf`;
      doc.save(fileName);
      setDownloadSuccess(`¡Reporte descargado exitosamente como "${fileName}"!`);
      setTimeout(() => setDownloadSuccess(null), 5000);
    } catch (err) {
      console.error('Error al generar PDF', err);
      alert('Hubo un error al generar el archivo PDF. Intente con el botón de Imprimir.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Report Selector */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Módulo de Informes & Descarga de PDF
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generación, previsualización y exportación de reportes oficiales de inventario y balance contable
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Direct Download Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-black shadow-md hover:shadow-emerald-500/25 transition active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>{isGenerating ? 'Generando PDF...' : 'Descargar Reporte en PDF'}</span>
            </button>

            {/* Print Preview Button */}
            <button
              onClick={handleTriggerPrint}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              title="Abrir vista de impresión del navegador"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>

            {/* JSON Backup Button */}
            <button
              onClick={exportDataJSON}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              title="Guardar copia de seguridad en JSON"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Copia JSON</span>
            </button>
          </div>
        </div>

        {/* Success Toast when downloaded */}
        {downloadSuccess && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Professional Report Type Selector */}
        <div className="mt-4">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Seleccione el Tipo de Reporte:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Opción 1: Informe Completo */}
            <button
              onClick={() => setReportType('completo')}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                reportType === 'completo'
                  ? 'bg-emerald-50 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-emerald-800 uppercase flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Recomendado
                </span>
              </div>
              <p className="font-bold text-xs text-slate-900 mt-1">
                Informe Completo
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Balance contable + Inventario de productos + Firmas de gerencia
              </p>
            </button>

            {/* Opción 2: Inventario */}
            <button
              onClick={() => setReportType('inventario')}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                reportType === 'inventario'
                  ? 'bg-emerald-50 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-700 uppercase flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-emerald-600" />
                  Almacén
                </span>
              </div>
              <p className="font-bold text-xs text-slate-900 mt-1">
                Reporte de Inventario
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Listado detallado de existencias, precios y valorización
              </p>
            </button>

            {/* Opción 3: Balance Contable */}
            <button
              onClick={() => setReportType('balance')}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                reportType === 'balance'
                  ? 'bg-emerald-50 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-700 uppercase flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-teal-600" />
                  Finanzas
                </span>
              </div>
              <p className="font-bold text-xs text-slate-900 mt-1">
                Balance Contable
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Cuentas de Debe, Haber, Inventario y Utilidad neta
              </p>
            </button>

            {/* Opción 4: Catálogo Maestro */}
            <button
              onClick={() => setReportType('catalogo')}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                reportType === 'catalogo'
                  ? 'bg-emerald-50 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-700 uppercase flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  Catálogo
                </span>
              </div>
              <p className="font-bold text-xs text-slate-900 mt-1">
                Catálogo de Productos
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Listado de códigos, nombres y precios de venta
              </p>
            </button>
          </div>
        </div>

        {/* Signatures Configuration */}
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Nombre de quien Elabora:
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Nombre de quien Revisa / Aprueba:
            </label>
            <input
              type="text"
              value={reviewName}
              onChange={(e) => setReviewName(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* PRINTABLE REPORT PREVIEW CONTAINER */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-300 p-6 sm:p-10 max-w-5xl mx-auto print:border-none print:shadow-none print:p-0">
        {/* Document Header with Store Logo and Metadata */}
        <div className="border-b-2 border-emerald-800 pb-5 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-emerald-950 uppercase tracking-tight">
                  {storeInfo.nombre}
                </h1>
              </div>
              <p className="text-sm font-bold text-slate-700 mt-1">
                {storeInfo.subtitulo || 'SISTEMA DE CONTROL DE INVENTARIO Y BALANCE CONTABLE'}
              </p>
              <p className="text-xs text-slate-500">
                {storeInfo.nit || 'NIT: 900.842.119-4'} | Sede Principal | {storeInfo.ciudad || 'Medellín, Colombia'}
              </p>
            </div>

            <div className="text-left sm:text-right bg-slate-50 print:bg-transparent p-3 rounded-xl border border-slate-200 print:border-none">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                DOCUMENTO GENERADO
              </p>
              <p className="font-mono text-sm font-black text-emerald-800">
                {reportType === 'completo'
                  ? 'BALANCE GENERAL & INVENTARIO'
                  : reportType === 'balance'
                  ? 'BALANCE CONTABLE'
                  : 'INFORME DE EXISTENCIAS'}
              </p>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                Período: <strong className="text-slate-900">{period.mes} {period.ano}</strong>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Emisión: {new Date().toLocaleDateString('es-CO')}
              </p>
            </div>
          </div>
        </div>

        {/* Executive Summary Cards in Preview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 print:border-slate-300">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              TOTAL INVENTARIO
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-emerald-900">
              {formatCurrency(totalInventario)}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              TOTAL DEBE
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-emerald-700">
              {formatCurrency(totalDebe)}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              TOTAL HABER
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-rose-700">
              {formatCurrency(totalHaber)}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              UTILIDAD NETA (D − H)
            </span>
            <span
              className={`text-base sm:text-lg font-black font-mono ${
                utilidad >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {formatCurrency(utilidad)}
            </span>
          </div>
        </div>

        {/* BALANCE CONTABLE SECTION */}
        {(reportType === 'completo' || reportType === 'balance') && (
          <div className="mb-8">
            <div className="flex items-center justify-between pb-2 border-b-2 border-slate-900 mb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                1. HOJA DE BALANCE CONTABLE
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                Período: {period.mes} {period.ano}
              </span>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase">
                  <th className="py-2 px-3 w-10 text-center">#</th>
                  <th className="py-2 px-3">DESCRIPCIÓN DE LA CUENTA</th>
                  <th className="py-2 px-3 text-right w-40">DEBE ($ COP)</th>
                  <th className="py-2 px-3 text-right w-40">HABER ($ COP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {balanceItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-center text-slate-400 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-800">
                      {item.descripcion}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-medium text-slate-900">
                      {item.debe > 0 ? formatCurrency(item.debe) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-medium text-slate-900">
                      {item.haber > 0 ? formatCurrency(item.haber) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
                  <td colSpan={2} className="py-2.5 px-3 uppercase text-slate-900">
                    TOTALES (DEBE / HABER)
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-800 font-black">
                    {formatCurrency(totalDebe)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-800 font-black">
                    {formatCurrency(totalHaber)}
                  </td>
                </tr>
                <tr className="bg-emerald-50/70 font-extrabold border-t border-slate-300">
                  <td colSpan={2} className="py-2.5 px-3 uppercase text-emerald-950 font-black">
                    UTILIDAD (DEBE − HABER)
                  </td>
                  <td
                    colSpan={2}
                    className={`py-2.5 px-3 text-right font-mono text-sm font-black ${
                      utilidad >= 0 ? 'text-emerald-900' : 'text-rose-900'
                    }`}
                  >
                    {formatCurrency(utilidad)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* INVENTORY TABLE SECTION */}
        {(reportType === 'completo' || reportType === 'inventario' || reportType === 'catalogo') && (
          <div className="mb-8">
            <div className="flex items-center justify-between pb-2 border-b-2 border-slate-900 mb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                {reportType === 'completo'
                  ? '2. INVENTARIO DE PRODUCTOS (BASE / Tabla1)'
                  : 'CATÁLOGO DE PRODUCTOS E INVENTARIO'}
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {products.length} productos registrados
              </span>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase">
                  <th className="py-2 px-3 w-20">CÓDIGO</th>
                  <th className="py-2 px-3">DESCRIPCIÓN</th>
                  <th className="py-2 px-3 text-right w-24">STOCK</th>
                  <th className="py-2 px-3 text-right w-32">VALOR UNIT.</th>
                  <th className="py-2 px-3 text-right w-36">TOTAL ($ COP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.map((prod) => (
                  <tr key={prod.codigo} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">
                      {prod.codigo}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-800">
                      {prod.descripcion}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {prod.stock}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700">
                      {formatCurrency(prod.valorUnitario)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-black text-emerald-800">
                      {formatCurrency(prod.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
                  <td colSpan={2} className="py-2.5 px-3 uppercase text-slate-900 font-black">
                    TOTAL GENERAL INVENTARIO
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                    {formatNumber(products.reduce((acc, p) => acc + p.stock, 0))} unid.
                  </td>
                  <td></td>
                  <td className="py-2.5 px-3 text-right font-mono text-sm font-black text-emerald-900">
                    {formatCurrency(totalInventario)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Signatures Section for Official Report */}
        <div className="mt-12 pt-8 border-t border-slate-300 grid grid-cols-2 gap-12 text-center text-xs">
          <div>
            <div className="h-14 border-b border-slate-400 mb-2"></div>
            <p className="font-black text-slate-800 uppercase">{authorName}</p>
            <p className="text-[11px] text-slate-500">
              Encargado de Inventario & Almacén
            </p>
          </div>

          <div>
            <div className="h-14 border-b border-slate-400 mb-2"></div>
            <p className="font-black text-slate-800 uppercase">{reviewName}</p>
            <p className="text-[11px] text-slate-500">
              {storeInfo.nombre} - Gerencia
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
          {storeInfo.nombre} • Sistema de Control de Inventario y Balance Contable
        </div>
      </div>
    </div>
  );
};
