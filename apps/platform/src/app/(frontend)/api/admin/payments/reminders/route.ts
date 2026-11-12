import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { z } from 'zod'

import {
  batchSendPaymentReminders,
  listCandidatesForPaymentReminders,
  PaymentReminderError,
  sendPaymentReminder,
} from '@/modules/payment-reminders/service.ts'

const sendReminderSchema = z.object({
  batch: z.boolean().optional(),
  candidateProcessId: z.number().int().positive().optional(),
  candidateProcessIds: z.array(z.number().int().positive()).optional(),
  channel: z.enum(['EMAIL', 'SMS', 'IN_APP', 'ALL']).optional(),
  customNote: z.string().trim().max(500).optional(),
  force: z.boolean().optional(),
  obligationKey: z.string().trim().max(100).optional(),
  trigger: z.enum(['PRE_DUE', 'ON_DUE', 'OVERDUE']).optional(),
  triggerFilter: z.enum(['ALL', 'DUE_TODAY', 'OVERDUE', 'PRE_DUE']).optional(),
})

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'users') {
    return Response.json({ message: 'Administratorska sesija je istekla.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const triggerFilter = url.searchParams.get('triggerFilter') as
    | 'ALL'
    | 'DUE_TODAY'
    | 'OVERDUE'
    | 'PRE_DUE'
    | null
  const search = url.searchParams.get('search') || undefined
  const page = parseInt(url.searchParams.get('page') || '1', 10) || 1
  const limit = parseInt(url.searchParams.get('limit') || '50', 10) || 50
  const asOfDateStr = url.searchParams.get('asOfDate')
  const asOfDate = asOfDateStr ? new Date(asOfDateStr) : new Date()

  try {
    const data = await listCandidatesForPaymentReminders({
      asOfDate,
      limit,
      page,
      payload,
      search,
      triggerFilter: triggerFilter || 'ALL',
    })

    return Response.json(data, {
      headers: { 'Cache-Control': 'no-store' },
      status: 200,
    })
  } catch (error) {
    console.error('Failed to list payment reminder candidates:', error)
    return Response.json(
      { message: 'Došlo je do greške pri učitavanju podsetnika za plaćanje.' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'users') {
    return Response.json({ message: 'Administratorska sesija je istekla.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ message: 'Zahtev nije ispravan JSON format.' }, { status: 400 })
  }

  const parsed = sendReminderSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { message: 'Neispravni parametri za slanje podsetnika.', errors: parsed.error.issues },
      { status: 400 },
    )
  }

  const data = parsed.data

  try {
    if (data.batch) {
      const batchResult = await batchSendPaymentReminders({
        administratorId: authentication.user.id,
        candidateProcessIds: data.candidateProcessIds,
        channel: data.channel,
        force: data.force,
        payload,
        triggerFilter: data.triggerFilter,
      })

      return Response.json(
        {
          dispatched: batchResult.dispatched,
          failed: batchResult.failed,
          message: `Grupno slanje završeno: isporučeno ${batchResult.dispatched}, preskočeno ${batchResult.skipped}, neuspešno ${batchResult.failed}.`,
          results: batchResult.results,
          skipped: batchResult.skipped,
        },
        { headers: { 'Cache-Control': 'no-store' }, status: 200 },
      )
    }

    if (!data.candidateProcessId || !data.obligationKey) {
      return Response.json(
        { message: 'Za pojedinačno slanje obavezni su candidateProcessId i obligationKey.' },
        { status: 400 },
      )
    }

    const results = await sendPaymentReminder({
      administratorId: authentication.user.id,
      input: {
        candidateProcessId: data.candidateProcessId,
        channel: data.channel,
        customNote: data.customNote,
        force: data.force,
        obligationKey: data.obligationKey,
        trigger: data.trigger,
      },
      payload,
    })

    const deliveredCount = results.filter((r) => r.status === 'DELIVERED').length
    const skippedCount = results.filter((r) => r.status === 'SKIPPED').length

    return Response.json(
      {
        message:
          deliveredCount > 0
            ? `Podsetnik je uspešno poslat (${deliveredCount} kanala).`
            : skippedCount > 0
              ? 'Podsetnik je preskočen jer je već ranije poslat za ovaj ciklus.'
              : 'Slanje podsetnika nije uspelo.',
        results,
      },
      { headers: { 'Cache-Control': 'no-store' }, status: 200 },
    )
  } catch (error) {
    if (error instanceof PaymentReminderError) {
      return Response.json({ message: error.message }, { status: error.status })
    }
    console.error('Error dispatching payment reminder:', error)
    return Response.json(
      { message: 'Slanje podsetnika za plaćanje trenutno nije dostupno.' },
      { status: 500 },
    )
  }
}
