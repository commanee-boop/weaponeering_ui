const reportFontFamily = "'TH Sarabun New', 'Sarabun', 'Leelawadee UI', Tahoma, sans-serif"
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

<<<<<<< Updated upstream
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
=======
const hasValue = value => value !== undefined && value !== null && String(value).trim() !== ''
const reportValue = value => hasValue(value) ? value : ''
const compactRows = rows => rows.filter(([, value]) => hasValue(value))
const formatScore = value => Number.isFinite(Number(value)) ? Number(value).toFixed(2) : ''

const priorityLabels = {
  red: 'สำคัญสูง', orange: 'ปานกลาง', green: 'ทั่วไป',
  key: 'สำคัญสูง', medium: 'สำคัญ', general: 'ทั่วไป'
}

const priorityLabel = data => {
  const value = String(data.priority || data.targetInfo?.priority || 'ทั่วไป').trim()
  return priorityLabels[value] || value
}

const coordinateText = targetInfo => {
  if (hasValue(targetInfo.coordinates)) return String(targetInfo.coordinates)
  const lat = reportValue(targetInfo.latitude)
  const lon = reportValue(targetInfo.longitude)
  return lat || lon ? `LAT ${lat || 'N/A'} / LON ${lon || 'N/A'}` : ''
>>>>>>> Stashed changes
}

const summaryValues = data => {
  const targetInfo = data.targetInfo || {}
  const recommendations = Array.isArray(data.recommendations) ? data.recommendations : []
<<<<<<< Updated upstream
  const firstRecommendation = recommendations[0] || {}

=======
>>>>>>> Stashed changes
  return [
    targetInfo.id,
    targetInfo.name,
    priorityLabel(data),
    coordinateText(targetInfo),
    '-',
    targetInfo.details,
<<<<<<< Updated upstream
    targetInfo.desiredResult || targetInfo.desiredEffect || targetInfo.area || firstRecommendation.size,
    '-'
  ].map(value => hasReportValue(value) ? value : 'N/A')
=======
    targetInfo.desiredResult || targetInfo.desiredEffect || targetInfo.area || recommendations[0]?.size,
    '-'
  ].map(value => hasValue(value) ? value : 'N/A')
>>>>>>> Stashed changes
}

const additionalRows = data => {
  const targetInfo = data.targetInfo || {}
  const metrics = data.metrics || {}
  const recommendations = Array.isArray(data.recommendations) ? data.recommendations.slice(0, 5) : []
<<<<<<< Updated upstream
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
=======
  const desiredResult = String(summaryValues(data)[6])
  const same = (left, right) => String(left ?? '').trim() === String(right ?? '').trim()
  const rows = [
    ['ประเภทเป้าหมาย', targetInfo.type],
    ['ชนิดสิ่งก่อสร้าง', targetInfo.structure],
    ['พื้นที่/แหล่งข้อมูล', same(targetInfo.area, desiredResult) ? '' : targetInfo.area],
    ['ระดับความแข็งแรง', targetInfo.strength],
    ['ชื่อไฟล์รูปภาพ', targetInfo.imageName],
    ['AI Confidence', hasValue(metrics.confidence) ? `${metrics.confidence}%` : ''],
>>>>>>> Stashed changes
    ['Pk Value', metrics.pk],
    ['CEP Value', metrics.cep]
  ]

  recommendations.forEach((rec, index) => {
<<<<<<< Updated upstream
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
=======
    rows.push([
      `อาวุธทางเลือกลำดับที่ ${index + 1}`,
      [rec.item, hasValue(rec.size) && !same(rec.size, desiredResult) ? `ผลลัพธ์ ${rec.size}` : '',
        hasValue(rec.qty) ? `จำนวน ${rec.qty}` : '', hasValue(rec.pd) ? `Pd ${formatScore(rec.pd)}` : '',
        hasValue(rec.pk) ? `Pk ${formatScore(rec.pk)}` : ''].filter(Boolean).join(' / ')
    ])
  })

  if (hasValue(data.analysisText) && !same(data.analysisText, targetInfo.details)) {
    rows.push(['ผลการวิเคราะห์ AI', data.analysisText])
  }
  return compactRows(rows)
}

