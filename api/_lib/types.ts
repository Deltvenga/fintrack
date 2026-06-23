export interface User {
  id: string
  username: string
  passwordHash: string
  createdAt: string
}

export interface Session {
  token: string
  userId: string
  expiresAt: string
}

export interface Group {
  id: string
  name: string
  inviteCode: string
  memberIds: string[]
  createdAt: string
}

export type TransactionType = 'expense' | 'income'

export interface Expense {
  id: string
  groupId: string
  type: TransactionType
  amount: number
  category: string
  description: string
  paidByUserId: string
  date: string
  createdAt: string
}

export type PlanRecurrence = 'monthly' | 'once'

export interface PlannedExpense {
  id: string
  groupId: string
  category: string
  amount: number
  recurrence: PlanRecurrence
  description: string
  createdAt: string
}

export interface Database {
  version: number
  users: User[]
  sessions: Session[]
  groups: Group[]
  expenses: Expense[]
  plans: PlannedExpense[]
}

export class DbConflictError extends Error {
  constructor() {
    super('Database conflict, please retry')
    this.name = 'DbConflictError'
  }
}
