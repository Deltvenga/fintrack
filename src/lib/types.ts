export interface User {
  id: string
  username: string
  createdAt: string
}

export interface Group {
  id: string
  name: string
  inviteCode: string
  memberCount: number
  expenseTotal: number
  createdAt: string
}

export type TransactionType = 'expense' | 'income'

export interface Expense {
  id: string
  groupId: string
  type: TransactionType
  amount: number
  category: string
  planId?: string
  planName?: string
  description: string
  paidByUserId: string
  paidByUsername: string
  date: string
  createdAt: string
}

export interface MemberBalance {
  userId: string
  username: string
  net: number
}

export interface Settlement {
  fromUserId: string
  fromUsername: string
  toUserId: string
  toUsername: string
  amount: number
}

export type PlanRecurrence = 'monthly' | 'once'

export interface PlannedExpense {
  id: string
  groupId: string
  name: string
  amount: number
  recurrence: PlanRecurrence
  description: string
  spent: number
  remaining: number
  percent: number
  createdAt: string
}

export interface FinancialSummary {
  totalIncome: number
  totalExpenses: number
  plannedRemaining: number
  currentBalance: number
}

export interface GroupBalance {
  members: MemberBalance[]
  settlements: Settlement[]
  totalExpenses: number
  totalIncome: number
}

export interface CustomCategory {
  id: string
  groupId: string
  name: string
  type: TransactionType
  icon: string
  color: string
  createdAt: string
}