const hasImage = targetInfo => typeof targetInfo?.imagePreview === 'string' && targetInfo.imagePreview.startsWith('data:image/')
const imageType = dataUrl => {
  const type = String(dataUrl).match(/^data:image\/(png|jpe?g|gif|bmp);/i)?.[1]?.toLowerCase() || 'png'
  return type === 'jpeg' ? 'jpg' : type
}

const dataUrlToBytes = dataUrl => {
  const [, payload = ''] = String(dataUrl).split(',')
  const binary = atob(payload)
  return Uint8Array.from(binary, character => character.charCodeAt(0))
}

const imageDimensions = dataUrl => new Promise(resolve => {
  const image = new Image()
  image.onload = () => resolve({ width: image.naturalWidth || 4, height: image.naturalHeight || 3 })
>>>>>>> Stashed changes
  image.onerror = () => resolve({ width: 4, height: 3 })
  image.src = dataUrl
})

<<<<<<< Updated upstream
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
=======
const fitImage = (dimensions, maxWidth, maxHeight) => {
  const scale = Math.min(maxWidth / dimensions.width, maxHeight / dimensions.height)
  return { width: Math.round(dimensions.width * scale), height: Math.round(dimensions.height * scale) }
}

const imageForWord = async dataUrl => {
  if (!String(dataUrl).startsWith('data:image/svg+xml')) return dataUrl
  const image = new Image()
  await new Promise((resolve, reject) => {
    image.onload = resolve
    image.onerror = reject
    image.src = dataUrl
  })
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth || 1200
  canvas.height = image.naturalHeight || 675
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/png')
}

const pdfHtml = data => {
  const targetInfo = data.targetInfo || {}
  const headers = ['TGT', 'ชื่อเป้าหมาย', 'PRI', 'พิกัด (LAT/LONG)', 'ความสูง (MSL)', 'รายละเอียดเป้าหมาย', 'ผลลัพธ์ที่ต้องการ', 'อาวุธที่ใช้']
  const headerCells = headers.map((label, index) => `<th>${escapeHtml(label)}${index === 4 ? '<br>(ft)' : ''}</th>`).join('')
  const valueCells = summaryValues(data).map(value => `<td>${escapeHtml(value)}</td>`).join('')
  const otherRows = additionalRows(data)
  const renderRows = rows => rows.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('')
  const preview = hasImage(targetInfo) ? targetInfo.imagePreview : ''

  return `<style>
    .pdf-report{width:1123px;background:#fff;color:#111827;font-family:${reportFontFamily};font-size:20px;line-height:1.3}
    .pdf-report *{box-sizing:border-box;font-family:${reportFontFamily}}
    .report-page{width:1123px;min-height:794px;padding:30px 42px}
    h1{margin:0 0 3px;color:#174ea6;font-size:30px;line-height:1.05}h2{margin:0 0 8px;color:#174ea6;font-size:24px}
    .meta{margin-bottom:8px;color:#5f6b7a;font-size:17px}.target-image-frame{height:488px;margin:10px 0 0;padding:8px;border:1px solid #b8c2d0;background:#f8fafc;display:flex;align-items:center;justify-content:center}
    .target-image-frame img{display:block;width:auto;max-width:842px;max-height:470px;object-fit:contain}.image-placeholder{color:#5f6b7a;font-size:22px}
    table{width:100%;border-collapse:collapse;table-layout:fixed;margin:6px 0 12px}th,td{border:1px solid #b8c2d0;padding:6px 8px;vertical-align:middle;font-size:17px}th{background:#174ea6;color:#fff;text-align:left}
    .summary-table th,.summary-table td{padding:5px;font-size:15px;text-align:center;overflow-wrap:anywhere}
    .summary-table th:nth-child(1),.summary-table td:nth-child(1){width:9%}.summary-table th:nth-child(2),.summary-table td:nth-child(2){width:12%}.summary-table th:nth-child(3),.summary-table td:nth-child(3){width:8%}.summary-table th:nth-child(4),.summary-table td:nth-child(4){width:14%}.summary-table th:nth-child(5),.summary-table td:nth-child(5){width:11%}.summary-table th:nth-child(6),.summary-table td:nth-child(6){width:17%;text-align:left}.summary-table th:nth-child(7),.summary-table td:nth-child(7){width:15%}.summary-table th:nth-child(8),.summary-table td:nth-child(8){width:14%}
    .additional-table th{width:250px}
  </style><article class="pdf-report"><section class="report-page"><h1>Weaponeering Analysis Summary</h1><div class="meta">วันที่จัดทำ: ${escapeHtml(data.generatedDate || new Date().toLocaleString('th-TH'))}</div>
    <figure class="target-image-frame">${preview ? `<img src="${escapeHtml(preview)}" alt="Target image">` : '<div class="image-placeholder">ไม่มีรูปภาพเป้าหมาย</div>'}</figure>
    <table class="summary-table"><thead><tr>${headerCells}</tr></thead><tbody><tr>${valueCells}</tr></tbody></table></section>
    ${otherRows.length ? `<section class="report-page"><h2>ข้อมูลเพิ่มเติม</h2><table class="additional-table"><tbody>${renderRows(otherRows)}</tbody></table></section>` : ''}</article>`
}

