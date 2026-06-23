import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomUUID } from 'node:crypto'
import { pickCustomColor, pickCustomIcon } from '../_lib/categories.js'
import { normalizeEmojiIcon } from '../_lib/emoji.js'
import {
  error,
  isGroupMember,
  json,
  parseBody,
  requireAuth,
} from '../_lib/auth.js'
import { readDb, updateDb } from '../_lib/db.js'
import { getRouteId } from '../_lib/request.js'
import type { CustomCategory, TransactionType } from '../_lib/types.js'

interface CreateCategoryBody {
  groupId?: string
  name?: string
  type?: TransactionType
  icon?: string
}

function mapCategory(category: CustomCategory) {
  return {
    id: category.id,
    groupId: category.groupId,
    name: category.name,
    type: category.type,
    icon: category.icon,
    color: category.color,
    createdAt: category.createdAt,
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireAuth(req, res)
  if (!user) {
    return
  }

  if (req.method === 'GET') {
    const groupId = req.query.groupId as string | undefined
    if (!groupId) {
      return error(res, 400, 'groupId is required')
    }

    const db = await readDb()
    if (!isGroupMember(db, groupId, user.id)) {
      return error(res, 403, 'Forbidden')
    }

    const categories = (db.categories ?? [])
      .filter((c) => c.groupId === groupId)
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
      .map(mapCategory)

    return json(res, 200, { categories })
  }

  if (req.method === 'POST') {
    const { groupId, name, type, icon } = parseBody<CreateCategoryBody>(req)

    if (!groupId) {
      return error(res, 400, 'groupId is required')
    }

    const categoryType: TransactionType = type === 'income' ? 'income' : 'expense'
    const trimmedName = name?.trim()

    if (!trimmedName) {
      return error(res, 400, 'Name is required')
    }

    const db = await readDb()
    if (!isGroupMember(db, groupId, user.id)) {
      return error(res, 403, 'Forbidden')
    }

    const existing = (db.categories ?? []).some(
      (c) =>
        c.groupId === groupId &&
        c.type === categoryType &&
        c.name.toLowerCase() === trimmedName.toLowerCase(),
    )
    if (existing) {
      return error(res, 400, 'Category already exists')
    }

    const groupCategories = (db.categories ?? []).filter((c) => c.groupId === groupId)
    const categoryId = randomUUID()
    const createdAt = new Date().toISOString()
    const iconValue = icon?.trim()
      ? normalizeEmojiIcon(icon)
      : pickCustomIcon(groupCategories.length)
    const color = pickCustomColor(groupCategories.length)

    await updateDb((freshDb) => {
      if (!freshDb.categories) {
        freshDb.categories = []
      }

      freshDb.categories.push({
        id: categoryId,
        groupId,
        name: trimmedName,
        type: categoryType,
        icon: iconValue,
        color,
        createdAt,
      })
    })

    const freshDb = await readDb()
    const category = freshDb.categories?.find((c) => c.id === categoryId)
    return json(res, 201, { category: category ? mapCategory(category) : null })
  }

  if (req.method === 'DELETE') {
    const categoryId = getRouteId(req, 'categories')
    if (!categoryId) {
      return error(res, 400, 'Category id is required')
    }

    const db = await readDb()
    const category = (db.categories ?? []).find((c) => c.id === categoryId)
    if (!category) {
      return error(res, 404, 'Category not found')
    }

    if (!isGroupMember(db, category.groupId, user.id)) {
      return error(res, 403, 'Forbidden')
    }

    await updateDb((freshDb) => {
      if (!freshDb.categories) {
        return
      }

      const index = freshDb.categories.findIndex((c) => c.id === categoryId)
      if (index !== -1) {
        freshDb.categories.splice(index, 1)
      }
    })

    return json(res, 200, { ok: true })
  }

  return error(res, 405, 'Method not allowed')
}
