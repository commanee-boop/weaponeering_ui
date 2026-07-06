import { jsPDF } from 'jspdf'
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, BorderStyle, AlignmentType } from 'docx'
import * as XLSX from 'xlsx'

const tableRow = (cells) => new TableRow({ children: cells })
const reportFontFamily = "'TH Sarabun New', 'Sarabun', 'Leelawadee UI', Tahoma, sans-serif"
const cleanRecommendation = value => String(value ?? 'N/A').replace(/\s*บาท\s*$/i, '').trim() || 'N/A'
const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

const formatScore = value => {
  const number = Number(value)
  return Number.isFinite(number) ? number.toFixed(2) : '0.00'
}

const priorityLabels = {
  red: 'สำคัญสูง',
  orange: 'ปานกลาง',
  green: 'ทั่วไป',
  key: 'สำคัญสูง',
  medium: 'สำคัญ',
  general: 'ทั่วไป'
}

const priorityLabel = data => {
  const value = data.priority || data.targetInfo?.priority || 'ทั่วไป'
  return priorityLabels[value] || value
}

const createPdfReportHtml = data => {
  const targetInfo = data.targetInfo || {}
  const metrics = data.metrics || {}
  const recommendationValue = cleanRecommendation(metrics.recommendation)
  const recommendations = Array.isArray(data.recommendations) ? data.recommendations.slice(0, 5) : []

  const infoRows = [
    ['ID เป้าหมาย', targetInfo.id || 'N/A'],
    ['ชื่อเป้าหมาย', targetInfo.name || 'N/A'],
    ['ประเภท', targetInfo.type || 'N/A'],
    ['ชนิดสิ่งก่อสร้าง', targetInfo.structure || 'N/A'],
    ['พื้นที่ทำการ', targetInfo.area || 'N/A'],
    ['ระดับความแข็งแรง', targetInfo.strength || 'N/A'],
    ['พิกัด (Lat/Lon)', `${targetInfo.latitude || 'N/A'} / ${targetInfo.longitude || 'N/A'}`]
  ]

  const metricRows = [
    ['AI Confidence', `${metrics.confidence || 'N/A'}%`],
    ['Pk Value', metrics.pk || 'N/A'],
    ['CEP Value', `${metrics.cep || 'N/A'} m`],
    ['Recommendation', recommendationValue]
  ]

  const renderRows = rows => rows.map(([label, value]) => `
    <tr>
      <th>${escapeHtml(label)}</th>
      <td>${escapeHtml(value)}</td>
    </tr>
  `).join('')

  const recommendationRows = recommendations.map((rec, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(rec.item || 'N/A')}</td>
      <td>${escapeHtml(rec.size || 'N/A')}</td>
      <td>${escapeHtml(rec.qty || 0)}</td>
      <td>${formatScore(rec.pd)}</td>
      <td>${formatScore(rec.pk)}</td>
    </tr>
  `).join('')

  return `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
      .pdf-report {
        width: 794px;
        min-height: 1123px;
        position: relative;
        padding: 54px 58px;
        background: #ffffff;
        color: #111827;
        font-family: ${reportFontFamily};
        font-size: 22px;
        line-height: 1.35;
      }
      .pdf-report * { box-sizing: border-box; font-family: ${reportFontFamily}; }
      .pdf-report h1 { margin: 0 0 4px; padding-right: 230px; color: #174ea6; font-size: 36px; font-weight: 700; line-height: 1.05; }
      .pdf-report h2 { margin: 22px 0 8px; color: #174ea6; font-size: 27px; font-weight: 700; }
      .pdf-report .meta { margin-bottom: 12px; color: #5f6b7a; font-size: 18px; }
      .pdf-report .priority-stamp {
        position: absolute;
        top: 42px;
        right: 58px;
        max-width: 220px;
        color: #d60000;
        font-size: 28px;
        font-weight: 700;
        line-height: 1.1;
        text-align: right;
      }
      .pdf-report .priority-stamp strong { display: block; font-size: 38px; }
      .pdf-report table { width: 100%; border-collapse: collapse; margin: 8px 0 18px; table-layout: fixed; }
      .pdf-report th, .pdf-report td { border: 1px solid #b8c2d0; padding: 7px 9px; vertical-align: top; font-size: 19px; }
      .pdf-report th { background: #174ea6; color: #ffffff; font-weight: 700; text-align: left; }
      .pdf-report .info-table th, .pdf-report .metrics-table th { width: 210px; }
      .pdf-report .recommendation-table th, .pdf-report .recommendation-table td { text-align: center; }
      .pdf-report .recommendation-table td:nth-child(2) { text-align: left; }
      .pdf-report .analysis {
        min-height: 118px;
        padding: 12px 14px;
        border-left: 6px solid #174ea6;
        background: #f3f7fd;
        color: #263343;
        font-size: 20px;
        white-space: pre-wrap;
      }
    </style>
    <article class="pdf-report">
      <div class="priority-stamp">ระดับความสำคัญ<strong>${escapeHtml(priorityLabel(data))}</strong></div>
      <h1>Weaponeering Analysis Summary</h1>
      <div class="meta">วันที่จัดทำ: ${escapeHtml(data.generatedDate || new Date().toLocaleString('th-TH'))}</div>
      <h2>ข้อมูลเป้าหมาย (Target Information)</h2>
      <table class="info-table"><tbody>${renderRows(infoRows)}</tbody></table>
      <h2>ผลการวิเคราะห์ (Analysis Metrics)</h2>
      <table class="metrics-table"><tbody>${renderRows(metricRows)}</tbody></table>
      <h2>Top 5 Recommendations</h2>
      <table class="recommendation-table">
        <thead><tr><th>ลำดับ</th><th>รายการ</th><th>ขนาด</th><th>จำนวน</th><th>Pd</th><th>Pk</th></tr></thead>
        <tbody>${recommendationRows || '<tr><td colspan="6">ไม่มีข้อมูล</td></tr>'}</tbody>
      </table>
      <h2>AI Analysis Result</h2>
      <div class="analysis">${escapeHtml(data.analysisText || 'N/A')}</div>
    </article>
  `
}

const waitForFonts = async () => {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready
    } catch (_) {
      // Continue with browser fallback fonts if the remote font is unavailable.
    }
  }
}

/**
 * Export Service
 * Handles data export to PDF, Word, and Excel formats
 */
export const exportService = {
  /**
   * Export analysis data to PDF format
   * @param {Object} data - Analysis data containing recommendations and analysis results
   * @param {string} filename - Output filename
   */
  async exportToPDF(data, filename = 'weaponeering_analysis.pdf') {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const reportContainer = document.createElement('div')
      reportContainer.innerHTML = createPdfReportHtml(data)
      reportContainer.style.position = 'fixed'
      reportContainer.style.left = '-10000px'
      reportContainer.style.top = '0'
      reportContainer.style.width = '794px'
      reportContainer.style.background = '#ffffff'
      document.body.appendChild(reportContainer)

      try {
        await waitForFonts()
        await new Promise((resolve) => {
          doc.html(reportContainer, {
            x: 0,
            y: 0,
            width: 210,
            windowWidth: 794,
            autoPaging: 'text',
            html2canvas: {
              scale: 0.8,
              backgroundColor: '#ffffff',
              useCORS: true
            },
            callback: (pdf) => {
              pdf.save(filename)
              resolve()
            }
          })
        })
      } finally {
        document.body.removeChild(reportContainer)
      }

      return true
    } catch (error) {
      console.error('PDF Export Error:', error)
      throw new Error(`ไม่สามารถส่งออก PDF: ${error.message}`)
    }
  },

  /**
   * Export analysis data to Word format
   * @param {Object} data - Analysis data
   * @param {string} filename - Output filename
   */
  async exportToWord(data, filename = 'weaponeering_analysis.docx') {
    try {
      const sections = []

      // Title
      sections.push(
        new Paragraph({
          text: 'Weaponeering Analysis Summary',
          style: 'Heading1',
          spacing: { after: 200 }
        })
      )

      sections.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { after: 180 },
          children: [
            new TextRun({
              text: `ระดับความสำคัญ: ${priorityLabel(data)}`,
              bold: true,
              color: 'D60000',
              size: 44,
              font: 'TH Sarabun New'
            })
          ]
        })
      )

      // Timestamp
      sections.push(
        new Paragraph({
          text: `วันที่จัดทำ: ${new Date().toLocaleString('th-TH')}`,
          spacing: { after: 200 }
        })
      )

      // Target Information
      if (data.targetInfo) {
        sections.push(
          new Paragraph({
            text: 'ข้อมูลเป้าหมาย (Target Information)',
            style: 'Heading2',
            spacing: { before: 200, after: 100 }
          })
        )

        const targetInfo = data.targetInfo

        const targetTable = new Table({
          width: { size: 100, type: WidthType.PERCENT },
          rows: [
            tableRow([new TableCell({ children: [new Paragraph('ข้อมูล')] }), new TableCell({ children: [new Paragraph('ค่า')] })]),
            tableRow([new TableCell({ children: [new Paragraph('ID เป้าหมาย')] }), new TableCell({ children: [new Paragraph(targetInfo.id || 'N/A')] })]),
            tableRow([new TableCell({ children: [new Paragraph('ชื่อเป้าหมาย')] }), new TableCell({ children: [new Paragraph(targetInfo.name || 'N/A')] })]),
            tableRow([new TableCell({ children: [new Paragraph('ประเภท')] }), new TableCell({ children: [new Paragraph(targetInfo.type || 'N/A')] })]),
            tableRow([new TableCell({ children: [new Paragraph('ชนิดสิ่งก่อสร้าง')] }), new TableCell({ children: [new Paragraph(targetInfo.structure || 'N/A')] })]),
            tableRow([new TableCell({ children: [new Paragraph('พื้นที่ทำการ')] }), new TableCell({ children: [new Paragraph(targetInfo.area || 'N/A')] })]),
            tableRow([new TableCell({ children: [new Paragraph('ระดับความแข็งแรง')] }), new TableCell({ children: [new Paragraph(targetInfo.strength || 'N/A')] })]),
            tableRow([new TableCell({ children: [new Paragraph('พิกัด')] }), new TableCell({ children: [new Paragraph(`${targetInfo.latitude || 'N/A'} / ${targetInfo.longitude || 'N/A'}`)] })])
          ],
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
          }
        })

        sections.push(targetTable)
        sections.push(new Paragraph({ text: '', spacing: { after: 200 } }))
      }

      // Analysis Metrics
      if (data.metrics) {
        sections.push(
          new Paragraph({
            text: 'ผลการวิเคราะห์ (Analysis Metrics)',
            style: 'Heading2',
            spacing: { before: 200, after: 100 }
          })
        )

        const metrics = data.metrics
        const recommendationValue = cleanRecommendation(metrics.recommendation)
        const metricsTable = new Table({
          width: { size: 100, type: WidthType.PERCENT },
          rows: [
            tableRow([new TableCell({ children: [new Paragraph('เมตริก')] }), new TableCell({ children: [new Paragraph('ค่า')] })]),
            tableRow([new TableCell({ children: [new Paragraph('AI Confidence')] }), new TableCell({ children: [new Paragraph(`${metrics.confidence || 'N/A'}%`)] })]),
            tableRow([new TableCell({ children: [new Paragraph('Pk Value')] }), new TableCell({ children: [new Paragraph(metrics.pk || 'N/A')] })]),
            tableRow([new TableCell({ children: [new Paragraph('CEP Value')] }), new TableCell({ children: [new Paragraph(`${metrics.cep || 'N/A'} m`)] })]),
            tableRow([new TableCell({ children: [new Paragraph('Recommendation')] }), new TableCell({ children: [new Paragraph(recommendationValue)] })])
          ],
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
          }
        })

        sections.push(metricsTable)
        sections.push(new Paragraph({ text: '', spacing: { after: 200 } }))
      }

      // Recommendations Table
      if (data.recommendations && data.recommendations.length > 0) {
        sections.push(
          new Paragraph({
            text: 'Top 5 Recommendations',
            style: 'Heading2',
            spacing: { before: 200, after: 100 }
          })
        )

        const recRows = [
          tableRow([
            new TableCell({ children: [new Paragraph('ลำดับ')], shading: { fill: '174EA6' } }),
            new TableCell({ children: [new Paragraph('รายการ')], shading: { fill: '174EA6' } }),
            new TableCell({ children: [new Paragraph('ขนาด')], shading: { fill: '174EA6' } }),
            new TableCell({ children: [new Paragraph('จำนวน')], shading: { fill: '174EA6' } }),
            new TableCell({ children: [new Paragraph('Pd')], shading: { fill: '174EA6' } }),
            new TableCell({ children: [new Paragraph('Pk')], shading: { fill: '174EA6' } })
          ])
        ]

        data.recommendations.slice(0, 5).forEach((rec, idx) => {
          recRows.push(
            tableRow([
              new TableCell({ children: [new Paragraph(String(idx + 1))] }),
              new TableCell({ children: [new Paragraph(rec.item || 'N/A')] }),
              new TableCell({ children: [new Paragraph(rec.size || 'N/A')] }),
              new TableCell({ children: [new Paragraph(String(rec.qty || 0))] }),
              new TableCell({ children: [new Paragraph((rec.pd || 0).toFixed(2))] }),
              new TableCell({ children: [new Paragraph((rec.pk || 0).toFixed(2))] })
            ])
          )
        })

        const recTable = new Table({
          width: { size: 100, type: WidthType.PERCENT },
          rows: recRows,
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
          }
        })

        sections.push(recTable)
        sections.push(new Paragraph({ text: '', spacing: { after: 200 } }))
      }

      // Analysis Summary
      if (data.analysisText) {
        sections.push(
          new Paragraph({
            text: 'AI Analysis Result',
            style: 'Heading2',
            spacing: { before: 200, after: 100 }
          })
        )

        sections.push(
          new Paragraph({
            text: data.analysisText,
            spacing: { after: 200 }
          })
        )
      }

      const doc = new Document({
        styles: {
          default: {
            document: {
              run: {
                font: 'TH Sarabun New',
                size: 28
              }
            }
          }
        },
        sections: [
          {
            children: sections
          }
        ]
      })

      const blob = await Packer.toBlob(doc)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      return true
    } catch (error) {
      console.error('Word Export Error:', error)
      throw new Error(`ไม่สามารถส่งออก Word: ${error.message}`)
    }
  },

  /**
   * Export analysis data to Excel format
   * @param {Object} data - Analysis data
   * @param {string} filename - Output filename
   */
  exportToExcel(data, filename = 'weaponeering_analysis.xlsx') {
    try {
      const wb = XLSX.utils.book_new()

      // Sheet 1: Summary
      const summaryData = [
        ['Weaponeering Analysis Summary'],
        ['ระดับความสำคัญ', priorityLabel(data)],
        [],
        ['วันที่จัดทำ', new Date().toLocaleString('th-TH')]
      ]

      if (data.metrics) {
        summaryData.push(
          [],
          ['ผลการวิเคราะห์ (Analysis Metrics)'],
          ['AI Confidence', `${data.metrics.confidence || 'N/A'}%`],
          ['Pk Value', data.metrics.pk || 'N/A'],
          ['CEP Value', `${data.metrics.cep || 'N/A'} m`],
          ['Recommendation', cleanRecommendation(data.metrics.recommendation)]
        )
      }

      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
      summaryWs['!cols'] = [{ wch: 25 }, { wch: 40 }]
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')

      // Sheet 2: Target Information
      if (data.targetInfo) {
        const targetData = [
          ['ข้อมูลเป้าหมาย (Target Information)'],
          [],
          ['ข้อมูล', 'ค่า'],
          ['ID เป้าหมาย', data.targetInfo.id || 'N/A'],
          ['ชื่อเป้าหมาย', data.targetInfo.name || 'N/A'],
          ['ประเภท', data.targetInfo.type || 'N/A'],
          ['ชนิดสิ่งก่อสร้าง', data.targetInfo.structure || 'N/A'],
          ['พื้นที่ทำการ', data.targetInfo.area || 'N/A'],
          ['ระดับความแข็งแรง', data.targetInfo.strength || 'N/A'],
          ['พิกัด Latitude', data.targetInfo.latitude || 'N/A'],
          ['พิกัด Longitude', data.targetInfo.longitude || 'N/A']
        ]

        const targetWs = XLSX.utils.aoa_to_sheet(targetData)
        targetWs['!cols'] = [{ wch: 25 }, { wch: 40 }]
        XLSX.utils.book_append_sheet(wb, targetWs, 'Target Info')
      }

      // Sheet 3: Recommendations
      if (data.recommendations && data.recommendations.length > 0) {
        const recData = [
          ['Top 5 Recommendations'],
          [],
          ['ลำดับ', 'รายการ', 'ขนาด', 'จำนวน', 'Pd', 'Pk']
        ]

        data.recommendations.slice(0, 5).forEach((rec, idx) => {
          recData.push([
            idx + 1,
            rec.item || 'N/A',
            rec.size || 'N/A',
            rec.qty || 0,
            (rec.pd || 0).toFixed(2),
            (rec.pk || 0).toFixed(2)
          ])
        })

        const recWs = XLSX.utils.aoa_to_sheet(recData)
        recWs['!cols'] = [{ wch: 10 }, { wch: 25 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 }]
        XLSX.utils.book_append_sheet(wb, recWs, 'Recommendations')
      }

      // Sheet 4: Analysis Text
      if (data.analysisText) {
        const analysisData = [
          ['AI Analysis Result'],
          [],
          [data.analysisText]
        ]

        const analysisWs = XLSX.utils.aoa_to_sheet(analysisData)
        analysisWs['!cols'] = [{ wch: 80 }]
        XLSX.utils.book_append_sheet(wb, analysisWs, 'Analysis')
      }

      // Save Excel file
      XLSX.writeFile(wb, filename)
      return true
    } catch (error) {
      console.error('Excel Export Error:', error)
      throw new Error(`ไม่สามารถส่งออก Excel: ${error.message}`)
    }
  }
}
