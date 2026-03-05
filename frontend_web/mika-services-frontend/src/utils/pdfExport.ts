export interface PdfExportOptions {
  filename?: string
  scale?: number
  margin?: number
  format?: 'a4' | 'a3'
}

const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297

export async function exportElementToPdf(
  element: HTMLElement,
  options: PdfExportOptions = {}
): Promise<void> {
  const { filename = 'export', scale = 2, margin = 10, format = 'a4' } = options

  const pageHeight = format === 'a4' ? A4_HEIGHT_MM : 420
  const pageWidth = format === 'a4' ? A4_WIDTH_MM : 297
  const contentHeight = pageHeight - 2 * margin
  const contentWidth = pageWidth - 2 * margin

  const [html2canvas, { jsPDF }] = await Promise.all([
    import('html2canvas').then(m => m.default),
    import('jspdf'),
  ])

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor: '#f9fafb',
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  })

  const imgData = canvas.toDataURL('image/jpeg', 0.92)
  const imgWidth = contentWidth
  const imgHeight = (canvas.height * contentWidth) / canvas.width
  let heightLeft = imgHeight
  let position = 0

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format,
  })

  pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight)
  heightLeft -= contentHeight

  while (heightLeft > 0) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight)
    heightLeft -= contentHeight
  }

  pdf.save(`${filename.replace(/\.pdf$/i, '')}.pdf`)
}
