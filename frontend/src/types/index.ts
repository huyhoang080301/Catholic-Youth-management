// User and Auth
export interface User {
  id: number
  email: string
  fullName: string
  phone?: string
  avatarUrl?: string
  parish?: string
  diocese?: string
  isActive: boolean
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

// Organization and Units
export type UnitType = 'xu_doan' | 'phan_doan' | 'chi_doan' | 'lop' | 'doi'
export type Branch = 'chien_con' | 'au_nhi' | 'thieu_nhi' | 'nghia_si' | 'hiep_si'

export interface OrganizationUnit {
  id: number
  name: string
  type: UnitType
  branch?: Branch
  parentId?: number
  description?: string
  children?: OrganizationUnit[]
  createdAt: string
  updatedAt: string
}

export type UnitRole = 'admin' | 'chu_nhiem' | 'pho_lop' | 'huynh_truong' | 'parent'

export interface UserUnitRole {
  id: number
  userId: number
  organizationUnitId?: number
  role: UnitRole
  canAttend: boolean
}

// Members
export type Gender = 'male' | 'female'
export type MemberLevel = 'cap_1' | 'cap_2' | 'cap_3'

export interface Address {
  id: number
  street?: string
  ward?: string
  district?: string
  province?: string
  country?: string
}

export interface Parent {
  id: number
  userId: number
  fullName: string
  phone?: string
  parish?: string
  diocese?: string
  addressId?: number
  isActive: boolean
  notes?: string
}

export interface Member {
  id: number
  fullName: string
  baptismName?: string
  dateOfBirth?: string
  gender?: Gender
  phone?: string
  photoUrl?: string
  addressId?: number
  address?: Address
  parentId?: number
  parent?: Parent
  // Sacraments
  baptismDate?: string
  baptismPlace?: string
  firstConfessionDate?: string
  firstConfessionPlace?: string
  firstCommunionDate?: string
  firstCommunionPlace?: string
  confirmationDate?: string
  confirmationPlace?: string
  level?: MemberLevel
  organizationUnitId?: number
  organizationUnit?: OrganizationUnit
  isActive: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

// Sessions and Attendance
export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  EXCUSED = 'excused',
}

export interface Session {
  id: number
  date: string
  title: string
  description?: string
  organizationUnitId?: number
  organizationUnit?: OrganizationUnit
  createdById?: number
  createdAt: string
  updatedAt: string
}

export interface Attendance {
  id: number
  sessionId: number
  memberId: number
  member?: Member
  status: AttendanceStatus
  note?: string
  markedById?: number
  createdAt: string
  updatedAt: string
}

export interface AttendanceRecord {
  memberId: number
  status: AttendanceStatus
  note?: string
}

// Notifications
export type NotificationType = 'attendance_summary' | 'absent_alert' | 'general'

export interface Notification {
  id: number
  userId: number
  title: string
  body: string
  type: NotificationType
  isRead: boolean
  metadata?: Record<string, any>
  createdAt: string
}

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Paginated list
export interface PaginatedResponse<T> {
  data: T[]
  total: number
}

// Summary Stats
export interface SessionSummary {
  sessionId: number
  date: string
  unitName: string
  presentCount: number
  absentCount: number
  excusedCount: number
  totalCount: number
}
