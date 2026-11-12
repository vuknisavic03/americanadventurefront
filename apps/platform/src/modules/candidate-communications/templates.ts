import { createHash } from 'node:crypto'

export type CommunicationCategory = 'ACCOUNT_ACTIVATION' | 'CONSULTATION_INVITATION' | 'EMBASSY_APPOINTMENT_REMINDER' | 'EMPLOYMENT_OFFER' | 'FLIGHT_TICKET_OFFER' | 'FLIGHT_TICKET_REQUEST' | 'JOB_SHORTLIST' | 'MATERIAL_BUNDLE'

export type CandidateCommunicationContext = {
  campaignName: string
  consultationBookingUrl: string
  firstName: string
  officialContactEmail: string
  officialPhone: string
  privacyPolicyUrl: string
  programName: string
  activationUrl?: string
  employerName?: string
  employmentOfferUrl?: string
  jobTitle?: string
  jobOptionCount?: number
  jobOptionsUrl?: string
  embassyAppointmentLabel?: string
  candidatePortalUrl?: string
  candidateFullName?: string
  flightRequestAdminUrl?: string
  flightRequestVersion?: number
  flightOfferOptionCount?: number
  flightOfferVersion?: number
}

export type RenderedCandidateMessage = {
  category: CommunicationCategory
  contentHash: string
  html: string
  subject: string
  templateKey: string
  templateVersion: string
  text: string
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function withHash(message: Omit<RenderedCandidateMessage, 'contentHash'>): RenderedCandidateMessage {
  return {
    ...message,
    contentHash: createHash('sha256')
      .update(`${message.subject}\n${message.text}\n${message.html}`)
      .digest('hex'),
  }
}

function renderMaterialBundle(context: CandidateCommunicationContext) {
  const firstName = context.firstName.trim()
  const text = `Zdravo ${firstName},

Hvala ti na interesovanju za program ${context.programName} u okviru sezone ${context.campaignName}.

Tvoja početna prijava je pregledana i možeš da nastaviš u sledeći korak procesa. Ova poruka ne predstavlja konačno prihvatanje na program, ugovor, ponudu za posao ili garanciju dobijanja vize.

Šta sledi:
1. Pročitaj ovaj kratki vodič i pripremi podatke ili pitanja koja želiš da razjasniš.
2. U posebnoj poruci dobićeš link za zakazivanje konsultacija.
3. Tokom konsultacija zaposleni agencije će objasniti naredne korake, dokumentaciju, rokove i obaveze za aktuelnu sezonu.
4. Korisnički profil se kreira tek nakon konsultacija i konačnog odobrenja agencije.

Nije potrebno da posebno potvrdiš da si pročitao/la ovaj vodič.

Za konsultacije pripremi podatke o fakultetu, gradu i godini studija, obnovi ili pauzi godine, ESPB bodovima, raspoloživosti tokom letnje sezone i pitanja o programu.

Ne šalji pasoš, JMBG, podatke platne kartice, bankovne podatke, lozinke ili verifikacione kodove emailom ili putem neodobrenih kanala.

Zvanični kontakt: ${context.officialContactEmail}
Telefon: ${context.officialPhone}
Politika privatnosti: ${context.privacyPolicyUrl}

Ovaj vodič služi samo kao priprema za konsultacije.

Srdačan pozdrav,
American Adventure`

  const html = `<!doctype html><html lang="sr"><body style="font-family:Arial,sans-serif;line-height:1.6;color:#172033;max-width:680px;margin:auto;padding:24px"><h1>Dobro došli u sledeći korak prijave</h1><p>Zdravo ${escapeHtml(firstName)},</p><p>Hvala ti na interesovanju za program <strong>${escapeHtml(context.programName)}</strong> u okviru sezone ${escapeHtml(context.campaignName)}.</p><p>Tvoja početna prijava je pregledana i možeš da nastaviš u sledeći korak procesa. Ova poruka ne predstavlja konačno prihvatanje na program, ugovor, ponudu za posao ili garanciju dobijanja vize.</p><h2>Šta sledi</h2><ol><li>Pročitaj ovaj kratki vodič i pripremi pitanja.</li><li>U posebnoj poruci dobićeš link za zakazivanje konsultacija.</li><li>Na konsultacijama ćemo objasniti naredne korake, dokumentaciju, rokove i obaveze.</li><li>Profil se kreira tek nakon konsultacija i konačnog odobrenja.</li></ol><p>Nije potrebno da posebno potvrdiš čitanje vodiča.</p><h2>Bezbedna komunikacija</h2><p>Ne šalji pasoš, JMBG, podatke platne kartice, bankovne podatke, lozinke ili verifikacione kodove emailom ili putem neodobrenih kanala.</p><p>Zvanični kontakt: <a href="mailto:${escapeHtml(context.officialContactEmail)}">${escapeHtml(context.officialContactEmail)}</a><br>Telefon: ${escapeHtml(context.officialPhone)}<br><a href="${escapeHtml(context.privacyPolicyUrl)}">Politika privatnosti</a></p><p>Ovaj vodič služi samo kao priprema za konsultacije.</p><p>Srdačan pozdrav,<br><strong>American Adventure</strong></p></body></html>`

  return withHash({
    category: 'MATERIAL_BUNDLE',
    html,
    subject: `Sledeći korak prijave za ${context.programName}`,
    templateKey: 'SWT_MVP_INFORMATION_PACK_SR',
    templateVersion: '0.1',
    text,
  })
}

function renderConsultationInvitation(context: CandidateCommunicationContext) {
  const firstName = context.firstName.trim()
  const text = `Zdravo ${firstName},

Informativni materijal za program ${context.programName} je uspešno poslat. Sada možeš da izabereš termin za SWT konsultacije:

${context.consultationBookingUrl}

Konsultacije traju 30 minuta. Pripremi pitanja o programu, rokovima, dokumentaciji i narednim koracima.

Ako imaš poteškoća sa zakazivanjem, piši na ${context.officialContactEmail} ili pozovi ${context.officialPhone}.

Srdačan pozdrav,
American Adventure`

  const html = `<!doctype html><html lang="sr"><body style="font-family:Arial,sans-serif;line-height:1.6;color:#172033;max-width:680px;margin:auto;padding:24px"><h1>Zakaži SWT konsultacije</h1><p>Zdravo ${escapeHtml(firstName)},</p><p>Informativni materijal za program <strong>${escapeHtml(context.programName)}</strong> je uspešno poslat. Sada možeš da izabereš termin za konsultacije.</p><p><a href="${escapeHtml(context.consultationBookingUrl)}" style="display:inline-block;padding:12px 18px;background:#1546a0;color:#fff;text-decoration:none;border-radius:6px">Izaberi termin</a></p><p>Konsultacije traju 30 minuta. Pripremi pitanja o programu, rokovima, dokumentaciji i narednim koracima.</p><p>Ako imaš poteškoća sa zakazivanjem, piši na <a href="mailto:${escapeHtml(context.officialContactEmail)}">${escapeHtml(context.officialContactEmail)}</a> ili pozovi ${escapeHtml(context.officialPhone)}.</p><p>Srdačan pozdrav,<br><strong>American Adventure</strong></p></body></html>`

  return withHash({
    category: 'CONSULTATION_INVITATION',
    html,
    subject: 'Zakaži SWT konsultacije',
    templateKey: 'SWT_CONSULTATION_INVITATION_SR',
    templateVersion: '0.1',
    text,
  })
}

function renderAccountActivation(context: CandidateCommunicationContext) {
  if (!context.activationUrl) throw new Error('Aktivaciona poruka zahteva aktivacioni URL.')
  const firstName = context.firstName.trim()
  const text = `Zdravo ${firstName},

Agencija je odobrila pristup tvom American Adventure kandidatskom portalu.

Aktiviraj nalog i postavi svoju lozinku preko ovog jednokratnog linka:
${context.activationUrl}

Link važi 48 sati. Ako istekne, obrati se agenciji da ti pošalje novi. Ne prosleđuj ovaj link drugim osobama i nikome ne šalji svoju lozinku.

Ako nisi očekivao/la ovu poruku, piši na ${context.officialContactEmail} ili pozovi ${context.officialPhone}.

Srdačan pozdrav,
American Adventure`

  const html = `<!doctype html><html lang="sr"><body style="font-family:Arial,sans-serif;line-height:1.6;color:#172033;max-width:680px;margin:auto;padding:24px"><h1>Aktiviraj kandidatski nalog</h1><p>Zdravo ${escapeHtml(firstName)},</p><p>Agencija je odobrila pristup tvom American Adventure kandidatskom portalu.</p><p><a href="${escapeHtml(context.activationUrl)}" style="display:inline-block;padding:12px 18px;background:#1546a0;color:#fff;text-decoration:none;border-radius:6px">Aktiviraj nalog</a></p><p>Link važi 48 sati i može se iskoristiti samo jednom. Ako istekne, obrati se agenciji da ti pošalje novi.</p><p>Ne prosleđuj ovaj link drugim osobama i nikome ne šalji svoju lozinku.</p><p>Ako nisi očekivao/la ovu poruku, piši na <a href="mailto:${escapeHtml(context.officialContactEmail)}">${escapeHtml(context.officialContactEmail)}</a> ili pozovi ${escapeHtml(context.officialPhone)}.</p><p>Srdačan pozdrav,<br><strong>American Adventure</strong></p></body></html>`

  return withHash({
    category: 'ACCOUNT_ACTIVATION',
    html,
    subject: 'Aktivirajte kandidatski nalog | American Adventure',
    templateKey: 'CANDIDATE_ACCOUNT_ACTIVATION_SR',
    templateVersion: '0.1',
    text,
  })
}

function renderEmploymentOffer(context: CandidateCommunicationContext) {
  if (!context.employmentOfferUrl || !context.employerName || !context.jobTitle) {
    throw new Error('Obaveštenje o radnoj ponudi zahteva podatke ponude i URL portala.')
  }
  const firstName = context.firstName.trim()
  const text = `Zdravo ${firstName},

Tvoj posao je potvrđen i nova radna ponuda za poziciju ${context.jobTitle} kod poslodavca ${context.employerName} dostupna je u American Adventure portalu.

Pregledaj sve uslove, uputstvo agencije i elektronski prihvati ponudu na:
${context.employmentOfferUrl}

Ako primetiš netačan podatak, nemoj prihvatati ponudu. Obrati se agenciji na ${context.officialContactEmail} ili ${context.officialPhone}.

Ne odgovaraj slanjem pasoša, JMBG-a, bankovnih podataka, lozinke ili verifikacionih kodova emailom.

Srdačan pozdrav,
American Adventure`
  const html = `<!doctype html><html lang="sr"><body style="font-family:Arial,sans-serif;line-height:1.6;color:#172033;max-width:680px;margin:auto;padding:24px"><h1>Radna ponuda je spremna</h1><p>Zdravo ${escapeHtml(firstName)},</p><p>Tvoj posao je potvrđen i nova radna ponuda za poziciju <strong>${escapeHtml(context.jobTitle)}</strong> kod poslodavca <strong>${escapeHtml(context.employerName)}</strong> dostupna je u American Adventure portalu.</p><p><a href="${escapeHtml(context.employmentOfferUrl)}" style="display:inline-block;padding:12px 18px;background:#1546a0;color:#fff;text-decoration:none;border-radius:6px">Pregledaj radnu ponudu</a></p><p>Pregledaj sve uslove i uputstvo agencije pre elektronskog prihvatanja.</p><p>Ako primetiš netačan podatak, nemoj prihvatati ponudu. Piši na <a href="mailto:${escapeHtml(context.officialContactEmail)}">${escapeHtml(context.officialContactEmail)}</a> ili pozovi ${escapeHtml(context.officialPhone)}.</p><p>Ne šalji pasoš, JMBG, bankovne podatke, lozinku ili verifikacione kodove emailom.</p><p>Srdačan pozdrav,<br><strong>American Adventure</strong></p></body></html>`
  return withHash({ category: 'EMPLOYMENT_OFFER', html, subject: `Radna ponuda: ${context.jobTitle} | American Adventure`, templateKey: 'SWT_EMPLOYMENT_OFFER_PUBLISHED_SR', templateVersion: '1.0', text })
}

function renderJobShortlist(context: CandidateCommunicationContext) {
  if (!context.jobOptionsUrl || !context.jobOptionCount || context.jobOptionCount < 1) throw new Error('Obaveštenje o poslovima zahteva broj opcija i URL portala.')
  const firstName = context.firstName.trim()
  const text = `Zdravo ${firstName},

Agencija je za tebe izdvojila ${context.jobOptionCount} ${context.jobOptionCount === 1 ? 'opciju posla' : 'opcije poslova'} za program ${context.programName}.

Uporedi lokaciju, satnicu, očekivane sate, period rada i smeštaj, pa u portalu označi poslove koji te interesuju:
${context.jobOptionsUrl}

Ove opcije nisu konačna potvrda zaposlenja. Nakon tvog interesovanja agencija proverava dostupnost sa poslodavcem i šalje posebnu zvaničnu radnu ponudu.

Ako imaš pitanje, piši na ${context.officialContactEmail} ili pozovi ${context.officialPhone}.

Srdačan pozdrav,
American Adventure`
  const html = `<!doctype html><html lang="sr"><body style="font-family:Arial,sans-serif;line-height:1.6;color:#172033;max-width:680px;margin:auto;padding:24px"><h1>Izdvojene su opcije poslova za tebe</h1><p>Zdravo ${escapeHtml(firstName)},</p><p>Agencija je za tebe izdvojila <strong>${context.jobOptionCount}</strong> ${context.jobOptionCount === 1 ? 'opciju posla' : 'opcije poslova'} za program <strong>${escapeHtml(context.programName)}</strong>.</p><p><a href="${escapeHtml(context.jobOptionsUrl)}" style="display:inline-block;padding:12px 18px;background:#1546a0;color:#fff;text-decoration:none;border-radius:6px">Uporedi opcije poslova</a></p><p>Pregledaj lokaciju, satnicu, očekivane sate, period rada i smeštaj, pa označi poslove koji te interesuju.</p><p>Ove opcije nisu konačna potvrda zaposlenja. Nakon tvog interesovanja agencija proverava dostupnost sa poslodavcem i šalje posebnu zvaničnu radnu ponudu.</p><p>Za pitanja piši na <a href="mailto:${escapeHtml(context.officialContactEmail)}">${escapeHtml(context.officialContactEmail)}</a> ili pozovi ${escapeHtml(context.officialPhone)}.</p><p>Srdačan pozdrav,<br><strong>American Adventure</strong></p></body></html>`
  return withHash({ category: 'JOB_SHORTLIST', html, subject: `Nove opcije poslova (${context.jobOptionCount}) | American Adventure`, templateKey: 'SWT_CANDIDATE_JOB_SHORTLIST_SR', templateVersion: '1.0', text })
}

function renderEmbassyAppointmentReminder(context: CandidateCommunicationContext) {
  if (!context.embassyAppointmentLabel || !context.candidatePortalUrl) throw new Error('Podsetnik za ambasadu zahteva termin i URL portala.')
  const firstName = context.firstName.trim()
  const text = `Zdravo ${firstName},\n\nPodsećamo te da je tvoj termin u Ambasadi SAD zakazan za ${context.embassyAppointmentLabel}.\n\nProveri dokumentaciju i uputstva agencije u portalu: ${context.candidatePortalUrl}\n\nAko je termin promenjen, odmah ažuriraj podatak u portalu ili kontaktiraj agenciju na ${context.officialContactEmail} ili ${context.officialPhone}.\n\nSrdačan pozdrav,\nAmerican Adventure`
  const html = `<!doctype html><html lang="sr"><body style="font-family:Arial,sans-serif;line-height:1.6;color:#172033;max-width:680px;margin:auto;padding:24px"><h1>Podsetnik za termin u ambasadi</h1><p>Zdravo ${escapeHtml(firstName)},</p><p>Podsećamo te da je tvoj termin u Ambasadi SAD zakazan za <strong>${escapeHtml(context.embassyAppointmentLabel)}</strong>.</p><p><a href="${escapeHtml(context.candidatePortalUrl)}" style="display:inline-block;padding:12px 18px;background:#1546a0;color:#fff;text-decoration:none;border-radius:6px">Otvori kandidatski portal</a></p><p>Proveri dokumentaciju i uputstva agencije. Ako je termin promenjen, odmah ažuriraj podatak u portalu ili kontaktiraj agenciju.</p><p>${escapeHtml(context.officialContactEmail)} · ${escapeHtml(context.officialPhone)}</p><p>Srdačan pozdrav,<br><strong>American Adventure</strong></p></body></html>`
  return withHash({ category: 'EMBASSY_APPOINTMENT_REMINDER', html, subject: `Podsetnik: termin u ambasadi ${context.embassyAppointmentLabel}`, templateKey: 'SWT_EMBASSY_APPOINTMENT_REMINDER_SR', templateVersion: '1.0', text })
}

function renderFlightTicketRequestNotification(context: CandidateCommunicationContext) {
  if (!context.candidateFullName || !context.flightRequestAdminUrl || !context.flightRequestVersion) throw new Error('Obaveštenje o avionskoj karti zahteva kandidata, verziju i URL admin portala.')
  const text = `Novi ili izmenjeni zahtev za avionsku kartu čeka obradu.\n\nKandidat: ${context.candidateFullName}\nVerzija zahteva: ${context.flightRequestVersion}\n\nOtvorite merodavne podatke u admin portalu:\n${context.flightRequestAdminUrl}\n\nDatumi i destinacije namerno nisu poslati emailom.`
  const html = `<!doctype html><html lang="sr"><body style="font-family:Arial,sans-serif;line-height:1.6;color:#172033;max-width:680px;margin:auto;padding:24px"><h1>Zahtev za avionsku kartu čeka obradu</h1><p>Kandidat: <strong>${escapeHtml(context.candidateFullName)}</strong></p><p>Verzija zahteva: <strong>${context.flightRequestVersion}</strong></p><p><a href="${escapeHtml(context.flightRequestAdminUrl)}" style="display:inline-block;padding:12px 18px;background:#1546a0;color:#fff;text-decoration:none;border-radius:6px">Otvori zahtev u admin portalu</a></p><p>Datumi i destinacije namerno nisu poslati emailom. Merodavni podaci nalaze se samo u zaštićenom admin portalu.</p></body></html>`
  return withHash({ category: 'FLIGHT_TICKET_REQUEST', html, subject: `Zahtev za avionsku kartu · ${context.candidateFullName}`, templateKey: 'SWT_FLIGHT_TICKET_REQUEST_ADMIN_SR', templateVersion: '1.0', text })
}

function renderFlightTicketOfferNotification(context: CandidateCommunicationContext) {
  if (!context.candidatePortalUrl || !context.flightOfferOptionCount || !context.flightOfferVersion) throw new Error('Obaveštenje o ponudi avionske karte zahteva verziju, broj opcija i URL portala.')
  const firstName = context.firstName.trim()
  const text = `Zdravo ${firstName},

Agencija je objavila ponudu avionske karte, verzija ${context.flightOfferVersion}, sa ${context.flightOfferOptionCount} ${context.flightOfferOptionCount === 1 ? 'opcijom leta' : 'opcijama leta'}.

Detalje o rutama, terminima, prtljagu, cenama i uslovima pregledaj isključivo u zaštićenom kandidatskom portalu:
${context.candidatePortalUrl}

U portalu možeš da prihvatiš jednu opciju ili odbiješ celu ponudu. Ova poruka nije avionska karta, rezervacija niti nalog za uplatu.

Za pitanja piši na ${context.officialContactEmail} ili pozovi ${context.officialPhone}.

Srdačan pozdrav,
American Adventure`
  const html = `<!doctype html><html lang="sr"><body style="font-family:Arial,sans-serif;line-height:1.6;color:#172033;max-width:680px;margin:auto;padding:24px"><h1>Nova ponuda avionske karte</h1><p>Zdravo ${escapeHtml(firstName)},</p><p>Agencija je objavila ponudu, verzija <strong>${context.flightOfferVersion}</strong>, sa <strong>${context.flightOfferOptionCount}</strong> ${context.flightOfferOptionCount === 1 ? 'opcijom leta' : 'opcijama leta'}.</p><p><a href="${escapeHtml(context.candidatePortalUrl)}" style="display:inline-block;padding:12px 18px;background:#1546a0;color:#fff;text-decoration:none;border-radius:6px">Pregledaj ponudu u portalu</a></p><p>Rute, termini, prtljag, cene i uslovi namerno nisu poslati emailom. U portalu možeš da prihvatiš jednu opciju ili odbiješ celu ponudu.</p><p>Ova poruka nije avionska karta, rezervacija niti nalog za uplatu.</p><p>Za pitanja piši na <a href="mailto:${escapeHtml(context.officialContactEmail)}">${escapeHtml(context.officialContactEmail)}</a> ili pozovi ${escapeHtml(context.officialPhone)}.</p><p>Srdačan pozdrav,<br><strong>American Adventure</strong></p></body></html>`
  return withHash({ category: 'FLIGHT_TICKET_OFFER', html, subject: `Ponuda avionske karte · verzija ${context.flightOfferVersion}`, templateKey: 'SWT_FLIGHT_TICKET_OFFER_CANDIDATE_SR', templateVersion: '1.0', text })
}

export function renderCandidateMessage(
  category: CommunicationCategory,
  context: CandidateCommunicationContext,
) {
  if (category === 'MATERIAL_BUNDLE') return renderMaterialBundle(context)
  if (category === 'CONSULTATION_INVITATION') return renderConsultationInvitation(context)
  if (category === 'EMPLOYMENT_OFFER') return renderEmploymentOffer(context)
  if (category === 'JOB_SHORTLIST') return renderJobShortlist(context)
  if (category === 'EMBASSY_APPOINTMENT_REMINDER') return renderEmbassyAppointmentReminder(context)
  if (category === 'FLIGHT_TICKET_REQUEST') return renderFlightTicketRequestNotification(context)
  if (category === 'FLIGHT_TICKET_OFFER') return renderFlightTicketOfferNotification(context)
  return renderAccountActivation(context)
}
