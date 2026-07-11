import prisma from "../../config/db.config.js";
import type { EventType } from "@prisma/client";
import { getDateRange } from "../../utils/DateRange";


export interface TrackEventPayload {
  eventType: EventType;
  userId?: string;
  productId?: string;
  orderId?: string;
  sessionId?: string;
  page?: string;
  ipAddress?: string;
  device?: string;
  browser?: string;
  os?: string;
  metadata?: Record<string, any>;
}

export default class AnalyticsService {

  private static buildDateMatch(
    days: number
  ) {

    const {

      from,

      to

    } = getDateRange(days);

    return {

      createdAt: {

        $gte: {

          $date:
            from.toISOString()

        },

        $lte: {

          $date:
            to.toISOString()

        }

      }

    };

  }

  static async trackEvent(payload: TrackEventPayload) {

    try {

      return await prisma.event.create({

        data: {

          eventType: payload.eventType,

          userId: payload.userId,

          productId: payload.productId,

          orderId: payload.orderId,

          sessionId: payload.sessionId,

          page: payload.page,

          ipAddress: payload.ipAddress,

          device: payload.device,

          browser: payload.browser,

          os: payload.os,

          metadata: payload.metadata ?? {}

        }

      });

    } catch (error) {

      console.error("Analytics Error:", error);

      throw error;

    }

  }

  static async getDashboardSummary(
    days: number = 7
  ) {
    const matchStage =
      this.buildDateMatch(days);

    const rawResult = await prisma.event.aggregateRaw({

      pipeline: [

        {

          $match:

            matchStage

        },

        {

          $group: {

            _id: "$eventType",

            count: {

              $sum: 1

            }

          }

        }

      ]

    });

    const result = rawResult as unknown as Array<{
      _id: string;
      count: number;
    }>;

    let totalEvents = 0;

    let productViews = 0;
    let productClicks = 0;
    let searches = 0;
    let wishlistAdds = 0;
    let cartAdds = 0;
    let orders = 0;

    for (const item of result) {

      totalEvents += item.count;

      switch (item._id) {

        case "PRODUCT_VIEW":
          productViews = item.count;
          break;

        case "PRODUCT_CLICK":
          productClicks = item.count;
          break;

        case "SEARCH":
          searches = item.count;
          break;

        case "ADD_TO_WISHLIST":
          wishlistAdds = item.count;
          break;

        case "ADD_TO_CART":
          cartAdds = item.count;
          break;

        case "ORDER_CREATED":
          orders = item.count;
          break;

        default:
          break;

      }

    }

    const conversionRate =
      cartAdds > 0
        ? Number(((orders / cartAdds) * 100).toFixed(2))
        : 0;

    return {

      totalEvents,

      productViews,

      productClicks,

      searches,

      wishlistAdds,

      cartAdds,

      orders,

      conversionRate

    };

  }

  static async getTopProducts(
    days: number = 7
  ) {

    const matchStage =
      this.buildDateMatch(days);

    const rawResult = await prisma.event.aggregateRaw({

      pipeline: [

        {
          $match: {

            ...matchStage,

            productId: {

              $ne: null

            }

          }

        },

        {
          $group: {

            _id: {

              productId: "$productId",

              eventType: "$eventType"

            },

            count: {

              $sum: 1

            }

          }

        }

      ]

    });

    const rows = rawResult as unknown as Array<{

      _id: {

        productId: any;

        eventType: string;

      };

      count: number;

    }>;

    const analyticsMap = new Map<
      string,
      {
        productId: string;
        views: number;
        clicks: number;
        cartAdds: number;
        orders: number;
      }
    >();

    for (const row of rows) {

      const rawId = row._id.productId;

      const id =
        typeof rawId === "string"
          ? rawId
          : rawId?.$oid;

      if (!id) continue;

      if (!analyticsMap.has(id)) {

        analyticsMap.set(id, {

          productId: id,

          views: 0,

          clicks: 0,

          cartAdds: 0,

          orders: 0

        });

      }

      const item = analyticsMap.get(id)!;

      switch (row._id.eventType) {

        case "PRODUCT_VIEW":
          item.views = row.count;
          break;

        case "PRODUCT_CLICK":
          item.clicks = row.count;
          break;

        case "ADD_TO_CART":
          item.cartAdds = row.count;
          break;

        case "ORDER_CREATED":
          item.orders = row.count;
          break;

      }

    }

    const ids = [...analyticsMap.keys()];

    const products = await prisma.product.findMany({

      where: {

        id: {

          in: ids

        }

      },

      select: {

        id: true,

        name: true,

        category: true

      }

    });

    const grouped = new Map<
      string,
      {
        name: string;
        category: string;
        views: number;
        clicks: number;
        cartAdds: number;
        orders: number;
      }
    >();

    for (const product of products) {

      const analytics =
        analyticsMap.get(product.id);

      if (!analytics) continue;

      const key =
        product.name.trim();

      if (!grouped.has(key)) {

        grouped.set(key, {

          name: product.name,

          category: product.category,

          views: 0,

          clicks: 0,

          cartAdds: 0,

          orders: 0

        });

      }

      const row =
        grouped.get(key)!;

      row.views += analytics.views;

      row.clicks += analytics.clicks;

      row.cartAdds += analytics.cartAdds;

      row.orders += analytics.orders;

    }

    const result =
      [...grouped.values()];

    result.sort((a, b) => {

      if (b.views !== a.views) {

        return b.views - a.views;

      }

      if (b.clicks !== a.clicks) {

        return b.clicks - a.clicks;

      }

      if (b.cartAdds !== a.cartAdds) {

        return b.cartAdds - a.cartAdds;

      }

      return b.orders - a.orders;

    });

    return result;

  }

