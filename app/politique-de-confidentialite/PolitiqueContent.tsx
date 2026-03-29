"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useI18n } from "@/contexts/I18nContext";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

export function PolitiqueContent() {
  const { t, locale } = useI18n();
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const homePath = currentLocale === "fr" ? "/" : `/${currentLocale}`;
  const isFr = locale === "fr";

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed left-0 right-0 top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href={homePath} className="flex items-center">
            <span className="text-lg font-medium text-brand-dark">AcheteTonCell</span>
          </Link>
          <div className="flex items-center gap-8">
            <LanguageSwitcher />
          </div>
        </div>
      </nav>
      <div className="mx-auto max-w-4xl px-6 py-16 pt-24">
        <div className="mb-12">
          <h1 className="font-(family-name:--font-playfair) mb-4 text-4xl font-light text-brand-dark md:text-5xl">
            {t.privacy.title}
          </h1>
          <p className="text-sm text-foreground/60">
            {t.privacy.lastUpdated} : {new Date().toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <div className="prose prose-lg max-w-none space-y-8 text-foreground">
          <section>
            <p className="mb-4 leading-relaxed">
              {isFr
                ? "La présente Politique de confidentialité décrit la façon dont vos informations personnelles sont recueillies, utilisées et partagées lorsque vous vous rendez sur achetetoncell.com (le « Site ») ou que vous y effectuez un achat."
                : "This Privacy Policy describes how your personal information is collected, used and shared when you visit achetetoncell.com (the \"Site\") or make a purchase there."}
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">
              {isFr ? "Protection des mineurs" : "Protection of minors"}
            </h2>
            <p className="mb-4 leading-relaxed">
              {isFr
                ? "Les enfants de moins de 13 ans ne sont pas autorisés à s'inscrire ou à utiliser achetetoncell.com. Le site ne peut être utilisé que par des personnes âgées d'au moins 13 ans. Si vous utilisez le site achetetoncell.com et que vous avez entre treize (13) et dix-huit (18) ans, vous devez avoir l'approbation de vos parents ou de votre tuteur légal pour effectuer un achat sur notre site transactionnel."
                : "Children under 13 are not allowed to register or use achetetoncell.com. The site may only be used by persons at least 13 years of age. If you use achetetoncell.com and you are between thirteen (13) and eighteen (18) years old, you must have the approval of your parents or legal guardian to make a purchase on our transactional site."}
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">
              {isFr ? "Informations personnelles recueillies" : "Personal information collected"}
            </h2>
            <p className="mb-4 leading-relaxed">
              {isFr
                ? "Lorsque vous vous rendez sur le Site, nous recueillons automatiquement certaines informations concernant votre appareil, notamment des informations sur votre navigateur web, votre adresse IP, votre fuseau horaire et certains des cookies qui sont installés sur votre appareil. En outre, lorsque vous parcourez le Site, nous recueillons des informations sur les pages web ou produits individuels que vous consultez, les sites web ou les termes de recherche qui vous ont permis d'arriver sur le Site, ainsi que des informations sur la manière dont vous interagissez avec le Site. Nous désignons ces informations collectées automatiquement sous l'appellation « Informations sur l'appareil »."
                : "When you visit the Site, we automatically collect certain information about your device, including information about your web browser, IP address, time zone and some of the cookies installed on your device. In addition, as you browse the Site, we collect information about the web pages or individual products you view, the websites or search terms that referred you to the Site, and information about how you interact with the Site. We refer to this automatically collected information as \"Device Information\"."}
            </p>
            <p className="mb-4 leading-relaxed">
              {isFr
                ? "Par ailleurs, lorsque vous effectuez ou tentez d'effectuer un achat par le biais du Site, nous recueillons certaines informations vous concernant, notamment votre nom, votre adresse de facturation, votre adresse d'expédition, vos informations de paiement (y compris vos numéros de cartes de crédit), votre adresse e-mail et votre numéro de téléphone. Ces informations sont désignées par l'appellation « Informations sur la commande »."
                : "When you make or attempt to make a purchase through the Site, we collect certain information about you, including your name, billing address, shipping address, payment information (including credit card numbers), email address and phone number. This information is referred to as \"Order Information\"."}
            </p>
            <p className="mb-4 leading-relaxed">
              {isFr
                ? "Lorsque nous utilisons l'expression « Informations personnelles » dans la présente Politique de confidentialité, nous faisons allusion à la fois aux Informations sur l'appareil et aux Informations sur la commande."
                : "When we use the term \"Personal Information\" in this Privacy Policy, we mean both Device Information and Order Information."}
            </p>
            <p className="mb-2 leading-relaxed font-medium">
              {isFr ? "Technologies utilisées (cookies)" : "Technologies used (cookies)"}
            </p>
            <p className="mb-2 leading-relaxed text-sm">
              {isFr
                ? "Les informations personnelles que nous collectons sont recueillies à l'aide des technologies suivantes : fichiers témoins (cookies). Exemples : _session_id (session), _shopify_visit (30 min), _shopify_uniq (visites uniques), cart (panier, 2 semaines), _secure_session_id, storefront_digest. Les fichiers journaux enregistrent l'activité du Site (IP, type de navigateur, etc.). Les pixels invisibles, balises et pixels enregistrent la façon dont vous parcourez le Site."
                : "The personal information we collect is gathered using the following technologies: cookies. Examples: _session_id (session), _shopify_visit (30 min), _shopify_uniq (unique visits), cart (shopping cart, 2 weeks), _secure_session_id, storefront_digest. Log files record Site activity (IP, browser type, etc.). Invisible pixels, tags and pixels record how you browse the Site."}
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">
              {isFr ? "Comment utilisons-nous vos informations personnelles ?" : "How do we use your personal information?"}
            </h2>
            <p className="mb-4 leading-relaxed">
              {isFr
                ? "En règle générale, nous utilisons les Informations sur la commande que nous recueillons pour traiter toute commande passée par l'intermédiaire du Site (y compris pour traiter vos informations de paiement, organiser l'expédition de votre commande et vous fournir des factures et/ou des confirmations de commande). En outre, nous utilisons ces Informations sur la commande pour : communiquer avec vous ; évaluer les fraudes ou risques potentiels ; vous fournir des informations ou des publicités concernant nos produits ou services, lorsque cela correspond aux préférences que vous nous avez communiquées."
                : "We generally use the Order Information we collect to process any orders placed through the Site (including processing your payment information, arranging for shipping of your order and providing you with invoices and/or order confirmations). We also use this Order Information to: communicate with you; assess fraud or potential risk; provide you with information or advertising about our products or services, when this matches the preferences you have shared with us."}
            </p>
            <p className="mb-4 leading-relaxed">
              {isFr
                ? "Nous utilisons les Informations sur l'appareil (en particulier votre adresse IP) que nous recueillons pour évaluer les fraudes ou risques potentiels et, de manière plus générale, pour améliorer et optimiser notre Site (par exemple, en générant des analyses sur la façon dont nos clients parcourent et interagissent avec le Site, et pour évaluer la réussite de nos campagnes de publicité et de marketing)."
                : "We use the Device Information (particularly your IP address) we collect to assess fraud or potential risk and, more generally, to improve and optimize our Site (for example, by generating analytics on how our customers browse and interact with the Site, and to evaluate the success of our advertising and marketing campaigns)."}
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">
              {isFr ? "Publicité" : "Advertising"}
            </h2>
            <p className="mb-4 leading-relaxed">
              {isFr
                ? "Comme indiqué ci-dessus, nous utilisons vos Informations personnelles pour vous proposer des publicités ciblées ou des messages de marketing qui, selon nous, pourraient vous intéresser. Pour en savoir plus sur le fonctionnement de la publicité ciblée, vous pouvez consulter la page d'information de la Network Advertising Initiative (NAI) à l'adresse : http://www.networkadvertising.org/understanding-online-advertising/how-does-it-work."
                : "As noted above, we use your Personal Information to provide you with targeted advertisements or marketing messages that we believe may be of interest to you. To learn more about how targeted advertising works, you can visit the Network Advertising Initiative (NAI) information page at: http://www.networkadvertising.org/understanding-online-advertising/how-does-it-work."}
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">
              {isFr ? "Rétention des données et suppression" : "Data retention and deletion"}
            </h2>
            <p className="mb-4 leading-relaxed">
              {isFr
                ? "Lorsque vous passez une commande par l'intermédiaire du Site, nous conservons les Informations sur votre commande dans nos dossiers, sauf si et jusqu'à ce que vous nous demandiez de les supprimer."
                : "When you place an order through the Site, we retain your Order Information in our records unless and until you ask us to delete it."}
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">
              {isFr ? "Sécurité des données" : "Data security"}
            </h2>
            <p className="mb-4 leading-relaxed">
              {isFr
                ? "Vos informations personnelles sont protégées pour votre confidentialité et votre sécurité. Nous garantissons la sécurité et la confidentialité de vos données en utilisant des procédures physiques, techniques et de gestion au sein de nos bases de données. Les informations personnelles que nous recueillons sont conservées dans un environnement sécurisé. Veuillez noter que, malgré tous nos efforts, aucune mesure de sécurité n'est parfaite ou impénétrable. Bien que nous nous efforcions de protéger vos informations personnelles, nous ne pouvons pas garantir à 100 % la sécurité des informations que vous nous transmettez. Nous vous invitons à prendre toutes les précautions pour protéger vos données personnelles lorsque vous êtes sur Internet (changer souvent vos mots de passe, utiliser une combinaison de lettres et de chiffres, utiliser un navigateur sécurisé)."
                : "Your personal information is protected for your privacy and security. We guarantee the security and confidentiality of your data using physical, technical and administrative procedures in our databases. The personal information we collect is kept in a secure environment. Please note that, despite our best efforts, no security measure is perfect or impenetrable. While we strive to protect your personal information, we cannot guarantee 100% security of the information you transmit to us. We encourage you to take all precautions to protect your personal data when on the Internet (change passwords often, use a combination of letters and numbers, use a secure browser)."}
            </p>
            <p className="mb-4 leading-relaxed">
              {isFr
                ? "Achetetoncell.com s'engage personnellement à prendre toutes les mesures nécessaires pour maintenir un niveau élevé de confidentialité en apportant des mises à jour hebdomadaires à nos systèmes et procédures de sécurité afin d'assurer la confidentialité de toutes vos transactions."
                : "Achetetoncell.com personally commits to taking all necessary measures to maintain a high level of confidentiality by making weekly updates to our security systems and procedures to ensure the confidentiality of all your transactions."}
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">
              {isFr ? "Changements" : "Changes"}
            </h2>
            <p className="mb-4 leading-relaxed">
              {isFr
                ? "Nous pouvons être amenés à modifier la présente politique de confidentialité de temps à autre afin d'y refléter, par exemple, les changements apportés à nos pratiques ou pour d'autres motifs opérationnels, juridiques ou réglementaires."
                : "We may update this privacy policy from time to time to reflect, for example, changes to our practices or for other operational, legal or regulatory reasons."}
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">
              {isFr ? "Nous contacter" : "Contact us"}
            </h2>
            <p className="mb-4 leading-relaxed">
              {isFr
                ? "Pour en savoir plus sur nos pratiques de confidentialité, si vous avez des questions ou si vous souhaitez déposer une réclamation, veuillez nous contacter par e-mail à "
                : "To learn more about our privacy practices, if you have questions or wish to file a complaint, please contact us by email at "}
              <a href="mailto:info@achetetoncell.com" className="font-medium text-brand-primary hover:underline">info@achetetoncell.com</a>.
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-foreground/10 pt-8">
          <Link href={homePath} className="text-brand-primary hover:underline">
            ← {locale === "fr" ? "Retour à l'accueil" : "Back to home"}
          </Link>
        </div>
      </div>
    </div>
  );
}
