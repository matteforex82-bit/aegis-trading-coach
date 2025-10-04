import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

/**
 * TEMPORARY ENDPOINT - DELETE AFTER ADMIN CREATION
 * This endpoint creates the initial admin user
 * Protected by SETUP_SECRET environment variable
 */
export async function POST(request: NextRequest) {
  try {
    // Security check - require setup secret
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    // Use a secret to prevent unauthorized admin creation
    const setupSecret = process.env.SETUP_SECRET || 'temp-setup-secret-12345'

    if (secret !== setupSecret) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid setup secret' },
        { status: 401 }
      )
    }

    const adminEmail = 'matteforex82@gmail.com'
    const adminPassword = 'Admin2025!'
    const adminName = 'Matteo Negrini'

    // Check if admin already exists
    const existingUser = await db.user.findUnique({
      where: { email: adminEmail }
    })

    if (existingUser) {
      // Update existing user to admin with new password
      const hashedPassword = await bcrypt.hash(adminPassword, 12)

      await db.user.update({
        where: { id: existingUser.id },
        data: {
          role: UserRole.ADMIN,
          password: hashedPassword,
          name: adminName
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Admin user updated successfully',
        user: {
          id: existingUser.id,
          email: adminEmail,
          name: adminName,
          role: 'ADMIN'
        }
      })
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    const adminUser = await db.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        password: hashedPassword,
        role: UserRole.ADMIN,
        emailVerified: new Date() // Mark as verified
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      }
    })

  } catch (error) {
    console.error('Setup admin error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create admin user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Also allow GET for easier testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  const setupSecret = process.env.SETUP_SECRET || 'temp-setup-secret-12345'

  if (secret !== setupSecret) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // Check if admin exists
    const admin = await db.user.findUnique({
      where: { email: 'matteforex82@gmail.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true // Check if password exists
      }
    })

    if (!admin) {
      return NextResponse.json({
        exists: false,
        message: 'Admin user does not exist'
      })
    }

    return NextResponse.json({
      exists: true,
      hasPassword: !!admin.password,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Database error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
