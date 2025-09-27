import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Store, 
  Megaphone,
  X,
  PanelLeftOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "POS", href: "/admin/pos", icon: Store },
  { name: "Campaigns", href: "/admin/campaigns", icon: Megaphone },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[16em-1fr] dark">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="lg:hidden rounded-full bg-muted px-2 pt-2 pb-[1px] absolute top-2 left-2">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-sidebar-foreground hover:text-sidebar-primary"
        >
          <PanelLeftOpen className="h-6 w-6" />
        </button>
      </div>
      {/* Sidebar */}
      <div className={cn(
        "h-[100vh] fixed z-50 w-64 bg-sidebar transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Sidebar header */}
          <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-sidebar-border">
            <h1 className="text-xl font-bold text-sidebar-foreground">
              Admin Panel
            </h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-sidebar-foreground hover:text-sidebar-primary"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "sidebar-nav-item",
                    isActive && "active"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="text-sm text-sidebar-foreground/60">
              E-commerce Admin v1.0
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="h-[100vh] lg:w-[calc(100vw-16em)] w-[100vw] col-start-2 col-end-3 overflow-y-auto bg-background">
        {/* Page content */}
        <main className="w-full py-8">
          <div className="pt-4 lg:pt-0 w-full px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}