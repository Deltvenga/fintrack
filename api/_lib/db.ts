import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { get, put, type BlobAccessType } from '@vercel/blob'
import type { Database } from './types.js'
import { DbConflictError } from './types.js'

const DB_BLOB_PATH = 'db.json'
const LOCAL_DB_PATH = join(process.cwd(), 'data', 'db.json')

export class BlobNotConfiguredError extends Error {
  constructor() {
    super(
      'Blob storage is not configured. Link a Blob store to the Vercel project or set BLOB_READ_WRITE_TOKEN.',
    )
    this.name = 'BlobNotConfiguredError'
  }
}

function isVercelRuntime(): boolean {
  return process.env.VERCEL === '1'
}

function getBlobToken(): string | undefined {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim()
  return token || undefined
}

function getBlobStoreId(): string | undefined {
  const storeId =
    process.env.BLOB_STORE_ID?.trim() ||
    process.env.BLOB_READ_WRITE_TOKEN_STORE_ID?.trim()
  return storeId || undefined
}

function useLocalDb(): boolean {
  if (isVercelRuntime()) {
    return false
  }
  return !getBlobToken()
}

function accessModes(): BlobAccessType[] {
  if (process.env.BLOB_ACCESS === 'public') return ['public']
  if (process.env.BLOB_ACCESS === 'private') return ['private']
  return ['private', 'public']
}

function blobOptions(access: BlobAccessType) {
  const token = getBlobToken()
  const storeId = getBlobStoreId()

  return {
    access,
    useCache: false as const,
    ...(token ? { token } : {}),
    ...(storeId ? { storeId } : {}),
  }
}

function assertBlobConfigured(): void {
  if (!isVercelRuntime()) {
    return
  }

  if (getBlobToken() || getBlobStoreId()) {
    return
  }

  throw new BlobNotConfiguredError()
}

function emptyDb(): Database {
  return {
    version: 1,
    users: [],
    sessions: [],
    groups: [],
    expenses: [],
  }
}

async function streamToText(stream: ReadableStream<Uint8Array>): Promise<string> {
  return new Response(stream).text()
}

async function readFromBlob(): Promise<Database> {
  assertBlobConfigured()

  for (const access of accessModes()) {
    try {
      const result = await get(DB_BLOB_PATH, blobOptions(access))
      if (result?.statusCode === 200 && result.stream) {
        const text = await streamToText(result.stream)
        return JSON.parse(text) as Database
      }
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes('404')) {
        console.error('Blob read error:', error)
      }
    }
  }

  return emptyDb()
}

async function writeToBlob(db: Database): Promise<void> {
  assertBlobConfigured()

  let lastError: unknown
  for (const access of accessModes()) {
    try {
      await put(DB_BLOB_PATH, JSON.stringify(db), {
        ...blobOptions(access),
        allowOverwrite: true,
        contentType: 'application/json',
      })
      return
    } catch (error) {
      lastError = error
      console.error(`Blob write error (${access}):`, error)
    }
  }

  throw lastError
}

function readFromLocal(): Database {
  if (!existsSync(LOCAL_DB_PATH)) {
    const dir = dirname(LOCAL_DB_PATH)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    writeFileSync(LOCAL_DB_PATH, JSON.stringify(emptyDb(), null, 2), 'utf-8')
    return emptyDb()
  }

  const raw = readFileSync(LOCAL_DB_PATH, 'utf-8')
  return JSON.parse(raw) as Database
}

function writeToLocal(db: Database): void {
  const dir = dirname(LOCAL_DB_PATH)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  writeFileSync(LOCAL_DB_PATH, JSON.stringify(db, null, 2), 'utf-8')
}

export async function readDb(): Promise<Database> {
  if (useLocalDb()) {
    return readFromLocal()
  }
  return readFromBlob()
}

export async function writeDb(db: Database, expectedVersion: number): Promise<void> {
  if (db.version !== expectedVersion) {
    throw new DbConflictError()
  }

  db.version = expectedVersion + 1

  if (useLocalDb()) {
    writeToLocal(db)
    return
  }

  await writeToBlob(db)
}

export async function updateDb(
  mutator: (db: Database) => void | Promise<void>,
  retries = 5,
): Promise<Database> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const db = await readDb()
    const version = db.version
    await mutator(db)

    try {
      await writeDb(db, version)
      return db
    } catch (error) {
      if (error instanceof DbConflictError && attempt < retries - 1) {
        continue
      }
      throw error
    }
  }

  throw new DbConflictError()
}
