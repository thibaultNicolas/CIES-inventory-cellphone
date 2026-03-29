import type { Metadata } from "next";
import { getTermesEtConditionsMetadata } from "@/metadata";
import Link from "next/link";

export const metadata: Metadata = getTermesEtConditionsMetadata();

export default function TermesEtConditions() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-12">
          <h1 className="font-(family-name:--font-playfair) mb-4 text-4xl font-light text-brand-dark md:text-5xl">
            Termes et conditions
          </h1>
          <p className="text-sm text-foreground/60">
            Dernière mise à jour : {new Date().toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <div className="prose prose-lg max-w-none space-y-8 text-foreground">
          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">1. Acceptation des termes</h2>
            <p className="mb-4 leading-relaxed">
              En accédant et en utilisant le site web d'AcheteTonCell (« le site »), vous acceptez d'être lié par les présents termes et conditions d'utilisation (« les termes »). Si vous n'acceptez pas ces termes, veuillez ne pas utiliser notre site ou nos services.
            </p>
            <p className="mb-4 leading-relaxed">
              Nous nous réservons le droit de modifier ces termes à tout moment. Les modifications entreront en vigueur dès leur publication sur le site. Il est de votre responsabilité de consulter régulièrement ces termes pour prendre connaissance des modifications.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">2. Description du service</h2>
            <p className="mb-4 leading-relaxed">
              AcheteTonCell est un service de rachat de téléphones cellulaires en ligne. Nous offrons :
            </p>
            <ul className="mb-4 ml-6 list-disc space-y-2">
              <li>Une évaluation gratuite et instantanée de la valeur de votre téléphone cellulaire</li>
              <li>Un processus de rachat simplifié en ligne</li>
              <li>L'expédition gratuite de votre appareil</li>
              <li>Un paiement rapide dans les 4 jours ouvrables suivant la réception et l'inspection de votre appareil</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">3. Éligibilité</h2>
            <p className="mb-4 leading-relaxed">
              Pour utiliser nos services, vous devez :
            </p>
            <ul className="mb-4 ml-6 list-disc space-y-2">
              <li>Être âgé d'au moins 18 ans ou avoir l'autorisation d'un parent ou tuteur légal</li>
              <li>Être résident du Canada</li>
              <li>Être le propriétaire légitime de l'appareil que vous souhaitez vendre</li>
              <li>Fournir des renseignements exacts et complets</li>
              <li>Respecter toutes les lois et réglementations applicables</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">4. Processus de rachat</h2>
            <h3 className="mb-3 text-xl font-medium text-brand-dark">4.1. Soumission de la demande</h3>
            <p className="mb-4 leading-relaxed">
              Lorsque vous soumettez une demande de rachat, vous acceptez que :
            </p>
            <ul className="mb-4 ml-6 list-disc space-y-2">
              <li>Le prix indiqué est une estimation préliminaire basée sur les renseignements fournis</li>
              <li>Le prix final sera déterminé après inspection physique de l'appareil</li>
              <li>Vous êtes responsable de l'exactitude des renseignements fournis concernant l'état et les caractéristiques de votre appareil</li>
              <li>Vous devez fournir des photographies claires et récentes de l'appareil</li>
            </ul>

            <h3 className="mb-3 mt-6 text-xl font-medium text-brand-dark">4.2. Expédition</h3>
            <p className="mb-4 leading-relaxed">
              Après acceptation de votre demande, nous vous fournirons une étiquette d'expédition prépayée. Vous êtes responsable de :
            </p>
            <ul className="mb-4 ml-6 list-disc space-y-2">
              <li>L'emballage sécurisé de l'appareil pour éviter les dommages pendant le transport</li>
              <li>L'expédition de l'appareil dans les 7 jours suivant la réception de l'étiquette d'expédition</li>
              <li>L'expédition de l'appareil exact correspondant à la demande soumise</li>
            </ul>
            <p className="mb-4 leading-relaxed">
              Nous ne sommes pas responsables des dommages survenus pendant le transport si l'appareil n'a pas été emballé correctement.
            </p>

            <h3 className="mb-3 mt-6 text-xl font-medium text-brand-dark">4.3. Inspection et paiement final</h3>
            <p className="mb-4 leading-relaxed">
              À la réception de votre appareil, nous procéderons à une inspection détaillée. Le prix final peut différer de l'estimation initiale si :
            </p>
            <ul className="mb-4 ml-6 list-disc space-y-2">
              <li>L'état réel de l'appareil diffère significativement de la description fournie</li>
              <li>L'appareil présente des dommages non déclarés</li>
              <li>L'appareil ne correspond pas au modèle déclaré</li>
              <li>L'appareil est verrouillé, bloqué ou non fonctionnel</li>
              <li>L'appareil a été modifié ou réparé de manière non autorisée</li>
            </ul>
            <p className="mb-4 leading-relaxed">
              Si le prix final diffère de l'estimation, nous vous contacterons pour vous proposer le nouveau prix. Vous pouvez accepter ou refuser cette offre. Si vous refusez, nous vous retournerons l'appareil à nos frais.
            </p>
            <p className="mb-4 leading-relaxed">
              Le paiement sera effectué dans les 4 jours ouvrables suivant l'inspection et l'acceptation de l'appareil, par virement bancaire ou chèque, selon votre préférence.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">5. Propriété et garanties</h2>
            <p className="mb-4 leading-relaxed">
              En soumettant votre appareil pour rachat, vous garantissez que :
            </p>
            <ul className="mb-4 ml-6 list-disc space-y-2">
              <li>Vous êtes le propriétaire légitime de l'appareil et avez le droit de le vendre</li>
              <li>L'appareil n'est pas volé, perdu ou fait l'objet d'un litige</li>
              <li>L'appareil n'est pas verrouillé par un opérateur de téléphonie mobile ou par un mécanisme de sécurité</li>
              <li>Vous avez effacé toutes les données personnelles de l'appareil</li>
              <li>Tous les renseignements fournis sont exacts et complets</li>
            </ul>
            <p className="mb-4 leading-relaxed">
              Si nous découvrons que l'appareil est volé, verrouillé ou fait l'objet d'un litige, nous nous réservons le droit de refuser le rachat et de signaler l'incident aux autorités compétentes.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">6. Annulation et remboursement</h2>
            <p className="mb-4 leading-relaxed">
              Vous pouvez annuler votre demande de rachat à tout moment avant l'expédition de votre appareil. Une fois l'appareil expédié, l'annulation n'est possible que si nous n'avons pas encore procédé à l'inspection.
            </p>
            <p className="mb-4 leading-relaxed">
              Si vous souhaitez récupérer votre appareil après l'inspection mais avant le paiement, nous vous le retournerons à nos frais. Aucun remboursement n'est applicable car aucun paiement n'a été effectué.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">7. Limitation de responsabilité</h2>
            <p className="mb-4 leading-relaxed">
              Dans les limites permises par la loi, AcheteTonCell ne sera pas responsable de :
            </p>
            <ul className="mb-4 ml-6 list-disc space-y-2">
              <li>Dommages indirects, accessoires, spéciaux ou consécutifs résultant de l'utilisation de nos services</li>
              <li>Perte de données, perte de profits ou perte d'opportunités commerciales</li>
              <li>Dommages résultant de retards dans le traitement ou le paiement, sauf en cas de négligence grave de notre part</li>
              <li>Dommages résultant de l'utilisation ou de l'impossibilité d'utiliser notre site web</li>
            </ul>
            <p className="mb-4 leading-relaxed">
              Notre responsabilité totale envers vous, pour quelque réclamation que ce soit, ne dépassera pas le montant que vous avez reçu ou auriez dû recevoir pour votre appareil.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">8. Propriété intellectuelle</h2>
            <p className="mb-4 leading-relaxed">
              Le contenu du site web, incluant mais sans s'y limiter, les textes, graphiques, logos, icônes, images, clips audio, téléchargements numériques et compilations de données, est la propriété d'AcheteTonCell ou de ses fournisseurs de contenu et est protégé par les lois canadiennes et internationales sur le droit d'auteur.
            </p>
            <p className="mb-4 leading-relaxed">
              Vous n'êtes pas autorisé à reproduire, distribuer, modifier, créer des œuvres dérivées, afficher publiquement, représenter publiquement, republier, télécharger, stocker ou transmettre tout matériel de notre site web sans notre autorisation écrite préalable.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">9. Utilisation acceptable</h2>
            <p className="mb-4 leading-relaxed">
              Vous vous engagez à utiliser notre site et nos services uniquement à des fins légales et de manière qui ne viole pas les droits d'autrui ou ne restreint pas l'utilisation et la jouissance du site par d'autres utilisateurs. Vous acceptez de ne pas :
            </p>
            <ul className="mb-4 ml-6 list-disc space-y-2">
              <li>Utiliser le site de manière frauduleuse ou trompeuse</li>
              <li>Tenter d'accéder à des zones non autorisées du site</li>
              <li>Introduire des virus, chevaux de Troie ou autres codes malveillants</li>
              <li>Collecter ou stocker des renseignements personnels sur d'autres utilisateurs</li>
              <li>Utiliser des robots, scripts automatisés ou autres moyens pour accéder au site</li>
              <li>Reproduire, dupliquer, copier ou revendre une partie de notre site</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">10. Protection des données personnelles</h2>
            <p className="mb-4 leading-relaxed">
              La collecte, l'utilisation et la divulgation de vos renseignements personnels sont régies par notre{" "}
              <Link href="/politique-de-confidentialite" className="text-brand-primary hover:underline">
                Politique de confidentialité
              </Link>
              {", "}conforme à la Loi 25 du Québec. En utilisant nos services, vous acceptez les pratiques décrites dans cette politique.
            </p>
            <p className="mb-4 leading-relaxed">
              Vous reconnaissez que vous êtes responsable de supprimer toutes les données personnelles de votre appareil avant de nous l'expédier. AcheteTonCell ne sera pas responsable de la perte ou de la divulgation de données personnelles restant sur l'appareil.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">11. Force majeure</h2>
            <p className="mb-4 leading-relaxed">
              Nous ne serons pas responsables de tout retard ou défaillance dans l'exécution de nos obligations résultant de causes indépendantes de notre volonté raisonnable, incluant mais sans s'y limiter, les actes de Dieu, les catastrophes naturelles, les guerres, les actes de terrorisme, les émeutes, les grèves, les pannes de réseau ou d'équipement, ou toute autre cause majeure.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">12. Droit applicable et juridiction</h2>
            <p className="mb-4 leading-relaxed">
              Ces termes et conditions sont régis par les lois de la province de Québec et les lois fédérales du Canada qui s'y appliquent. Tout litige découlant de ou lié à ces termes sera soumis à la juridiction exclusive des tribunaux du Québec, district de Montréal.
            </p>
            <p className="mb-4 leading-relaxed">
              Si vous êtes un consommateur résidant au Québec, vous bénéficiez également des protections prévues par la{" "}
              <a
                href="https://www.opc.gouv.qc.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary hover:underline"
              >
                Loi sur la protection du consommateur
              </a>
              {" "}du Québec.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">13. Dispositions générales</h2>
            <h3 className="mb-3 text-xl font-medium text-brand-dark">13.1. Divisibilité</h3>
            <p className="mb-4 leading-relaxed">
              Si une disposition de ces termes est jugée invalide ou inapplicable, cette disposition sera modifiée et interprétée pour atteindre les objectifs de cette disposition dans la mesure du possible, et les autres dispositions resteront en vigueur.
            </p>

            <h3 className="mb-3 mt-6 text-xl font-medium text-brand-dark">13.2. Renonciation</h3>
            <p className="mb-4 leading-relaxed">
              Aucune renonciation à l'exécution d'une disposition de ces termes ne sera considérée comme une renonciation supplémentaire ou continue à cette disposition ou à toute autre disposition.
            </p>

            <h3 className="mb-3 mt-6 text-xl font-medium text-brand-dark">13.3. Cession</h3>
            <p className="mb-4 leading-relaxed">
              Vous ne pouvez pas céder ou transférer vos droits ou obligations en vertu de ces termes sans notre consentement écrit préalable. Nous pouvons céder ou transférer nos droits et obligations sans restriction.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">14. Contact</h2>
            <p className="mb-4 leading-relaxed">
              Pour toute question concernant ces termes et conditions, veuillez nous contacter :
            </p>
            <div className="rounded-card border border-foreground/10 bg-secondary/50 p-6">
              <p className="mb-2 font-medium text-brand-dark">AcheteTonCell</p>
              <p className="mb-1 text-foreground">
                Courriel : <a href="mailto:contact@achetetoncell.com" className="text-brand-primary hover:underline">contact@achetetoncell.com</a>
              </p>
              <p className="text-foreground">
                Adresse : [Adresse complète à compléter]
              </p>
            </div>
          </section>
        </div>

        <div className="mt-12 border-t border-foreground/10 pt-8">
          <Link
            href="/"
            className="text-brand-primary hover:underline"
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
