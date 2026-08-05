const reportFontFamily = "'TH Sarabun New', 'Sarabun', 'Leelawadee UI', Tahoma, sans-serif"
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

const priorityValue = data => String(data.priority || data.targetInfo?.priority || 'ทั่วไป').trim()

const priorityLabel = data => {
  const value = priorityValue(data)
  return priorityLabels[value] || value
}

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

const summaryValues = data => {
  const targetInfo = data.targetInfo || {}
  const recommendations = Array.isArray(data.recommendations) ? data.recommendations : []
  const firstRecommendation = recommendations[0] || {}

  return [
    targetInfo.id,
    targetInfo.name,
    priorityLabel(data),
    coordinateText(targetInfo),
    '-',
    targetInfo.details,
    targetInfo.desiredResult || targetInfo.desiredEffect || targetInfo.area || firstRecommendation.size,
    '-'
  ].map(value => hasReportValue(value) ? value : 'N/A')
}

const additionalRows = data => {
  const targetInfo = data.targetInfo || {}
  const metrics = data.metrics || {}
  const recommendations = Array.isArray(data.recommendations) ? data.recommendations.slice(0, 5) : []
  const summary = summaryValues(data)
  const desiredResult = String(summary[6])
  const selectedWeapon = String(summary[7])
  const isSameValue = (left, right) => String(left ?? '').trim() === String(right ?? '').trim()

  const rows = [
    ['ประเภทเป้าหมาย', targetInfo.type],
    ['ชนิดสิ่งก่อสร้าง', targetInfo.structure],
    ['พื้นที่/แหล่งข้อมูล', isSameValue(targetInfo.area, desiredResult) ? '' : targetInfo.area],
    ['ระดับความแข็งแรง', targetInfo.strength],
    ['ชื่อไฟล์รูปภาพ', targetInfo.imageName],
    ['AI Confidence', hasReportValue(metrics.confidence) ? `${metrics.confidence}%` : ''],
    ['Pk Value', metrics.pk],
    ['CEP Value', metrics.cep]
  ]

  recommendations.forEach((rec, index) => {
    if (index === 0 && isSameValue(rec.item, selectedWeapon)) {
      const firstRecommendationDetails = [
        hasReportValue(rec.qty) ? `จำนวน ${rec.qty}` : '',
        hasReportValue(rec.pd) ? `Pd ${formatScore(rec.pd)}` : ''
      ].filter(Boolean).join(' / ')
      if (firstRecommendationDetails) rows.push(['รายละเอียดอาวุธที่ใช้', firstRecommendationDetails])
      return
    }

    rows.push([
      `อาวุธทางเลือกลำดับที่ ${index + 1}`,
      [
        rec.item,
        hasReportValue(rec.size) && !isSameValue(rec.size, desiredResult) ? `ผลลัพธ์ ${rec.size}` : '',
        hasReportValue(rec.qty) ? `จำนวน ${rec.qty}` : '',
        hasReportValue(rec.pd) ? `Pd ${formatScore(rec.pd)}` : '',
        hasReportValue(rec.pk) ? `Pk ${formatScore(rec.pk)}` : ''
      ].filter(Boolean).join(' / ')
    ])
  })

  if (hasReportValue(data.analysisText) && !isSameValue(data.analysisText, targetInfo.details)) {
    rows.push(['ผลการวิเคราะห์ AI', data.analysisText])
  }

  return compactRows(rows)
}

const getImageDimensions = dataUrl => new Promise(resolve => {
  const image = new Image()
  image.onload = () => resolve({ width: image.naturalWidth || image.width, height: image.naturalHeight || image.height })
  image.onerror = () => resolve({ width: 4, height: 3 })
  image.src = dataUrl
})

const fitImageWithin = (dimensions, maxWidth, maxHeight) => {
  const width = Math.max(1, Number(dimensions?.width) || maxWidth)
  const height = Math.max(1, Number(dimensions?.height) || maxHeight)
  const scale = Math.min(maxWidth / width, maxHeight / height)
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale)
  }
}

