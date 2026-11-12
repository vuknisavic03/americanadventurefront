import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { databaseName, generateKey, restoreBackup } from './backup.mjs'
import {
  RESTORE_DRILL_E2E_TIMEOUT_MS,
  RESTORE_DRILL_MIGRATION_TIMEOUT_MS,
  restoreDrillScriptTimeout,
} from './restore-drill-config.mjs'

test('restore drill keeps separate, sufficient migration and browser-test timeouts', () => {
  assert.equal(restoreDrillScriptTimeout('migrate:e2e'), RESTORE_DRILL_MIGRATION_TIMEOUT_MS)
  assert.equal(restoreDrillScriptTimeout('test:e2e'), RESTORE_DRILL_E2E_TIMEOUT_MS)
  assert.ok(RESTORE_DRILL_MIGRATION_TIMEOUT_MS >= 3 * 60 * 1000)
  assert.ok(RESTORE_DRILL_E2E_TIMEOUT_MS >= 25 * 60 * 1000)
  assert.throws(() => restoreDrillScriptTimeout('unknown'))
})

test('restore refuses normal database names and option/connection injection', () => {
  for (const name of ['american_adventure', 'postgres', '--help', 'postgresql://host/db', 'a;drop database x']) {
    assert.throws(() => databaseName(name, true))
  }
  assert.equal(databaseName('probe_restore_test', true), 'probe_restore_test')
})

test('key generation refuses overwrite and invalid archives never reach PostgreSQL', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'aa-backup-test-'))
  try {
    const keyFile = path.join(directory, 'key')
    await generateKey(keyFile)
    const original = await readFile(keyFile)
    await assert.rejects(generateKey(keyFile))
    assert.deepEqual(await readFile(keyFile), original)
    const input = path.join(directory, 'bad.aab')
    await writeFile(input, Buffer.alloc(100))
    await assert.rejects(restoreBackup({ input, keyFile, database: 'probe_restore_test', container: 'does-not-exist' }),
      /Unsupported backup format/)
  } finally { await rm(directory, { recursive: true, force: true }) }
})
