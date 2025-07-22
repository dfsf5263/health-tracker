const cron = require('node-cron')

// Schedule configurable via CRON_SCHEDULE environment variable
// Cron format: second minute hour day-of-month month day-of-week
// Default: '30 0,15,30,45 * * * *' means: 30 seconds after each 15-minute window (00:30, 15:30, 30:30, 45:30)
// This ensures we run once per 15-minute window with a 30-second buffer
const schedule = process.env.CRON_SCHEDULE || '30 0,15,30,45 * * * *'

console.log('Starting birth control reminder cron job...')
console.log(`Scheduled to run: ${schedule}`)

cron.schedule(schedule, async () => {
  console.log('Running birth control reminder cron job...')
  
  try {
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      console.error('CRON_SECRET environment variable is not set')
      return
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const cronUrl = `${baseUrl}/api/cron/birth-control-reminder`

    console.log(`Making request to: ${cronUrl}`)

    const response = await fetch(cronUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Birth control reminder cron job failed: ${response.status} ${response.statusText}`)
      console.error('Error details:', errorText)
      return
    }

    const result = await response.json()
    console.log('Birth control reminder cron job completed successfully:')
    console.log(`- Total users checked: ${result.results.total}`)
    console.log(`- Reminders sent: ${result.results.successful}`)
    console.log(`- Failed: ${result.results.failed}`)
    
    if (result.results.failed > 0) {
      console.log('Failed reminder details:')
      result.details.filter(d => !d.success).forEach(detail => {
        console.log(`  - ${detail.email}: ${detail.error}`)
      })
    }
  } catch (error) {
    console.error('Error in birth control reminder cron job:', error)
  }
}, {
  scheduled: true,
  timezone: process.env.TZ || 'UTC'
})

console.log(`Cron job initialized. Timezone: ${process.env.TZ || 'UTC'}`)

// Keep the process running
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down cron job...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down cron job...')
  process.exit(0)
})