export function getPageTitle(pathname: string): string {
  const routeTitles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/dashboard/analytics': 'Analytics',
    '/dashboard/add-event': 'Add Event',
    '/dashboard/edit-period-day': 'Edit Period Day',
    '/dashboard/edit-birth-control-day': 'Edit Birth Control Day',
    '/dashboard/edit-irregular-physical-day': 'Edit Irregular Physical Day',
    '/dashboard/edit-normal-physical-day': 'Edit Normal Physical Day',
    '/dashboard/edit-migraine': 'Edit Migraine',
    '/dashboard/manage-event-types': 'Manage Event Types',
    '/dashboard/settings': 'Settings',
    '/dashboard/settings/profile': 'Profile Settings',
  }

  return routeTitles[pathname] || 'Dashboard'
}
