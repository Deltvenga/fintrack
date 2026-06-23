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

export interface Expense {
  id: string
  groupId: string
  amount: number
  category: string
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

export interface GroupBalance {
  members: MemberBalance[]
  settlements: Settlement[]
  totalExpenses: number
}