  static async getConversionFunnel(
    days: number = 7
  ) {

    const matchStage =
      this.buildDateMatch(days);

    const rawResult = await prisma.event.aggregateRaw({

      pipeline: [

        {
          $match: {

            ...matchStage,

            eventType: {

              $in: [

                "PRODUCT_VIEW",

                "PRODUCT_CLICK",

                "ADD_TO_CART",

                "ORDER_CREATED"

              ]

            }

          }

        },

        {

          $group: {

            _id: "$eventType",

            count: {

              $sum: 1

            }

          }

        }

      ]

    });

    const rows = rawResult as unknown as Array<{

      _id: string;

      count: number;

    }>;

    let views = 0;
    let clicks = 0;
    let cartAdds = 0;
    let orders = 0;

    for (const row of rows) {

      switch (row._id) {

        case "PRODUCT_VIEW":
          views = row.count;
          break;

        case "PRODUCT_CLICK":
          clicks = row.count;
          break;

        case "ADD_TO_CART":
          cartAdds = row.count;
          break;

        case "ORDER_CREATED":
          orders = row.count;
          break;

      }

    }

    return {

      views,

      clicks,

      cartAdds,

      orders,

      viewToClick:
        views === 0
          ? 0
          : Number(((clicks / views) * 100).toFixed(2)),

      clickToCart:
        clicks === 0
          ? 0
          : Number(((cartAdds / clicks) * 100).toFixed(2)),

      cartToOrder:
        cartAdds === 0
          ? 0
          : Number(((orders / cartAdds) * 100).toFixed(2))

    };

  }

  static async getSearchAnalytics(
    days: number = 7
  ) {

    const matchStage =
      this.buildDateMatch(days);

    const rawResult = await prisma.event.aggregateRaw({

      pipeline: [

        {
          $match: {

            ...matchStage,

            eventType: "SEARCH",

            "metadata.query": {

              $exists: true,

              $type: "string",

              $ne: ""

            }

          }

        },

        {
          $project: {

            keyword: {

              $trim: {

                input: {

                  $toLower: "$metadata.query"

                }

              }

            }

          }

        },

        {
          $match: {

            $expr: {

              $gte: [

                {

                  $strLenCP: "$keyword"

                },

                3

              ]

            }

          }

        },

        {
          $group: {

            _id: "$keyword",

            totalSearches: {

              $sum: 1

            }

          }

        },

        {

          $sort: {

            totalSearches: -1,

            _id: 1

          }

        },

        {

          $limit: 20

        }

      ]

    });

    const rows = rawResult as unknown as Array<{

      _id: string;

      totalSearches: number;

    }>;

    return rows.map((item) => ({

      keyword:

        item._id.charAt(0).toUpperCase() +

        item._id.slice(1),

      totalSearches:

        item.totalSearches

    }));

  }

  static async getDailyAnalytics(
    days: number = 7
  ) {

    const matchStage =
      this.buildDateMatch(days);

    const rawResult =
      await prisma.event.aggregateRaw({

        pipeline: [

          {
            $match:
              matchStage
          },

          {
            $group: {

              _id: {

                date: {

                  $dateToString: {

                    format: "%Y-%m-%d",

                    date: "$createdAt"

                  }

                },

                eventType: "$eventType"

              },

              count: {

                $sum: 1

              }

            }

          },

          {

            $sort: {

              "_id.date": 1

            }

          }

        ]

      });

    const rows =
      rawResult as unknown as Array<{

        _id: {

          date: string;

          eventType: string;

        };

        count: number;

      }>;

    const analyticsMap = new Map<
      string,
      {
        date: string;
        views: number;
        clicks: number;
        cartAdds: number;
        orders: number;
        searches: number;
      }
    >();

    for (const row of rows) {

      const date = row._id.date;

      if (!analyticsMap.has(date)) {

        analyticsMap.set(date, {

          date,

          views: 0,

          clicks: 0,

          cartAdds: 0,

          orders: 0,

          searches: 0

        });

      }

      const analytics =
        analyticsMap.get(date)!;

      switch (row._id.eventType) {

        case "PRODUCT_VIEW":

          analytics.views = row.count;

          break;

        case "PRODUCT_CLICK":

          analytics.clicks = row.count;

          break;

        case "ADD_TO_CART":

          analytics.cartAdds = row.count;

          break;

        case "ORDER_CREATED":

          analytics.orders = row.count;

          break;

        case "SEARCH":

          analytics.searches = row.count;

          break;

        default:

          break;

      }

    }

    return [...analyticsMap.values()];

  }

