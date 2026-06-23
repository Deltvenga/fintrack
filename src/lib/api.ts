import type { Expense, Group, GroupBalance, User } from './types'

class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new ApiError(response.status, data.error ?? 'Request failed')
  }

  return data as T
}

export const api = {
  register(username: string, password: string) {
    return request<{ user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  },

  login(username: string, password: string) {
    return request<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  },

  logout() {
    return request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' })
  },

  me() {
    return request<{ user: User }>('/api/auth/me')
  },

  getGroups() {
    return request<{ groups: Group[] }>('/api/groups')
  },

  createGroup(name: string) {
    return request<{ group: Group }>('/api/groups', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
  },

  joinGroup(inviteCode: string) {
    return request<{ group: Pick<Group, 'id' | 'name' | 'inviteCode'> }>(
      '/api/groups/join',
      {
        method: 'POST',
        body: JSON.stringify({ inviteCode }),
      },
    )
  },

  getExpenses(groupId: string) {
    return request<{ expenses: Expense[] }>(`/api/expenses?groupId=${groupId}`)
  },

  createExpense(payload: {
    groupId: string
    amount: number
    category: string
    description?: string
    date?: string
  }) {
    return request<{ expense: Expense }>('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  getBalance(groupId: string) {
    return request<{ balance: GroupBalance }>(`/api/groups/${groupId}/balance`)
  },
}

export { ApiError }
