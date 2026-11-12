import { spawn } from 'node:child_process'
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import { chmod, link, mkdtemp, open, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'

const MAGIC = Buffer.from('AABACK01')
const HEADER_SIZE = MAGIC.length + 12
const repoRoot = await realpath(fileURLToPath(new URL('../../', import.meta.url)))

export function databaseName(value, restore = false) {
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(value ?? '')) throw new Error('Invalid database name.')
  if (restore && !value.endsWith('_restore_test')) {
    throw new Error('Restore requires a NEW database ending in _restore_test.')
  }
  return value
}

async function outsideRepository(filename) {
  const resolved = path.join(await realpath(path.dirname(path.resolve(filename))), path.basename(filename))
  const relative = path.relative(repoRoot, resolved)
  if (!relative || (!relative.startsWith('..' + path.sep) && !path.isAbsolute(relative))) {
    throw new Error('Backup archives and keys must be outside the repository.')
  }
  return resolved
}

export async function generateKey(filename) {
  const destination = await outsideRepository(filename)
  await writeFile(destination, randomBytes(32).toString('base64') + '\n', { flag: 'wx', mode: 0o600 })
}

async function readKey(filename) {
  const resolved = await realpath(filename)
  await outsideRepository(resolved)
  const info = await stat(resolved)
  if (!info.isFile() || info.size > 100 || (process.platform !== 'win32' && (info.mode & 0o077))) {
    throw new Error('Key must be a private file (chmod 600 on Linux).')
  }
  const encoded = (await readFile(resolved, 'utf8')).trim()
  const key = Buffer.from(encoded, 'base64')
  if (key.length !== 32 || key.toString('base64') !== encoded) throw new Error('Invalid backup key.')
  return key
}

// No shell interpolation, connection URLs, or passwords in argv. Native tools use libpq's
// PGHOST/PGPORT/PGUSER/PGPASSFILE/PGSSLMODE settings. Docker mode uses a container-local socket.
export function pgTool(tool, args, { container, user } = {}) {
  if (container && !/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(container)) throw new Error('Invalid container.')
  const userArgs = user ? ['--username', user] : []
  const command = container ? 'docker' : tool
  const argv = container ? ['exec', '-i', container, tool, ...userArgs, ...args] : [...userArgs, ...args]
  const child = spawn(command, argv, { stdio: ['pipe', 'pipe', 'pipe'], shell: false, timeout: 10 * 60 * 1000 })
  // SQL errors can contain candidate data. Return only the tool and code to callers.
  child.stderr.resume()
  const done = new Promise((resolve, reject) => {
    child.once('error', () => reject(new Error(tool + ' could not start.')))
    child.once('close', (code) => code === 0 ? resolve() : reject(new Error(tool + ' failed (exit ' + code + ').')))
  })
  done.catch(() => {})
  return { child, done }
}

async function privateWorkspace(parent) {
  const directory = await mkdtemp(path.join(parent, '.aa-backup-'))
  await chmod(directory, 0o700)
  return directory
}

export async function createBackup({ output, keyFile, database, container, user }) {
  databaseName(database)
  const key = await readKey(keyFile)
  const destination = await outsideRepository(output)
  const directory = await privateWorkspace(path.dirname(destination))
  const temporary = path.join(directory, 'archive')
  let processHandle
  try {
    const header = Buffer.concat([MAGIC, randomBytes(12)])
    const cipher = createCipheriv('aes-256-gcm', key, header.subarray(MAGIC.length))
    cipher.setAAD(header)
    await writeFile(temporary, header, { flag: 'wx', mode: 0o600 })
    processHandle = pgTool('pg_dump', ['--no-password', '--format=custom', '--dbname', database], { container, user })
    processHandle.child.stdin.end()
    const copied = pipeline(processHandle.child.stdout, cipher, createWriteStream(temporary, { flags: 'a' }))
    await Promise.all([copied, processHandle.done])
    const handle = await open(temporary, 'a')
    try { await handle.write(cipher.getAuthTag()); await handle.sync() } finally { await handle.close() }
    // Hard link publishes the complete authenticated archive atomically and refuses overwrite.
    await link(temporary, destination)
    return { format: 'AABACK01', bytes: (await stat(destination)).size }
  } finally {
    processHandle?.child.kill()
    key.fill(0)
    await rm(directory, { recursive: true, force: true })
  }
}

export async function restoreBackup({ input, keyFile, database, container, user, scratchDirectory = tmpdir() }) {
  databaseName(database, true)
  const key = await readKey(keyFile)
  await outsideRepository(path.join(scratchDirectory, 'scratch-location'))
  const directory = await privateWorkspace(await realpath(scratchDirectory))
  const plaintext = path.join(directory, 'verified.dump')
  let processHandle
  try {
    const handle = await open(input, 'r')
    try {
      const size = (await handle.stat()).size
      if (size <= HEADER_SIZE + 16) throw new Error('Invalid backup archive.')
      const header = Buffer.alloc(HEADER_SIZE)
      const tag = Buffer.alloc(16)
      await handle.read(header, 0, header.length, 0)
      await handle.read(tag, 0, 16, size - 16)
      if (!header.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error('Unsupported backup format.')
      const decipher = createDecipheriv('aes-256-gcm', key, header.subarray(MAGIC.length))
      decipher.setAAD(header)
      decipher.setAuthTag(tag)
      // Authentication must finish before any database is created or SQL is executed.
      await pipeline(
        handle.createReadStream({ start: HEADER_SIZE, end: size - 17, autoClose: false }),
        decipher,
        createWriteStream(plaintext, { flags: 'wx', mode: 0o600 }),
      )
    } finally { await handle.close() }
    processHandle = pgTool('createdb', ['--no-password', '--maintenance-db=postgres', '--template=template0', database], { container, user })
    processHandle.child.stdin.end()
    processHandle.child.stdout.resume()
    await processHandle.done // Existing target always fails; no --clean, DROP, or overwrite.
    processHandle = pgTool('pg_restore', [
      '--no-password', '--exit-on-error', '--single-transaction', '--no-owner', '--no-privileges', '--dbname', database,
    ], { container, user })
    processHandle.child.stdout.resume()
    await Promise.all([pipeline(createReadStream(plaintext), processHandle.child.stdin), processHandle.done])
    return { restored: true }
  } finally {
    processHandle?.child.kill()
    key.fill(0)
    await rm(directory, { recursive: true, force: true })
  }
}

async function main() {
  const [command, ...args] = process.argv.slice(2)
  const options = {}
  const names = { '--output': 'output', '--input': 'input', '--key-file': 'keyFile', '--database': 'database',
    '--container': 'container', '--user': 'user', '--scratch-directory': 'scratchDirectory' }
  for (let index = 0; index < args.length; index += 2) {
    const name = names[args[index]]
    if (!name || !args[index + 1] || options[name]) throw new Error('Invalid or repeated CLI option.')
    options[name] = args[index + 1]
  }
  if (command === 'keygen' && options.keyFile) {
    await generateKey(options.keyFile)
  } else if (command === 'create' && options.output && options.keyFile && options.database) {
    console.log(JSON.stringify(await createBackup(options)))
  } else if (command === 'restore' && options.input && options.keyFile && options.database) {
    console.log(JSON.stringify(await restoreBackup(options)))
  } else {
    throw new Error('Usage: backup.mjs keygen|create|restore --key-file PATH [--input/--output PATH --database NAME --container NAME --user NAME]')
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(() => { console.error('Backup operation failed. Check arguments, key, archive, database access and free space.'); process.exitCode = 1 })
}
