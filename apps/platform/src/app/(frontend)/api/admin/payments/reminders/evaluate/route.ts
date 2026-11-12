import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { z } from 'zod'

import { runAutomatedPaymentRemindersJob } from '@/modules/payment-reminders/service.ts'

const evaluateSchema = z.object({
  asOfDate: z.string().optional(),
  dryRun: z.boolean().optional(),
})

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'users') {
    return Response.json({ message: 'Administratorska sesija je istekla.' }, { status: 401 })
  }

  let body: unknown = {}
  try {
    const text = await request.text()
    if (text && text.trim().length > 0) {
      body = JSON.parse(text)
    }
  } catch {
    return Response.json({ message: 'Zahtev nije ispravan JSON format.' }, { status: 400 })
  }

  const parsed = evaluateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { message: 'Neispravni parametri za evaluaciju podsetnika.' },
      { status: 400 },
    )
  }

  const asOfDate = parsed.data.asOfDate ? new Date(parsed.data.asOfDate) : new Date()

  try {
    const result = await runAutomatedPaymentRemindersJob({
      asOfDate,
      dryRun: parsed.data.dryRun ?? false,
      payload,
    })

    return Response.json(
      {
        dispatched: result.dispatched,
        eligible: result.eligible,
        failed: result.failed,
        message: `Evaluacija obaveza završena. Pregledano: ${result.totalEvaluated}, kandidata za slanje: ${result.eligible}, isporučeno: ${result.dispatched}, preskočeno: ${result.skipped}, neuspešno: ${result.failed}.`,
        results: result.results,
        skipped: result.skipped,
        totalEvaluated: result.totalEvaluated,
      },
      { headers: { 'Cache-Control': 'no-store' }, status: 200 },
    )
  } catch (error) {
    console.error('Error during payment reminders evaluation job:', error)
    return Response.json(
      { message: 'Automatska provera podsetnika za plaćanje nije uspela.' },
      { status: 500 },
    )
  }
}
