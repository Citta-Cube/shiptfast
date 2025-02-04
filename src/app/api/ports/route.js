// File: app/api/ports/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/superbase/server'

// Cache the results for 1 hour (3600 seconds)
export const revalidate = 3600

export async function GET(request) {
  const supabase = createClient()
  
  // Extract query parameters
  const { searchParams } = new URL(request.url)
  const service = searchParams.get('service')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') || '100', 10)

  try {
    // Start building the query
    let query = supabase
      .from('ports')
      .select('id, port_code, name, country_code, service', { count: 'exact' })

    // Apply service filter if provided
    if (service) {
      query = query.eq('service', service)
    }

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase()
      query = query.or(
        `name.ilike.%${searchLower}%`
      )
    }

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Execute the query with pagination
    const { data, error, count } = await query
      .order('name')
      .range(from, to)

    if (error) throw error

    // Calculate total pages
    const totalPages = Math.ceil(count / pageSize)

    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        totalPages,
        totalCount: count
      }
    })
  } catch (error) {
    console.error('Error fetching ports:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching ports' },
      { status: 500 }
    )
  }
}