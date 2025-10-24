import { Home, Package, Users, LineChart, CreditCard, Settings, Ship, Plane, Clock, FileText, MessageCircle, Building, Briefcase, User } from "lucide-react"

// Exporter menu configuration
export const exporterConfig = {
  mainNav: [
    {
      title: "Create Order",
      href: "/orders/new",
    },
  ],
  sidebarNav: [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
      alwaysOpen: true,
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
      href: "/exporters/forwarders",
      icon: Users,
    },
    {
      title: "Settings & Configuration",
      href: "/profile",
      icon: Settings,
    }
  ],
}

// Forwarder menu configuration
export const forwarderConfig = {
  mainNav: [
    
  ],
  sidebarNav: [
    {
      title: "Dashboard",
      href: "/forwarders/dashboard",
      icon: Home,
      alwaysOpen: true,
      submenu: [
        {
          title: "Order Status",
          items: [
            {
              title: "Open Requests",
              href: "/forwarders/dashboard?tab=open",
              icon: Clock,
            },
            {
              title: "Pending Quotes",
              href: "/forwarders/dashboard?tab=pending",
              icon: Clock,
            },
            {
              title: "Won Orders",
              href: "/forwarders/dashboard?tab=selected",
              icon: Clock,
            },
            {
              title: "Rejected Quotes",
              href: "/forwarders/dashboard?tab=rejected",
              icon: Clock,
            },
          ]
        },
        {
          title: "Shipment Type",
          items: [
            {
              title: "Sea Freight",
              href: "/forwarders/dashboard?shipmentType=sea",
              icon: Ship,
            },
            {
              title: "Air Freight",
              href: "/forwarders/dashboard?shipmentType=air",
              icon: Plane,
            },
          ]
        }
      ]
    },
    {
      title: "Analytics",
      href: "/forwarders/analytics",
      icon: LineChart,
    },
    // {
    //   title: "Order Management",
    //   href: "/forwarders/orders",
    //   icon: Package,
    // },
    {
      title: "Exporters",
      href: "/forwarders/exporters",
      icon: Building,
    },
    {
      title: "Settings & Configuration",
      href: "/profile",
      icon: Settings,
    }
  ],
}

// For backward compatibility, export the existing config
export const dashboardConfig = exporterConfig;