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

const priorityAliases = {
  'สำคัญสูง': 'red',
  'ปานกลาง': 'orange',
  'สำคัญ': 'orange',
  'ทั่วไป': 'green'
}

const priorityColors = {
  red: { pdf: '#d60000', docx: 'D60000' },
  orange: { pdf: '#f28b2c', docx: 'F28B2C' },
  green: { pdf: '#29a968', docx: '29A968' },
  key: { pdf: '#d60000', docx: 'D60000' },
  medium: { pdf: '#f28b2c', docx: 'F28B2C' },
  general: { pdf: '#29a968', docx: '29A968' }
}

const priorityValue = data => String(data.priority || data.targetInfo?.priority || 'ทั่วไป').trim()
const priorityKey = data => priorityAliases[priorityValue(data)] || priorityValue(data)

const priorityLabel = data => {
  const value = priorityValue(data)
  return priorityLabels[value] || value
}

const priorityColor = data => priorityColors[priorityKey(data)] || priorityColors.green
const hasImagePreview = targetInfo => typeof targetInfo?.imagePreview === 'string' && targetInfo.imagePreview.startsWith('data:image/')
const hasReportValue = value => value !== undefined && value !== null && String(value).trim() !== ''
const reportValue = value => hasReportValue(value) ? value : ''
const compactRows = rows => rows
  .map(([label, value]) => [label, reportValue(value)])
  .filter(([, value]) => hasReportValue(value))
