'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import { VisaQuestionnairePanel } from '../candidate-portal/VisaQuestionnairePanel.tsx'
import './VisaQuestionnaireManagementPanel.scss'

export function VisaQuestionnaireManagementPanel() {
  const { id } = useDocumentInfo()
  return id ? <VisaQuestionnairePanel key={id} processId={id} /> : null
}
