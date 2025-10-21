import { createClient } from '@/lib/supabase/server';

/**
 * Get comprehensive analytics data for a freight forwarder
 * @param {string} forwarderId - The forwarder's company ID
 * @param {string} timeRange - Time range filter (7d, 30d, 90d, 1y, all)
 * @returns {Promise<Object>} - Analytics data
 */
export async function getForwarderAnalytics(forwarderId, timeRange = '30d') {
  const supabase = createClient();

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();

  switch(timeRange) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    case 'all':
      startDate.setFullYear(2000); // Far back enough to get all data
      break;
  }

  try {
    // Get all order invitations for the forwarder with first quote submission time
    const { data: orderData, error: orderError } = await supabase
      .from('order_selected_forwarders')
      .select(`
        id,
        is_submitted,
        is_rejected,
        is_selected,
        created_at,
        first_quote_submitted_at,
        orders:order_id (
          id,
          reference_number,
          shipment_type,
          load_type,
          cargo_ready_date,
          quotation_deadline,
          status,
          created_at,
          origin_port:origin_port_id (
            id,
            name,
            country_code
          ),
          destination_port:destination_port_id (
            id,
            name,
            country_code
          ),
          exporter:exporter_id (
            id,
            name
          )
        )
      `)
      .eq('freight_forwarder_id', forwarderId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (orderError) throw orderError;

    // Get all quotes for these orders - we'll process them to get latest/active quote per order
    const orderIds = orderData.map(item => item.orders.id).filter(Boolean);

    let quotesData = [];
    if (orderIds.length > 0) {
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select('*')
        .eq('freight_forwarder_id', forwarderId)
        .in('order_id', orderIds)
        .order('created_at', { ascending: false });

      if (quotesError) throw quotesError;
      quotesData = quotes || [];
    }

    // Get forwarder company details
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('average_rating, total_ratings, total_orders')
      .eq('id', forwarderId)
      .single();

    if (companyError) throw companyError;

    // Process the data for analytics
    const analytics = processAnalyticsData(orderData, quotesData, companyData, timeRange);

    return analytics;
  } catch (error) {
    console.error('Error fetching forwarder analytics:', error);
    throw error;
  }
}

/**
 * Process raw data into analytics metrics
 */
