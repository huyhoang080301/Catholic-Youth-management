import { describe, it, expect, jest } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemberCard } from './member-card'
import { Member } from '@/types'

const mockMember: Member = {
  id: 1,
  memberCode: 'TNTT00001',
  fullName: 'Nguyen Van A',
  baptismName: 'Maria',
  dateOfBirth: '2010-05-15',
  gender: 'male',
  phone: '0901234567',
  status: 'active',
  isActive: true,
  organizationUnitId: 1,
  organizationUnit: {
    id: 1,
    name: 'Lớp 1A',
    type: 'lop',
  },
  teams: [
    {
      id: 1,
      memberId: 1,
      teamId: 5,
      team: {
        id: 5,
        name: 'Đội Thiện Nguyện',
        type: 'doi',
        branch: 'thieu_nhi',
      },
      createdAt: '2026-01-01',
    },
  ],
}

describe('MemberCard', () => {
  it('should render member fullName', () => {
    render(<MemberCard member={mockMember} />)
    expect(screen.getByText('Nguyen Van A')).toBeTruthy()
  })

  it('should render baptismName when present', () => {
    render(<MemberCard member={mockMember} />)
    expect(screen.getByText(/Thánh danh: Maria/)).toBeTruthy()
  })

  it('should render organization unit name', () => {
    render(<MemberCard member={mockMember} />)
    expect(screen.getByText('Lớp 1A')).toBeTruthy()
  })

  it('should render phone when present', () => {
    render(<MemberCard member={mockMember} />)
    expect(screen.getByText('0901234567')).toBeTruthy()
  })

  it('should render active badge for active member', () => {
    render(<MemberCard member={mockMember} />)
    expect(screen.getByText('Hoạt động')).toBeTruthy()
  })

  it('should render inactive badge for inactive member', () => {
    render(<MemberCard member={{ ...mockMember, isActive: false }} />)
    expect(screen.getByText('Không hoạt động')).toBeTruthy()
  })

  it('should render team name when member has teams', () => {
    render(<MemberCard member={mockMember} />)
    expect(screen.getByText('Đội Thiện Nguyện')).toBeTruthy()
  })

  it('should call onEdit when edit button is clicked', () => {
    const onEdit = jest.fn()
    render(<MemberCard member={mockMember} onEdit={onEdit} />)

    const editBtn = screen.getByTitle('Sửa')
    fireEvent.click(editBtn)

    expect(onEdit).toHaveBeenCalledWith(mockMember)
  })

  it('should call onDelete when delete button is clicked', () => {
    const onDelete = jest.fn()
    render(<MemberCard member={mockMember} onDelete={onDelete} />)

    const deleteBtn = screen.getByTitle('Xóa')
    fireEvent.click(deleteBtn)

    expect(onDelete).toHaveBeenCalledWith(mockMember)
  })

  it('should not render edit button when onEdit is not provided', () => {
    render(<MemberCard member={mockMember} />)
    expect(screen.queryByTitle('Sửa')).toBeNull()
  })

  it('should not render delete button when onDelete is not provided', () => {
    render(<MemberCard member={mockMember} />)
    expect(screen.queryByTitle('Xóa')).toBeNull()
  })

  it('should link to member detail page', () => {
    render(<MemberCard member={mockMember} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/dashboard/thanh-vien/1')
  })

  it('should not render phone when not present', () => {
    const memberNoPhone = { ...mockMember, phone: undefined }
    render(<MemberCard member={memberNoPhone} />)
    expect(screen.queryByText('0901234567')).toBeNull()
  })

  it('should not render team section when no teams', () => {
    const memberNoTeams = { ...mockMember, teams: undefined }
    render(<MemberCard member={memberNoTeams} />)
    expect(screen.queryByText('Đội Thiện Nguyện')).toBeNull()
  })
})