  static async getRealtimeAnalytics() {

    const thirtyMinutesAgo = new Date(

      Date.now() - (30 * 60 * 1000)

    );

    const [

      totalEvents,

      loggedInUsers,

      guestVisitors,

      lastEvent

    ] = await Promise.all([

      prisma.event.count({

        where: {

          createdAt: {

            gte: thirtyMinutesAgo

          }

        }

      }),

      prisma.event.groupBy({

        by: ["userId"],

        where: {

          createdAt: {

            gte: thirtyMinutesAgo

          },

          userId: {

            not: null

          }

        }

      }),

      prisma.event.count({

        where: {

          createdAt: {

            gte: thirtyMinutesAgo

          },

          userId: null

        }

      }),

      prisma.event.findFirst({

        orderBy: {

          createdAt: "desc"

        },

        select: {

          createdAt: true

        }

      })

    ]);

    return {

      last30Minutes: totalEvents,

      loggedInUsers: loggedInUsers.length,

      guestVisitors,

      lastActivity:

        lastEvent?.createdAt ?? null

    };

  }

  static async getOverview(days: number = 7) {

    const [
      summary,
      daily,
      topProducts,
      searches,
      funnel,
      realtime
    ] = await Promise.all([
      this.getDashboardSummary(days),
      this.getDailyAnalytics(days),
      this.getTopProducts(days),
      this.getSearchAnalytics(days),
      this.getConversionFunnel(days),
      this.getRealtimeAnalytics()
    ]);

    return {
      summary,
      daily,
      topProducts,
      searches,
      funnel,
      realtime
    };
  }

  static async getBusinessDashboard() {

    const now = new Date();

    // ---------------- TODAY ----------------

    const startOfToday = new Date(now);

    startOfToday.setHours(0, 0, 0, 0);

    // ---------------- MONTH ----------------

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    // =====================================================
    // BILL STATISTICS
    // =====================================================

    const [

      todayBills,

      monthBills,

      totalBills

    ] = await Promise.all([

      prisma.bill.findMany({

        where: {

          created_at: {

            gte: startOfToday

          }

        },

        select: {

          netAmount: true

        }

      }),

      prisma.bill.findMany({

        where: {

          created_at: {

            gte: startOfMonth

          }

        },

        select: {

          netAmount: true

        }

      }),

      prisma.bill.findMany({

        select: {

          netAmount: true

        }

      })

    ]);

    const todayRevenue =

      todayBills.reduce(

        (sum, bill) =>

          sum + bill.netAmount,

        0

      );

    const monthRevenue =

      monthBills.reduce(

        (sum, bill) =>

          sum + bill.netAmount,

        0

      );

    const totalRevenue =

      totalBills.reduce(

        (sum, bill) =>

          sum + bill.netAmount,

        0

      );

    // =====================================================
    // ORDER STATISTICS
    // =====================================================

    const [

      todayOrders,

      monthOrders,

      totalOrders,

      pendingOrders,

      acceptedOrders,

      deliveredOrders,

      cancelledOrders

    ] = await Promise.all([

      prisma.order.count({

        where: {

          createdAt: {

            gte: startOfToday

          }

        }

      }),

      prisma.order.count({

        where: {

          createdAt: {

            gte: startOfMonth

          }

        }

      }),

      prisma.order.count(),

      prisma.order.count({

        where: {

          status: "PENDING"

        }

      }),

      prisma.order.count({

        where: {

          status: "ACCEPTED"

        }

      }),

      prisma.order.count({

        where: {

          status: "DELIVERED"

        }

      }),

      prisma.order.count({

        where: {

          status: "CANCELLED"

        }

      })

    ]);

    // =====================================================
    // AVERAGE ORDER VALUE
    // =====================================================

    const averageOrderValue =

      totalBills.length > 0

        ? Number(

          (

            totalRevenue /

            totalBills.length

          ).toFixed(2)

        )

        : 0;

    // =====================================================
    // RESPONSE
    // =====================================================

    return {

      todayRevenue: Number(todayRevenue.toFixed(2)),
      monthRevenue: Number(monthRevenue.toFixed(2)),
      totalRevenue: Number(totalRevenue.toFixed(2)),
      todayBills:

        todayBills.length,

      monthBills:

        monthBills.length,

      totalBills:

        totalBills.length,

      todayOrders,

      monthOrders,

      totalOrders,

      pendingOrders,

      acceptedOrders,

      deliveredOrders,

      cancelledOrders,

      averageOrderValue: Number(averageOrderValue.toFixed(2)),

    };

  }

