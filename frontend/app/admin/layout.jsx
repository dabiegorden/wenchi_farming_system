"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { ThemeProvider } from "@/components/theme-provider"
import { toast } from "sonner"
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { Home, Users, Leaf, Thermometer, Package, Map, Bell, FileText, Settings, LogOut, AirVent } from "lucide-react"

export default function AdminLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/auth/user-info", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        })

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/sign-in")
            return
          }
          throw new Error("Failed to fetch user information")
        }

        const data = await response.json()
        setUser(data.data.user)

        // If user is not admin, redirect to dashboard
        if (data.data.user.role !== "admin") {
          router.push("/dashboard")
          return
        }
      } catch (err) {
        console.error(err)
        router.push("/sign-in")
      } finally {
        setLoading(false)
      }
    }

    fetchUserInfo()
  }, [router])

  const handleSignOut = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/signout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to sign out")
      }

      router.push("/sign-in")
    } catch (err) {
      console.error("Sign out error:", err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <SidebarProvider>
        <div className="flex min-h-screen">
          <Sidebar>
            <SidebarHeader className="border-b">
              <div className="flex items-center p-2">
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold mr-2">
                  WF
                </div>
                <div>
                  <h2 className="text-lg font-bold">Wenchi Farm</h2>
                  <p className="text-xs text-muted-foreground">Admin Panel</p>
                </div>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Admin</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/admin"}>
                      <Link href="/admin/dashboard">
                        <Home className="h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/admin/users" || pathname.startsWith("/admin/users/")}
                    >
                      <Link href="/admin/users">
                        <Users className="h-4 w-4" />
                        <span>User Management</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/admin/crops" || pathname.startsWith("/admin/crops/")}
                    >
                      <Link href="/admin/crops">
                        <Leaf className="h-4 w-4" />
                        <span>Crop Management</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/admin/inventory" || pathname.startsWith("/admin/inventory/")}
                    >
                      <Link href="/admin/inventory">
                        <Package className="h-4 w-4" />
                        <span>Inventory</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/admin/land" || pathname.startsWith("/admin/land/")}
                    >
                      <Link href="/admin/land">
                        <Map className="h-4 w-4" />
                        <span>Land Management</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/admin/health" || pathname.startsWith("/admin/health/")}
                    >
                      <Link href="/admin/health">
                        <Thermometer className="h-4 w-4" />
                        <span>Health Assessment</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/admin/notifications" || pathname.startsWith("/admin/notifications/")}
                    >
                      <Link href="/admin/notifications">
                        <Bell className="h-4 w-4" />
                        <span>Notifications</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/admin/reports" || pathname.startsWith("/admin/reports/")}
                    >
                      <Link href="/admin/reports">
                        <FileText className="h-4 w-4" />
                        <span>Reports</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {/* AI */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/admin/ai" || pathname.startsWith("/admin/ai/")}
                    >
                      <Link href="/admin/ai">
                        <AirVent className="h-4 w-4" />
                        <span>AI Assistants</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/admin/settings"}>
                      <Link href="/admin/settings">
                        <Settings className="h-4 w-4" />
                        <span>System Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
              <div className="p-2 border-t">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold mr-2">
                      {user?.name?.charAt(0) || "A"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user?.name || "Admin"}</p>
                      <p className="text-xs text-muted-foreground">{user?.email || "admin@example.com"}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 p-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </SidebarFooter>
          </Sidebar>
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  )
}
