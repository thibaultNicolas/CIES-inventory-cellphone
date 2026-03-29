import Link from "next/link";
import type { ReactNode } from "react";
import { getTranslations } from "@/lib/translations";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Lock,
  Package,
  PhoneCall,
  Star,
  Zap,
} from "lucide-react";

type BusinessServiceContentProps = {
  locale: "fr" | "en";
};

export function BusinessServiceContent({
  locale,
}: BusinessServiceContentProps) {
  const isFr = locale === "fr";
  const t = getTranslations(locale);

  const homeContactPath = isFr ? "/contact" : "/en/contact";
  const homeRachatPath = isFr ? "/" : "/en";
  const businessReviews = t.home.reviews.reviews;

  const calendarLink = isFr
    ? "https://calendar.google.com/calendar/u/0/r/eventedit?text=Appel%20-%20Service%20aux%20entreprises%20(AcheteTonCell)&details=Bonjour%2C%0A%0AJe%20souhaite%20planifier%20un%20appel%20pour%20le%20rachat%20d%27une%20flotte%20d%27appareils.%0A%0AMerci%21&location=Téléphone"
    : "https://calendar.google.com/calendar/u/0/r/eventedit?text=Call%20-%20Business%20services%20(AcheteTonCell)&details=Hello%2C%0A%0AI%27d%20like%20to%20schedule%20a%20call%20about%20bulk%20device%20trade-in.%0A%0AThanks!&location=Phone";

  return (
    <div className="bg-[#F4F1EA]">
      {/* Section 1 */}
      <section className="relative overflow-hidden pt-20 pb-14 sm:pt-28 sm:pb-20">
        <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-brand-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-brand-dark/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <span className="mb-4 block text-xs font-semibold uppercase tracking-[0.2em] text-foreground/50 sm:mb-6">
            {isFr ? "Service aux entreprises" : "Business services"}
          </span>
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-16">
            <h1 className="mt-2 font-(family-name:--font-playfair) text-3xl font-semibold leading-tight text-brand-dark sm:mt-3 sm:text-4xl md:text-5xl">
              {isFr
                ? "Rachat de flottes de téléphones cellulaire pour entreprises"
                : "Bulk cellphone fleet buyback for businesses"}
            </h1>
          </div>
          <div className="mt-6 max-w-3xl space-y-5">
            <p className="text-sm leading-relaxed text-foreground/75 sm:text-base">
              {isFr
                ? "Vendez vos appareils électroniques rapidement, simplement et au meilleur prix."
                : "Sell your electronic devices quickly, simply, and at the best price."}
            </p>

            <div className="rounded-2xl border border-brand-primary/15 bg-white/70 p-4 text-sm text-foreground/80 shadow-[var(--shadow-soft)] sm:p-5">
              {isFr
                ? "Service prioritaire pour les entreprises, organisations et institutions ayant plusieurs appareils à vendre."
                : "Priority service for businesses, organizations, and institutions with multiple devices to sell."}
            </div>

            <ul className="grid gap-3 sm:grid-cols-3">
              <li className="flex items-center gap-3 rounded-2xl border border-black/6 bg-white/80 p-4 shadow-[var(--shadow-soft)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                  <Zap className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {isFr ? "Évaluation rapide" : "Fast evaluation"}
                </span>
              </li>
              <li className="flex items-center gap-3 rounded-2xl border border-black/6 bg-white/80 p-4 shadow-[var(--shadow-soft)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                  <Lock className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {isFr ? "Processus sécurisé" : "Secure process"}
                </span>
              </li>
              <li className="flex items-center gap-3 rounded-2xl border border-black/6 bg-white/80 p-4 shadow-[var(--shadow-soft)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                  <CircleDollarSign className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {isFr ? "Paiement rapide" : "Fast payout"}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 2 */}
      <section className="border-t border-black/5 bg-white py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <h2 className="font-(family-name:--font-playfair) text-2xl font-semibold text-brand-dark sm:text-3xl">
              {isFr
                ? "Vous avez plusieurs téléphones cellulaires à vendre ?"
                : "Do you have multiple cellphones to sell?"}
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-foreground/75 sm:text-base">
              <p>
                {isFr
                  ? "On le sait : gérer une flotte d’appareils usagés peut rapidement devenir une perte de temps."
                  : "We know: managing a fleet of used devices can quickly become a time sink."}
              </p>
              <p>
                {isFr
                  ? "Entre l’inventaire, la revente et la logistique, cela mobilise des ressources que vous pourriez consacrer à votre entreprise."
                  : "Between inventory, resale, and logistics, it uses resources you could spend on your business."}
              </p>
              <p className="font-medium text-foreground">
                {isFr ? "Nous nous occupons de tout." : "We handle everything."}
              </p>
            </div>
          </div>

          <div className="mt-10 overflow-hidden rounded-3xl bg-brand-primary px-5 py-10 shadow-[0_14px_50px_-30px_rgba(0,38,255,0.6)] sm:mt-12 sm:px-8">
            <div className="grid gap-6 md:grid-cols-3">
              <InfoCard
                icon={<Package className="h-6 w-6" aria-hidden />}
                title={isFr ? "Collecte des appareils" : "Device collection"}
                description={
                  isFr
                    ? "Collecte et logistique adaptées à votre volume."
                    : "Pickup and logistics adapted to your volume."
                }
              />
              <InfoCard
                icon={<ClipboardCheck className="h-6 w-6" aria-hidden />}
                title={
                  isFr
                    ? "Inspection professionnelle"
                    : "Professional inspection"
                }
                description={
                  isFr
                    ? "Vérification et évaluation selon l’état réel."
                    : "Check and evaluate based on real condition."
                }
              />
              <InfoCard
                icon={<CircleDollarSign className="h-6 w-6" aria-hidden />}
                title={
                  isFr
                    ? "Offre rapide et paiement sécurisé"
                    : "Fast offer and secure payment"
                }
                description={
                  isFr
                    ? "Offre claire, paiement sécurisé, suivi simple."
                    : "Clear offer, secure payment, simple tracking."
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 */}
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="font-(family-name:--font-playfair) text-2xl font-semibold text-brand-dark sm:text-3xl">
            {isFr
              ? "Une solution simple pour les organisations"
              : "A simple solution for organizations"}
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <OrgPill label={isFr ? "🏢 Une entreprise" : "🏢 A business"} />
            <OrgPill
              label={isFr ? "🏫 Une institution" : "🏫 An institution"}
            />
            <OrgPill
              label={
                isFr
                  ? "🏦 Une organisation publique"
                  : "🏦 A public organization"
              }
            />
            <OrgPill
              label={
                isFr
                  ? "💼 Un gestionnaire de flotte mobile"
                  : "💼 A fleet manager"
              }
            />
          </div>

          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-foreground/75 sm:text-base">
            {isFr
              ? "Nous offrons un service rapide et personnalisé pour le rachat de vos téléphones."
              : "We offer fast, personalized service to buy back your phones."}
          </p>

          <div className="mt-8">
            <p className="text-sm font-semibold text-foreground sm:text-base">
              {isFr
                ? "3 façons rapides de nous contacter"
                : "3 fast ways to contact us"}
            </p>
            <p className="mt-1 text-sm text-foreground/70">
              {isFr
                ? "3 options express pour vendre vos appareils"
                : "3 express options to sell your devices"}
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <ActionCard
                number="1"
                title={isFr ? "Appel direct" : "Direct call"}
                description={
                  isFr
                    ? "Parlez immédiatement avec un spécialiste."
                    : "Talk with a specialist right away."
                }
                ctaLabel={isFr ? "📞 Appelez-nous" : "📞 Call us"}
                href="tel:+18338032023"
                icon={<PhoneCall className="h-5 w-5" aria-hidden />}
              />

              <ActionCard
                number="2"
                title={isFr ? "Planifier un rappel" : "Schedule a call"}
                description={
                  isFr
                    ? "Choisissez l’heure qui vous convient."
                    : "Pick a time that works for you."
                }
                ctaLabel={isFr ? "📅 Planifier un appel" : "📅 Schedule a call"}
                href={calendarLink}
                external
                icon={<CalendarClock className="h-5 w-5" aria-hidden />}
              />

              <ActionCard
                number="3"
                title={
                  isFr
                    ? "Remplissez notre formulaire de rachat en ligne"
                    : "Fill out our online trade-in form"
                }
                description={
                  isFr
                    ? "Une fois le formulaire complété, notre équipe vous contactera rapidement afin de vous proposer la solution de collecte et de paiement la plus rapide et la mieux adaptée à vos besoins."
                    : "Once submitted, our team will quickly contact you to propose the fastest collection and payout option tailored to your needs."
                }
                ctaLabel={
                  isFr ? "DÉMARRER MON ÉVALUATION" : "START MY EVALUATION"
                }
                href={homeRachatPath}
                icon={<ArrowRight className="h-5 w-5" aria-hidden />}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 */}
      <section className="border-t border-black/5 bg-white py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="font-(family-name:--font-playfair) text-2xl font-semibold text-brand-dark sm:text-3xl">
            {isFr
              ? "Pourquoi les entreprises nous choisissent"
              : "Why companies choose us"}
          </h2>

          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            <WhyItem
              label={
                isFr
                  ? "⚡ Évaluation rapide des appareils"
                  : "⚡ Fast device evaluation"
              }
            />
            <WhyItem
              label={
                isFr
                  ? "💰 Offres compétitives sur le marché"
                  : "💰 Competitive market offers"
              }
            />
            <WhyItem
              label={
                isFr
                  ? "🔒 Service personnalisé, fiabilité et sécurisé"
                  : "🔒 Personalized, reliable, secure service"
              }
            />
            <WhyItem
              label={
                isFr
                  ? "📦 Logistique simplifiée pour les volumes"
                  : "📦 Simplified logistics for volume"
              }
            />
            <WhyItem
              label={
                isFr
                  ? "🇨🇦 Entreprise québécoise spécialisée en appareils mobiles"
                  : "🇨🇦 Quebec-based mobile device specialists"
              }
            />
          </ul>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {businessReviews.slice(0, 3).map((review, i) => (
              <ReviewCard
                key={i}
                quote={review.text}
                author={review.name}
                stars={review.stars}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Section 5 */}
      <section className="bg-[#F4F1EA] py-14 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rounded-3xl bg-gradient-to-br from-brand-dark to-brand-primary p-6 text-background shadow-[0_14px_50px_-30px_rgba(0,0,0,0.6)] sm:p-10">
            <h2 className="font-(family-name:--font-playfair) text-2xl font-semibold sm:text-3xl">
              {isFr
                ? "Transformez vos téléphones inutilisés en valeur."
                : "Turn unused phones into value."}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-background/85 sm:text-base">
              {isFr
                ? "Que vous ayez 5, 40 ou 100+ appareils, notre équipe peut vous proposer une solution rapide et efficace."
                : "Whether you have 5, 40, or 100+ devices, our team can propose a fast, effective solution."}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="https://rachat.achetetoncell.com/rachat"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-background px-7 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-brand-dark transition-colors hover:bg-background/90"
              >
                {isFr ? "OBTENIR MON OFFRE" : "GET MY OFFER"}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
              <Link
                href={homeContactPath}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-background/50 px-7 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-background transition-colors hover:bg-background hover:text-brand-dark"
              >
                {isFr ? "Parler à un spécialiste" : "Talk to a specialist"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl bg-white px-6 py-8 text-center shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)]">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary text-background shadow-soft">
        {icon}
      </div>
      <h3 className="mt-5 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-foreground/75">
        {description}
      </p>
    </div>
  );
}

function OrgPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-foreground/10 bg-secondary/60 px-4 py-2 text-sm font-medium text-foreground">
      {label}
    </span>
  );
}

function ActionCard({
  number,
  title,
  description,
  ctaLabel,
  href,
  icon,
  external = false,
}: {
  number: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  icon: ReactNode;
  external?: boolean;
}) {
  const isInternal = !external && href.startsWith("/");

  return (
    <div className="rounded-3xl border border-black/6 bg-[#F4F1EA] p-5 transition-colors hover:bg-black/[0.02]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white shadow-[var(--shadow-soft)]">
            {number}
          </span>
          <h3 className="mt-1 text-base font-semibold text-brand-dark">
            {title}
          </h3>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-foreground/75">
        {description}
      </p>
      {isInternal ? (
        <Link
          href={href}
          className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-brand-dark px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white shadow-[0_4px_24px_-4px_rgba(0,0,114,0.35)] transition-all duration-300 hover:bg-brand-primary hover:scale-[1.01]"
        >
          {ctaLabel}
        </Link>
      ) : (
        <a
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-brand-dark px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white shadow-[0_4px_24px_-4px_rgba(0,0,114,0.35)] transition-all duration-300 hover:bg-brand-primary hover:scale-[1.01]"
        >
          {ctaLabel}
        </a>
      )}
    </div>
  );
}

function WhyItem({ label }: { label: string }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-black/6 bg-[#F4F1EA] p-4">
      <CheckCircle2
        className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary"
        aria-hidden
      />
      <span className="text-sm font-medium text-foreground">{label}</span>
    </li>
  );
}

function ReviewCard({
  quote,
  author,
  stars,
}: {
  quote: string;
  author: string;
  stars: number;
}) {
  return (
    <div className="rounded-2xl border border-black/6 border-l-[3px] border-l-brand-primary bg-white p-5 shadow-[var(--shadow-soft)] transition-colors duration-300 hover:border-brand-primary sm:rounded-[24px] sm:p-6">
      <div className="mb-4 flex gap-0.5">
        {Array.from({ length: stars }).map((_, i) => (
          <Star key={i} className="h-5 w-5 fill-brand-gold text-brand-gold" />
        ))}
      </div>
      <p className="mb-4 text-foreground/90">&ldquo;{quote}&rdquo;</p>
      <p className="text-sm font-medium text-foreground/80">— {author}</p>
    </div>
  );
}
