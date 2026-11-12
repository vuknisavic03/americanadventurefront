import type { Access, CollectionConfig } from 'payload'

import { candidateProcessStepOptions } from '../modules/candidate-processes/workflow.ts'

const administrator = ({ req }: Parameters<Access>[0]) => req.user?.collection === 'users'

const administratorOrOwnProcess: Access = ({ req }) => {
  if (req.user?.collection === 'users') return true
  if (req.user?.collection !== 'candidate-accounts') return false
  return { candidateAccount: { equals: req.user.id } }
}

const immutableRelationship = { update: () => false }

function relationId(value: number | { id: number }) {
  return typeof value === 'number' ? value : value.id
}

const progressFields = new Set([
  'currentStep',
  'currentStepStartedAt',
  'nextActionDescription',
  'nextActionDueAt',
  'nextActionTitle',
  'processStatus',
  'progressNote',
])

export const CandidateProcesses: CollectionConfig = {
  slug: 'candidate-processes',
  access: {
    create: administrator,
    delete: administrator,
    read: administratorOrOwnProcess,
    update: administrator,
  },
  admin: {
    defaultColumns: ['candidateAccount', 'programCode', 'processStatus', 'currentStep', 'progressUpdatedAt'],
    group: 'Kandidatski portal',
    useAsTitle: 'candidateAccount',
  },
  fields: [
    {
      name: 'candidateAccount',
      type: 'relationship',
      access: immutableRelationship,
      admin: { readOnly: true },
      label: 'Kandidatski nalog',
      relationTo: 'candidate-accounts',
      required: true,
    },
    {
      name: 'applicant',
      type: 'relationship',
      access: immutableRelationship,
      admin: { readOnly: true },
      label: 'Kandidat',
      relationTo: 'applicants',
      required: true,
    },
    {
      name: 'preApplication',
      type: 'relationship',
      access: immutableRelationship,
      admin: { readOnly: true },
      label: 'Izvorna prijava',
      relationTo: 'pre-applications',
      required: true,
      unique: true,
    },
    {
      name: 'programCode',
      type: 'select',
      access: immutableRelationship,
      admin: { readOnly: true },
      label: 'Program',
      options: [{ label: 'Work & Travel', value: 'SWT' }],
      required: true,
    },
    {
      name: 'processStatus',
      type: 'select',
      defaultValue: 'ACTIVE',
      label: 'Status procesa',
      options: [
        { label: 'Aktivan', value: 'ACTIVE' },
        { label: 'Pauziran', value: 'ON_HOLD' },
        { label: 'Završen', value: 'COMPLETED' },
      ],
      required: true,
    },
    {
      name: 'currentStep',
      type: 'select',
      defaultValue: 'PROFILE_SETUP',
      label: 'Trenutni korak',
      options: candidateProcessStepOptions,
      required: true,
    },
    {
      name: 'currentStepStartedAt',
      type: 'date',
      label: 'Trenutni korak započet',
    },
    {
      name: 'nextActionTitle',
      type: 'text',
      label: 'Sledeća akcija za kandidata',
      maxLength: 160,
    },
    {
      name: 'nextActionDescription',
      type: 'textarea',
      label: 'Objašnjenje sledeće akcije',
      maxLength: 600,
    },
    {
      name: 'nextActionDueAt',
      type: 'date',
      label: 'Rok za sledeću akciju',
    },
    {
      name: 'progressNote',
      type: 'textarea',
      label: 'Interna napomena administratora',
      maxLength: 2_000,
    },
    {
      name: 'peerSharingConsent',
      type: 'checkbox',
      defaultValue: false,
      label: 'Saglasnost za deljenje kontakta i povezivanje sa kolegama u SAD (FR-061)',
    },
    {
      name: 'progressVersion',
      type: 'number',
      access: { update: () => false },
      admin: { hidden: true },
      defaultValue: 1,
      min: 1,
      required: true,
    },
    {
      name: 'progressUpdatedAt',
      type: 'date',
      access: { update: () => false },
      admin: { readOnly: true },
      label: 'Napredak poslednji put izmenjen',
    },
    {
      name: 'progressUpdatedBy',
      type: 'relationship',
      access: { update: () => false },
      admin: { readOnly: true },
      label: 'Napredak izmenio/la',
      relationTo: 'users',
    },
    {
      name: 'interviewPreparationManagement',
      type: 'ui',
      admin: {
        components: {
          Field: './components/admin/InterviewPreparationManagementPanel#InterviewPreparationManagementPanel',
        },
      },
    },
    {
      name: 'employmentOfferManagement',
      type: 'ui',
      admin: {
        components: {
          Field: './components/admin/EmploymentOfferManagementPanel#EmploymentOfferManagementPanel',
        },
      },
    },
    {
      name: 'visaQuestionnaireManagement',
      type: 'ui',
      admin: { components: { Field: './components/admin/VisaQuestionnaireManagementPanel#VisaQuestionnaireManagementPanel' } },
    },
    {
      name: 'visaDocumentChecklistManagement',
      type: 'ui',
      admin: { components: { Field: './components/admin/VisaDocumentChecklistManagementPanel#VisaDocumentChecklistManagementPanel' } },
    },
    {
      name: 'passportAuthorizationManagement',
      type: 'ui',
      admin: { components: { Field: './components/admin/PassportAuthorizationManagementPanel#PassportAuthorizationManagementPanel' } },
    },
    {
      name: 'visaPaymentOrderManagement',
      type: 'ui',
      admin: {
        components: {
          Field: './components/admin/VisaPaymentOrderManagementPanel#VisaPaymentOrderManagementPanel',
        },
      },
    },
    {
      name: 'embassyAppointmentManagement',
      type: 'ui',
      admin: { components: { Field: './components/admin/EmbassyAppointmentManagementPanel#EmbassyAppointmentManagementPanel' } },
    },
    {
      name: 'embassyPreparationManagement',
      type: 'ui',
      admin: { components: { Field: './components/admin/InterviewPreparationManagementPanel#EmbassyPreparationManagementPanel' } },
    },
    {
      name: 'flightTicketRequestManagement',
      type: 'ui',
      admin: { components: { Field: './components/admin/FlightTicketRequestManagementPanel#FlightTicketRequestManagementPanel' } },
    },
    {
      name: 'flightTicketOfferManagement',
      type: 'ui',
      admin: { components: { Field: './components/admin/FlightTicketOfferManagementPanel#FlightTicketOfferManagementPanel' } },
    },
    {
      name: 'flightTicketPaymentOrderManagement',
      type: 'ui',
      admin: { components: { Field: './components/admin/FlightTicketPaymentOrderManagementPanel#FlightTicketPaymentOrderManagementPanel' } },
    },
    {
      name: 'orientationMeetingManagement',
      type: 'ui',
      admin: { components: { Field: './components/admin/InterviewPreparationManagementPanel#OrientationMeetingManagementPanel' } },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, operation, previousDoc, req }) => {
        if (operation !== 'update' || req.user?.collection !== 'users') return doc
        const changedFields = [...progressFields].filter((field) => doc[field] !== previousDoc[field])
        if (changedFields.length === 0) return doc

        const applicationId = relationId(doc.preApplication)
        const application = await req.payload.findByID({
          collection: 'pre-applications',
          depth: 0,
          id: applicationId,
          overrideAccess: true,
          req,
        })
        await req.payload.create({
          collection: 'audit-events',
          data: {
            actor: req.user.id,
            actorType: 'ADMIN',
            correlationId: application.correlationId,
            eventType: 'CANDIDATE_PROCESS_UPDATED',
            metadata: {
              candidateProcessId: doc.id,
              changedFields,
              currentStep: doc.currentStep,
              previousStep: previousDoc.currentStep,
              processStatus: doc.processStatus,
            },
            newStatus: application.status,
            occurredAt: new Date().toISOString(),
            preApplication: application.id,
            previousStatus: application.status,
            workflowVersion: application.workflowVersion,
          },
          overrideAccess: true,
          req,
        })
        return doc
      },
    ],
    beforeChange: [
      ({ data, operation, originalDoc, req }) => {
        const now = new Date().toISOString()
        if (operation === 'create') {
          data.progressUpdatedAt ??= now
          data.progressUpdatedBy ??= req.user?.collection === 'users' ? req.user.id : undefined
          return data
        }

        const progressChanged = [...progressFields].some((field) => field in data)
        if (progressChanged) {
          if ('currentStep' in data && data.currentStep !== originalDoc.currentStep) {
            data.currentStepStartedAt = now
          }
          data.progressUpdatedAt = now
          data.progressUpdatedBy = req.user?.collection === 'users' ? req.user.id : undefined
          data.progressVersion = (originalDoc.progressVersion ?? 1) + 1
        }
        return data
      },
    ],
  },
  labels: {
    plural: 'Procesi kandidata',
    singular: 'Proces kandidata',
  },
}
