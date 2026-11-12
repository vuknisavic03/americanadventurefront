import config from '@payload-config'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import { AccountFrame } from '@/components/candidate-portal/AccountFrame.tsx'
import { CandidateProfileForm } from '@/components/candidate-portal/CandidateProfileForm.tsx'
import { ContractAcceptancePanel } from '@/components/candidate-portal/ContractAcceptancePanel.tsx'
import { ContractReadinessPanel } from '@/components/candidate-portal/ContractReadinessPanel.tsx'
import { InterviewPreparationPanel } from '@/components/candidate-portal/InterviewPreparationPanel.tsx'
import { EmploymentOfferPanel } from '@/components/candidate-portal/EmploymentOfferPanel.tsx'
import { CandidateJobOptionsPanel } from '@/components/candidate-portal/CandidateJobOptionsPanel.tsx'
import { LogoutButton } from '@/components/candidate-portal/LogoutButton.tsx'
import { PaymentOverviewPanel } from '@/components/candidate-portal/PaymentOverviewPanel.tsx'
import { PassportAuthorizationPanel } from '@/components/candidate-portal/PassportAuthorizationPanel.tsx'
import { ProgramApplicationForm } from '@/components/candidate-portal/ProgramApplicationForm.tsx'
import { ProgramDocumentsPanel } from '@/components/candidate-portal/ProgramDocumentsPanel.tsx'
import { ProgramOfferPanel } from '@/components/candidate-portal/ProgramOfferPanel.tsx'
import { VisaQuestionnairePanel } from '@/components/candidate-portal/VisaQuestionnairePanel.tsx'
import { VisaDocumentsPanel } from '@/components/candidate-portal/VisaDocumentsPanel.tsx'
import { VisaPaymentOrderPanel } from '@/components/candidate-portal/VisaPaymentOrderPanel.tsx'
import { EmbassyAppointmentPanel } from '@/components/candidate-portal/EmbassyAppointmentPanel.tsx'
import { FlightTicketRequestPanel } from '@/components/candidate-portal/FlightTicketRequestPanel.tsx'
import { FlightTicketOfferPanel } from '@/components/candidate-portal/FlightTicketOfferPanel.tsx'
import { FlightTicketPaymentOrderPanel } from '@/components/candidate-portal/FlightTicketPaymentOrderPanel.tsx'
import { UsaStayMaterialsPanel } from '@/components/candidate-portal/UsaStayMaterialsPanel.tsx'
import { UsaStayTipsPanel } from '@/components/candidate-portal/UsaStayTipsPanel.tsx'
import { PeerNetworkingPanel } from '@/components/candidate-portal/PeerNetworkingPanel.tsx'
import { contractAcceptanceStatement } from '@/modules/generated-contracts/acceptanceStatement.ts'
import {
  projectCandidateProgress,
  type CandidateProcessStatus,
  type CandidateProcessStepKey,
  swtProcessSteps,
} from '@/modules/candidate-processes/workflow.ts'
import {
  ensureCandidateProgramApplication,
  programApplicationForPortal,
} from '@/modules/program-applications/service.ts'
import { candidateProgramDocumentChecklist, candidateVisaDocumentChecklist } from '@/modules/candidate-documents/service.ts'
import { interviewPreparationForCandidate } from '@/modules/interview-preparations/service.ts'
import { employmentOffersForCandidate } from '@/modules/employment-offers/service.ts'
import { jobOptionsForCandidate } from '@/modules/job-options/service.ts'
import { visaPaymentOrdersForCandidate } from '@/modules/visa-payments/service.ts'
import { passportAuthorizationForPortal } from '@/modules/passport-authorizations/service.ts'
import { flightTicketPaymentOrdersForCandidate } from '@/modules/flight-ticket-payments/service.ts'
import { materialsForCandidate, tipsForCandidate, peerNetworkingForCandidate } from '@/modules/usa-stay/service.ts'

export const dynamic = 'force-dynamic'

const processStatusLabels: Record<CandidateProcessStatus, string> = {
  ACTIVE: 'Proces je aktivan',
  COMPLETED: 'Program je završen',
  ON_HOLD: 'Proces je privremeno pauziran',
}

function formatDate(value?: null | string) {
  if (!value) return undefined
  return new Intl.DateTimeFormat('sr-Latn-RS', { dateStyle: 'long' }).format(new Date(value))
}