const excelHtml = data => {
  const headers = ['TGT', 'ชื่อเป้าหมาย', 'PRI', 'พิกัด', 'ความสูง (MSL) (ft)', 'รายละเอียดเป้าหมาย', 'ผลลัพธ์ที่ต้องการ', 'อาวุธที่ใช้']
  const headerCells = headers.map(label => `<th>${escapeHtml(label)}</th>`).join('')
  const valueCells = summaryValues(data).map(value => `<td>${escapeHtml(value)}</td>`).join('')
  const otherRows = additionalRows(data).map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td colspan="7">${escapeHtml(value)}</td></tr>`).join('')
  return `<!doctype html><html lang="th"><head><meta charset="utf-8"><style>
    body{font-family:"TH Sarabun New",Tahoma,sans-serif;font-size:16pt}table{border-collapse:collapse;width:100%}th,td{border:1px solid #8a97a8;padding:8px;vertical-align:middle}th{background:#174ea6;color:#fff;font-weight:bold}.summary td{text-align:center}.additional th{width:220px;text-align:left}
  </style></head><body><h2>Weaponeering Analysis Summary</h2><p>วันที่จัดทำ: ${escapeHtml(data.generatedDate || new Date().toLocaleString('th-TH'))}</p>
    <table class="summary"><thead><tr>${headerCells}</tr></thead><tbody><tr>${valueCells}</tr></tbody></table>
    ${otherRows ? `<h3>ข้อมูลเพิ่มเติม</h3><table class="additional"><tbody>${otherRows}</tbody></table>` : ''}</body></html>`
}

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const exportService = {
  async exportToPDF(data, filename = 'weaponeering_analysis.pdf') {
    const [{ jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas')])
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const container = document.createElement('div')
    container.innerHTML = pdfHtml(data)
    Object.assign(container.style, { position: 'absolute', left: '0', top: '0', width: '1123px', background: '#fff', pointerEvents: 'none', zIndex: '-1' })
    document.body.appendChild(container)
    try {
      if (document.fonts?.ready) await document.fonts.ready
      const canvas = await html2canvas(container.querySelector('.pdf-report'), { scale: 2, backgroundColor: '#fff', useCORS: true, logging: false, windowWidth: 1123 })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const imageHeight = canvas.height * pageWidth / canvas.width
      const imageData = canvas.toDataURL('image/png')
      let y = 0
      for (let remaining = imageHeight; remaining > 0; remaining -= pageHeight) {
        if (y < 0) doc.addPage()
        doc.addImage(imageData, 'PNG', 0, y, pageWidth, imageHeight)
        y -= pageHeight
      }
      doc.save(filename)
    } finally {
      document.body.removeChild(container)
    }
  },

  exportToExcel(data, filename = 'weaponeering_analysis.xls') {
    const blob = new Blob(['\ufeff', excelHtml(data)], { type: 'application/vnd.ms-excel;charset=utf-8' })
    downloadBlob(blob, filename)
  },

  async exportToWord(data, filename = 'weaponeering_analysis.docx') {
    const { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, ImageRun, PageBreak, WidthType, BorderStyle, TableLayoutType, AlignmentType, PageOrientation, VerticalAlign } = await import('docx')
    const fontSize = 32
    const blue = '174EA6'
    const border = 'B8C2D0'
    const tableWidth = 15700
    const summaryWidths = [1400, 1900, 1300, 2200, 1800, 2600, 2300, 2200]
    const detailWidths = [3600, 12100]
    const borders = Object.fromEntries(['top', 'bottom', 'left', 'right', 'insideHorizontal', 'insideVertical'].map(key => [key, { style: BorderStyle.SINGLE, size: 1, color: border }]))
    const run = (text, options = {}) => new TextRun({ text: String(text ?? 'N/A'), font: 'TH Sarabun New', size: fontSize, bold: Boolean(options.bold), color: options.color || '111827' })
    const cell = (text, width, options = {}) => new TableCell({ width: { size: width, type: WidthType.DXA }, shading: options.shading, verticalAlign: VerticalAlign.CENTER, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ alignment: options.alignment, children: options.lines ? options.lines.flatMap((line, index) => [...(index ? [new TextRun({ break: 1 })] : []), run(line, options)]) : [run(text, options)] })] })
    const summary = new Table({ width: { size: tableWidth, type: WidthType.DXA }, columnWidths: summaryWidths, layout: TableLayoutType.FIXED, borders, rows: [
      new TableRow({ tableHeader: true, children: ['TGT', 'ชื่อเป้าหมาย', 'PRI', 'พิกัด (LAT/LONG)', 'ความสูง (MSL)', 'รายละเอียดเป้าหมาย', 'ผลลัพธ์ที่ต้องการ', 'อาวุธที่ใช้'].map((label, index) => cell(label, summaryWidths[index], { bold: true, color: 'FFFFFF', shading: { fill: blue }, alignment: AlignmentType.CENTER, lines: index === 4 ? ['ความสูง (MSL)', '(ft)'] : undefined })) }),
      new TableRow({ children: summaryValues(data).map((value, index) => cell(value, summaryWidths[index], { alignment: index === 5 ? undefined : AlignmentType.CENTER })) })
    ] })
    const otherRows = additionalRows(data)
    const children = [new Paragraph({ spacing: { after: 30 }, children: [run('Weaponeering Analysis Summary', { bold: true, color: blue })] }), new Paragraph({ spacing: { after: 50 }, children: [run(`วันที่จัดทำ: ${data.generatedDate || new Date().toLocaleString('th-TH')}`, { color: '5F6B7A' })] })]
    const targetInfo = data.targetInfo || {}
    if (hasImage(targetInfo)) {
      const normalized = await imageForWord(targetInfo.imagePreview)
      const dimensions = await imageDimensions(normalized)
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 40 }, children: [new ImageRun({ type: imageType(normalized), data: dataUrlToBytes(normalized), transformation: fitImage(dimensions, 1200, 450) })] }))
    } else {
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 700, after: 700 }, children: [run('ไม่มีรูปภาพเป้าหมาย', { color: '5F6B7A' })] }))
    }
    children.push(summary)
    if (otherRows.length) {
      children.push(new Paragraph({ children: [new PageBreak()] }), new Paragraph({ spacing: { before: 80, after: 80 }, children: [run('ข้อมูลเพิ่มเติม', { bold: true, color: blue })] }), new Table({ width: { size: tableWidth, type: WidthType.DXA }, columnWidths: detailWidths, layout: TableLayoutType.FIXED, borders, rows: otherRows.map(([label, value]) => new TableRow({ children: [cell(label, detailWidths[0], { bold: true, color: 'FFFFFF', shading: { fill: blue } }), cell(value, detailWidths[1])] })) }))
    }
    const doc = new Document({ styles: { default: { document: { run: { font: 'TH Sarabun New', size: fontSize } } } }, sections: [{ properties: { page: { size: { orientation: PageOrientation.LANDSCAPE }, margin: { top: 560, right: 568, bottom: 560, left: 568 } } }, children }] })
    downloadBlob(await Packer.toBlob(doc), filename)
>>>>>>> Stashed changes
  }
}
