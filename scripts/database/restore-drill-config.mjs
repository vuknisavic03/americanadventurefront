export const RESTORE_DRILL_MIGRATION_TIMEOUT_MS = 3 * 60 * 1000
export const RESTORE_DRILL_E2E_TIMEOUT_MS = 25 * 60 * 1000

export function restoreDrillScriptTimeout(script) {
  if (script === 'migrate:e2e') return RESTORE_DRILL_MIGRATION_TIMEOUT_MS
  if (script === 'test:e2e') return RESTORE_DRILL_E2E_TIMEOUT_MS
  throw new Error('Unsupported restore drill script: ' + script)
}
