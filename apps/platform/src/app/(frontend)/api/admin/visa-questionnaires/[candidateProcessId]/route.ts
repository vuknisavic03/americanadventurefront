import { authenticate, failure, json, readBody } from '@/modules/visa-questionnaires/http.ts'
import { adminMutation } from '@/modules/visa-questionnaires/schema.ts'
import { questionnaireForAdmin, reviewQuestionnaire } from '@/modules/visa-questionnaires/service.ts'

type Context = { params: Promise<{ candidateProcessId: string }> }
async function processId(context: Context) {
  const value = Number((await context.params).candidateProcessId)
  return Number.isSafeInteger(value) && value > 0 ? value : undefined
}
export async function GET(request: Request, context: Context) {
  try {
    const { payload } = await authenticate(request, 'users')
    const id = await processId(context)
    if (!id) return json({ message: 'Proces nije pronađen.' }, 404)
    return json(await questionnaireForAdmin(payload, id))
  } catch (error) { return failure(error) }
}
export async function POST(request: Request, context: Context) {
  try {
    const { payload, user } = await authenticate(request, 'users')
    const id = await processId(context)
    if (!id) return json({ message: 'Proces nije pronađen.' }, 404)
    const parsed = adminMutation.safeParse(await readBody(request))
    if (!parsed.success) return json({ message: 'Proverite podatke zahteva.' }, 400)
    return json({ ...await reviewQuestionnaire({ payload, processId: id, administratorId: user.id, ...parsed.data }), message: 'Pregled viznog upitnika je sačuvan.' })
  } catch (error) { return failure(error) }
}
