/**
 * Zvanične smernice agencije American Adventure za izradu Video CV-a (FR-042)
 * Izvor: "AA Instrukcija za pravljenje video CV-a.pdf"
 */

export interface VideoCvSample {
  title: string
  url: string
}

export interface VideoCvGuidelines {
  dressCode: string
  mandatoryFinalQuestion: string
  mandatoryTopics: readonly string[]
  maxDurationSeconds: number
  officialSampleVideos: readonly VideoCvSample[]
  recommendedQuestions: readonly string[]
  speechAdvice: string
}

export const VIDEO_CV_GUIDELINES: VideoCvGuidelines = {
  dressCode: 'Poslovno-ležerno (npr. muškarci: košulja, farmerke i cipele; devojke: bluza, farmerke i cipele).',
  mandatoryFinalQuestion: 'Šta bi još kompanija koja Vas zapošljava trebalo da zna o vama?',
  mandatoryTopics: [
    'Osnovne informacije o sebi (ime, prezime, grad iz kog dolazite, fakultet koji studirate)',
    'Radno iskustvo (ukoliko ste bili na SWT programu obavezno naglasite; u suprotnom navedite iskustvo u Srbiji ili volontiranje/školske aktivnosti)',
  ],
  maxDurationSeconds: 120, // 2 minuta
  officialSampleVideos: [
    { title: 'Primer 1', url: 'https://www.youtube.com/watch?v=5nfIF6QW3RM' },
    { title: 'Primer 2', url: 'https://youtu.be/PhtfiddS9P8?si=LlT1WzkrVwPHUoY1' },
    { title: 'Primer 3', url: 'https://youtu.be/GN8l0aBMz5I?si=9kUKFRBjLgG4SDAt' },
    { title: 'Primer 4', url: 'https://youtu.be/gxBT9ZUC93w' },
    { title: 'Primer 5', url: 'https://youtu.be/ZULkNRep1HA' },
  ],
  recommendedQuestions: [
    'Šta za Vas znači odlazak na Work and Travel program i zašto želite da idete?',
    'Šta želite da Amerikanci nauče o vašoj kulturi?',
    'Koje su Vaše najveće prednosti na poslu?',
    'Koji su Vaši ciljevi u karijeri?',
    'Šta Vas čini dobrim zaposlenim – zašto mislite da poslodavac baš Vas treba da zaposli?',
    'Šta mislite da će vam biti najveći izazov života i rada u Americi?',
    'Čemu se najviše radujete da vidite ili radite u Americi?',
    'Koje 3 stvari biste preporučili strancima da vide ili rade ako dođu u Srbiju?',
    'Kako bi vaš karakter opisala Vaša rodbina ili prijatelji?',
    'Koji je vaš omiljeni američki TV show ili film i zašto?',
    'Kako pripremate vaše omiljeno tradicionalno srpsko jelo?',
    'Da li igrate neki sport i koji je vaš omiljeni profesionalni tim?',
  ],
  speechAdvice: 'Pričajte polako i razgovetno sa osmehom na licu, jer je to u američkoj kulturi ključna odlika motivisanosti i profesionalizma.',
}

/**
 * Validira YouTube URL (podržava puni www.youtube.com format i skraćeni youtu.be)
 */
export function validateYouTubeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)[\w-]{11}(\S*)?$/
  return pattern.test(trimmed)
}

/**
 * Izvlači jedinstveni 11-karakterni YouTube Video ID iz URL-a
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/)
  return match ? match[1] : null
}
