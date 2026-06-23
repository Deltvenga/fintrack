import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { get, put, type BlobAccessType } from '@vercel/blob'
import type { Database } from './types.js'
import { DbConflictError } from './types.js'

const DB_BLOB_PATH = 'db.json'
const LOCAL_DB_PATH = join(process.cwd(), 'data', 'db.json')

function emptyDb(): Database {
  return {
    version: 1,
    users: [],
    sessions: [],
    groups: [],
    expenses: [],
  }
}

function useBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

async function streamToText(stream: ReadableStream<Uint8Array>): Promise<string> {
  return new Response(stream).text()
}

async function readFromBlob(): Promise<Database> {
  const modes: BlobAccessType[] =
    process.env.BLOB_ACCESS === 'public'
      ? ['public']
      : process.env.BLOB_ACCESS === 'private'
        ? ['private']
        : ['private', 'public']

  for (const access of modes) {
    try {
      const result = await get(DB_BLOB_PATH, { access, useCache: false })
      if (result?.statusCode === 200 && result.stream) {
        const text = await streamToText(result.stream)
        return JSON.parse(text) as Database
      }
    } catch {
      // try next access mode
    }
  }

  return emptyDb()
}

async function writeToBlob(db: Database): Promise<void> {
  const modes: BlobAccessType[] =
    process.env.BLOB_ACCESS === 'public'
      ? ['public']
      : process.env.BLOB_ACCESS === 'private'
        ? ['private']
        : ['private', 'public']

  let lastError: unknown
  for (const access of modes) {
    try {
      await put(DB_BLOB_PATH, JSON.stringify(db), {
        access,
        allowOverwrite: true,
        contentType: 'application/json',
      })
      return
    } catch (error) {
      lastError = error
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
  if (useBlob()) {
    return readFromBlob()
  }
  return readFromLocal()
}

export async function writeDb(db: Database, expectedVersion: number): Promise<void> {
  if (db.version !== expectedVersion) {
    throw new DbConflictError()
  }

  db.version = expectedVersion + 1

  if (useBlob()) {
    await writeToBlob(db)
  } else {
    writeToLocal(db)
  }
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