function processAnalyticsData(orderData, quotesData, companyData, timeRange) {
  // Create a map of order_id to quotes for faster lookup
  const quotesByOrder = {};
  quotesData.forEach(quote => {
    if (!quotesByOrder[quote.order_id]) {
      quotesByOrder[quote.order_id] = [];
    }
    quotesByOrder[quote.order_id].push(quote);
  });

  // Initialize metrics
  const metrics = {
    overview: {
      totalInvitations: orderData.length,
      quotesSubmitted: 0, // Unique orders with quotes submitted
      quotesWon: 0,
      quotesLost: 0,
      responseRate: 0,
      winRate: 0,
      averageRating: companyData.average_rating || 0,
      totalRatings: companyData.total_ratings || 0,
    },
    revenue: {
      totalQuoteValue: 0,
      wonQuoteValue: 0,
      lostQuoteValue: 0,
      pendingQuoteValue: 0,
      averageQuoteValue: 0,
    },
    orders: {
      byShipmentType: {
        SEA: 0,
        AIR: 0,
      },
      byLoadType: {
        FCL: 0,
        LCL: 0,
      },
      byStatus: {
        open: 0,
        quoted: 0,
        won: 0,
        lost: 0,
      },
    },
    trends: {
      quotesByPeriod: [],
      revenueByPeriod: [],
      winRateByPeriod: [],
    },
    routes: {},
    exporters: {},
    performance: {
      averageResponseTime: 0,
      responseTimes: [],
    },
  };

  // Track time periods for trends (revenue = won quotes only)
  const periodMap = new Map();

  orderData.forEach(item => {
    const order = item.orders;
    if (!order) return; // Skip if order data is missing

    // Get all quotes for this order
    const orderQuotes = quotesByOrder[order.id] || [];

    // Get the active/latest quote (the one that matters for analytics)
    // Priority: SELECTED > ACTIVE > REJECTED (latest of each type)
    const selectedQuote = orderQuotes.find(q => q.status === 'SELECTED');
    const activeQuote = orderQuotes.find(q => q.status === 'ACTIVE');
    const rejectedQuote = orderQuotes.find(q => q.status === 'REJECTED');

    // The "current" quote is the one that represents the current state
    const currentQuote = selectedQuote || activeQuote || rejectedQuote;

    // Count shipment types (for all invited orders)
    if (order.shipment_type) {
      metrics.orders.byShipmentType[order.shipment_type] =
        (metrics.orders.byShipmentType[order.shipment_type] || 0) + 1;
    }

    // Count load types (for all invited orders)
    if (order.load_type) {
      metrics.orders.byLoadType[order.load_type] =
        (metrics.orders.byLoadType[order.load_type] || 0) + 1;
    }

    // Track routes (for all invited orders)
    if (order.origin_port && order.destination_port) {
      const routeKey = `${order.origin_port.name} → ${order.destination_port.name}`;
      if (!metrics.routes[routeKey]) {
        metrics.routes[routeKey] = {
          origin: order.origin_port,
          destination: order.destination_port,
          count: 0,
          totalValue: 0,
        };
      }
      metrics.routes[routeKey].count++;
      if (currentQuote) {
        metrics.routes[routeKey].totalValue += currentQuote.net_freight_cost;
      }
    }

    // Track exporters (for all invited orders)
    if (order.exporter) {
      if (!metrics.exporters[order.exporter.id]) {
        metrics.exporters[order.exporter.id] = {
          name: order.exporter.name,
          ordersCount: 0,
          quotesWon: 0,
          totalValue: 0,
        };
      }
      metrics.exporters[order.exporter.id].ordersCount++;
    }

    // Process quotes - count unique orders with quotes, not total quotes
    if (item.is_submitted && currentQuote) {
      metrics.overview.quotesSubmitted++; // Count unique orders quoted
      metrics.revenue.totalQuoteValue += currentQuote.net_freight_cost;

      if (currentQuote.status === 'SELECTED') {
        metrics.overview.quotesWon++;
        metrics.revenue.wonQuoteValue += currentQuote.net_freight_cost;
        metrics.orders.byStatus.won++;

        if (order.exporter) {
          metrics.exporters[order.exporter.id].quotesWon++;
          metrics.exporters[order.exporter.id].totalValue += currentQuote.net_freight_cost;
        }
      } else if (currentQuote.status === 'REJECTED') {
        metrics.overview.quotesLost++;
        metrics.revenue.lostQuoteValue += currentQuote.net_freight_cost;
        metrics.orders.byStatus.lost++;
      } else if (currentQuote.status === 'ACTIVE') {
        metrics.revenue.pendingQuoteValue += currentQuote.net_freight_cost;
        metrics.orders.byStatus.quoted++;
      }

      // Calculate response time using first_quote_submitted_at if available
      if (item.first_quote_submitted_at) {
        const invitationDate = new Date(item.created_at);
        const firstQuoteDate = new Date(item.first_quote_submitted_at);
        const responseTime = (firstQuoteDate - invitationDate) / (1000 * 60 * 60); // hours
        if (responseTime >= 0) { // Only add valid response times
          metrics.performance.responseTimes.push(responseTime);
        }
      }

      // Track by period based on first quote submission time (or current quote if not available)
      const periodDate = item.first_quote_submitted_at || currentQuote.created_at;
      const period = getPeriodKey(periodDate, timeRange);
      if (!periodMap.has(period)) {
        periodMap.set(period, {
          period,
          quotes: 0,
          revenue: 0, // Only revenue from won quotes
          won: 0,
          lost: 0,
        });
      }
      const periodData = periodMap.get(period);
      periodData.quotes++;
      // Only add to revenue if the quote was selected (actual revenue)
      if (currentQuote.status === 'SELECTED') {
        periodData.revenue += currentQuote.net_freight_cost;
        periodData.won++;
      }
      if (currentQuote.status === 'REJECTED') periodData.lost++;
    } else if (!item.is_submitted && order.status === 'OPEN') {
      metrics.orders.byStatus.open++;
    }
  });

  // Calculate derived metrics
  metrics.overview.responseRate = metrics.overview.totalInvitations > 0
    ? (metrics.overview.quotesSubmitted / metrics.overview.totalInvitations * 100).toFixed(1)
    : 0;

  metrics.overview.winRate = metrics.overview.quotesSubmitted > 0
    ? (metrics.overview.quotesWon / metrics.overview.quotesSubmitted * 100).toFixed(1)
    : 0;

  metrics.revenue.averageQuoteValue = metrics.overview.quotesSubmitted > 0
    ? (metrics.revenue.totalQuoteValue / metrics.overview.quotesSubmitted).toFixed(2)
    : 0;

  metrics.performance.averageResponseTime = metrics.performance.responseTimes.length > 0
    ? (metrics.performance.responseTimes.reduce((a, b) => a + b, 0) / metrics.performance.responseTimes.length).toFixed(1)
    : 0;

  // Convert period map to array and sort
  metrics.trends.quotesByPeriod = Array.from(periodMap.values()).sort((a, b) =>
    a.period.localeCompare(b.period)
  );

  // Convert routes and exporters objects to sorted arrays
  metrics.routes = Object.values(metrics.routes)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 routes

  metrics.exporters = Object.values(metrics.exporters)
    .sort((a, b) => b.ordersCount - a.ordersCount)
    .slice(0, 10); // Top 10 exporters

  return metrics;
}

/**
 * Get period key for grouping data
 */
function getPeriodKey(dateString, timeRange) {
  const date = new Date(dateString);

  if (timeRange === '7d') {
    // Group by day
    return date.toISOString().split('T')[0];
  } else if (timeRange === '30d' || timeRange === '90d') {
    // Group by week
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    return weekStart.toISOString().split('T')[0];
  } else {
    // Group by month
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
}

/**
 * Get quote submission trends over time
 */
export async function getQuoteTrends(forwarderId, timeRange = '30d') {
  const analytics = await getForwarderAnalytics(forwarderId, timeRange);
  return analytics.trends.quotesByPeriod;
}

/**
 * Get top performing routes
 */
export async function getTopRoutes(forwarderId, limit = 10) {
  const analytics = await getForwarderAnalytics(forwarderId, 'all');
  return analytics.routes.slice(0, limit);
}
