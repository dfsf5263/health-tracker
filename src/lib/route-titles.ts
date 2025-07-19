export function getPageTitle(pathname: string): string {
  const routeTitles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/dashboard/add-event': 'Add Event',
    '/dashboard/settings': 'Settings',
  }

  return routeTitles[pathname] || 'Dashboard'
}