export default async function CandidatePortalPage() {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })

  if (!authentication.user || authentication.user.collection !== 'candidate-accounts') {
    redirect('/nalog/prijava')
  }

  const account = await payload.findByID({
    collection: 'candidate-accounts',
    depth: 0,
    id: authentication.user.id,
    overrideAccess: true,
  })
  const applicationId =
    typeof account.preApplication === 'object' ? account.preApplication.id : account.preApplication
  const application = await payload.findByID({
    collection: 'pre-applications',
    depth: 0,
    id: applicationId,
    overrideAccess: true,
  })
  const applicantId = typeof account.applicant === 'object' ? account.applicant.id : account.applicant
  const applicant = await payload.findByID({
    collection: 'applicants',
    depth: 0,
    id: applicantId,
    overrideAccess: true,
  })
  const processResult = await payload.find({
    collection: 'candidate-processes',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { preApplication: { equals: application.id } },
  })
  const process = processResult.docs[0]
  const selectionResult = process
    ? await payload.find({
        collection: 'program-offer-selections',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        where: { candidateProcess: { equals: process.id } },
      })
    : { docs: [] }
  const selection = selectionResult.docs[0]
  const generatedContract = (
    await payload.find({
      collection: 'generated-contracts',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      sort: '-generatedAt',
      where: { candidateAccount: { equals: account.id } },
    })
  ).docs[0]
  const contractAcceptance = generatedContract
    ? (
        await payload.find({
          collection: 'contract-acceptances',
          depth: 0,
          limit: 1,
          overrideAccess: true,
          where: { contract: { equals: generatedContract.id } },
        })
      ).docs[0]
    : undefined
  const paymentPlan = contractAcceptance
    ? (
        await payload.find({
          collection: 'candidate-payment-plans',
          depth: 0,
          limit: 1,
          overrideAccess: true,
          where: { contractAcceptance: { equals: contractAcceptance.id } },
        })
      ).docs[0]
    : undefined
  const payments = paymentPlan
    ? (
        await payload.find({
          collection: 'candidate-payments',
          depth: 0,
          limit: 100,
          overrideAccess: true,
          sort: 'receivedAt',
          where: { paymentPlan: { equals: paymentPlan.id } },
        })
      ).docs
    : []
  const candidateInvoices = paymentPlan
    ? (
        await payload.find({
          collection: 'candidate-invoices',
          depth: 0,
          limit: 50,
          overrideAccess: true,
          sort: '-issueDate',
          where: { candidateAccount: { equals: account.id } },
        })
      ).docs
    : []
  const sensitiveProfile = (
    await payload.find({
      collection: 'candidate-sensitive-profiles',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { candidateAccount: { equals: account.id } },
    })
  ).docs[0]
  const passportDocument = sensitiveProfile?.activePassportDocument
    ? await payload.findByID({
        collection: 'candidate-private-documents',
        depth: 0,
        id: typeof sensitiveProfile.activePassportDocument === 'object'
          ? sensitiveProfile.activePassportDocument.id
          : sensitiveProfile.activePassportDocument,
        overrideAccess: true,
      })
    : undefined
  const offer = selection
    ? await payload.findByID({
        collection: 'program-offers',
        depth: 0,
        id: typeof selection.offer === 'object' ? selection.offer.id : selection.offer,
        overrideAccess: true,
      })
    : (
        await payload.find({
          collection: 'program-offers',
          depth: 0,
          limit: 1,
          overrideAccess: true,
          sort: '-publishedAt',
          where: {
            and: [
              { candidateAccount: { equals: account.id } },
              { status: { equals: 'PUBLISHED' } },
            ],
          },
        })
      ).docs[0]
  const currentStep = (process?.currentStep ?? 'PROFILE_SETUP') as CandidateProcessStepKey
  const processStatus = (process?.processStatus ?? 'ACTIVE') as CandidateProcessStatus
  const programApplicationIndex = swtProcessSteps.findIndex((step) => step.key === 'PROGRAM_APPLICATION')
  const currentStepIndex = swtProcessSteps.findIndex((step) => step.key === currentStep)
  const programApplicationAccessible = processStatus === 'ACTIVE' && currentStepIndex >= programApplicationIndex
  const programApplication = programApplicationAccessible
    ? await ensureCandidateProgramApplication({
        accountId: account.id,
        now: new Date(),
        payload,
      })
    : undefined
  const portalProgramApplication = programApplication ? programApplicationForPortal(programApplication) : undefined
  const documentsIndex = swtProcessSteps.findIndex((step) => step.key === 'DOCUMENTS')
  const programDocumentsAccessible = processStatus === 'ACTIVE' && currentStepIndex >= documentsIndex
  const programDocuments = programDocumentsAccessible
    ? await candidateProgramDocumentChecklist({ accountId: account.id, payload })
    : undefined
  const jobPlacementIndex = swtProcessSteps.findIndex((step) => step.key === 'JOB_PLACEMENT')
  const interviewPreparationAccessible = processStatus === 'ACTIVE' && currentStepIndex >= jobPlacementIndex
  const interviewPreparations = interviewPreparationAccessible
    ? await interviewPreparationForCandidate({ accountId: account.id, payload })
    : undefined
  const employmentOfferState = interviewPreparationAccessible && process
    ? await employmentOffersForCandidate({ accountId: account.id, candidateProcessId: process.id, payload })
    : undefined
  const candidateJobOptionState = interviewPreparationAccessible && process
    ? await jobOptionsForCandidate({ accountId: account.id, candidateProcessId: process.id, payload })
    : undefined
  const visaIndex = swtProcessSteps.findIndex((step) => step.key === 'VISA')
  const visaAccessible = processStatus === 'ACTIVE' && currentStepIndex >= visaIndex
  const travelPreparationIndex = swtProcessSteps.findIndex((step) => step.key === 'TRAVEL_PREPARATION')
  const travelPreparationAccessible = processStatus === 'ACTIVE' && currentStepIndex >= travelPreparationIndex
  const flightTicketPaymentOrders = travelPreparationAccessible && process
    ? await flightTicketPaymentOrdersForCandidate({ accountId: account.id, candidateProcessId: process.id, payload }) : undefined
  const orientationMeetings = travelPreparationAccessible
    ? await interviewPreparationForCandidate({ accountId: account.id, payload, purpose: 'ORIENTATION' })
    : undefined
  const embassyPreparations = visaAccessible
    ? await interviewPreparationForCandidate({ accountId: account.id, payload, purpose: 'EMBASSY' })
    : undefined
  const visaPaymentOrders = visaAccessible && process
    ? await visaPaymentOrdersForCandidate({ accountId: account.id, candidateProcessId: process.id, payload }) : undefined
  const visaDocuments = visaAccessible && process
    ? await candidateVisaDocumentChecklist({ accountId: account.id, payload }) : undefined
  const passportAuthorization = visaAccessible
    ? await passportAuthorizationForPortal(payload, account.id) : undefined
  const usaMaterials = travelPreparationAccessible
    ? await materialsForCandidate({ payload, programCode: account.programCode })
    : undefined
  const usaTips = travelPreparationAccessible
    ? await tipsForCandidate({ payload })
    : undefined
  const peerNetworking = travelPreparationAccessible
    ? await peerNetworkingForCandidate({ accountId: account.id, payload })
    : undefined
  const steps = projectCandidateProgress({
    currentStep,
    processStatus,
    programCode: account.programCode,
  })
  const currentStepDefinition = steps.find((step) => step.state === 'CURRENT') ?? steps.at(-1)
  const dueDate = formatDate(process?.nextActionDueAt)

  return (
    <AccountFrame>
      <section className="portal-card portal-card--dashboard">
        <div className="portal-heading">
          <div>
            <p className="eyebrow">Work &amp; Travel kandidat</p>
            <h1>Dobro došli, {account.fullName}</h1>
            <p>Na jednom mestu pratite napredak i održavajte svoje podatke ažurnim.</p>
          </div>
          <LogoutButton />
        </div>

        <div className="portal-overview">
          <div className="status-panel">
            <span>Trenutni korak</span>
            <strong>{currentStepDefinition?.label}</strong>
            <p>{currentStepDefinition?.description}</p>
          </div>
          <aside className="next-action-card">
            <span>Sledeća akcija</span>
            <strong>{process?.nextActionTitle ?? 'Proverite i dopunite svoj profil'}</strong>
            <p>{process?.nextActionDescription ?? 'Proverite podatke prenete iz prijave i sačuvajte eventualne izmene.'}</p>
            {dueDate ? <small>Rok: {dueDate}</small> : null}
          </aside>
        </div>

        <dl className="portal-details portal-details--summary">
          <div><dt>Status</dt><dd>{processStatusLabels[processStatus]}</dd></div>
          <div><dt>Program</dt><dd>{account.programCode === 'SWT' ? 'Work & Travel USA' : account.programCode}</dd></div>
          <div><dt>Email</dt><dd>{account.email}</dd></div>
          <div><dt>Referentni broj</dt><dd>{application.correlationId}</dd></div>
        </dl>

        <section className="progress-section" aria-labelledby="process-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Tok programa</p>
              <h2 id="process-heading">Vaši koraci</h2>
            </div>
            <p>Oznake pokazuju šta je završeno, na čemu trenutno radimo i šta dolazi kasnije.</p>
          </div>
          <ol className="progress-timeline">
            {steps.map((step) => (
              <li className={`progress-step progress-step--${step.state.toLowerCase()}`} key={step.key}>
                <span className="progress-marker" aria-hidden="true">
                  {step.state === 'COMPLETED' ? '✓' : step.state === 'CURRENT' ? '●' : ''}
                </span>
                <div>
                  <span className="progress-state">
                    {step.state === 'COMPLETED' ? 'Završeno' : step.state === 'CURRENT' ? 'Trenutno' : 'Predstoji'}
                  </span>
                  <h3>{step.label}</h3>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <ProgramOfferPanel
          offer={offer ? {
            basePriceCents: offer.basePriceCents,
            id: offer.id,
            installments: {
              enabled: offer.installments?.enabled === true,
              items: (offer.installments?.items ?? []).map((item) => ({
                amountCents: item.amountCents,
                dueAt: item.dueAt,
                label: item.label,
              })),
            },
            oneTime: {
              discountCents: offer.oneTime?.discountCents ?? 0,
              discountLabel: offer.oneTime?.discountLabel,
              enabled: offer.oneTime?.enabled === true,
            },
            payWhenYouEarn: {
              deferredAmountCents: offer.payWhenYouEarn?.deferredAmountCents ?? 0,
              depositCents: offer.payWhenYouEarn?.depositCents ?? 0,
              description: offer.payWhenYouEarn?.description ?? '',
              enabled: offer.payWhenYouEarn?.enabled === true,
            },
            validUntil: offer.validUntil,
          } : undefined}
          selection={selection ? {
            acceptedAt: selection.acceptedAt,
            discountCents: selection.discountCents,
            installmentSchedule: Array.isArray(selection.installmentSchedule)
              ? selection.installmentSchedule as { amountCents: number; dueAt: string; label: string }[]
              : [],
            payWhenYouEarn: selection.payWhenYouEarnSnapshot && typeof selection.payWhenYouEarnSnapshot === 'object'
              ? selection.payWhenYouEarnSnapshot as { deferredAmountCents: number; depositCents: number; description: string }
              : null,
            selectedMethod: selection.selectedMethod,
            totalCents: selection.totalCents,
          } : undefined}
        />

        <ContractReadinessPanel state={{
          document: passportDocument ? {
            fileName: passportDocument.originalFileName,
            id: passportDocument.id,
            status: passportDocument.status === 'SUPERSEDED' ? 'REJECTED' : passportDocument.status,
          } : undefined,
          personalIdStatus: sensitiveProfile?.personalIdStatus ?? 'MISSING',
          readinessStatus: sensitiveProfile?.contractReadinessStatus ?? 'INCOMPLETE',
        }} />

        {generatedContract ? (
          <ContractAcceptancePanel
            acceptance={contractAcceptance ? {
              acceptedAt: contractAcceptance.acceptedAt,
              id: contractAcceptance.id,
              reference: contractAcceptance.acceptanceReference,
            } : undefined}
            contract={{
              generatedAt: generatedContract.generatedAt,
              id: generatedContract.id,
              number: generatedContract.contractNumber,
              sourcePdfSha256: generatedContract.pdfSha256,
              statement: contractAcceptanceStatement(generatedContract.contractNumber),
            }}
          />
        ) : null}

        {paymentPlan ? (
          <PaymentOverviewPanel
            invoices={candidateInvoices.map((inv) => ({
              id: inv.id,
              invoiceNumber: inv.invoiceNumber,
              issueDate: inv.issueDate,
              note: inv.note || undefined,
              originalAmountCents: inv.originalAmountCents,
              originalCurrency: inv.originalCurrency,
              settlementAmountRsdCents: inv.settlementAmountRsdCents,
            }))}
            payments={payments.map((payment) => ({
              amountCents: payment.amountCents,
              entryType: payment.entryType,
              paymentReference: payment.paymentReference,
              receivedAt: payment.receivedAt,
            }))}
            plan={{
              currency: paymentPlan.currency,
              firstPaymentRequiredCents: paymentPlan.firstPaymentRequiredCents,
              firstPaymentStatus: paymentPlan.firstPaymentStatus,
              obligations: Array.isArray(paymentPlan.obligations)
                ? paymentPlan.obligations as Parameters<typeof PaymentOverviewPanel>[0]['plan']['obligations']
                : [],
              paidCents: paymentPlan.paidCents,
              remainingCents: paymentPlan.remainingCents,
              status: paymentPlan.status,
              totalCents: paymentPlan.totalCents,
            }}
          />
        ) : null}

        {programApplicationAccessible ? (
          <ProgramApplicationForm application={portalProgramApplication} />
        ) : null}

        {programDocuments ? <ProgramDocumentsPanel items={programDocuments} /> : null}

        {interviewPreparations ? <InterviewPreparationPanel appointments={interviewPreparations} /> : null}

        {candidateJobOptionState ? <CandidateJobOptionsPanel options={candidateJobOptionState.options} /> : null}
        {employmentOfferState?.offers.length ? <EmploymentOfferPanel acceptances={employmentOfferState.acceptances} offers={employmentOfferState.offers} /> : null}

        {visaPaymentOrders ? <VisaPaymentOrderPanel orders={visaPaymentOrders} /> : null}
        {visaPaymentOrders?.some((order) => order.status === 'PAID') ? <VisaQuestionnairePanel /> : null}
        {visaDocuments ? <VisaDocumentsPanel state={visaDocuments} /> : null}
        <PassportAuthorizationPanel authorization={passportAuthorization} visible={visaAccessible} />
        {visaAccessible ? <EmbassyAppointmentPanel /> : null}
        {embassyPreparations ? <InterviewPreparationPanel appointments={embassyPreparations} purpose="EMBASSY" /> : null}
        {travelPreparationAccessible ? <FlightTicketRequestPanel /> : null}
        {travelPreparationAccessible ? <FlightTicketOfferPanel /> : null}
        {flightTicketPaymentOrders ? <FlightTicketPaymentOrderPanel orders={flightTicketPaymentOrders} /> : null}
        {orientationMeetings ? <InterviewPreparationPanel appointments={orientationMeetings} purpose="ORIENTATION" /> : null}
        {usaMaterials ? <UsaStayMaterialsPanel materials={usaMaterials} /> : null}
        {peerNetworking ? <PeerNetworkingPanel initialState={peerNetworking} /> : null}
        {usaTips ? <UsaStayTipsPanel tips={usaTips} /> : null}

        <CandidateProfileForm
          initialValues={{
            citizenship: account.citizenship ?? '',
            phone: applicant.phone,
            residentialAddress: applicant.residentialAddress,
          }}
        />

        <section className="profile-reference" aria-labelledby="reference-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Podaci iz prijave</p>
              <h2 id="reference-heading">Osnovni podaci</h2>
            </div>
            <p>Za promenu imena, datuma rođenja ili email adrese kontaktirajte agenciju.</p>
          </div>
          <dl className="portal-details">
            <div><dt>Ime i prezime</dt><dd>{applicant.fullName}</dd></div>
            <div><dt>Datum rođenja</dt><dd>{formatDate(applicant.dateOfBirth)}</dd></div>
            <div><dt>Fakultet</dt><dd>{application.submission.facultyName}</dd></div>
            <div><dt>Grad studiranja</dt><dd>{application.submission.studyCity}</dd></div>
          </dl>
        </section>
      </section>
    </AccountFrame>
  )
}
