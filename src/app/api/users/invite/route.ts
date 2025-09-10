import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { withSubscriptionCheck } from '@/lib/subscription-middleware'
import { sendEmail } from '@/lib/email'

const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['ADMIN', 'USER']).default('USER')
})

export async function POST(req: NextRequest) {
  try {
    // Check subscription limits before inviting user
    const { user, error } = await withSubscriptionCheck(req, 'users', 1)
    
    if (error) {
      return error
    }

    const body = await req.json()
    const validatedData = inviteUserSchema.parse(body)

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      // Check if user is already in this organization
      if (existingUser.organizationId === user.organization!.id) {
        return NextResponse.json(
          { error: 'User is already a member of this organization' },
          { status: 409 }
        )
      }
      
      // Check if user is in another organization
      if (existingUser.organizationId) {
        return NextResponse.json(
          { error: 'User is already a member of another organization' },
          { status: 409 }
        )
      }

      // User exists but not in any organization - add them to this one
      const updatedUser = await db.user.update({
        where: { id: existingUser.id },
        data: {
          organizationId: user.organization!.id,
          role: validatedData.role
        },
        include: {
          organization: {
            select: { name: true }
          }
        }
      })

      // Send welcome email
      try {
        await sendEmail({
          to: updatedUser.email,
          subject: `Welcome to ${user.organization!.name}`,
          html: `
            <h2>Welcome to ${user.organization!.name}!</h2>
            <p>You have been added to the organization. You can now access the dashboard.</p>
            <p><a href="${process.env.NEXTAUTH_URL}/login">Login to Dashboard</a></p>
          `
        })
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError)
        // Don't fail the request if email fails
      }

      return NextResponse.json({
        success: true,
        message: 'User added to organization successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role
        }
      })
    }

    // Generate invitation token
    const invitationToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create invitation record
    const invitation = await db.invitation.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        role: validatedData.role,
        token: invitationToken,
        expiresAt,
        organizationId: user.organization!.id,
        invitedById: user.id
      },
      include: {
        organization: {
          select: { name: true }
        },
        invitedBy: {
          select: { name: true, email: true }
        }
      }
    })

    // Send invitation email
    const invitationUrl = `${process.env.NEXTAUTH_URL}/invite/${invitationToken}`
    
    try {
      await sendEmail({
        to: validatedData.email,
        subject: `Invitation to join ${user.organization!.name}`,
        html: `
          <h2>You're invited to join ${user.organization!.name}!</h2>
          <p>Hi ${validatedData.name},</p>
          <p>${invitation.invitedBy.name} (${invitation.invitedBy.email}) has invited you to join their organization on our platform.</p>
          <p><strong><a href="${invitationUrl}">Accept Invitation</a></strong></p>
          <p>This invitation will expire on ${expiresAt.toLocaleDateString()}.</p>
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        `
      })
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError)
      
      // Delete the invitation if email fails
      await db.invitation.delete({
        where: { id: invitation.id }
      })
      
      return NextResponse.json(
        { error: 'Failed to send invitation email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        name: invitation.name,
        role: invitation.role,
        expiresAt: invitation.expiresAt
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error inviting user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get pending invitations for the organization
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { organization: true }
    })

    if (!user?.organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const invitations = await db.invitation.findMany({
      where: {
        organizationId: user.organization.id,
        acceptedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        invitedBy: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ invitations })

  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}