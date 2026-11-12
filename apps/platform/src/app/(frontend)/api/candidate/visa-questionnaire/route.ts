import { authenticate, failure, json, readBody } from '@/modules/visa-questionnaires/http.ts'
import { candidateMutation } from '@/modules/visa-questionnaires/schema.ts'
import { questionnaireForCandidate, saveQuestionnaire } from '@/modules/visa-questionnaires/service.ts'

export async function GET(request: Request) {
  try {
    const { payload, user } = await authenticate(request, 'candidate-accounts')
    return json({ questionnaire: await questionnaireForCandidate(payload, user.id) })
  } catch (error) { return failure(error) }
}
export async function POST(request: Request) {
  try {
    const { payload, user } = await authenticate(request, 'candidate-accounts')
    const parsed = candidateMutation.safeParse(await readBody(request))
    if (!parsed.success) return json({ message: 'Proverite podatke upitnika.' }, 400)
    const result = await saveQuestionnaire({ payload, accountId: user.id, ...parsed.data })
    return json({ ...result, message: parsed.data.action === 'SUBMIT' ? 'Vizni upitnik je predat agenciji.' : 'Nacrt je sačuvan.' })
  } catch (error) { return failure(error) }
}