  static async getRevenueChart(
    days: number = 7
  ) {

    const startDate = new Date();

    startDate.setDate(
      startDate.getDate() - days + 1
    );

    startDate.setHours(
      0,
      0,
      0,
      0
    );

    const rawResult =
      await prisma.bill.aggregateRaw({

        pipeline: [

          {

            $match: {

              created_at: {

                $gte: {

                  $date:
                    startDate.toISOString()

                }

              }

            }

          },

          {

            $group: {

              _id: {

                $dateToString: {

                  format: "%Y-%m-%d",

                  date: "$created_at"

                }

              },

              revenue: {

                $sum: "$netAmount"

              },

              bills: {

                $sum: 1

              }

            }

          },

          {

            $sort: {

              _id: 1

            }

          }

        ]

      });

    const rows =
      rawResult as unknown as Array<{

        _id: string;

        revenue: number;

        bills: number;

      }>;

    const revenueMap = new Map<
      string,
      {
        revenue: number;
        bills: number;
      }
    >();

    rows.forEach((row) => {

      revenueMap.set(row._id, {

        revenue: Number(row.revenue.toFixed(2)),

        bills: row.bills

      });

    });

    const result: Array<{

      date: string;

      revenue: number;

      bills: number;

    }> = [];

    for (let i = 0; i < days; i++) {

      const currentDate = new Date(startDate);

      currentDate.setDate(
        startDate.getDate() + i
      );

      const date =
        currentDate
          .toISOString()
          .split("T")[0];

      const data =
        revenueMap.get(date);

      result.push({

        date,

        revenue:
          data?.revenue ?? 0,

        bills:
          data?.bills ?? 0

      });

    }

    return result;

  }

  static async getTopCustomers() {

    const bills = await prisma.bill.groupBy({

      by: [

        "customerName",

        "customerPhone"

      ],

      _count: {

        _all: true

      },

      _sum: {

        netAmount: true

      }

    });

    const orders = await prisma.order.groupBy({

      by: [

        "customerName",

        "customerPhone"

      ],

      _count: {

        _all: true

      }

    });

    const orderMap = new Map<
      string,
      number
    >();

    for (const order of orders) {

      orderMap.set(

        `${order.customerName}_${order.customerPhone}`,

        order._count._all

      );

    }

    const customers = bills.map((bill) => {

      const key =
        `${bill.customerName}_${bill.customerPhone}`;

      return {

        name: bill.customerName,

        phone: bill.customerPhone,

        bills: bill._count._all,

        orders:
          orderMap.get(key) ?? 0,

        revenue:
          Number(
            bill._sum.netAmount ?? 0
          )

      };

    });

    customers.sort(

      (a, b) =>

        b.revenue -

        a.revenue

    );

    return customers.slice(0, 5);

  }

  static async getCustomerInsights() {

    const bills = await prisma.bill.findMany({

      select: {

        customerPhone: true

      }

    });

    const customerMap = new Map<string, number>();

    for (const bill of bills) {

      const phone = bill.customerPhone?.trim();

      if (!phone) continue;

      customerMap.set(

        phone,

        (customerMap.get(phone) ?? 0) + 1

      );

    }

    let newCustomers = 0;

    let returningCustomers = 0;

    customerMap.forEach((count) => {

      if (count === 1) {

        newCustomers++;

      } else {

        returningCustomers++;

      }

    });

    const totalCustomers =
      newCustomers + returningCustomers;

    const repeatPurchaseRate =
      totalCustomers === 0
        ? 0
        : Number(
          (
            (returningCustomers /
              totalCustomers) *
            100
          ).toFixed(2)
        );

    return {

      newCustomers,

      returningCustomers,

      repeatPurchaseRate

    };

  }

  static async getRecentOrders() {

    const orders = await prisma.order.findMany({

      orderBy: {

        createdAt: "desc"

      },

      take: 5,

      select: {

        id: true,

        customerName: true,

        totalAmount: true,

        status: true,

        createdAt: true

      }

    });

    return orders.map((order) => ({

      id: order.id,

      customerName: order.customerName,

      totalAmount: order.totalAmount ?? 0,

      status: order.status,

      createdAt: order.createdAt

    }));

  }

}