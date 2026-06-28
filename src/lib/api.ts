import type {
  CustomCategory,
  Expense,
  FinancialSummary,
  Group,
  GroupBalance,
  PlannedExpense,
  PlanRecurrence,
  TransactionType,
  User,
} from './types'

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
    type?: TransactionType
    amount: number
    category?: string
    planId?: string
    description?: string
    date?: string
  }) {
    return request<{ expense: Expense }>('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  updateExpense(
    expenseId: string,
    payload: {
      amount?: number
      category?: string
      description?: string
      date?: string
    },
  ) {
    return request<{ expense: Expense }>(
      `/api/expenses?id=${encodeURIComponent(expenseId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
    )
  },

  deleteExpense(expenseId: string) {
    return request<{ ok: boolean }>(
      `/api/expenses?id=${encodeURIComponent(expenseId)}`,
      { method: 'DELETE' },
    )
  },

  getBalance(groupId: string) {
    return request<{ balance: GroupBalance }>(`/api/groups/${groupId}/balance`)
  },

  getPlans(groupId: string) {
    return request<{ plans: PlannedExpense[]; summary: FinancialSummary }>(
      `/api/plans?groupId=${groupId}`,
    )
  },

  createPlan(payload: {
    groupId: string
    name: string
    amount: number
    recurrence: PlanRecurrence
    targetMonth?: string
    description?: string
    icon?: string
  }) {
    return request<{ plan: PlannedExpense; summary: FinancialSummary }>('/api/plans', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  updatePlan(
    planId: string,
    payload: {
      amount?: number
      recurrence?: PlanRecurrence
      targetMonth?: string
      description?: string
      icon?: string
    },
  ) {
    return request<{ plan: PlannedExpense; summary: FinancialSummary }>(
      `/api/plans?id=${encodeURIComponent(planId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
    )
  },

  deletePlan(planId: string) {
    return request<{ plans: PlannedExpense[]; summary: FinancialSummary }>(
      `/api/plans?id=${encodeURIComponent(planId)}`,
      { method: 'DELETE' },
    )
  },

  getCategories(groupId: string) {
    return request<{ categories: CustomCategory[] }>(
      `/api/categories?groupId=${groupId}`,
    )
  },

  createCategory(payload: {
    groupId: string
    name: string
    type: TransactionType
    icon?: string
  }) {
    return request<{ category: CustomCategory }>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  deleteCategory(categoryId: string) {
    return request<{ ok: boolean }>(
      `/api/categories?id=${encodeURIComponent(categoryId)}`,
      { method: 'DELETE' },
    )
  },
}

export { ApiError }
