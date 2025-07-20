export function getPageTitle(pathname: string): string {
  const routeTitles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/dashboard/add-event': 'Add Event',
    '/dashboard/edit-period-day': 'Edit Period Day',
    '/dashboard/settings': 'Settings',
  }

  return routeTitles[pathname] || 'Dashboard'
}
