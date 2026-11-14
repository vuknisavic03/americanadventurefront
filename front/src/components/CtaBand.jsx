// CtaBand.jsx — završni poziv na prijavu. Isti na svim javnim stranama, da akcija uvek bude na istom mestu.
// Žuto polje kao putokaz, naslov preko cele širine, akcija ispod.
import { Button, Container, PlaneIcon } from "./ui";

export default function CtaBand({
  title = "Prijave za leto 2027. su otvorene",
  text = "Prijava je besplatna i ne obavezuje. Popuni formular, a mi ti se javljamo sa procenom i sledećim koracima.",
  href = "/prijava-online?program=work-and-travel",
  label = "Prijavi se besplatno",
  onNavigate = () => {},
  className = "",
  id,
}) {
  return (
    <section id={id} className={`overflow-hidden bg-brand ${className}`}>
      <Container className="max-w-7xl py-20 sm:py-28">
        <p className="flex max-w-xs items-center gap-3 text-ink/50" aria-hidden="true">
          <span className="perforation flex-1" />
          <PlaneIcon className="h-5 w-5 text-ink" />
        </p>
        <h2 className="font-display mt-6 max-w-5xl text-[clamp(2.6rem,6.6vw,5.6rem)] font-extrabold leading-[0.92] text-ink">{title}</h2>
        <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <p className="max-w-xl text-lg leading-relaxed text-ink/80">{text}</p>
          <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center">
            <Button size="lg" variant="dark" href={href} onClick={(e) => onNavigate(e, href)}>
              {label}
            </Button>
            <a href="tel:+381641072004" className="text-center text-[15px] font-semibold text-ink underline decoration-2 decoration-ink/30 underline-offset-[5px] hover:decoration-ink">
              ili pozovi 064 107 2004
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
