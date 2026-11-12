import * as migration_20260826_162429_initial_schema from './20260826_162429_initial_schema';
import * as migration_20260827_112615_pre_application_intake from './20260827_112615_pre_application_intake';
import * as migration_20260827_135104_admin_application_processing from './20260827_135104_admin_application_processing';
import * as migration_20260827_171850_qualified_candidate_communications from './20260827_171850_qualified_candidate_communications';
import * as migration_20260828_103700_consultation_management from './20260828_103700_consultation_management';
import * as migration_20260828_150000_candidate_account_activation from './20260828_150000_candidate_account_activation';
import * as migration_20260829_100000_admin_issued_candidate_activation from './20260829_100000_admin_issued_candidate_activation';
import * as migration_20260829_180000_candidate_profile_process_portal from './20260829_180000_candidate_profile_process_portal';
import * as migration_20260829_210000_program_offer_payment_selection from './20260829_210000_program_offer_payment_selection';
import * as migration_20260830_120000_secure_contract_foundation from './20260830_120000_secure_contract_foundation';
import * as migration_20260830_150000_remove_jmbg_mask from './20260830_150000_remove_jmbg_mask';
import * as migration_20260831_090000_normalize_candidate_verification_token from './20260831_090000_normalize_candidate_verification_token';
import * as migration_20260901_100000_generated_contracts from './20260901_100000_generated_contracts';
import * as migration_20260901_140000_remove_contract_number_sequence from './20260901_140000_remove_contract_number_sequence';
import * as migration_20260901_170000_contract_acceptance from './20260901_170000_contract_acceptance';
import * as migration_20260901_202033_initial_payment_ledger from './20260901_202033_initial_payment_ledger';
import * as migration_20260902_105022_program_applications from './20260902_105022_program_applications';
import * as migration_20260905_120934_persistent_rate_limits from './20260905_120934_persistent_rate_limits';
import * as migration_20260905_183040_program_document_checklist from './20260905_183040_program_document_checklist';
import * as migration_20260908_084831_job_interview_preparation from './20260908_084831_job_interview_preparation';
import * as migration_20260908_133848 from './20260908_133848';
import * as migration_20260908_151446 from './20260908_151446';
import * as migration_20260909_080703_visa_payment_orders from './20260909_080703_visa_payment_orders';
import * as migration_20260909_142630_visa_questionnaires from './20260909_142630_visa_questionnaires';
import * as migration_20260913_083208 from './20260913_083208';
import * as migration_20260914_111511 from './20260914_111511';
import * as migration_20260915_080548_embassy_appointments_reminders from './20260915_080548_embassy_appointments_reminders';
import * as migration_20260916_164103_embassy_interview_preparation from './20260916_164103_embassy_interview_preparation';
import * as migration_20260917_081937_flight_ticket_requests from './20260917_081937_flight_ticket_requests';
import * as migration_20260921_182417_payload_3_90_1_auth_security from './20260921_182417_payload_3_90_1_auth_security';
import * as migration_20260922_104546_flight_ticket_offers from './20260922_104546_flight_ticket_offers';
import * as migration_20260924_163731_fr_058_flight_ticket_payment_orders from './20260924_163731_fr_058_flight_ticket_payment_orders';
import * as migration_20260925_101401_fr_059_orientation_meetings from './20260925_101401_fr_059_orientation_meetings';
import * as migration_20261008_120000_fr_060_062_usa_stay_support from './20261008_120000_fr_060_062_usa_stay_support';
import * as migration_20261008_200000_admin_candidate_export_audit_event from './20261008_200000_admin_candidate_export_audit_event';
import * as migration_20261008_220000_admin_communications_and_notifications from './20261008_220000_admin_communications_and_notifications';
import * as migration_20261009_120000_document_translations_fr_075 from './20261009_120000_document_translations_fr_075';
import * as migration_20261009_140000_candidate_invoices_and_kir from './20261009_140000_candidate_invoices_and_kir';
import * as migration_20261010_220000_payment_reminders from './20261010_220000_payment_reminders';
import * as migration_20261012_120000_commercial_discounts from './20261012_120000_commercial_discounts';
import * as migration_20261012_140000_pkz_guarantor from './20261012_140000_pkz_guarantor';
import * as migration_20261015_140000_passport_ocr from './20261015_140000_passport_ocr';
import * as migration_20261101_130000_candidate_invitations_and_applications from './20261101_130000_candidate_invitations_and_applications';

