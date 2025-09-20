import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { requireAdmin } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
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

    // Get basic counts
    const [totalUsers, totalOrganizations, totalTradingAccounts] = await Promise.all([
      db.user.count(),
      db.organization.count(),
      db.tradingAccount.count()
    ])

    // Get subscription stats
    const subscriptionStats = await db.organization.groupBy({
      by: ['subscriptionStatus'],
      _count: {
        subscriptionStatus: true
      }
    })

    // Get recent users (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentUsers = await db.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    })

    // Get recent organizations (last 30 days)
    const recentOrganizations = await db.organization.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    })

    // Get user growth data (last 12 months)
    const userGrowthData = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      const count = await db.user.count({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      })
      
      userGrowthData.push({
        month: startOfMonth.toISOString().slice(0, 7), // YYYY-MM format
        users: count
      })
    }

    // Get revenue data from Stripe (if available)
    let revenueStats = null
    try {
      // Get recent charges from Stripe
      const charges = await stripe.charges.list({
        limit: 100,
        created: {
          gte: Math.floor(thirtyDaysAgo.getTime() / 1000)
        }
      })
      
      const totalRevenue = charges.data
        .filter(charge => charge.status === 'succeeded')
        .reduce((sum, charge) => sum + charge.amount, 0)
      
      revenueStats = {
        totalRevenue: totalRevenue / 100, // Convert from cents to euros
        totalTransactions: charges.data.filter(charge => charge.status === 'succeeded').length
      }
    } catch (error) {
      console.warn('Could not fetch Stripe revenue data:', error)
    }

    // Get top organizations by trading accounts
    const topOrganizations = await db.organization.findMany({
      include: {
        _count: {
          select: {
            tradingAccounts: true,
            users: true
          }
        }
      },
      orderBy: {
        tradingAccounts: {
          _count: 'desc'
        }
      },
      take: 5
    })

    return NextResponse.json({
      overview: {
        totalUsers,
        totalOrganizations,
        totalTradingAccounts,
        recentUsers,
        recentOrganizations
      },
      subscriptions: subscriptionStats.reduce((acc, stat) => {
        acc[stat.subscriptionStatus || 'none'] = stat._count.subscriptionStatus
        return acc
      }, {} as Record<string, number>),
      userGrowth: userGrowthData,
      revenue: revenueStats,
      topOrganizations: topOrganizations.map(org => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        subscriptionStatus: org.subscriptionStatus,
        tradingAccountsCount: org._count.tradingAccounts,
        usersCount: org._count.users,
        createdAt: org.createdAt
      }))
    })
  } catch (error) {
    console.error('Admin stats API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}