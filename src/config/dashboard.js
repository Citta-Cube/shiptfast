import { Home, Package, Users, LineChart, CreditCard, Settings, Ship, Plane, Clock } from "lucide-react"

export const dashboardConfig = {
  mainNav: [
    {
      title: "Create Order",
      href: "/orders/new",
    },
    {
      title: "Support",
      href: "/support",
      disabled: true,
    },
  ],
  sidebarNav: [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
      submenu: [
        {
          title: "Shipment Type",
          items: [
            {
              title: "Sea Freight",
              href: "/dashboard?shipmentType=sea",
              icon: Ship,
            },
            {
              title: "Air Freight",
              href: "/dashboard?shipmentType=air",
              icon: Plane,
            },
          ]
        },
        {
          title: "Status",
          items: [
            {
              title: "Open Orders",
              href: "/dashboard?status=open",
              icon: Clock,
            },
            {
              title: "Pending Orders",
              href: "/dashboard?status=pending",
              icon: Clock,
            },
            {
              title: "Closed Orders",
              href: "/dashboard?status=closed",
              icon: Clock,
            },
          ]
        }
      ]
    },
    {
      title: "Freight Forwarders",
      href: "/forwarders",
      icon: Users,
    }
    // {
    //   title: "Analytics",
    //   href: "/dashboard/analytics",
    //   icon: LineChart,
    // }
  ],
}