export const migrations = [
  {
    up: migration_20260826_162429_initial_schema.up,
    down: migration_20260826_162429_initial_schema.down,
    name: '20260826_162429_initial_schema',
  },
  {
    up: migration_20260827_112615_pre_application_intake.up,
    down: migration_20260827_112615_pre_application_intake.down,
    name: '20260827_112615_pre_application_intake',
  },
  {
    up: migration_20260827_135104_admin_application_processing.up,
    down: migration_20260827_135104_admin_application_processing.down,
    name: '20260827_135104_admin_application_processing',
  },
  {
    up: migration_20260827_171850_qualified_candidate_communications.up,
    down: migration_20260827_171850_qualified_candidate_communications.down,
    name: '20260827_171850_qualified_candidate_communications',
  },
  {
    up: migration_20260828_103700_consultation_management.up,
    down: migration_20260828_103700_consultation_management.down,
    name: '20260828_103700_consultation_management',
  },
  {
    up: migration_20260828_150000_candidate_account_activation.up,
    down: migration_20260828_150000_candidate_account_activation.down,
    name: '20260828_150000_candidate_account_activation',
  },
  {
    up: migration_20260829_100000_admin_issued_candidate_activation.up,
    down: migration_20260829_100000_admin_issued_candidate_activation.down,
    name: '20260829_100000_admin_issued_candidate_activation',
  },
  {
    up: migration_20260829_180000_candidate_profile_process_portal.up,
    down: migration_20260829_180000_candidate_profile_process_portal.down,
    name: '20260829_180000_candidate_profile_process_portal',
  },
  {
    up: migration_20260829_210000_program_offer_payment_selection.up,
    down: migration_20260829_210000_program_offer_payment_selection.down,
    name: '20260829_210000_program_offer_payment_selection',
  },
  {
    up: migration_20260830_120000_secure_contract_foundation.up,
    down: migration_20260830_120000_secure_contract_foundation.down,
    name: '20260830_120000_secure_contract_foundation',
  },
  {
    up: migration_20260830_150000_remove_jmbg_mask.up,
    down: migration_20260830_150000_remove_jmbg_mask.down,
    name: '20260830_150000_remove_jmbg_mask',
  },
  {
    up: migration_20260831_090000_normalize_candidate_verification_token.up,
    down: migration_20260831_090000_normalize_candidate_verification_token.down,
    name: '20260831_090000_normalize_candidate_verification_token',
  },
  {
    up: migration_20260901_100000_generated_contracts.up,
    down: migration_20260901_100000_generated_contracts.down,
    name: '20260901_100000_generated_contracts',
  },
  {
    up: migration_20260901_140000_remove_contract_number_sequence.up,
    down: migration_20260901_140000_remove_contract_number_sequence.down,
    name: '20260901_140000_remove_contract_number_sequence',
  },
  {
    up: migration_20260901_170000_contract_acceptance.up,
    down: migration_20260901_170000_contract_acceptance.down,
    name: '20260901_170000_contract_acceptance',
  },
  {
    up: migration_20260901_202033_initial_payment_ledger.up,
    down: migration_20260901_202033_initial_payment_ledger.down,
    name: '20260901_202033_initial_payment_ledger',
  },
  {
    up: migration_20260902_105022_program_applications.up,
    down: migration_20260902_105022_program_applications.down,
    name: '20260902_105022_program_applications',
  },
  {
    up: migration_20260905_120934_persistent_rate_limits.up,
    down: migration_20260905_120934_persistent_rate_limits.down,
    name: '20260905_120934_persistent_rate_limits',
  },
  {
    up: migration_20260905_183040_program_document_checklist.up,
    down: migration_20260905_183040_program_document_checklist.down,
    name: '20260905_183040_program_document_checklist',
  },
  {
    up: migration_20260908_084831_job_interview_preparation.up,
    down: migration_20260908_084831_job_interview_preparation.down,
    name: '20260908_084831_job_interview_preparation',
  },
  {
    up: migration_20260908_133848.up,
    down: migration_20260908_133848.down,
    name: '20260908_133848',
  },
  {
    up: migration_20260908_151446.up,
    down: migration_20260908_151446.down,
    name: '20260908_151446',
  },
  {
    up: migration_20260909_080703_visa_payment_orders.up,
    down: migration_20260909_080703_visa_payment_orders.down,
    name: '20260909_080703_visa_payment_orders',
  },
  {
    up: migration_20260909_142630_visa_questionnaires.up,
    down: migration_20260909_142630_visa_questionnaires.down,
    name: '20260909_142630_visa_questionnaires',
  },
  {
    up: migration_20260913_083208.up,
    down: migration_20260913_083208.down,
    name: '20260913_083208',
  },
  {
    up: migration_20260914_111511.up,
    down: migration_20260914_111511.down,
    name: '20260914_111511',
  },
  {
    up: migration_20260915_080548_embassy_appointments_reminders.up,
    down: migration_20260915_080548_embassy_appointments_reminders.down,
    name: '20260915_080548_embassy_appointments_reminders',
  },
  {
    up: migration_20260916_164103_embassy_interview_preparation.up,
    down: migration_20260916_164103_embassy_interview_preparation.down,
    name: '20260916_164103_embassy_interview_preparation',
  },
  {
    up: migration_20260917_081937_flight_ticket_requests.up,
    down: migration_20260917_081937_flight_ticket_requests.down,
    name: '20260917_081937_flight_ticket_requests',
  },
  {
    up: migration_20260921_182417_payload_3_90_1_auth_security.up,
    down: migration_20260921_182417_payload_3_90_1_auth_security.down,
    name: '20260921_182417_payload_3_90_1_auth_security',
  },
  {
    up: migration_20260922_104546_flight_ticket_offers.up,
    down: migration_20260922_104546_flight_ticket_offers.down,
    name: '20260922_104546_flight_ticket_offers',
  },
  {
    up: migration_20260924_163731_fr_058_flight_ticket_payment_orders.up,
    down: migration_20260924_163731_fr_058_flight_ticket_payment_orders.down,
    name: '20260924_163731_fr_058_flight_ticket_payment_orders',
  },
  {
    up: migration_20260925_101401_fr_059_orientation_meetings.up,
    down: migration_20260925_101401_fr_059_orientation_meetings.down,
    name: '20260925_101401_fr_059_orientation_meetings',
  },
  {
    up: migration_20261008_120000_fr_060_062_usa_stay_support.up,
    down: migration_20261008_120000_fr_060_062_usa_stay_support.down,
    name: '20261008_120000_fr_060_062_usa_stay_support',
  },
  {
    up: migration_20261008_200000_admin_candidate_export_audit_event.up,
    down: migration_20261008_200000_admin_candidate_export_audit_event.down,
    name: '20261008_200000_admin_candidate_export_audit_event',
  },
  {
    up: migration_20261008_220000_admin_communications_and_notifications.up,
    down: migration_20261008_220000_admin_communications_and_notifications.down,
    name: '20261008_220000_admin_communications_and_notifications',
  },
  {
    up: migration_20261009_120000_document_translations_fr_075.up,
    down: migration_20261009_120000_document_translations_fr_075.down,
    name: '20261009_120000_document_translations_fr_075',
  },
  {
    up: migration_20261009_140000_candidate_invoices_and_kir.up,
    down: migration_20261009_140000_candidate_invoices_and_kir.down,
    name: '20261009_140000_candidate_invoices_and_kir',
  },
  {
    up: migration_20261010_220000_payment_reminders.up,
    down: migration_20261010_220000_payment_reminders.down,
    name: '20261010_220000_payment_reminders',
  },
  {
    up: migration_20261012_120000_commercial_discounts.up,
    down: migration_20261012_120000_commercial_discounts.down,
    name: '20261012_120000_commercial_discounts',
  },
  {
    up: migration_20261012_140000_pkz_guarantor.up,
    down: migration_20261012_140000_pkz_guarantor.down,
    name: '20261012_140000_pkz_guarantor',
  },
  {
    up: migration_20261015_140000_passport_ocr.up,
    down: migration_20261015_140000_passport_ocr.down,
    name: '20261015_140000_passport_ocr',
  },
  {
    up: migration_20261101_130000_candidate_invitations_and_applications.up,
    down: migration_20261101_130000_candidate_invitations_and_applications.down,
    name: '20261101_130000_candidate_invitations_and_applications',
  },
];
