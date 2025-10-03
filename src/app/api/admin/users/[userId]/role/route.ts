import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-middleware'
import { UserRole } from '@prisma/client'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const adminCheck = await requireAdmin(req)
    if (adminCheck) {
      return adminCheck
    }

    const { role } = await req.json()
    const { userId } = await params

    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Prevent admin from demoting themselves
    const currentUser = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (currentUser?.id === userId && role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot demote yourself from admin role' },
        { status: 400 }
      )
    }

    // Update user role
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    return NextResponse.json({
      message: 'User role updated successfully',
      user: updatedUser
    })
  } catch (error) {
    console.error('Update user role API error:', error)
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    )
  }
}