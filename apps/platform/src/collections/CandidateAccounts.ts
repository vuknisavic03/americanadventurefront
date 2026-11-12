import { Forbidden, type Access, type CollectionConfig } from 'payload'

import { readPlatformEnvironment } from '../config/environment.ts'
import { assertCandidatePassword } from '../modules/candidate-accounts/passwordPolicy.ts'

const isAdministrator = ({ req }: Parameters<Access>[0]) => req.user?.collection === 'users'
const administratorFieldAccess = ({ req }: { req: { user?: { collection?: string } | null } }) =>
  req.user?.collection === 'users'

const administratorOrOwnAccount: Access = ({ req }) => {
  if (req.user?.collection === 'users') return true
  if (req.user?.collection !== 'candidate-accounts') return false

  return { id: { equals: req.user.id } }
}

function candidatePortalUrl(path: string, token: string) {
  const serverUrl = readPlatformEnvironment().serverUrl.replace(/\/$/, '')
  return `${serverUrl}${path}?token=${encodeURIComponent(token)}`
}

export const CandidateAccounts: CollectionConfig = {
  slug: 'candidate-accounts',
  access: {
    admin: isAdministrator,
    create: () => false,
    delete: isAdministrator,
    read: administratorOrOwnAccount,
    unlock: isAdministrator,
    update: administratorOrOwnAccount,
  },
  admin: {
    defaultColumns: ['fullName', 'email', 'accountStatus', 'activationExpiresAt', 'createdAt'],
    group: 'Kandidatski portal',
    useAsTitle: 'fullName',
  },
  auth: {
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
    forgotPassword: {
      expiration: 30 * 60 * 1_000,
      generateEmailHTML: (args) => {
        const url = candidatePortalUrl('/nalog/nova-lozinka', args?.token ?? '')
        return `<p>Zatražena je promena lozinke za vaš American Adventure nalog.</p><p><a href="${url}">Postavite novu lozinku</a></p><p>Link važi 30 minuta. Ako zahtev niste poslali vi, zanemarite ovu poruku.</p>`
      },
      generateEmailSubject: () => 'Promena lozinke | American Adventure',
    },
    lockTime: 15 * 60 * 1_000,
    maxLoginAttempts: 5,
    removeTokenFromResponses: true,
    tokenExpiration: 2 * 60 * 60,
    verify: true,
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      access: { update: administratorFieldAccess },
      required: true,
      unique: true,
    },
    {
      name: 'applicant',
      type: 'relationship',
      access: { update: () => false },
      admin: { readOnly: true },
      relationTo: 'applicants',
      required: true,
      unique: true,
    },
    {
      name: 'preApplication',
      type: 'relationship',
      access: { update: () => false },
      admin: { readOnly: true },
      relationTo: 'pre-applications',
      required: true,
      unique: true,
    },
    {
      name: 'fullName',
      type: 'text',
      access: { update: () => false },
      admin: { readOnly: true },
      required: true,
    },
    {
      name: 'citizenship',
      type: 'text',
      access: { update: () => false },
      admin: { readOnly: true },
      maxLength: 100,
    },
    {
      name: 'programCode',
      type: 'select',
      access: { update: () => false },
      admin: { readOnly: true },
      options: [{ label: 'Work & Travel', value: 'SWT' }],
      required: true,
    },
    {
      name: 'accountStatus',
      type: 'select',
      access: { update: () => false },
      admin: { readOnly: true },
      defaultValue: 'PENDING_ACTIVATION',
      label: 'Status pristupa',
      options: [
        { label: 'Čeka aktivaciju', value: 'PENDING_ACTIVATION' },
        { label: 'Aktivan', value: 'ACTIVE' },
        { label: 'Suspendovan', value: 'SUSPENDED' },
      ],
      required: true,
    },
    {
      name: 'activationVersion',
      type: 'number',
      admin: { hidden: true },
      defaultValue: 0,
      min: 0,
      required: true,
    },
    { name: 'activationNonce', type: 'text', admin: { hidden: true } },
    {
      name: 'activationIssuedAt',
      type: 'date',
      admin: { readOnly: true },
      label: 'Aktivacioni poziv izdat',
    },
    {
      name: 'activationExpiresAt',
      type: 'date',
      admin: { readOnly: true },
      label: 'Aktivacioni poziv važi do',
    },
    {
      name: 'activationIssuedBy',
      type: 'relationship',
      admin: { readOnly: true },
      label: 'Aktivacioni poziv izdao/la',
      relationTo: 'users',
    },
    {
      name: 'verifiedAt',
      type: 'date',
      access: { update: () => false },
      admin: { readOnly: true },
      label: 'Nalog aktiviran',
    },
  ],
  hooks: {
    beforeLogin: [
      ({ req, user }) => {
        if (user.accountStatus !== 'ACTIVE' || !user._verified) throw new Forbidden(req.t)
        return user
      },
    ],
    beforeOperation: [
      ({ args, operation }) => {
        if (!['create', 'resetPassword', 'update', 'updateByID'].includes(operation)) return
        if ('data' in args && args.data && 'password' in args.data) {
          assertCandidatePassword(args.data.password)
        }
      },
    ],
  },
  labels: {
    plural: 'Kandidatski nalozi',
    singular: 'Kandidatski nalog',
  },
}

