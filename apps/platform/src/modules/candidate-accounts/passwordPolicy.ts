import { APIError } from 'payload'

export const CANDIDATE_PASSWORD_MINIMUM_LENGTH = 12
export const CANDIDATE_PASSWORD_MAXIMUM_LENGTH = 128

export function assertCandidatePassword(password: unknown) {
  if (
    typeof password !== 'string' ||
    password.length < CANDIDATE_PASSWORD_MINIMUM_LENGTH ||
    password.length > CANDIDATE_PASSWORD_MAXIMUM_LENGTH
  ) {
    throw new APIError(
      `Lozinka mora imati između ${CANDIDATE_PASSWORD_MINIMUM_LENGTH} i ${CANDIDATE_PASSWORD_MAXIMUM_LENGTH} znakova.`,
      400,
      null,
      true,
    )
  }
}