const createPdfReportHtml = data => {
  const targetInfo = data.targetInfo || {}
  const imagePreview = hasImagePreview(targetInfo) ? targetInfo.imagePreview : ''
  const summaryHeaders = ['TGT', 'ชื่อเป้าหมาย', 'PRI', 'พิกัด', 'ความสูง (MSL)', 'รายละเอียดเป้าหมาย', 'ผลลัพธ์ที่ต้องการ', 'อาวุธที่ใช้']
  const summaryData = summaryValues(data)
  const otherRows = additionalRows(data)

  const renderRows = rows => rows.map(([label, value]) => `
    <tr>
      <th>${escapeHtml(label)}</th>
      <td>${escapeHtml(value)}</td>
    </tr>
  `).join('')

  const summaryHeaderCells = summaryHeaders
    .map((label, index) => `<th>${escapeHtml(label)}${index === 4 ? '<br>(ft)' : ''}</th>`)
    .join('')
  const summaryValueCells = summaryData.map(value => `<td>${escapeHtml(value)}</td>`).join('')

  return `
    <style>
      .pdf-report {
        width: 1123px;
        min-height: 0;
        position: relative;
        background: #ffffff;
        color: #111827;
        font-family: ${reportFontFamily};
        font-size: 20px;
        line-height: 1.3;
      }
      .pdf-report * { box-sizing: border-box; font-family: ${reportFontFamily}; }
      .pdf-report .report-page { width: 1123px; min-height: 794px; padding: 30px 42px; }
      .pdf-report .summary-page { min-height: 794px; }
      .pdf-report h1 { margin: 0 0 3px; color: #174ea6; font-size: 30px; font-weight: 700; line-height: 1.05; }
      .pdf-report h2 { margin: 0 0 8px; color: #174ea6; font-size: 24px; font-weight: 700; }
      .pdf-report .meta { margin-bottom: 8px; color: #5f6b7a; font-size: 17px; }
      .pdf-report table { width: 100%; border-collapse: collapse; margin: 6px 0 12px; table-layout: fixed; }
      .pdf-report th, .pdf-report td { border: 1px solid #b8c2d0; padding: 6px 8px; vertical-align: middle; font-size: 17px; }
      .pdf-report th { background: #174ea6; color: #ffffff; font-weight: 700; text-align: left; }
      .pdf-report .additional-table th { width: 250px; }
      .pdf-report .target-image-frame {
        height: 488px;
        margin: 10px 0 0;
        padding: 8px;
        border: 1px solid #b8c2d0;
        background: #f8fafc;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .pdf-report .target-image-frame img {
        display: block;
        width: auto;
        max-width: 842px;
        max-height: 470px;
        object-fit: contain;
        background: #ffffff;
      }
      .pdf-report .image-placeholder {
        color: #5f6b7a;
        font-size: 22px;
        text-align: center;
      }
      .pdf-report .summary-table { margin: 6px 0 0; }
      .pdf-report .summary-table th { padding: 5px; font-size: 15px; text-align: center; vertical-align: middle; }
      .pdf-report .summary-table td { padding: 6px 5px; font-size: 15px; text-align: center; vertical-align: middle; overflow-wrap: anywhere; }
      .pdf-report .summary-table th:nth-child(1), .pdf-report .summary-table td:nth-child(1) { width: 9%; }
      .pdf-report .summary-table th:nth-child(2), .pdf-report .summary-table td:nth-child(2) { width: 12%; }
      .pdf-report .summary-table th:nth-child(3), .pdf-report .summary-table td:nth-child(3) { width: 8%; }
      .pdf-report .summary-table th:nth-child(4), .pdf-report .summary-table td:nth-child(4) { width: 14%; }
      .pdf-report .summary-table th:nth-child(5), .pdf-report .summary-table td:nth-child(5) { width: 11%; }
      .pdf-report .summary-table th:nth-child(6), .pdf-report .summary-table td:nth-child(6) { width: 17%; text-align: left; }
      .pdf-report .summary-table th:nth-child(7), .pdf-report .summary-table td:nth-child(7) { width: 15%; }
      .pdf-report .summary-table th:nth-child(8), .pdf-report .summary-table td:nth-child(8) { width: 14%; }
    </style>
    <article class="pdf-report">
      <section class="report-page summary-page">
        <h1>Weaponeering Analysis Summary</h1>
        <div class="meta">วันที่จัดทำ: ${escapeHtml(data.generatedDate || new Date().toLocaleString('th-TH'))}</div>
        <figure class="target-image-frame">
          ${imagePreview
            ? `<img src="${escapeHtml(imagePreview)}" alt="${escapeHtml(targetInfo.imageName || 'Target image')}" />`
            : '<div class="image-placeholder">ไม่มีรูปภาพเป้าหมาย</div>'}
        </figure>
        <table class="summary-table">
          <thead><tr>${summaryHeaderCells}</tr></thead>
          <tbody><tr>${summaryValueCells}</tr></tbody>
        </table>
      </section>
      ${otherRows.length ? `
        <section class="report-page details-page">
          <h2>ข้อมูลเพิ่มเติม</h2>
          <table class="additional-table"><tbody>${renderRows(otherRows)}</tbody></table>
        </section>
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
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })

      const reportContainer = document.createElement('div')
      reportContainer.innerHTML = createPdfReportHtml(data)
      reportContainer.style.position = 'absolute'
      reportContainer.style.left = '0'
      reportContainer.style.top = '0'
      reportContainer.style.width = '1123px'
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
          windowWidth: 1123
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
        AlignmentType,
        PageOrientation,
        VerticalAlign
      } = await import('docx')
      const wordBlue = '174EA6'
      const wordText = '111827'
      const wordMuted = '5F6B7A'
      const wordBorder = 'B8C2D0'
      const wordFontSize = 32
      const tableWidth = 15700
      const twoColWidths = [3600, 12100]
      const summaryColWidths = [1400, 1900, 1300, 2200, 1800, 2600, 2300, 2200]
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
        size: options.size || wordFontSize,
        bold: Boolean(options.bold),
        color: options.color || wordText
      })

      const paragraph = (text, options = {}) => new Paragraph({
        alignment: options.alignment,
        spacing: options.spacing,
        children: [run(text, options)]
      })

      const heading = text => new Paragraph({
        spacing: { before: 80, after: 80 },
        children: [run(text, { bold: true, color: wordBlue, size: wordFontSize })]
      })

      const pageBreak = () => new Paragraph({
        children: [new PageBreak()]
      })

      const tableCell = (text, width, options = {}) => new TableCell({
        width: { size: width, type: WidthType.DXA },
        shading: options.shading,
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 80, bottom: 80, left: 130, right: 130 },
        children: [new Paragraph({
          alignment: options.alignment,
          children: options.lines
            ? options.lines.flatMap((line, index) => [
                ...(index ? [new TextRun({ break: 1 })] : []),
                run(line, {
                  bold: options.bold,
                  color: options.color || wordText,
                  size: options.size || wordFontSize
                })
              ])
            : [run(text, {
                bold: options.bold,
                color: options.color || wordText,
                size: options.size || wordFontSize
              })]
        })]
      })

      const twoColumnTable = rows => new Table({
        width: { size: tableWidth, type: WidthType.DXA },
        columnWidths: twoColWidths,
        layout: TableLayoutType.FIXED,
        borders: tableBorders,
        rows: rows.map(([label, value]) => new TableRow({
          children: [
            tableCell(label, twoColWidths[0], { shading: { fill: wordBlue }, bold: true, color: 'FFFFFF', size: wordFontSize }),
            tableCell(hasReportValue(value) ? value : 'N/A', twoColWidths[1], { size: wordFontSize })
          ]
        }))
      })

      const summaryTable = values => new Table({
        width: { size: tableWidth, type: WidthType.DXA },
        columnWidths: summaryColWidths,
        layout: TableLayoutType.FIXED,
        borders: tableBorders,
        rows: [
          new TableRow({
            tableHeader: true,
            children: ['TGT', 'ชื่อเป้าหมาย', 'PRI', 'พิกัด', 'ความสูง (MSL)', 'รายละเอียดเป้าหมาย', 'ผลลัพธ์ที่ต้องการ', 'อาวุธที่ใช้']
              .map((label, index) => tableCell(label, summaryColWidths[index], {
                shading: { fill: wordBlue },
                bold: true,
                color: 'FFFFFF',
                size: wordFontSize,
                alignment: AlignmentType.CENTER,
                lines: index === 4 ? ['ความสูง (MSL)', '(ft)'] : undefined
              }))
          }),
          new TableRow({
            children: values.map((value, index) => tableCell(value, summaryColWidths[index], {
              size: wordFontSize,
              alignment: index === 5 ? undefined : AlignmentType.CENTER
            }))
          })
        ]
      })

      const sections = []
      const targetInfo = data.targetInfo || {}
      const horizontalSummary = summaryValues(data)
      const otherRows = additionalRows(data)

      sections.push(new Paragraph({
        spacing: { after: 30 },
        children: [run('Weaponeering Analysis Summary', { bold: true, color: wordBlue, size: wordFontSize })]
      }))
      sections.push(paragraph(`วันที่จัดทำ: ${data.generatedDate || new Date().toLocaleString('th-TH')}`, {
        color: wordMuted,
        size: wordFontSize,
        spacing: { after: 50 }
      }))

      if (hasImagePreview(targetInfo)) {
        const dimensions = await getImageDimensions(targetInfo.imagePreview)
        const fittedImage = fitImageWithin(dimensions, 1200, 450)
        sections.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 40 },
          children: [
            new ImageRun({
              type: imageTypeFromDataUrl(targetInfo.imagePreview),
              data: dataUrlToUint8Array(targetInfo.imagePreview),
              transformation: fittedImage
            })
          ]
        }))
      } else {
        sections.push(paragraph('ไม่มีรูปภาพเป้าหมาย', {
          alignment: AlignmentType.CENTER,
          color: wordMuted,
          size: wordFontSize,
          spacing: { before: 700, after: 700 }
        }))
      }

      sections.push(summaryTable(horizontalSummary))

      if (otherRows.length) {
        sections.push(pageBreak())
        sections.push(heading('ข้อมูลเพิ่มเติม'))
        sections.push(twoColumnTable(otherRows))
      }

      const doc = new Document({
        styles: {
          default: {
            document: {
              run: {
                font: 'TH Sarabun New',
                size: wordFontSize
              }
            }
          }
        },
        sections: [
          {
            properties: {
              page: {
                size: {
                  orientation: PageOrientation.LANDSCAPE
                },
                margin: {
                  top: 560,
                  right: 568,
                  bottom: 560,
                  left: 568
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