const coordinateText = targetInfo => {
  const lat = reportValue(targetInfo.latitude)
  const lon = reportValue(targetInfo.longitude)
  if (!lat && !lon) return ''
  return `LAT ${lat || 'N/A'} / LON ${lon || 'N/A'}`
}
const imageTypeFromDataUrl = dataUrl => {
  const match = String(dataUrl || '').match(/^data:image\/(png|jpe?g|gif|bmp);/i)
  if (!match) return 'png'
  return match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase()
}
const dataUrlToUint8Array = dataUrl => {
  const [, base64 = ''] = String(dataUrl).split(',')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

const createPdfReportHtml = data => {
  const targetInfo = data.targetInfo || {}
  const metrics = data.metrics || {}
  const recommendationValue = cleanRecommendation(metrics.recommendation)
  const recommendations = Array.isArray(data.recommendations) ? data.recommendations.slice(0, 5) : []
  const stampColor = priorityColor(data).pdf
  const imagePreview = hasImagePreview(targetInfo) ? targetInfo.imagePreview : ''

  const infoRows = compactRows([
    ['ID เป้าหมาย', targetInfo.id],
    ['ชื่อเป้าหมาย', targetInfo.name],
    ['ประเภท', targetInfo.type],
    ['ชนิดสิ่งก่อสร้าง', targetInfo.structure],
    ['พื้นที่ทำการ', targetInfo.area],
    ['ระดับความแข็งแรง', targetInfo.strength],
    ['รายละเอียดเป้าหมาย', targetInfo.details],
    ['รูปภาพประกอบ', targetInfo.imageName || (imagePreview ? 'มีรูปภาพประกอบ' : '')],
    ['พิกัด (LAT/LON)', coordinateText(targetInfo)]
  ])

  const metricRows = compactRows([
    ['AI Confidence', hasReportValue(metrics.confidence) ? `${metrics.confidence}%` : ''],
    ['Pk Value', metrics.pk],
    ['CEP Value', hasReportValue(metrics.cep) ? `${metrics.cep} m` : ''],
    ['Recommendation', hasReportValue(metrics.recommendation) ? recommendationValue : '']
  ])
  const hasMetrics = metricRows.length > 0
  const hasAnalysisText = hasReportValue(data.analysisText)

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
      .pdf-report {
        width: 794px;
        min-height: 0;
        position: relative;
        padding: 46px 56px;
        background: #ffffff;
        color: #111827;
        font-family: ${reportFontFamily};
        font-size: 22px;
        line-height: 1.35;
      }
      .pdf-report * { box-sizing: border-box; font-family: ${reportFontFamily}; }
      .pdf-report h1 { margin: 0 0 4px; padding-right: 230px; color: #174ea6; font-size: 34px; font-weight: 700; line-height: 1.05; }
      .pdf-report h2 { margin: 16px 0 6px; color: #174ea6; font-size: 25px; font-weight: 700; }
      .pdf-report .meta { margin-bottom: 8px; color: #5f6b7a; font-size: 18px; }
      .pdf-report .priority-stamp {
        position: absolute;
        top: 40px;
        right: 56px;
        max-width: 220px;
        color: ${stampColor};
        font-size: 28px;
        font-weight: 700;
        line-height: 1.1;
        text-align: right;
      }
      .pdf-report .priority-stamp strong { display: block; font-size: 38px; }
      .pdf-report .pdf-before-metrics {
        min-height: 1080px;
      }
      .pdf-report .target-image-page {
        margin-bottom: 12px;
      }
      .pdf-report table { width: 100%; border-collapse: collapse; margin: 6px 0 12px; table-layout: fixed; }
      .pdf-report th, .pdf-report td { border: 1px solid #b8c2d0; padding: 6px 8px; vertical-align: top; font-size: 18px; }
      .pdf-report th { background: #174ea6; color: #ffffff; font-weight: 700; text-align: left; }
      .pdf-report .info-table th, .pdf-report .metrics-table th { width: 210px; }
      .pdf-report .target-image-frame {
        margin: 6px 0 12px;
        padding: 8px;
        border: 1px solid #b8c2d0;
        background: #f8fafc;
      }
      .pdf-report .target-image-frame img {
        display: block;
        width: 100%;
        max-height: 320px;
        object-fit: contain;
        background: #ffffff;
      }
      .pdf-report .target-image-frame figcaption {
        margin-top: 6px;
        color: #5f6b7a;
        font-size: 17px;
        text-align: center;
      }
      .pdf-report .recommendation-table th, .pdf-report .recommendation-table td { text-align: center; }
      .pdf-report .recommendation-table td:nth-child(2) { text-align: left; }
      .pdf-report .analysis {
        min-height: 0;
        padding: 10px 12px;
        border-left: 6px solid #174ea6;
        background: #f3f7fd;
        color: #263343;
        font-size: 20px;
        white-space: pre-wrap;
      }
    </style>
    <article class="pdf-report">
      <div class="priority-stamp">ระดับความสำคัญ<strong>${escapeHtml(priorityLabel(data))}</strong></div>
      <div class="${hasMetrics ? 'pdf-before-metrics' : ''}">
        <section>
          <h1>Weaponeering Analysis Summary</h1>
          <div class="meta">วันที่จัดทำ: ${escapeHtml(data.generatedDate || new Date().toLocaleString('th-TH'))}</div>
          ${infoRows.length ? `
            <h2>ข้อมูลเป้าหมาย (Target Information)</h2>
            <table class="info-table"><tbody>${renderRows(infoRows)}</tbody></table>
          ` : ''}
        </section>
        ${imagePreview ? `
          <section class="target-image-page">
            <h2>รูปภาพประกอบเป้าหมาย (Target Image)</h2>
            <figure class="target-image-frame">
              <img src="${escapeHtml(imagePreview)}" alt="Target image" />
              <figcaption>${escapeHtml(targetInfo.imageName || 'Target image')}</figcaption>
            </figure>
          </section>
        ` : ''}
      </div>
      ${hasMetrics ? `
        <h2>ผลการวิเคราะห์ (Analysis Metrics)</h2>
        <table class="metrics-table"><tbody>${renderRows(metricRows)}</tbody></table>
      ` : ''}
      ${recommendations.length ? `
        <h2>Top 5 Recommendations</h2>
        <table class="recommendation-table">
          <thead><tr><th>ลำดับ</th><th>รายการ</th><th>ขนาด</th><th>จำนวน</th><th>Pd</th><th>Pk</th></tr></thead>
          <tbody>${recommendationRows}</tbody>
        </table>
      ` : ''}
      ${hasAnalysisText ? `
        <h2>AI Analysis Result</h2>
        <div class="analysis">${escapeHtml(data.analysisText)}</div>
      ` : ''}
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
 * Handles data export to PDF and Word formats
 */
export const exportService = {
  /**
   * Export analysis data to PDF format
   * @param {Object} data - Analysis data containing recommendations and analysis results
   * @param {string} filename - Output filename
   */
  async exportToPDF(data, filename = 'weaponeering_analysis.pdf') {
    try {
      const { jsPDF } = await import('jspdf')
      const { default: html2canvas } = await import('html2canvas')
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const reportContainer = document.createElement('div')
      reportContainer.innerHTML = createPdfReportHtml(data)
      reportContainer.style.position = 'absolute'
      reportContainer.style.left = '0'
      reportContainer.style.top = '0'
      reportContainer.style.width = '794px'
      reportContainer.style.background = '#ffffff'
      reportContainer.style.pointerEvents = 'none'
      reportContainer.style.zIndex = '-1'
      document.body.appendChild(reportContainer)

      try {
        await waitForFonts()
        const reportElement = reportContainer.querySelector('.pdf-report') || reportContainer
        const canvas = await html2canvas(reportElement, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false,
          windowWidth: 794
        })

        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        const imageData = canvas.toDataURL('image/png')
        const imageHeight = (canvas.height * pageWidth) / canvas.width

        let yPosition = 0
        let remainingHeight = imageHeight

        doc.addImage(imageData, 'PNG', 0, yPosition, pageWidth, imageHeight)
        remainingHeight -= pageHeight

        while (remainingHeight > 0) {
          yPosition -= pageHeight
          doc.addPage()
          doc.addImage(imageData, 'PNG', 0, yPosition, pageWidth, imageHeight)
          remainingHeight -= pageHeight
        }

        doc.save(filename)
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
      const {
        Document,
        Packer,
        Paragraph,
        Table,
        TableCell,
        TableRow,
        TextRun,
        ImageRun,
        PageBreak,
        WidthType,
        BorderStyle,
        TableLayoutType,
        AlignmentType
      } = await import('docx')
      const wordBlue = '174EA6'
      const wordText = '111827'
      const wordMuted = '5F6B7A'
      const wordBorder = 'B8C2D0'
      const tableWidth = 9800
      const twoColWidths = [2900, 6900]
      const recColWidths = [900, 3300, 1900, 1200, 1200, 1300]
      const tableBorders = {
        top: { style: BorderStyle.SINGLE, size: 1, color: wordBorder },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: wordBorder },
        left: { style: BorderStyle.SINGLE, size: 1, color: wordBorder },
        right: { style: BorderStyle.SINGLE, size: 1, color: wordBorder },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: wordBorder },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: wordBorder }
      }

      const run = (text, options = {}) => new TextRun({
        text: String(text ?? 'N/A'),
        font: 'TH Sarabun New',
        size: options.size || 28,
        bold: Boolean(options.bold),
        color: options.color || wordText
      })

      const paragraph = (text, options = {}) => new Paragraph({
        alignment: options.alignment,
        spacing: options.spacing,
        children: [run(text, options)]
      })

      const heading = text => new Paragraph({
        spacing: { before: 180, after: 70 },
        children: [run(text, { bold: true, color: wordBlue, size: 32 })]
      })

      const pageBreak = () => new Paragraph({
        children: [new PageBreak()]
      })

      const tableCell = (text, width, options = {}) => new TableCell({
        width: { size: width, type: WidthType.DXA },
        shading: options.shading,
        margins: { top: 80, bottom: 80, left: 130, right: 130 },
        children: [
          paragraph(text, {
            bold: options.bold,
            color: options.color || wordText,
            size: options.size || 24,
            alignment: options.alignment
          })
        ]
      })

      const twoColumnTable = rows => new Table({
        width: { size: tableWidth, type: WidthType.DXA },
        columnWidths: twoColWidths,
        layout: TableLayoutType.FIXED,
        borders: tableBorders,
        rows: rows.map(([label, value]) => new TableRow({
          children: [
            tableCell(label, twoColWidths[0], { shading: { fill: wordBlue }, bold: true, color: 'FFFFFF' }),
            tableCell(hasReportValue(value) ? value : 'N/A', twoColWidths[1])
          ]
        }))
      })

      const recTable = rows => new Table({
        width: { size: tableWidth, type: WidthType.DXA },
        columnWidths: recColWidths,
        layout: TableLayoutType.FIXED,
        borders: tableBorders,
        rows: rows
      })

      const recHeaderCell = (text, index) => tableCell(text, recColWidths[index], {
        shading: { fill: wordBlue },
        bold: true,
        color: 'FFFFFF',
        alignment: AlignmentType.CENTER
      })

      const recValueCell = (text, index, centered = true) => tableCell(text, recColWidths[index], {
        alignment: centered ? AlignmentType.CENTER : undefined,
        color: wordText
      })

      const sections = []
      const targetInfo = data.targetInfo || {}
      const metrics = data.metrics || {}
      const recommendationValue = cleanRecommendation(metrics.recommendation)
      const recommendations = Array.isArray(data.recommendations) ? data.recommendations.slice(0, 5) : []

      const infoRows = compactRows([
        ['ID เป้าหมาย', targetInfo.id],
        ['ชื่อเป้าหมาย', targetInfo.name],
        ['ประเภท', targetInfo.type],
        ['ชนิดสิ่งก่อสร้าง', targetInfo.structure],
        ['พื้นที่ทำการ', targetInfo.area],
        ['ระดับความแข็งแรง', targetInfo.strength],
        ['รายละเอียดเป้าหมาย', targetInfo.details],
        ['รูปภาพประกอบ', targetInfo.imageName || (hasImagePreview(targetInfo) ? 'มีรูปภาพประกอบ' : '')],
        ['พิกัด (LAT/LON)', coordinateText(targetInfo)]
      ])

      const metricRows = compactRows([
        ['AI Confidence', hasReportValue(metrics.confidence) ? `${metrics.confidence}%` : ''],
        ['Pk Value', metrics.pk],
        ['CEP Value', hasReportValue(metrics.cep) ? `${metrics.cep} m` : ''],
        ['Recommendation', hasReportValue(metrics.recommendation) ? recommendationValue : '']
      ])
      const hasMetrics = metricRows.length > 0
      const hasAnalysisText = hasReportValue(data.analysisText)

      sections.push(new Paragraph({
        spacing: { after: 30 },
        children: [run('Weaponeering Analysis Summary', { bold: true, color: wordBlue, size: 40 })]
      }))
      sections.push(paragraph(`วันที่จัดทำ: ${data.generatedDate || new Date().toLocaleString('th-TH')}`, {
        color: wordMuted,
        size: 22,
        spacing: { after: 60 }
      }))
      sections.push(paragraph(`ระดับความสำคัญ: ${priorityLabel(data)}`, {
        alignment: AlignmentType.RIGHT,
        bold: true,
        color: priorityColor(data).docx,
        size: 34,
        spacing: { after: 100 }
      }))

      if (infoRows.length) {
        sections.push(heading('ข้อมูลเป้าหมาย (Target Information)'))
        sections.push(twoColumnTable(infoRows))
      }

      if (hasImagePreview(targetInfo)) {
        sections.push(heading('รูปภาพประกอบเป้าหมาย (Target Image)'))
        sections.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              type: imageTypeFromDataUrl(targetInfo.imagePreview),
              data: dataUrlToUint8Array(targetInfo.imagePreview),
              transformation: {
                width: 380,
                height: 235
              }
            })
          ]
        }))
        sections.push(paragraph(targetInfo.imageName || 'Target image', {
          alignment: AlignmentType.CENTER,
          color: wordMuted,
          size: 22,
          spacing: { before: 50, after: 80 }
        }))
      }

      if (hasMetrics) {
        sections.push(pageBreak())
        sections.push(heading('ผลการวิเคราะห์ (Analysis Metrics)'))
        sections.push(twoColumnTable(metricRows))
      }

      if (recommendations.length) {
        sections.push(heading('Top 5 Recommendations'))
        const recommendationRows = [
          new TableRow({
            children: [
              recHeaderCell('ลำดับ', 0),
              recHeaderCell('รายการ', 1),
              recHeaderCell('ขนาด', 2),
              recHeaderCell('จำนวน', 3),
              recHeaderCell('Pd', 4),
              recHeaderCell('Pk', 5)
            ]
          })
        ]
        recommendations.forEach((rec, idx) => {
          recommendationRows.push(new TableRow({
            children: [
              recValueCell(String(idx + 1), 0),
              recValueCell(rec.item || 'N/A', 1, false),
              recValueCell(rec.size || 'N/A', 2),
              recValueCell(String(rec.qty || 0), 3),
              recValueCell(formatScore(rec.pd), 4),
              recValueCell(formatScore(rec.pk), 5)
            ]
          }))
        })
        sections.push(recTable(recommendationRows))
      }

      if (hasAnalysisText) {
        sections.push(heading('AI Analysis Result'))
        sections.push(paragraph(data.analysisText, {
          size: 24,
          color: '263343',
          spacing: { after: 120 }
        }))
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
            properties: {
              page: {
                margin: {
                  top: 720,
                  right: 820,
                  bottom: 720,
                  left: 820
                }
              }
            },
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
  }
}
