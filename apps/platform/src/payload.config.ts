import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'

import { Applicants } from './collections/Applicants.ts'
import { AuditEvents } from './collections/AuditEvents.ts'
import { CandidateAccounts } from './collections/CandidateAccounts.ts'
import { CandidateApplications } from './collections/CandidateApplications.ts'
import { CandidateInvitations } from './collections/CandidateInvitations.ts'
import { CandidatePaymentPlans } from './collections/CandidatePaymentPlans.ts'
import { CandidatePayments } from './collections/CandidatePayments.ts'
import { CandidatePrivateDocuments } from './collections/CandidatePrivateDocuments.ts'
import { CandidateProcesses } from './collections/CandidateProcesses.ts'
import { CandidateProgramApplications } from './collections/CandidateProgramApplications.ts'
import { CandidateSensitiveProfiles } from './collections/CandidateSensitiveProfiles.ts'
import { CandidateJobOptions } from './collections/CandidateJobOptions.ts'
import { CandidateJobShortlists } from './collections/CandidateJobShortlists.ts'
import { ContactAttempts } from './collections/ContactAttempts.ts'
import { CommunicationLogs } from './collections/CommunicationLogs.ts'
import { ConsentRecords } from './collections/ConsentRecords.ts'
import { ContractAcceptances } from './collections/ContractAcceptances.ts'
import { ContractTemplates } from './collections/ContractTemplates.ts'
import { GeneratedContracts } from './collections/GeneratedContracts.ts'
import { EmploymentOfferAcceptances } from './collections/EmploymentOfferAcceptances.ts'
import { EmploymentOffers } from './collections/EmploymentOffers.ts'
import { EmbassyAppointments } from './collections/EmbassyAppointments.ts'
import { EmbassyReminderDeliveries } from './collections/EmbassyReminderDeliveries.ts'
import { FlightTicketRequests } from './collections/FlightTicketRequests.ts'
import { FlightTicketOfferResponses } from './collections/FlightTicketOfferResponses.ts'
import { FlightTicketOffers } from './collections/FlightTicketOffers.ts'
import { FlightTicketPaymentOrders } from './collections/FlightTicketPaymentOrders.ts'
import { InterviewPreparationAppointments } from './collections/InterviewPreparationAppointments.ts'
import { JobOpenings } from './collections/JobOpenings.ts'
import { MessageDeliveries } from './collections/MessageDeliveries.ts'
import { OutboxEvents } from './collections/OutboxEvents.ts'
import { PassportAuthorizationTemplates } from './collections/PassportAuthorizationTemplates.ts'
import { PassportCollectionAuthorizations } from './collections/PassportCollectionAuthorizations.ts'
import { PreApplications } from './collections/PreApplications.ts'
import { ProgramApplicationTemplates } from './collections/ProgramApplicationTemplates.ts'
import { ProgramOffers } from './collections/ProgramOffers.ts'
import { ProgramOfferSelections } from './collections/ProgramOfferSelections.ts'
import { RequestRateLimits } from './collections/RequestRateLimits.ts'
import { Users } from './collections/Users.ts'
import { UsaStayMaterials } from './collections/UsaStayMaterials.ts'
import { UsaStayTips } from './collections/UsaStayTips.ts'
import { TranslatedDocuments } from './collections/TranslatedDocuments.ts'
import { CandidateInvoices } from './collections/CandidateInvoices.ts'
import { DiscountGroups } from './collections/DiscountGroups.ts'
import { BrandAmbassadors } from './collections/BrandAmbassadors.ts'
import { CandidateDiscounts } from './collections/CandidateDiscounts.ts'
import { CandidateGuarantors } from './collections/CandidateGuarantors.ts'
import { VisaQuestionnaires } from './collections/VisaQuestionnaires.ts'
import { VisaPaymentOrders } from './collections/VisaPaymentOrders.ts'
import { readPlatformEnvironment } from './config/environment.ts'
import { migrations } from './migrations/index.ts'
import { sendCandidateCommunicationTask } from './modules/candidate-communications/sendCandidateCommunicationTask.ts'
import { createPlatformEmailAdapter } from './modules/candidate-communications/emailProvider.ts'
import { sendEmbassyAppointmentReminderTask } from './modules/embassy-appointments/sendEmbassyAppointmentReminderTask.ts'

const filename = fileURLToPath(import.meta.url)
const directory = path.dirname(filename)
const environment = readPlatformEnvironment()
const automaticJobsEnabled = process.env.PAYLOAD_JOBS_AUTORUN?.trim().toLowerCase() !== 'false'

export default buildConfig({
  admin: {
    importMap: {
      baseDir: path.resolve(directory),
    },
    meta: {
      titleSuffix: ' | American Adventure',
    },
    user: Users.slug,
  },
  collections: [
    Users,
    CandidateAccounts,
    CandidateApplications,
    CandidateInvitations,
    CandidateProcesses,
    CandidatePaymentPlans,
    CandidatePayments,
    ProgramApplicationTemplates,
    CandidateProgramApplications,
    CandidateSensitiveProfiles,
    CandidatePrivateDocuments,
    InterviewPreparationAppointments,
    JobOpenings,
    CandidateJobShortlists,
    CandidateJobOptions,
    EmploymentOffers,
    EmploymentOfferAcceptances,
    EmbassyAppointments,
    EmbassyReminderDeliveries,
    FlightTicketRequests,
    FlightTicketOffers,
    FlightTicketOfferResponses,
    FlightTicketPaymentOrders,
    VisaPaymentOrders,
    VisaQuestionnaires,
    PassportAuthorizationTemplates,
    PassportCollectionAuthorizations,
    ContractTemplates,
    GeneratedContracts,
    ContractAcceptances,
    ProgramOffers,
    ProgramOfferSelections,
    UsaStayMaterials,
    UsaStayTips,
    Applicants,
    PreApplications,
    ContactAttempts,
    ConsentRecords,
    AuditEvents,
    CommunicationLogs,
    TranslatedDocuments,
    CandidateInvoices,
    DiscountGroups,
    BrandAmbassadors,
    CandidateDiscounts,
    CandidateGuarantors,
    OutboxEvents,
    MessageDeliveries,
    RequestRateLimits,
  ],
  db: postgresAdapter({
    pool: {
      connectionString: environment.databaseUrl,
    },
    prodMigrations: migrations,
  }),
  editor: lexicalEditor(),
  email: createPlatformEmailAdapter(environment.candidateCommunication),
  jobs: {
    access: {
      cancel: ({ req }) => req.user?.collection === 'users',
      queue: ({ req }) => req.user?.collection === 'users',
      run: ({ req }) => req.user?.collection === 'users',
    },
    autoRun: automaticJobsEnabled
      ? [{ cron: '*/10 * * * * *', limit: 10, queue: 'candidate-communications' }]
      : [],
    deleteJobOnComplete: false,
    tasks: [sendCandidateCommunicationTask, sendEmbassyAppointmentReminderTask],
  },
  secret: environment.payloadSecret,
  serverURL: environment.serverUrl,
  typescript: {
    outputFile: path.resolve(directory, 'payload-types.ts'),
  },
})
