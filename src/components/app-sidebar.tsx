'use client'

import {
  Activity,
  Brain,
  Calendar,
  ChevronRight,
  Settings,
  Shield,
  User,
  UserCog,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'

import { NavGroup } from '@/components/nav-group'
import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import { NavUserErrorBoundary } from '@/components/nav-user-error-boundary'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { apiFetch } from '@/lib/http-utils'

const data = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: Calendar,
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
    {
      name: 'Account',
      url: '/dashboard/settings/account',
      icon: UserCog,
    },
    {
      name: 'Security',
      url: '/dashboard/settings/security',
      icon: Shield,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [sex, setSex] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      const { data } = await apiFetch<{ sex: string }>('/api/user/profile')
      if (data) {
        setSex(data.sex)
      }
    }
    loadProfile()
  }, [])

  const analyticsItems = useMemo(
    () => [
      { name: 'Migraine Breakdown', url: '/dashboard/analytics/migraines', icon: Brain },
      ...(sex !== 'Male'
        ? [{ name: 'Cycle Tracking', url: '/dashboard/analytics/cycle-tracking', icon: Activity }]
        : []),
    ],
    [sex]
  )

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
        <NavGroup title="Analytics" items={analyticsItems} />

        {/* Collapsible Settings Section */}
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel
              asChild
              className="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"
            >
              <CollapsibleTrigger>
                Settings{' '}
                <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {data.settings.map((item) => {
                    const Icon = item.icon
                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton asChild>
                          <Link href={item.url}>
                            <Icon className="!size-4" />
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>
      <SidebarFooter>
        <NavUserErrorBoundary>
          <NavUser />
        </NavUserErrorBoundary>
      </SidebarFooter>
    </Sidebar>
  )
}
