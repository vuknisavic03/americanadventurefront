import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { createBackup, generateKey, pgTool, restoreBackup } from './backup.mjs'
import { restoreDrillScriptTimeout } from './restore-drill-config.mjs'
import { encryptSensitiveBytes, decryptSensitiveBytes } from '../../apps/platform/src/modules/candidate-documents/sensitiveDataCrypto.ts'

const execute = promisify(execFile)
const root = fileURLToPath(new URL('../../', import.meta.url))
const platform = path.join(root, 'apps/platform')
const suffix = randomUUID().slice(0, 8)
const source = 'aa-backup-source-' + suffix
const target = 'aa-backup-target-' + suffix
const sourceDB = 'american_adventure_backup_test'
const targetDB = 'american_adventure_restore_test'
const user = 'american_adventure'
const directory = await mkdtemp(path.join(tmpdir(), 'aa-restore-drill-'))
const created = []
const started = Date.now()

async function docker(args) {
  try { return (await execute('docker', args, { maxBuffer: 2 * 1024 * 1024, timeout: 120_000 })).stdout.trim() }
  catch { throw new Error('Restore drill Docker operation failed.') }
}

async function sql(container, database, statement) {
  const { child, done } = pgTool('psql', ['--no-password', '--no-psqlrc', '--set=ON_ERROR_STOP=1',
    '--tuples-only', '--no-align', '--dbname', database], { container, user })
  const chunks = []
  child.stdout.on('data', chunk => chunks.push(chunk))
  child.stdin.end(statement)
  await done
  return Buffer.concat(chunks).toString('utf8').trim()
}

async function startDatabase(name, published) {
  await docker(['run', '--detach', '--rm', '--name', name,
    '--label', 'american-adventure.purpose=restore-drill',
    '--tmpfs', '/var/lib/postgresql/data',
    '--env', 'POSTGRES_USER=' + user, '--env', 'POSTGRES_DB=' + sourceDB,
    '--env', 'POSTGRES_HOST_AUTH_METHOD=trust',
    ...(published ? ['--publish', '127.0.0.1::5432'] : ['--network', 'none']), 'postgres:17-alpine'])
  created.push(name)
  for (let attempt = 0; attempt < 60; attempt++) {
    try { await docker(['exec', name, 'pg_isready', '-h', '127.0.0.1', '-U', user, '-d', sourceDB]); return }
    catch { await new Promise(resolve => setTimeout(resolve, 500)) }
  }
  throw new Error('Test PostgreSQL did not become ready.')
}

function identifier(name) { return '"' + name.replaceAll('"', '""') + '"' }

async function inventory(container, database) {
  const tables = JSON.parse(await sql(container, database,
    "SELECT json_agg(tablename ORDER BY tablename) FROM pg_tables WHERE schemaname='public';"))
  const state = {}
  for (const table of tables) {
    state[table] = await sql(container, database,
      'SELECT count(*) || \':\' || md5(coalesce(string_agg(md5(row_to_json(t)::text), \'\' ORDER BY md5(row_to_json(t)::text)), \'\')) FROM public.' + identifier(table) + ' t;')
  }
  const sequences = JSON.parse(await sql(container, database,
    "SELECT coalesce(json_agg(sequencename ORDER BY sequencename),'[]') FROM pg_sequences WHERE schemaname='public';"))
  for (const sequence of sequences) {
    state['sequence:' + sequence] = await sql(container, database,
      'SELECT last_value || \':\' || is_called FROM public.' + identifier(sequence) + ';')
  }
  state.columns = await sql(container, database,
    "SELECT json_agg(row_to_json(c) ORDER BY table_name, ordinal_position) FROM (SELECT table_name,column_name,ordinal_position,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public') c;")
  state.constraints = await sql(container, database,
    "SELECT json_agg(row_to_json(c) ORDER BY relname,conname) FROM (SELECT relname,conname,pg_get_constraintdef(pg_constraint.oid) AS definition FROM pg_constraint JOIN pg_class ON conrelid=pg_class.oid JOIN pg_namespace n ON relnamespace=n.oid WHERE n.nspname='public') c;")
  return state
}

