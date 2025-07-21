'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, User, Settings, BarChart3 } from 'lucide-react'

import { NavMain } from '@/components/nav-main'
import { NavGroup } from '@/components/nav-group'
import { NavUser } from '@/components/nav-user'
import { NavUserErrorBoundary } from '@/components/nav-user-error-boundary'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const data = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: Calendar,
    },
    {
      title: 'Analytics',
      url: '/dashboard/analytics',
      icon: BarChart3,
    },
    {
      title: 'Manage Event Types',
      url: '/dashboard/manage-event-types',
      icon: Settings,
    },
  ],
  settings: [
    {
      name: 'Profile',
      url: '/dashboard/settings/profile',
      icon: User,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href="/dashboard">
                <Image
                  src="/favicon-32x32.png"
                  alt="Health Tracker"
                  width={20}
                  height={20}
                  className="!size-5"
                />
                <span className="text-base font-semibold">Health Tracker</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavGroup title="Settings" items={data.settings} />
      </SidebarContent>
      <SidebarFooter>
        <NavUserErrorBoundary>
          <NavUser />
        </NavUserErrorBoundary>
      </SidebarFooter>
    </Sidebar>
  )
}
