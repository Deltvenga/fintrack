import type { VercelRequest } from '@vercel/node'

export function getRouteId(req: VercelRequest, collection: string): string | undefined {
  const fromQuery = req.query.id
  if (typeof fromQuery === 'string' && fromQuery.trim()) {
    return fromQuery.trim()
  }

  const pathname = (req.url ?? '').split('?')[0]
  const prefix = `/api/${collection}/`
  if (pathname.startsWith(prefix) && pathname.length > prefix.length) {
    return pathname.slice(prefix.length)
  }

  return undefined
}
