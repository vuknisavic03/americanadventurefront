export const PASSPORT_AUTHORIZATION_ACCEPTANCE_STATEMENT_VERSION = '1.0'

export function passportAuthorizationAcceptanceStatement(number: string) {
  return `Potvrđujem da sam pročitao/la punomoćje broj ${number}, da su navedeni podaci tačni i da ga prihvatam putem svog zaštićenog kandidatskog naloga.`
}
