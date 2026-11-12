import ExcelJS from 'exceljs'
import { sanitizeExcelCellValue } from '../admin-candidates/rules.ts'
import type { KirEntry } from './rules.ts'

export type CandidateLedgerExportData = {
  candidateAddress: string
  candidateEmail: string
  candidateName: string
  candidatePhone?: string
  contractNumber?: string
  invoices: Array<{
    amountRsdFormatted: string
    date: string
    invoiceNumber: string
    note: string
  }>
  obligations: Array<{
    amountFormatted: string
    dueDate: string
    label: string
    status: string
  }>
  paidFormatted: string
  paymentMethodLabel: string
  payments: Array<{
    amountForeignFormatted: string
    amountRsdFormatted: string
    date: string
    exchangeRateFormatted?: string
    reference: string
  }>
  programName: string
  remainingFormatted: string
  totalFormatted: string
}

export async function generateKirExcelBuffer(entries: KirEntry[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'American Adventure Platform'
  workbook.lastModifiedBy = 'American Adventure Admin'
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet('KIR Knjiga', {
    views: [{ state: 'frozen', ySplit: 2 }],
  })

  // Title row
  worksheet.mergeCells('A1:H1')
  const titleCell = worksheet.getCell('A1')
  titleCell.value = 'KNJIGA IZDATIH RAČUNA (KIR) - AMERICAN ADVENTURE DOO'
  titleCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 }
  titleCell.fill = {
    fgColor: { argb: 'FF15386B' },
    pattern: 'solid',
    type: 'pattern',
  }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  worksheet.getRow(1).height = 28

  // Column definitions matching Section 17 template:
  // Red br. | Datum Knjiženja | Broj računa | Datum izdavanja računa | Naziv/ime kupca | PIB | Iznos računa | NAPOMENA
  worksheet.getRow(2).values = [
    'Red br.',
    'Datum Knjiženja',
    'Broj računa',
    'Datum izdavanja računa',
    'Naziv/ime kupca',
    'PIB / JMBG',
    'Iznos računa (RSD)',
    'NAPOMENA',
  ]

  const headerRow = worksheet.getRow(2)
  headerRow.height = 24
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
  headerRow.fill = {
    fgColor: { argb: 'FF1E293B' },
    pattern: 'solid',
    type: 'pattern',
  }
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' }

  worksheet.getColumn(1).width = 10
  worksheet.getColumn(2).width = 18
  worksheet.getColumn(3).width = 18
  worksheet.getColumn(4).width = 22
  worksheet.getColumn(5).width = 28
  worksheet.getColumn(6).width = 18
  worksheet.getColumn(7).width = 20
  worksheet.getColumn(8).width = 35

  let totalRsdMinor = 0

  for (const entry of entries) {
    totalRsdMinor += entry.invoiceAmountRsdMinor

    const row = worksheet.addRow([
      entry.sequenceNumber,
      sanitizeExcelCellValue(entry.accountingDate),
      sanitizeExcelCellValue(entry.invoiceNumber),
      sanitizeExcelCellValue(entry.invoiceDate),
      sanitizeExcelCellValue(entry.buyerName),
      sanitizeExcelCellValue(entry.buyerIdentificationNumber),
      entry.invoiceAmountRsdMinor / 100,
      sanitizeExcelCellValue(entry.note),
    ])

    row.height = 20
    row.getCell(1).alignment = { horizontal: 'center' }
    row.getCell(2).alignment = { horizontal: 'center' }
    row.getCell(3).alignment = { horizontal: 'center' }
    row.getCell(4).alignment = { horizontal: 'center' }
    row.getCell(6).alignment = { horizontal: 'center' }
    row.getCell(7).numFmt = '#,##0.00'
    row.getCell(7).alignment = { horizontal: 'right' }
  }

  // Summary Row
  const summaryRowIndex = entries.length + 3
  const summaryRow = worksheet.getRow(summaryRowIndex)
  summaryRow.getCell(5).value = 'UKUPNO:'
  summaryRow.getCell(5).font = { bold: true }
  summaryRow.getCell(5).alignment = { horizontal: 'right' }
  summaryRow.getCell(7).value = totalRsdMinor / 100
  summaryRow.getCell(7).numFmt = '#,##0.00'
  summaryRow.getCell(7).font = { bold: true }
  summaryRow.height = 24

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

export async function generateCandidateLedgerExcelBuffer(
  data: CandidateLedgerExportData,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'American Adventure Platform'
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet('Finansijska kartica')

  // Title
  worksheet.mergeCells('A1:E1')
  const title = worksheet.getCell('A1')
  title.value = `FINANSIJSKA KARTICA KANDIDATA - ${data.candidateName}`
  title.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 }
  title.fill = { fgColor: { argb: 'FF15386B' }, pattern: 'solid', type: 'pattern' }
  title.alignment = { horizontal: 'center', vertical: 'middle' }
  worksheet.getRow(1).height = 28

  // Info box
  worksheet.addRow(['Kandidat:', sanitizeExcelCellValue(data.candidateName), '', 'Program:', sanitizeExcelCellValue(data.programName)])
  worksheet.addRow(['Email:', sanitizeExcelCellValue(data.candidateEmail), '', 'Ugovor:', sanitizeExcelCellValue(data.contractNumber || 'N/A')])
  worksheet.addRow(['Telefon:', sanitizeExcelCellValue(data.candidatePhone || 'N/A'), '', 'Način plaćanja:', sanitizeExcelCellValue(data.paymentMethodLabel)])
  worksheet.addRow([])

  // Financial summary
  worksheet.addRow(['UKUPNA OBAVEZA:', sanitizeExcelCellValue(data.totalFormatted)])
  worksheet.addRow(['EVIDENTIRANO UPLAĆENO:', sanitizeExcelCellValue(data.paidFormatted)])
  worksheet.addRow(['PREOSTALI DUG:', sanitizeExcelCellValue(data.remainingFormatted)])
  worksheet.addRow([])

  // Payments table header
  const pHeader = worksheet.addRow(['R.br.', 'Datum uplate', 'Referenca / Poziv na broj', 'Iznos u valuti', 'Iznos (RSD)'])
  pHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  pHeader.fill = { fgColor: { argb: 'FF1E293B' }, pattern: 'solid', type: 'pattern' }

  let pIndex = 1
  for (const p of data.payments) {
    worksheet.addRow([
      pIndex++,
      sanitizeExcelCellValue(p.date),
      sanitizeExcelCellValue(p.reference),
      sanitizeExcelCellValue(p.amountForeignFormatted),
      sanitizeExcelCellValue(p.amountRsdFormatted),
    ])
  }
  worksheet.addRow([])

  // Invoices table header
  const iHeader = worksheet.addRow(['R.br.', 'Broj fakture', 'Datum izdavanja', 'Iznos (RSD)', 'Napomena'])
  iHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  iHeader.fill = { fgColor: { argb: 'FF1E293B' }, pattern: 'solid', type: 'pattern' }

  let iIndex = 1
  for (const inv of data.invoices) {
    worksheet.addRow([
      iIndex++,
      sanitizeExcelCellValue(inv.invoiceNumber),
      sanitizeExcelCellValue(inv.date),
      sanitizeExcelCellValue(inv.amountRsdFormatted),
      sanitizeExcelCellValue(inv.note),
    ])
  }

  worksheet.columns.forEach((col) => {
    col.width = 24
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
