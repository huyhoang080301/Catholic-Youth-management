// User and Auth
export interface User {
  id: number
  username: string
  email?: string
  fullName: string
  phone?: string
  avatarUrl?: string
  parish?: string
  diocese?: string
  isActive: boolean
  roles?: string[]
}

// Role constants
export const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  chu_nhiem: 'Chủ nhiệm',
  truong_ban: 'Trưởng ban',
  pho_lop: 'Phó lớp',
  huynh_truong: 'Hướng dẫn viên',
  parent: 'Phụ huynh',
}

// Role helpers
export function hasRole(user: User | null, ...roles: string[]): boolean {
  if (!user?.roles || user.roles.length === 0) return false
  return roles.some((r) => user.roles!.includes(r))
}

export function canManageMembers(user: User | null): boolean {
  return hasRole(user, 'admin', 'chu_nhiem', 'truong_ban')
}

export function canTakeAttendance(user: User | null): boolean {
  return hasRole(user, 'admin', 'chu_nhiem', 'truong_ban', 'pho_lop', 'huynh_truong')
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

// Organization and Units
export type UnitType = 'xu_doan' | 'phan_doan' | 'chi_doan' | 'lop' | 'doi'
export type Branch = 'chien_con' | 'au_nhi' | 'thieu_nhi' | 'nghia_si' | 'hiep_si'
export type TeamType = 'in_branch' | 'cross_branch'
export type SessionType = 'class' | 'general'

export interface OrganizationUnit {
  id: number
  name: string
  type: UnitType
  branch?: Branch
  parentId?: number
  description?: string
  code?: string
  children?: OrganizationUnit[]
  leaderId?: number
  leader?: { id: number; fullName: string }
  deputyId?: number
  deputy?: { id: number; fullName: string }
  teamType?: TeamType
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
export type MemberStatus = 'active' | 'inactive' | 'on_leave' | 'reserved'

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
  address?: Address
  isActive: boolean
  notes?: string
}

export interface Member {
  id: number
  memberCode?: string
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
  status?: MemberStatus
  organizationUnitId?: number
  organizationUnit?: OrganizationUnit
  branch?: Branch
  teams?: MemberTeam[]
  isActive: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface MemberTeam {
  id: number
  memberId: number
  teamId: number
  team: OrganizationUnit
  createdAt: string
}

export interface MemberStatusHistory {
  id: number
  memberId: number
  transitionType: string
  fromStatus?: string
  toStatus?: string
  fromOrganizationUnitId?: number
  toOrganizationUnitId?: number
  fromLevel?: string
  toLevel?: string
  reason?: string
  performedBy?: string
  createdAt: string
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
  sessionType?: SessionType
  organizationUnitId?: number
  organizationUnit?: OrganizationUnit
  teamIds?: number[]
  createdById?: number
  createdAt: string
  updatedAt: string
}

export interface Attendance {
  id: number
  sessionId: number
  session?: Session
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
  metadata?: Record<string, unknown>
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
