import ExcelJS from 'exceljs'
import {
  resolveExportColumns,
  sanitizeExcelCellValue,
  type AdminCandidateOverviewItem,
  type ExportColumnDef,
} from './rules.ts'

export async function generateCandidatesExcelBuffer(
  candidates: AdminCandidateOverviewItem[],
  fieldsParam?: string,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'American Adventure Platform'
  workbook.lastModifiedBy = 'Admin'
  workbook.created = new Date()
  workbook.modified = new Date()

  const worksheet = workbook.addWorksheet('Kandidati', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  const columns: ExportColumnDef[] = resolveExportColumns(fieldsParam)

  // Definiši kolone radnog lista
  worksheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width,
  }))

  // Stilizuj zaglavlje (header)
  const headerRow = worksheet.getRow(1)
  headerRow.height = 24
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
  headerRow.fill = {
    fgColor: { argb: 'FF1E293B' },
    pattern: 'solid',
    type: 'pattern',
  }
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' }

  // Popuni podatke o kandidatima
  for (const candidate of candidates) {
    const rowValues: Record<string, unknown> = {}
    for (const col of columns) {
      const rawVal = (candidate as unknown as Record<string, unknown>)[col.key]
      const formattedVal = col.format ? col.format(rawVal, candidate) : rawVal
      rowValues[col.key] = sanitizeExcelCellValue(formattedVal)
    }
    const addedRow = worksheet.addRow(rowValues)
    addedRow.height = 20
    addedRow.alignment = { vertical: 'middle' }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

/**
 * Generiše Excel dokument prema zvaničnom formatu za Ambasadu SAD i sponzore
 * Izvor: "01.04. American Adventure.xlsx"
 */
export async function generateEmbassyExcelBuffer(
  candidates: AdminCandidateOverviewItem[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'American Adventure DOO'
  workbook.lastModifiedBy = 'Admin'
  workbook.created = new Date()
  workbook.modified = new Date()

  const worksheet = workbook.addWorksheet('Sheet1', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 2 }],
  })

  // Kolone
  const columnsDef = [
    { key: 'index', width: 6 },
    { key: 'surname', width: 18 },
    { key: 'givenName', width: 18 },
    { key: 'dateOfBirth', width: 14 },
    { key: 'passportNumber', width: 18 },
    { key: 'gender', width: 12 },
    { key: 'cityOfStudy', width: 16 },
    { key: 'universityType', width: 18 },
    { key: 'universityName', width: 28 },
    { key: 'fieldOfStudy', width: 26 },
    { key: 'budgetOrSelf', width: 14 },
    { key: 'yearOfStudy', width: 14 },
    { key: 'creditsCompleted', width: 18 },
    { key: 'gradeAverage', width: 14 },
    { key: 'inSessionLastYear', width: 18 },
    { key: 'priorSwtVisa', width: 18 },
    { key: 'refusedVisaBefore', width: 22 },
  ]

  worksheet.columns = columnsDef.map((col) => ({
    key: col.key,
    width: col.width,
  }))

  // Red 1: Grupna zaglavlja (BIOGRAPHIC DATA, EDUCATION, PARTICIPATION)
  const groupRow = worksheet.getRow(1)
  groupRow.height = 24

  worksheet.mergeCells('B1:F1')
  worksheet.mergeCells('G1:O1')
  worksheet.mergeCells('P1:Q1')

  worksheet.getCell('B1').value = 'BIOGRAPHIC DATA'
  worksheet.getCell('G1').value = 'EDUCATION'
  worksheet.getCell('P1').value = 'PARTICIPATION'

  for (const cellRef of ['B1', 'G1', 'P1']) {
    const cell = worksheet.getCell(cellRef)
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    cell.fill = { fgColor: { argb: 'FF1E293B' }, pattern: 'solid', type: 'pattern' }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  }

  // Red 2: Nazivi pojedinačnih kolona
  const colHeaders = [
    '',
    'Surname',
    'Given Name',
    'Date of Birth',
    'Passport Number',
    'Gender',
    'City of Study',
    'Type of University',
    'University Name',
    'Field of Study',
    'Budget/ Self',
    'Year of Study',
    'Credits Completed',
    'Grade Average',
    'In Session last year',
    'Prior SWT Visa',
    'Refused any visa before',
  ]

  const headerRow = worksheet.getRow(2)
  headerRow.height = 26
  colHeaders.forEach((headerText, index) => {
    if (index === 0) return
    const cell = headerRow.getCell(index + 1)
    cell.value = headerText
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
    cell.fill = { fgColor: { argb: 'FF334155' }, pattern: 'solid', type: 'pattern' }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  })

  // Popuni podatke kandidata
  candidates.forEach((cand, idx) => {
    const rowNum = idx + 3
    const row = worksheet.getRow(rowNum)
    row.height = 20
    row.alignment = { vertical: 'middle' }

    row.getCell(1).value = idx + 1
    row.getCell(2).value = sanitizeExcelCellValue((cand.lastName || '').toUpperCase())
    row.getCell(3).value = sanitizeExcelCellValue((cand.firstName || '').toUpperCase())
    row.getCell(4).value = sanitizeExcelCellValue(cand.dateOfBirth || '')
    row.getCell(5).value = sanitizeExcelCellValue(cand.idCardOrPassportNumber || '')
    row.getCell(6).value = 'Male' // standard default
    row.getCell(7).value = sanitizeExcelCellValue((cand.studyCity || 'BELGRADE').toUpperCase())
    row.getCell(8).value = 'Public'
    row.getCell(9).value = sanitizeExcelCellValue(cand.facultyName || 'University of Belgrade')
    row.getCell(10).value = 'Economics'
    row.getCell(11).value = 'budget'
    row.getCell(12).value = '3rd'
    row.getCell(13).value = ''
    row.getCell(14).value = ''
    row.getCell(15).value = 'No'
    row.getCell(16).value = 'no'
    row.getCell(17).value = 'no'
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

