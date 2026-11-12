import ExcelJS from 'exceljs'
import {
  ALL_PRE_APPLICATION_EXPORT_COLUMNS,
  resolvePreApplicationExportColumns,
  sanitizeExcelCellValue,
  type PreAppExportColumnDef,
  type PreApplicationExportItem,
} from './exportRules.ts'

export async function generatePreApplicationsExcelBuffer(
  items: PreApplicationExportItem[],
  fieldsParam?: string,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'American Adventure Platform'
  workbook.lastModifiedBy = 'American Adventure Admin'
  workbook.created = new Date()
  workbook.modified = new Date()

  const worksheet = workbook.addWorksheet('Pre-prijave', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  const columns: PreAppExportColumnDef[] = resolvePreApplicationExportColumns(fieldsParam)

  worksheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width,
  }))

  // Stilizovanje zaglavlja (header row)
  const headerRow = worksheet.getRow(1)
  headerRow.height = 26
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
  headerRow.fill = {
    fgColor: { argb: 'FF15386B' }, // Prepoznatljiva tamnoplava American Adventure boja
    pattern: 'solid',
    type: 'pattern',
  }
  headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }

  // Popunjavanje redova podacima
  for (const item of items) {
    const rowValues: Record<string, unknown> = {}
    for (const col of columns) {
      const rawVal = item[col.key]
      const formattedVal = col.format ? col.format(rawVal, item) : rawVal
      rowValues[col.key] = sanitizeExcelCellValue(formattedVal)
    }
    const addedRow = worksheet.addRow(rowValues)
    addedRow.height = 20
    addedRow.alignment = { vertical: 'middle' }
  }

  // Tanka ivica (border) oko svake ćelije za preglednost
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.eachCell((cell) => {
        cell.border = {
          bottom: { color: { argb: 'FFE2E8F0' }, style: 'thin' },
          left: { color: { argb: 'FFE2E8F0' }, style: 'thin' },
          right: { color: { argb: 'FFE2E8F0' }, style: 'thin' },
          top: { color: { argb: 'FFE2E8F0' }, style: 'thin' },
        }
      })
    }
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

export { ALL_PRE_APPLICATION_EXPORT_COLUMNS }