try {
  await startDatabase(source, true)
  await startDatabase(target, false)
  const port = (await docker(['port', source, '5432/tcp'])).split(':').at(-1)
  const environment = { ...process.env,
    DATABASE_URL: 'postgresql://' + user + '@127.0.0.1:' + port + '/' + sourceDB,
    PAYLOAD_SECRET: 'synthetic-restore-drill-secret-not-for-production',
    CANDIDATE_EMAIL_PROVIDER: 'capture', TRUSTED_PROXY_HOPS: '1',
    NEXT_PUBLIC_SERVER_URL: 'http://127.0.0.1:3100', E2E_BASE_URL: 'http://127.0.0.1:3100', CI: 'true',
  }
  // The existing browser workflow supplies linked synthetic candidates, consent and audit records.
  for (const script of ['migrate:e2e', 'test:e2e']) {
    console.log('Restore drill: ' + script)
    try { await execute('npm', ['run', script], { cwd: platform, env: environment, maxBuffer: 8 * 1024 * 1024, timeout: restoreDrillScriptTimeout(script) }) }
    catch { throw new Error(script + ' failed; use the Playwright report for synthetic test diagnostics.') }
  }
  const keyring = { activeKeyId: 'restore-fixture', keys: new Map([['restore-fixture', randomBytes(32)]]),
    fingerprintKey: randomBytes(32) }
  const context = 'backup-restore-synthetic-probe'
  const document = Buffer.from('%PDF-1.4\nSYNTHETIC RESTORE PROBE - NOT A PASSPORT\n%%EOF\n')
  const envelope = encryptSensitiveBytes(document, keyring, context)
  await sql(source, sourceDB,
    'CREATE TABLE restore_drill_probe (id serial PRIMARY KEY, pre_application_id integer NOT NULL REFERENCES pre_applications(id), envelope jsonb NOT NULL);' +
    "INSERT INTO restore_drill_probe(pre_application_id,envelope) SELECT id, '" + JSON.stringify(envelope) +
    "'::jsonb FROM pre_applications ORDER BY id LIMIT 1;")
  const before = await inventory(source, sourceDB)
  const keyFile = path.join(directory, 'backup.key')
  const wrongKey = path.join(directory, 'wrong.key')
  const output = path.join(directory, 'snapshot.aab')
  await generateKey(keyFile)
  await generateKey(wrongKey)
  const failedOutput = path.join(directory, 'failed.aab')
  await assert.rejects(createBackup({ output: failedOutput, keyFile, database: 'missing_backup_test', container: source, user }))
  await assert.rejects(access(failedOutput))
  const backupStarted = Date.now()
  const backup = await createBackup({ output, keyFile, database: sourceDB, container: source, user })
  const backupMs = Date.now() - backupStarted
  await assert.rejects(createBackup({ output, keyFile, database: sourceDB, container: source, user }))
  const restoreOptions = { input: output, keyFile, database: targetDB, container: target, user }
  await assert.rejects(restoreBackup({ ...restoreOptions, keyFile: wrongKey }))
  const damaged = Buffer.from(await readFile(output))
  damaged[Math.floor(damaged.length / 2)] ^= 1
  const damagedFile = path.join(directory, 'damaged.aab')
  await writeFile(damagedFile, damaged, { mode: 0o600 })
  await assert.rejects(restoreBackup({ ...restoreOptions, input: damagedFile }))
  assert.equal(await sql(target, 'postgres', "SELECT count(*) FROM pg_database WHERE datname='" + targetDB + "';"), '0')

  const restoreStarted = Date.now()
  await restoreBackup(restoreOptions)
  const restoreMs = Date.now() - restoreStarted
  const after = await inventory(target, targetDB)
  assert.deepEqual(after, before)
  const restoredEnvelope = JSON.parse(await sql(target, targetDB, 'SELECT envelope FROM restore_drill_probe;'))
  assert.deepEqual(decryptSensitiveBytes(restoredEnvelope, keyring, context), document)
  assert.throws(() => decryptSensitiveBytes(restoredEnvelope, { ...keyring, keys: new Map() }, context))
  await assert.rejects(restoreBackup(restoreOptions))
  assert.deepEqual(await inventory(target, targetDB), before)
  const archive = await readFile(output)
  const report = {
    date: new Date().toISOString(), commit: (await execute('git', ['rev-parse', 'HEAD'], { cwd: root })).stdout.trim(),
    workingTreeChanges: Boolean((await execute('git', ['status', '--porcelain'], { cwd: root })).stdout.trim()),
    postgres: await docker(['exec', source, 'pg_dump', '--version']),
    tablesVerified: Object.keys(before).filter(k => !k.startsWith('sequence:') && !['columns', 'constraints'].includes(k)).length,
    archiveBytes: backup.bytes, archiveSha256: createHash('sha256').update(archive).digest('hex'),
    backupMs, restoreMs, totalMs: Date.now() - started,
    checks: ['failed pg_dump leaves no published archive', 'all table row counts and digests', 'sequence state', 'column definitions', 'constraints',
      'application ciphertext decryption', 'missing application key rejection', 'wrong backup key rejection',
      'tampered archive rejection before target creation', 'existing archive and database refusal'],
    limitations: 'Synthetic small dataset; timings are not production RPO/RTO. No application server or email worker started against restored DB.',
  }
  console.log(JSON.stringify(report, null, 2))
} finally {
  for (const name of created.reverse()) await docker(['rm', '--force', name])
  await rm(directory, { recursive: true, force: true })
}
