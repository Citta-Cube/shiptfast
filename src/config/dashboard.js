import { Home, Package, Users, LineChart, CreditCard, Settings, Ship, Plane, Clock, FileText, MessageCircle, Building, Briefcase } from "lucide-react"

// Exporter menu configuration
export const exporterConfig = {
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
      href: "/exporters/forwarders",
      icon: Users,
    }
  ],
}

// Forwarder menu configuration
export const forwarderConfig = {
  mainNav: [
    {
      title: "Quote Requests",
      href: "/forwarders/orders/open",
    },
    {
      title: "Settings",
      href: "/forwarders/settings",
    },
  ],
  sidebarNav: [
    {
      title: "Dashboard",
      href: "/forwarders/dashboard",
      icon: Home,
      submenu: [
        {
          title: "Order Status",
          items: [
            {
              title: "Open Requests",
              href: "/forwarders/dashboard?status=open",
              icon: Clock,
            },
            {
              title: "Pending Quotes",
              href: "/forwarders/dashboard?status=pending",
              icon: Clock,
            },
            {
              title: "Won Orders",
              href: "/forwarders/dashboard?status=selected",
              icon: Clock,
            },
            {
              title: "Rejected Quotes",
              href: "/forwarders/dashboard?status=rejected",
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
      title: "Order Management",
      href: "/forwarders/orders",
      icon: Package,
    },
    {
      title: "Exporters",
      href: "/forwarders/exporters",
      icon: Building,
    },
  ],
}

// For backward compatibility, export the existing config
export const dashboardConfig = exporterConfig;