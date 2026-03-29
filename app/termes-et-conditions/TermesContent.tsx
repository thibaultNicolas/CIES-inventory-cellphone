"use client";

import Link from "next/link";
import { useI18n } from "@/contexts/I18nContext";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { useParams } from "next/navigation";

export function TermesContent() {
  const { t, locale } = useI18n();
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const homePath = currentLocale === "fr" ? "/" : `/${currentLocale}`;
  const politiquePath = currentLocale === "fr" ? "/politique-de-confidentialite" : `/${currentLocale}/politique-de-confidentialite`;
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
            {locale === "fr" ? "Conditions d'utilisation" : "Terms of Service"}
          </h1>
          <p className="text-sm text-foreground/60">
            {locale === "fr" ? "Dernière mise à jour" : "Last updated"} : {new Date().toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <div className="prose prose-lg max-w-none space-y-8 text-foreground">
          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">
              {isFr ? "Conditions d'utilisation" : "Terms of use"}
            </h2>
            <p className="mb-4 leading-relaxed">
              {isFr
                ? "Bienvenue sur notre site achetetoncell.com. Ce site web est exploité par achetetoncell.com. Partout sur le site, nous employons les termes « nous », « notre » et « nos » en référence à achetetoncell.com. Ce site web, y compris l'ensemble des informations, outils et services auquel il donne accès, est offert par Achetetoncell.com à l'utilisateur que vous êtes. En accédant ou en utilisant notre site Web, vous acceptez d'être lié par les termes et conditions énoncés ci-dessous. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre site Web."
                : "Welcome to our site achetetoncell.com. This website is operated by achetetoncell.com. Throughout the site, we use the terms \"we\", \"our\" and \"us\" to refer to achetetoncell.com. This website, including all information, tools and services to which it provides access, is offered by Achetetoncell.com to you, the user. By accessing or using our website, you agree to be bound by the terms and conditions set out below. If you do not accept these terms, please do not use our website."}
            </p>
            <ol className="mb-4 ml-6 list-decimal space-y-3">
              <li>
                <strong>{isFr ? "Utilisation de notre site Web" : "Use of our website"}</strong>: {isFr ? "Notre site Web est destiné à votre usage personnel et non commercial. Vous ne pouvez pas utiliser notre site Web à des fins illégales ou non autorisées." : "Our website is for your personal, non-commercial use. You may not use our website for any illegal or unauthorized purpose."}
              </li>
              <li>
                <strong>{isFr ? "Droits de propriété intellectuelle" : "Intellectual property rights"}</strong>: {isFr ? "Notre site Web et tout son contenu (texte, images, code) sont protégés par le droit d'auteur et d'autres lois sur la propriété intellectuelle. Vous ne pouvez pas reproduire ou distribuer tout contenu sans notre consentement écrit exprès." : "Our website and all its content (text, images, code) are protected by copyright and other intellectual property laws. You may not reproduce or distribute any content without our express written consent."}
              </li>
              <li>
                <strong>{isFr ? "Avis de non-responsabilité" : "Disclaimer"}</strong>: {isFr ? "Notre site Web et son contenu sont fournis « tels quels ». Nous ne faisons aucune représentation ou garantie d'aucune sorte, expresse ou implicite." : "Our website and its content are provided \"as is\". We make no representation or warranty of any kind, express or implied."}
              </li>
              <li>
                <strong>{isFr ? "Limitation de responsabilité" : "Limitation of liability"}</strong>: {isFr ? "Nous ne serons pas responsables des dommages de toute nature résultant de l'utilisation de notre site Web." : "We shall not be liable for damages of any kind resulting from the use of our website."}
              </li>
              <li>
                <strong>{isFr ? "Indemnisation" : "Indemnification"}</strong>: {isFr ? "Vous acceptez de nous indemniser et de nous dégager de toute réclamation, perte, dommage ou dépense résultant de votre utilisation du site ou de la violation de ces conditions." : "You agree to indemnify and hold us harmless from any claim, loss, damage or expense resulting from your use of the site or violation of these terms."}
              </li>
              <li>
                <strong>{isFr ? "Modifications" : "Modifications"}</strong>: {isFr ? "Nous nous réservons le droit de modifier nos conditions d'utilisation à tout moment. Votre utilisation continue du site après toute modification constitue votre acceptation des nouvelles conditions." : "We reserve the right to modify our terms of use at any time. Your continued use of the site after any change constitutes your acceptance of the new terms."}
              </li>
              <li>
                <strong>{isFr ? "Loi applicable" : "Applicable law"}</strong>: {isFr ? "Ces conditions et votre utilisation du site seront régies par les lois du Québec et du Canada. Notre boutique est hébergée sur Shopify Inc." : "These terms and your use of the site shall be governed by the laws of Quebec and Canada. Our store is hosted on Shopify Inc."}
              </li>
            </ol>
            <p className="mb-4 leading-relaxed">
              {isFr ? "Contactez-nous : si vous avez des questions concernant ces conditions d'utilisation ou notre site Web, veuillez nous contacter à " : "Contact us: if you have questions about these terms of use or our website, please contact us at "}
              <a href="mailto:info@achetetoncell.com" className="font-medium text-brand-primary hover:underline">info@achetetoncell.com</a>.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">
              {isFr ? "Conditions générales" : "General terms"}
            </h2>
            <p className="mb-4 leading-relaxed">
              {isFr
                ? "Nous nous réservons le droit de refuser de servir quelqu'un à tout moment et pour quelque raison que ce soit. Vous acceptez de ne pas reproduire, dupliquer, copier, vendre, revendre ou exploiter toute partie du Service, toute utilisation du Service ou tout accès au Service, sans notre autorisation écrite."
                : "We reserve the right to refuse service to anyone at any time and for any reason. You agree not to reproduce, duplicate, copy, sell, resell or exploit any part of the Service, any use of the Service or any access to the Service, without our written authorization."}
            </p>
            <ol className="mb-4 ml-6 list-decimal space-y-3">
              <li>
                {isFr ? "Transfert de contenu : votre contenu peut être transféré en clair sur les réseaux. Les informations de carte de crédit sont toujours cryptées." : "Content transfer: your content may be transferred in clear text over networks. Credit card information is always encrypted."}
              </li>
              <li>
                {isFr ? "Interdiction de reproduction et de vente sans autorisation écrite expresse." : "Prohibition of reproduction and sale without express written authorization."}
              </li>
              <li>
                {isFr ? "Enregistrement : pour générer ou consulter des annonces, les utilisateurs doivent s'inscrire et accepter les présentes conditions et la politique de confidentialité." : "Registration: to create or view listings, users must register and accept these terms and the privacy policy."}
              </li>
              <li>
                {isFr ? "Responsabilité de l'utilisateur : fournir des informations exactes, ne pas utiliser de fausses identités, maintenir la confidentialité de votre compte." : "User responsibility: provide accurate information, do not use false identities, maintain the confidentiality of your account."}
              </li>
            </ol>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">
              {isFr ? "Restrictions d'utilisation" : "Use restrictions"}
            </h2>
            <p className="mb-4 leading-relaxed">
              {isFr
                ? "Il est interdit de copier du contenu sans autorisation, de télécharger ou partager du matériel sans droit légal, d'enfreindre des brevets, marques, droits d'auteur, de publier des publicités non sollicitées, de télécharger des virus, de créer des déclarations fausses ou trompeuses, de perturber les serveurs ou réseaux du site, de violer toute loi applicable, ou de collecter des informations personnelles d'autrui sans autorisation."
                : "It is prohibited to copy content without authorization, to download or share material without legal right, to infringe patents, trademarks, copyrights, to post unsolicited advertising, to upload viruses, to create false or misleading statements, to disrupt the site's servers or networks, to violate any applicable law, or to collect others' personal information without authorization."}
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">
              {isFr ? "Violations de la propriété intellectuelle" : "Intellectual property violations"}
            </h2>
            <p className="mb-4 leading-relaxed">
              {isFr
                ? "Chez achetetoncell.com, nous prenons très au sérieux la protection des droits de propriété intellectuelle. Toute activité portant atteinte aux droits d'autrui entraînera la suppression du contenu et l'arrêt de l'activité. Si vous pensez que vos droits ont été violés, contactez-nous à info@achetetoncell.com."
                : "At achetetoncell.com, we take the protection of intellectual property rights very seriously. Any activity that infringes the rights of others will result in removal of content and cessation of the activity. If you believe your rights have been violated, contact us at info@achetetoncell.com."}
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">
              {isFr ? "Modifications du service et des prix" : "Modifications to service and prices"}
            </h2>
            <p className="mb-4 leading-relaxed">
              {isFr
                ? "Les prix de nos produits peuvent être modifiés sans préavis. Nous nous réservons le droit de modifier ou d'interrompre notre service (ou une partie de celui-ci) à tout moment, sans préavis préalable."
                : "The prices of our products may be changed without notice. We reserve the right to modify or discontinue our service (or any part of it) at any time, without prior notice."}
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">
              {isFr ? "Liens hypertextes" : "Hyperlinks"}
            </h2>
            <p className="mb-4 leading-relaxed">
              {isFr
                ? "Les liens présents sur notre site vous permettent de naviguer vers d'autres sites. Ces liens sont fournis à titre informatif. Achetetoncell.com décline toute responsabilité pour les sites tiers (contenu et fonctionnement). Ces sites peuvent être hébergés hors de votre pays et soumis à des lois différentes."
                : "The links on our site allow you to navigate to other sites. These links are provided for information only. Achetetoncell.com disclaims any responsibility for third-party sites (content and operation). These sites may be hosted outside your country and subject to different laws."}
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">
              {isFr ? "Commentaires et soumissions" : "Comments and submissions"}
            </h2>
            <p className="mb-4 leading-relaxed">
              {isFr
                ? "En nous envoyant des idées, suggestions, propositions ou tout autre contenu, vous nous donnez le droit de les utiliser, modifier, publier et distribuer sans restriction. Nous nous réservons le droit de supprimer tout contenu illégal, offensant ou qui viole les droits de tiers."
                : "By sending us ideas, suggestions, proposals or any other content, you give us the right to use, modify, publish and distribute them without restriction. We reserve the right to remove any illegal, offensive or third-party rights-infringing content."}
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">
              {isFr ? "Informations personnelles" : "Personal information"}
            </h2>
            <p className="mb-4 leading-relaxed">
              {isFr ? "La transmission de vos informations personnelles sur notre boutique est régie par notre " : "The transmission of your personal information on our store is governed by our "}
              <Link href={politiquePath} className="font-medium text-brand-primary hover:underline">
                {isFr ? "Politique de confidentialité" : "Privacy Policy"}
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">
              {isFr ? "Erreurs, inexactitudes et omissions" : "Errors, inaccuracies and omissions"}
            </h2>
            <p className="mb-4 leading-relaxed">
              {isFr
                ? "Il peut y avoir sur notre site des informations contenant des erreurs, inexactitudes ou omissions (descriptions, prix, promotions, disponibilité). Nous nous réservons le droit de corriger ces erreurs et de modifier ou annuler les commandes si les informations sont inexactes, à tout moment et sans préavis."
                : "There may be information on our site containing errors, inaccuracies or omissions (descriptions, prices, promotions, availability). We reserve the right to correct such errors and to change or cancel orders if the information is inaccurate, at any time and without notice."}
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">
              {isFr ? "Intégralité de l'accord" : "Entire agreement"}
            </h2>
            <p className="mb-4 leading-relaxed">
              {isFr
                ? "Les présentes Conditions d'utilisation constituent l'intégralité de l'entente entre vous et nous et régissent votre utilisation du Service. Elles remplacent tous accords antérieurs. Toute ambiguïté ne doit pas être interprétée en défaveur de la partie rédactrice."
                : "These Terms of Use constitute the entire agreement between you and us and govern your use of the Service. They replace all prior agreements. Any ambiguity shall not be interpreted against the drafting party."}
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">
              {isFr ? "Loi applicable" : "Applicable law"}
            </h2>
            <p className="mb-4 leading-relaxed">
              {isFr
                ? "Les présentes Conditions d'utilisation sont régies et interprétées en vertu des lois du Québec et du Canada."
                : "These Terms of Use are governed by and construed in accordance with the laws of Quebec and Canada."}
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-brand-dark">
              {isFr ? "Coordonnées" : "Contact"}
            </h2>
            <p className="mb-4 leading-relaxed">
              {isFr ? "Les questions relatives aux Conditions d'utilisation doivent nous être envoyées à " : "Questions regarding the Terms of Use should be sent to us at "}
              <a href="mailto:info@achetetoncell.com" className="font-medium text-brand-primary hover:underline">info@achetetoncell.com</a>.
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-foreground/10 pt-8">
          <Link href={homePath} className="text-brand-primary hover:underline">
            ← {locale === "fr" ? "Retour à l'accueil" : "Back to home"}
          </Link>
          <span className="mx-2 text-foreground/40">|</span>
          <Link href={politiquePath} className="text-brand-primary hover:underline">
            {t.footer.privacy}
          </Link>
        </div>
      </div>
    </div>
  );
}
