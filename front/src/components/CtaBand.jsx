// CtaBand.jsx — završni poziv na prijavu. Isti na svim javnim stranama, da akcija uvek bude na istom mestu.
import { Button, Container } from "./ui";

export default function CtaBand({
  title = "Prijave za leto 2027. su otvorene",
  text = "Prijava je besplatna i ne obavezuje. Popuni formular, a mi ti se javljamo sa procenom i sledećim koracima.",
  href = "/prijava-online?program=work-and-travel",
  label = "Prijavi se besplatno",
  onNavigate = () => {},
  className = "",
}) {
  return (
    <section className={`bg-brand ${className}`}>
      <Container className="flex flex-col gap-8 py-14 sm:py-16 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold leading-[1.1] text-ink sm:text-4xl">{title}</h2>
          <p className="mt-3 text-base leading-relaxed text-ink/80 sm:text-lg">{text}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
          <Button size="lg" variant="dark" href={href} onClick={(e) => onNavigate(e, href)}>
            {label}
          </Button>
          <a href="tel:+381641072004" className="text-center text-[15px] font-semibold text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink">
            ili pozovi +381 64 107 2004
          </a>
        </div>
      </Container>
    </section>
  );
}
