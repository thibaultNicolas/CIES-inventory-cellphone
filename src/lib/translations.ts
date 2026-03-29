import type { Locale } from "./i18n";

export type Translations = (typeof translations)[Locale];

export const translations = {
  fr: {
    // Navigation
    nav: {
      getPrice: "Obtenir mon prix",
      processus: "Processus",
      faq: "FAQ",
      shop: "Magasiner un cellulaire",
      rachat: "Rachat",
      openMenu: "Ouvrir le menu",
      closeMenu: "Fermer le menu",
      logout: "Déconnexion",
      adminDashboard: "Administration",
    },
    // Home page
    home: {
      tagline: "Rachat de cellulaires",
      title: "💰 Vendez votre cellulaire en toute simplicité.",
      titleLine2: "Recevez votre paiement à l'intérieur de 48h après réception.",
      description:
        "Évaluation gratuite en 60 secondes. Expédition offerte. Paiement Interac garanti.",
      cta: "Démarrer mon évaluation",
      mobileCta: "Évaluer mon appareil",
      trustBadges: {
        secure: "Paiement sécurisé",
        fast: "Évaluation en 60s",
        shipping: "Expédition gratuite",
      },
      howItWorks: "Comment ça marche",
      howItWorksSubtitle: "Obtenez votre prix en 60 secondes",
      howItWorksIntro:
        "Trois étapes simples pour vendre votre appareil en toute confiance.",
      step1: {
        number: "01",
        title: "Obtenez votre prix en 60 secondes",
        description:
          "Choisissez votre modèle et son état. Recevez une estimation instantanée et transparente. Aucun engagement.",
      },
      step2: {
        number: "02",
        title: "Expédition gratuite et 100 % sécurisée",
        description:
          "Notre équipe vous transmettra l’étiquette ou les consignes d’expédition. Emballez et envoyez-nous votre appareil ou déposez-le en personne.",
      },
      step3: {
        number: "03",
        title: "Paiement rapide par virement Interac",
        description:
          "Paiement envoyé sous 24–48h après réception.",
      },
      ctaSection: {
        ready: "Prêt à commencer?",
        yourDevice: "Votre appareil a de la valeur.",
        discover: "Découvrez combien.",
        getPrice: "Obtenir mon prix",
      },
      mission: {
        title: "Pourquoi vendre votre appareil cellulaire avec AcheteTonCell ?",
        intro: "Vendre à AcheteTonCell, c'est simple, local et payant !",
        points: [
          {
            title: "Expertise locale",
            description:
              "Un service fier d'être 100 % québécois et Canadien.",
          },
          {
            title: "Fiabilité prouvée",
            description:
              "Déjà plus de 5000 appareils rachetés avec succès.",
          },
          {
            title: "Honnêteté totale",
            description:
              "Le prix estimé est le prix payé. Aucun frais caché, c'est garanti.",
          },
          {
            title: "Paiement rapide",
            description:
              "Votre argent est envoyé directement par virement Interac.",
          },
          {
            title: "Nous sommes à votre écoute",
            description:
              "Profitez d'un support humain personnalisé, sans robots.",
          },
        ],
        phone: "1-833-803-2023",
      },
      brands: {
        title: "Marques qu'on rachète",
        subtitle:
          "8 grandes marques acceptées — iPhone, Samsung, Google et plus",
      },
      store: {
        title: "Envie de changer de cellulaire ?",
        subtitle: "Découvrez nos appareils remis à neuf et certifiés.",
        description:
          "Parcourez notre boutique en ligne : iPhone, Samsung, Google Pixel et plus encore. Chaque appareil est rigoureusement testé, certifié et protégé par une garantie complète. Profitez de la livraison express partout au Canada.",
        cta: "Magasiner nos cellulaires",
      },
      reviews: {
        title: "Ce que nos clients disent",
        subtitle:
          "Des centaines de clients nous font confiance pour le rachat de leur cellulaire.",
        viewOnGoogle: "Voir tous les avis sur Google",
        ratingLabel: "Note moyenne",
        googleReviewsCount: "+200",
        reviewCountLabel: "avis Google",
        reviews: [
          {
            name: "Marie L.",
            stars: 5,
            text: "Processus super simple et rapide. J'ai reçu mon paiement en quelques jours. Je recommande à 100%!",
          },
          {
            name: "Jean-François T.",
            stars: 5,
            text: "Excellente expérience. Équipe professionnelle et prix honnête pour mon iPhone. Merci AcheteTonCell!",
          },
          {
            name: "Sophie G.",
            stars: 5,
            text: "Enfin un service de rachat fiable au Québec. Expédition gratuite, tout est bien expliqué. Très satisfaite.",
          },
        ],
      },
      volume: {
        badge: "SERVICE PRIORITAIRE ENTREPRISES",
        title: "Rachat en volume",
        intro: "Vous avez plusieurs appareils à vendre ?",
        description:
          "Évitez les formulaires individuels et recevez une offre globale personnalisée.",
        bullets: [
          "Traitement prioritaire",
          "Offre compétitive",
          "Paiement rapide",
          "Service québécois sécurisé",
        ],
        ctaButton: "Contacter notre équipe",
        statLine: "Plus de 500 entreprises nous font confiance",
        contactLabel: "Contact direct :",
        phone: "1-833-803-2023",
        email: "info@achetetoncell.com",
      },
      faqRapide: {
        title: "FAQ rapide",
        items: [
          {
            question: "Le prix proposé peut-il changer ?",
            answer:
              "Notre offre est basée sur l'état réel de l'appareil. Si l'état déclaré correspond à l'inspection, le prix est garanti. En cas de différence majeure, nous vous proposerons une nouvelle offre que vous êtes libre d'accepter ou de refuser (avec retour gratuit).",
          },
          {
            question: "Dois-je effacer mes données avant l'envoi ?",
            answer:
              "Oui, pour votre sécurité, vous devez réinitialiser votre appareil et désactiver les comptes iCloud (iPhone) ou Google (Android).",
          },
          {
            question: "Mon paiement est-il garanti et sécurisé ?",
            answer:
              "Absolument. En tant qu'entreprise québécoise enregistrée, nous traitons chaque transaction avec une transparence totale. Vous recevez un reçu officiel et un suivi rigoureux à chaque étape.",
          },
          {
            question: "Comment dois-je emballer mon cellulaire ?",
            answer:
              "Utilisez une boîte rigide et du papier bulle pour bien caler l'appareil. Évitez les enveloppes simples. Un emballage soigné prévient les dommages durant le transport et garantit votre estimation.",
          },
          {
            question: "Quels types de paiements offrez-vous ?",
            answer:
              "Nous privilégions le virement Interac pour sa rapidité et sa sécurité. C'est le moyen le plus simple pour vous d'accéder à vos fonds immédiatement après l'inspection.",
          },
          {
            question: "En combien de temps serai-je payé après l'envoi ?",
            answer:
              "Recevez votre paiement par virement Interac sous 48 heures après la réception et l'inspection de votre appareil.",
          },
        ],
      },
      faq: {
        title: "Questions fréquentes",
        items: [
          {
            question: "Combien de temps dure le processus?",
            answer:
              "De l'évaluation au paiement, tout se fait en 4 jours ouvrables.",
          },
          {
            question: "Mon téléphone doit-il être en parfait état?",
            answer:
              "Non, nous acceptons les appareils en bon état, très bon état et comme neuf.",
          },
          {
            question: "Comment suis-je payé?",
            answer:
              "Par virement bancaire direct dans les 4 jours suivant la réception de votre appareil.",
          },
          {
            question: "L'expédition est-elle vraiment gratuite?",
            answer:
              "Oui, nous vous envoyons une étiquette prépayée Postes Canada.",
          },
        ],
      },
    },
    // Footer
    footer: {
      copyright: "© 2026 AcheteTonCell. Tous droits réservés.",
      privacy: "Politique de confidentialité",
      terms: "Termes et conditions",
      usefulLinks: "Liens utiles",
      tradeInRequest: "Demande de rachat",
      fourDayPayout: "Réponse en 4 jours",
      getPrice: "Obtenir mon prix",
      tagline: "Rachat simple, rapide, transparent.",
      ctaButton: "Obtenir une soumission gratuite",
      businessService: "Service aux entreprises",
      links: {
        rachat: "Rachat",
        processus: "Processus",
        aPropos: "À propos",
        contact: "Contact",
        faq: "FAQ",
      },
      phone: "1-833-803-2023",
      email: "info@achetetoncell.com",
      quebecService: {
        title: "Service québécois",
        subtitle:
          "Points de collecte disponibles pour un paiement le jour même :",
        cities:
          "Québec • Lévis • Trois-Rivières • Drummondville • Victoriaville • Sherbrooke",
      },
      trustLabel: "Service québécois sécurisé",
      taglineShort:
        "Évaluation rapide, expédition offerte et paiement fiable partout au Québec.",
      builtFor: "Conçu pour un rachat simple et rapide.",
      nextSteps: {
        title: "Prochaines étapes",
        step1: "Recevez gratuitement votre étiquette d'expédition.",
        step2: "Envoyez-nous votre appareil.",
        step3: "Soyez payé en moins de 48h après réception.",
      },
      dataProtection: {
        title: "Protection des renseignements personnels",
        responsibleTitle:
          "Responsable de la protection des renseignements personnels",
        responsibleName: "Xavier Lemieux",
        email: "Courriel",
        responsibleEmail: "info@achetetoncell.com",
        phone: "Téléphone",
        responsiblePhone: "1-833-803-2023",
      },
    },
    // Cookie Banner
    cookie: {
      title: "Cookies et confidentialité",
      description:
        "Nous utilisons des cookies pour améliorer votre expérience et analyser notre trafic. Vous pouvez accepter ou refuser les cookies non essentiels.",
      learnMore: "En savoir plus",
      accept: "Accepter",
      reject: "Refuser",
    },
    // Privacy Policy
    privacy: {
      title: "Politique de confidentialité",
      lastUpdated: "Dernière mise à jour",
      // Sections will be added as needed
    },
    // Wizard
    wizard: {
      step1: "Étape 1 sur 4",
      step2: "Étape 2 sur 4",
      step3: "Étape 3 sur 4",
      step4: "Étape 4 sur 4",
      chooseBrand: "Choisissez votre marque",
      searchModelPlaceholder: "Rechercher un modèle (ex: iPhone 13)",
      searchModelAriaLabel: "Rechercher un modèle de téléphone",
      searchModelNoResults: "Aucun modèle trouvé.",
      searchModelClear: "Effacer la recherche",
      selectModel: "Sélectionnez votre",
      deviceCondition: "État de votre",
      yourInfo: "Vos coordonnées",
      step4TradeInTitle: "Informations du rachat",
      back: "Retour",
      continue: "Continuer",
      cta: {
        acceptAndAddAnotherDevice: "Accepter et ajouter un autre appareil",
        getPaid: "Confirmer et recevoir mon paiement",
      },
      capacity: "Capacité",
      deviceConditionLabel: "État de l'appareil",
      conditions: {
        perfect: {
          label: "Parfait",
          description: "Aucune rayure, fonctionne parfaitement",
        },
        good: {
          label: "Bon état",
          description: "Légères traces d'usure, fonctionne bien",
        },
        acceptable: {
          label: "Acceptable",
          description: "Usure visible, fonctionne correctement",
        },
        scratched: {
          label: "Écran brisé",
          description: "Écran fissuré ou défaut majeur",
        },
      },
      form: {
        employeeFullName: "Nom complet de l’employé",
        employeeFullNamePlaceholder: "ex. Marie Tremblay",
        clientFullName: "Nom complet du client",
        clientFullNamePlaceholder: "ex. Jean Dupont",
        clientPhone: "Téléphone du client",
        clientPhonePlaceholder: "+1 514 123 4567",
        clientCity: "Ville",
        clientCityPlaceholder: "ex. Montréal",
        deviceImei: "IMEI du cellulaire",
        deviceImeiPlaceholder: "15 chiffres habituellement",
        deviceImeiHint:
          "Numéro IMEI / identifiant unique de l’appareil (souvent 15 chiffres).",
        fullName: "Nom complet",
        email: "Courriel",
        phone: "Téléphone",
        address: "Adresse complète",
        photoProof: "Preuve photo",
        frontPhoto: "Photo du devant",
        backPhoto: "Photo du derrière",
        batteryPhoto: "Photo de l'état de la batterie",
        uploadSuccess: "Uploadée avec succès",
        uploading: "Upload en cours...",
        dragDrop: "Glissez-déposez une image ou cliquez pour sélectionner",
        privacyAccept:
          "J'accepte que mes données soient traitées conformément à la",
        privacyPolicy: "Politique de Confidentialité",
        privacyAcceptEnd: "pour finaliser ma demande de rachat.",
        dataCollectionNotice:
          "Vos renseignements sont collectés pour le traitement du rachat (magasin et client), la conformité et le suivi de la transaction. Ils sont hébergés de manière sécurisée et ne seront jamais vendus.",
        consentCheckbox:
          "Je consens à la collecte de mes renseignements personnels selon la Politique de Confidentialité.",
        submit: "Vendre mon appareil",
        submitting: "Envoi en cours...",
        submitError: "Une erreur est survenue lors de l'envoi de votre demande.",
        requiredPhotos:
          "Veuillez ajouter les 3 photos (devant, derrière, batterie) pour finaliser votre demande",
        canadaOnlyAddress:
          "Adresse invalide: nous acceptons seulement des adresses au Canada.",
      },
      fromPrice: "À partir de",
      estimatedValueLabel: "Valeur estimée :",
      conditionLabel: "État",
      quantityLabel: "Quantité",
      acceptPrivacyAlert:
        "Veuillez accepter la politique de confidentialité pour continuer.",
      addOneDevice: "Ajoutez au moins un appareil à votre demande.",
      searchingAddresses: "Recherche d'adresses...",
      yourRequest: "Votre demande",
      devicesCount: "appareil(s)",
      removeDevice: "Retirer l'appareil",
      shippingProtectionTitle: "Protection d'expédition (optionnelle)",
      shippingProtectionDescription:
        "Votre envoi inclut déjà une couverture gratuite jusqu'à 100 $. Si vous souhaitez une protection supplémentaire, vous pouvez ajouter une couverture jusqu'à la valeur totale de votre commande en cas de perte ou de dommage pendant le transport (réclamation sujette à approbation). Les frais de protection seront déduits de votre offre.",
      addInsurance: "Ajouter une assurance (-27.99$)",
      insurance: "Assurance",
      googleMapsKeyMissing:
        "Google Maps API key manquante (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).",
    },
    // Success page (post-submit)
    success: {
      rachat: "Rachat",
      done: "C'est fait !",
      messageIntro: "Votre demande a été enregistrée avec succès.",
      messageEmail:
        "Notre équipe traitera votre demande et vous contactera pour la suite (expédition, étiquette si applicable).",
      orderNumber: "Numéro de commande",
      date: "Date",
      totalPayout: "Paiement total",
      shippingProtection: "Protection d'expédition",
      insuranceFee: "Frais d'assurance",
      yes: "Oui",
      no: "Non",
      orderDetails: "Détails de la commande",
      product: "Produit",
      total: "Total",
      totalPayoutLabel: "Paiement total :",
      shippingTitle: "Expédition",
      shippingLabelManual:
        "Notre équipe vous contactera pour les informations de livraison.",
      trackingNumber: "Numéro de suivi",
      reviewInstructions:
        "Notre équipe vous contactera pour les prochaines étapes.",
      emailInstructions:
        "Conservez votre numéro de commande. Nous vous contacterons pour les prochaines étapes.",
      contactSummaryTitle: "Informations enregistrées",
    },
    // Merci page (single device thank you)
    merci: {
      rachat: "Rachat",
      thankYou: "Merci !",
      message:
        "Votre demande de rachat a été enregistrée avec succès. Notre équipe vous contactera pour les instructions d'expédition.",
      summary: "Récapitulatif",
      device: "Appareil :",
      capacity: "Capacité :",
      condition: "État :",
      offeredPrice: "Prix offert :",
      downloadLabel: "Télécharger mon bordereau d'expédition",
      newRequest: "Nouvelle demande",
    },
    // Admin
    admin: {
      administration: "Administration",
      accounts: "Comptes",
      tradeInRequests: "Demandes de rachat",
      commissions: "Commissions",
      products: "Produits",
      incidents: "Incidents (Loi 25)",
      filters: "Filtres :",
      period: "Période :",
      allPeriods: "Toutes les périodes",
      thisWeek: "Semaine en cours",
      lastWeek: "Semaine dernière",
      thisMonth: "Ce mois-ci",
      lastMonth: "Mois dernier",
      threeMonths: "3 mois",
      sixMonths: "6 mois",
      thisYear: "Année en cours",
      custom: "Personnalisé",
      startDate: "Date de début",
      endDate: "Date de fin",
      allBrands: "Toutes les marques",
      allModels: "Tous les modèles",
      allStatuses: "Tous les statuts",
      all: "Toutes",
      paid: "Payées",
      unpaid: "Non payées",
      commissionLabel: "Commission :",
      filterByPaymentStatus: "Filtrer par statut de paiement",
      submissionsCount: "demande",
      submissionsCountPlural: "demandes",
      date: "Date",
      orderNumber: "Commande",
      view: "Voir",
      back: "Retour",
      orderTitle: "Commande",
      placedAt: "Reçue le",
      items: "article",
      itemsPlural: "articles",
      lines: "ligne",
      linesPlural: "lignes",
      orderItemsTitle: "Articles",
      customerTitle: "Client",
      employeeFullName: "Employé",
      clientFullNameLabel: "Client",
      clientPhoneLabel: "Tél. client",
      clientCityLabel: "Ville",
      deviceImeiLabel: "IMEI",
      address: "Adresse",
      summaryTitle: "Résumé",
      itemsLabel: "Articles",
      subtotalLabel: "Sous-total",
      insuranceFeeLabel: "Frais d'assurance",
      totalLabel: "Total",
      shippingTitle: "Expédition",
      trackingNumber: "Numéro de suivi",
      shippingLabel: "Étiquette",
      downloadShippingLabel: "Télécharger l'étiquette (PDF)",
      uploadShippingLabel: "Ajouter l'étiquette",
      shippingLabelDropHint: "Glissez-déposez le PDF ou cliquez pour choisir",
      shippingLabelPdfOnly: "Veuillez ajouter un fichier PDF.",
      shippingLabelManualInfo:
        "Ajoute un PDF puis mets le statut de la commande à « Étiquette envoyé » lorsque le client a reçu l’étiquette (hors plateforme).",
      client: "Client",
      device: "Appareil",
      condition: "État",
      price: "Prix",
      quantity: "Qté",
      unitPrice: "Prix unitaire",
      lineTotal: "Total ligne",
      unpaidCommissionUnits: "unités impayées",
      editPrice: "Modifier prix",
      save: "Enregistrer",
      cancel: "Annuler",
      priceUpdateReason: "Raison",
      priceUpdateReasonPlaceholder: "Ex: ajustement après inspection",
      priceUpdatePrevious: "Ancien prix:",
      priceUpdateInvalidPrice: "Prix invalide.",
      priceUpdateReasonRequired: "Veuillez indiquer une raison.",
      priceUpdateError: "Erreur lors de la mise à jour du prix",
      shippingProtection: "Protection",
      status: "Statut",
      commissionPaid: "Commission payée",
      actions: "Actions",
      change: "Changer",
      noSubmissions: "Aucune demande trouvée",
      statusUnprocessed: "Non traité",
      statusLabelSent: "Étiquette envoyé",
      statusPaid: "Reçu et paiement envoyé",
      statusCancelled: "Annulé",
      markCommissionPaid: "Marquer commission comme payée",
      markCommissionUnpaid: "Marquer commission comme non payée",
      yes: "Oui",
      no: "Non",
      errorUpdateStatus: "Erreur lors de la mise à jour du statut",
      errorUpdate: "Erreur lors de la mise à jour",
      deleteSubmission: "Supprimer la demande",
      deleteOrder: "Supprimer la commande",
      deleteOrderConfirm:
        "Êtes-vous sûr de vouloir supprimer définitivement cette commande et tous ses appareils ? Cette action est irréversible.",
      deleteConfirm:
        "Êtes-vous sûr de vouloir supprimer définitivement cette demande ? Cette action est irréversible.",
      deleteSuccess: "Demande supprimée",
      deleteError: "Erreur lors de la suppression",
      devicesBought: "Appareils achetés",
      totalValuePeriod: "Valeur totale (période)",
      commissionPaidCount: "Commission payée",
      commissionUnpaidCount: "Commission non payée",
      devicesFilter: "Appareils (filtre)",
      commissionAmount: "Montant de commission",
      valueCurrentPage: "Valeur (page actuelle)",
      commissionPaidPage: "Commission payée (page)",
      unpaidPage: "En attente (page)",
      noDevicesForPeriod: "Aucun appareil pour cette période",
      markAsPaid: "Marquer comme payée",
      markAsUnpaid: "Marquer comme non payée",
      loadingCommissions: "Chargement des commissions…",
      accountsManagement: "Gestion des comptes",
      accountsCountLabel: "compte",
      accountsCountLabelPlural: "comptes",
      tradeInRequestsTitle: "Demandes de rachat",
      tradeInRequestsCountLabel: "demande au total",
      tradeInRequestsCountLabelPlural: "demandes au total",
      commissionsTitle: "Commissions",
      commissionsSubtitle:
        "Vue d'ensemble des achats et suivi des commissions payées",
      productsManagement: "Gestion des produits",
      productsCountLabel: "marque",
      productsCountLabelPlural: "marques",
      modelsLabel: "modèle",
      modelsLabelPlural: "modèles",
      pricesLabel: "prix",
      incidentsTitle: "Incidents (Loi 25)",
      incidentsRegister: "Registre des Incidents",
      incidentsSubtitle:
        "Documentation des incidents de confidentialité (Loi 25)",
    },
  },
  en: {
    // Navigation
    nav: {
      getPrice: "Get my price",
      processus: "Process",
      faq: "FAQ",
      shop: "Shop cellphones",
      rachat: "Trade-in",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      logout: "Log out",
      adminDashboard: "Admin",
    },
    // Home page
    home: {
      tagline: "Cellphone trade-in",
      title: "💰 Sell your cellphone with ease.",
      titleLine2: "Get your payment within 48h after we receive it.",
      description:
        "Free evaluation in 60 seconds. Free shipping. Interac payment guaranteed.",
      cta: "Start my evaluation",
      mobileCta: "Evaluate my device",
      trustBadges: {
        secure: "Secure payment",
        fast: "Evaluation in 60s",
        shipping: "Free shipping",
      },
      howItWorks: "How it works",
      howItWorksSubtitle: "Get your price in 60 seconds",
      howItWorksIntro:
        "Three simple steps to sell your device with confidence.",
      step1: {
        number: "01",
        title: "Get your price in 60 seconds",
        description:
          "Choose your model and its condition. Receive an instant, transparent estimate. No commitment.",
      },
      step2: {
        number: "02",
        title: "Free and 100% secure shipping",
        description:
          "Our team will send your prepaid label or shipping instructions. Pack and send us your device or drop it off in person.",
      },
      step3: {
        number: "03",
        title: "Fast payment by Interac transfer",
        description:
          "Payment sent within 24–48h after we receive your device.",
      },
      ctaSection: {
        ready: "Ready to get started?",
        yourDevice: "Your device has value.",
        discover: "Find out how much.",
        getPrice: "Get my price",
      },
      mission: {
        title: "Why sell your cellphone with AcheteTonCell?",
        intro: "Selling to AcheteTonCell is simple, local, and rewarding!",
        points: [
          {
            title: "Local expertise",
            description:
              "A service proud to be 100% Quebec and Canadian.",
          },
          {
            title: "Proven reliability",
            description:
              "Over 5000 devices successfully bought back.",
          },
          {
            title: "Total honesty",
            description:
              "The estimated price is the price you get paid. No hidden fees—guaranteed.",
          },
          {
            title: "Fast payment",
            description:
              "Your money is sent directly by Interac transfer.",
          },
          {
            title: "We're here for you",
            description:
              "Enjoy personalized human support—no bots.",
          },
        ],
        phone: "1-833-803-2023",
      },
      brands: {
        title: "Brands we buy back",
        subtitle: "8 major brands accepted — iPhone, Samsung, Google and more",
      },
      store: {
        title: "Looking to change your cellphone?",
        subtitle: "Discover our refurbished and certified devices.",
        description:
          "Browse our online store: iPhone, Samsung, Google Pixel and more. Every device is rigorously tested, certified, and protected by a full warranty. Enjoy express delivery across Canada.",
        cta: "Shop our cellphones",
      },
      reviews: {
        title: "What our customers say",
        subtitle:
          "Hundreds of customers trust us for their cellphone trade-in.",
        viewOnGoogle: "View all reviews on Google",
        ratingLabel: "Average rating",
        googleReviewsCount: "+200",
        reviewCountLabel: "Google reviews",
        reviews: [
          {
            name: "Marie L.",
            stars: 5,
            text: "Super simple and fast process. I received my payment within days. 100% recommend!",
          },
          {
            name: "Jean-François T.",
            stars: 5,
            text: "Excellent experience. Professional team and fair price for my iPhone. Thanks AcheteTonCell!",
          },
          {
            name: "Sophie G.",
            stars: 5,
            text: "Finally a reliable trade-in service in Quebec. Free shipping, everything well explained. Very satisfied.",
          },
        ],
      },
      volume: {
        badge: "PRIORITY ENTERPRISE SERVICE",
        title: "Volume trade-in",
        intro: "Selling multiple devices?",
        description:
          "Skip individual forms and get one personalized bulk offer.",
        bullets: [
          "Priority processing",
          "Competitive offer",
          "Fast payment",
          "Secure Quebec service",
        ],
        ctaButton: "Contact our team",
        statLine: "Over 500 companies trust us",
        contactLabel: "Direct contact:",
        phone: "1-833-803-2023",
        email: "info@achetetoncell.com",
      },
      faqRapide: {
        title: "Quick FAQ",
        items: [
          {
            question: "Can the offered price change?",
            answer:
              "Our offer is based on the actual condition of the device. If the declared condition matches the inspection, the price is guaranteed. If there is a significant difference, we will propose a new offer that you are free to accept or refuse (with free return).",
          },
          {
            question: "Should I erase my data before sending?",
            answer:
              "Yes, for your security, you must reset your device and disable iCloud (iPhone) or Google (Android) accounts.",
          },
          {
            question: "Is my payment guaranteed and secure?",
            answer:
              "Absolutely. As a registered Quebec business, we handle every transaction with full transparency. You receive an official receipt and rigorous follow-up at every step.",
          },
          {
            question: "How should I pack my cellphone?",
            answer:
              "Use a rigid box and bubble wrap to secure the device. Avoid simple envelopes. Careful packaging prevents damage during shipping and protects your estimate.",
          },
          {
            question: "What payment methods do you offer?",
            answer:
              "We use Interac transfer for its speed and security. It's the simplest way for you to access your funds immediately after inspection.",
          },
          {
            question: "How soon will I be paid after sending?",
            answer:
              "Receive your payment by Interac transfer within 48 hours after we receive and inspect your device.",
          },
        ],
      },
      faq: {
        title: "Frequently asked questions",
        items: [
          {
            question: "How long does the process take?",
            answer:
              "From evaluation to payment, everything is done within 4 business days.",
          },
          {
            question: "Does my phone need to be in perfect condition?",
            answer:
              "No, we accept devices in good, very good, and like-new condition.",
          },
          {
            question: "How do I get paid?",
            answer:
              "By direct bank transfer within 4 days of us receiving your device.",
          },
          {
            question: "Is shipping really free?",
            answer:
              "Yes, we send you a prepaid Canada Post label.",
          },
        ],
      },
    },
    // Footer
    footer: {
      copyright: "© 2026 AcheteTonCell. All rights reserved.",
      privacy: "Privacy Policy",
      terms: "Terms and Conditions",
      usefulLinks: "Useful links",
      tradeInRequest: "Trade-in request",
      fourDayPayout: "4-day payout",
      getPrice: "Get my price",
      tagline: "Simple, fast, transparent trade-in.",
      ctaButton: "Get a free quote",
      businessService: "Business services",
      links: {
        rachat: "Trade-in",
        processus: "Process",
        aPropos: "About",
        contact: "Contact",
        faq: "FAQ",
      },
      phone: "1-833-803-2023",
      email: "info@achetetoncell.com",
      quebecService: {
        title: "Quebec service",
        subtitle: "Drop-off points available for same-day payment:",
        cities:
          "Quebec City • Lévis • Trois-Rivières • Drummondville • Victoriaville • Sherbrooke",
      },
      trustLabel: "Secure Quebec service",
      taglineShort:
        "Fast valuation, free shipping, and reliable payout across Quebec.",
      builtFor: "Built for simple, fast trade-ins.",
      nextSteps: {
        title: "Next steps",
        step1: "Receive your free shipping label.",
        step2: "Send us your device.",
        step3: "Get paid within 48 hours after we receive it.",
      },
      dataProtection: {
        title: "Personal Information Protection",
        responsibleTitle: "Personal Information Protection Officer",
        responsibleName: "[Officer Name]",
        email: "Email",
        responsibleEmail: "info@achetetoncell.com",
        phone: "Phone",
        responsiblePhone: "1-833-803-2023",
      },
    },
    // Cookie Banner
    cookie: {
      title: "Cookies and privacy",
      description:
        "We use cookies to improve your experience and analyze our traffic. You can accept or refuse non-essential cookies.",
      learnMore: "Learn more",
      accept: "Accept",
      reject: "Reject",
    },
    // Privacy Policy
    privacy: {
      title: "Privacy Policy",
      lastUpdated: "Last updated",
    },
    // Wizard
    wizard: {
      step1: "Step 1 of 4",
      step2: "Step 2 of 4",
      step3: "Step 3 of 4",
      step4: "Step 4 of 4",
      chooseBrand: "Choose your brand",
      searchModelPlaceholder: "Search a model (e.g. iPhone 13)",
      searchModelAriaLabel: "Search a phone model",
      searchModelNoResults: "No models found.",
      searchModelClear: "Clear search",
      selectModel: "Select your",
      deviceCondition: "Condition of your",
      yourInfo: "Your contact information",
      step4TradeInTitle: "Trade-in details",
      back: "Back",
      continue: "Continue",
      cta: {
        acceptAndAddAnotherDevice: "Accept & add another device",
        getPaid: "Get Paid",
      },
      capacity: "Capacity",
      deviceConditionLabel: "Device condition",
      conditions: {
        perfect: {
          label: "Perfect",
          description: "No scratches, works perfectly",
        },
        good: {
          label: "Good condition",
          description: "Light wear, works well",
        },
        acceptable: {
          label: "Acceptable",
          description: "Visible wear, works properly",
        },
        scratched: {
          label: "Cracked screen",
          description: "Cracked screen or major defect",
        },
      },
      form: {
        employeeFullName: "Employee full name",
        employeeFullNamePlaceholder: "e.g. Jane Smith",
        clientFullName: "Customer full name",
        clientFullNamePlaceholder: "e.g. John Smith",
        clientPhone: "Customer phone",
        clientPhonePlaceholder: "+1 514 123 4567",
        clientCity: "City",
        clientCityPlaceholder: "e.g. Montreal",
        deviceImei: "Phone IMEI",
        deviceImeiPlaceholder: "Usually 15 digits",
        deviceImeiHint:
          "IMEI / unique device identifier (often 15 digits).",
        fullName: "Full name",
        email: "Email",
        phone: "Phone",
        address: "Full address",
        photoProof: "Photo proof",
        frontPhoto: "Front photo",
        backPhoto: "Back photo",
        batteryPhoto: "Battery condition photo",
        uploadSuccess: "Uploaded successfully",
        uploading: "Uploading...",
        dragDrop: "Drag and drop an image or click to select",
        privacyAccept:
          "I accept that my data be processed in accordance with the",
        privacyPolicy: "Privacy Policy",
        privacyAcceptEnd: "to finalize my trade-in request.",
        dataCollectionNotice:
          "Your information is collected to process the trade-in (store and customer), compliance, and transaction follow-up. It is securely hosted and will never be sold.",
        consentCheckbox:
          "I consent to the collection of my personal information according to the Privacy Policy.",
        submit: "Sell my device",
        submitting: "Submitting...",
        submitError: "Something went wrong while submitting your request.",
        requiredPhotos:
          "Please add the 3 photos (front, back, battery) to finalize your request",
        canadaOnlyAddress: "Invalid address: we only accept Canadian addresses.",
      },
      fromPrice: "From",
      estimatedValueLabel: "Estimated value:",
      conditionLabel: "Condition",
      quantityLabel: "Quantity",
      acceptPrivacyAlert: "Please accept the privacy policy to continue.",
      addOneDevice: "Add at least one device to your request.",
      searchingAddresses: "Searching addresses...",
      yourRequest: "Your request",
      devicesCount: "device(s)",
      removeDevice: "Remove device",
      shippingProtectionTitle: "Shipping Protection (Optional)",
      shippingProtectionDescription:
        "Your shipment already includes free coverage up to $100. If you want extra protection, you can add coverage up to the full value of your order for loss or transit damage (claims subject to approval). The protection fee will be deducted from your offer.",
      addInsurance: "Add insurance (-$27.99)",
      insurance: "Insurance",
      googleMapsKeyMissing:
        "Google Maps API key missing (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).",
    },
    success: {
      rachat: "Trade-in",
      done: "Done!",
      messageIntro: "Your request has been successfully recorded.",
      messageEmail:
        "Our team will process your request and contact you for next steps (shipping, label if applicable).",
      orderNumber: "Order Number",
      date: "Date",
      totalPayout: "Total Payout",
      shippingProtection: "Shipping protection",
      insuranceFee: "Insurance fee",
      yes: "Yes",
      no: "No",
      orderDetails: "Order details",
      product: "Product",
      total: "Total",
      totalPayoutLabel: "Total payout:",
      shippingTitle: "Shipping",
      shippingLabelManual: "Our team will contact you with shipping instructions.",
      trackingNumber: "Tracking number",
      reviewInstructions: "Our team will contact you for the next steps.",
      emailInstructions:
        "Keep your order number. We will contact you for the next steps.",
      contactSummaryTitle: "Information on file",
    },
    merci: {
      rachat: "Trade-in",
      thankYou: "Thank you!",
      message:
        "Your trade-in request has been successfully recorded. Our team will contact you with shipping instructions.",
      summary: "Summary",
      device: "Device:",
      capacity: "Capacity:",
      condition: "Condition:",
      offeredPrice: "Offered price:",
      downloadLabel: "Download my shipping label",
      newRequest: "New request",
    },
    admin: {
      administration: "Administration",
      accounts: "Accounts",
      tradeInRequests: "Trade-in requests",
      commissions: "Commissions",
      products: "Products",
      incidents: "Incidents (Law 25)",
      filters: "Filters:",
      period: "Period:",
      allPeriods: "All periods",
      thisWeek: "This week",
      lastWeek: "Last week",
      thisMonth: "This month",
      lastMonth: "Last month",
      threeMonths: "3 months",
      sixMonths: "6 months",
      thisYear: "This year",
      custom: "Custom",
      startDate: "Start date",
      endDate: "End date",
      allBrands: "All brands",
      allModels: "All models",
      allStatuses: "All statuses",
      all: "All",
      paid: "Paid",
      unpaid: "Unpaid",
      commissionLabel: "Commission:",
      filterByPaymentStatus: "Filter by payment status",
      submissionsCount: "request",
      submissionsCountPlural: "requests",
      date: "Date",
      orderNumber: "Order",
      view: "View",
      back: "Back",
      orderTitle: "Order",
      placedAt: "Received on",
      items: "item",
      itemsPlural: "items",
      lines: "line",
      linesPlural: "lines",
      orderItemsTitle: "Items",
      customerTitle: "Customer",
      employeeFullName: "Employee",
      clientFullNameLabel: "Customer",
      clientPhoneLabel: "Customer phone",
      clientCityLabel: "City",
      deviceImeiLabel: "IMEI",
      address: "Address",
      summaryTitle: "Summary",
      itemsLabel: "Items",
      subtotalLabel: "Subtotal",
      insuranceFeeLabel: "Insurance fee",
      totalLabel: "Total",
      shippingTitle: "Shipping",
      trackingNumber: "Tracking number",
      shippingLabel: "Label",
      downloadShippingLabel: "Download label (PDF)",
      uploadShippingLabel: "Upload label",
      shippingLabelDropHint: "Drop the PDF or click to choose",
      shippingLabelPdfOnly: "Please upload a PDF file.",
      shippingLabelManualInfo:
        "Upload a PDF, then set the order status to “Label sent” once the customer has the label (outside the app).",
      client: "Client",
      device: "Device",
      condition: "Condition",
      price: "Price",
      quantity: "Qty",
      unitPrice: "Unit price",
      lineTotal: "Line total",
      unpaidCommissionUnits: "unpaid units",
      editPrice: "Edit price",
      save: "Save",
      cancel: "Cancel",
      priceUpdateReason: "Reason",
      priceUpdateReasonPlaceholder: "e.g. adjustment after inspection",
      priceUpdatePrevious: "Previous price:",
      priceUpdateInvalidPrice: "Invalid price.",
      priceUpdateReasonRequired: "Please provide a reason.",
      priceUpdateError: "Error updating price",
      shippingProtection: "Protection",
      status: "Status",
      commissionPaid: "Commission paid",
      actions: "Actions",
      change: "Change",
      noSubmissions: "No submissions found",
      statusUnprocessed: "Unprocessed",
      statusLabelSent: "Label sent",
      statusPaid: "Received & paid",
      statusCancelled: "Cancelled",
      markCommissionPaid: "Mark commission as paid",
      markCommissionUnpaid: "Mark commission as unpaid",
      yes: "Yes",
      no: "No",
      errorUpdateStatus: "Error updating status",
      errorUpdate: "Error updating",
      deleteSubmission: "Delete request",
      deleteOrder: "Delete order",
      deleteOrderConfirm:
        "Are you sure you want to permanently delete this order and all its items? This action cannot be undone.",
      deleteConfirm:
        "Are you sure you want to permanently delete this request? This action cannot be undone.",
      deleteSuccess: "Request deleted",
      deleteError: "Error deleting",
      devicesBought: "Devices purchased",
      totalValuePeriod: "Total value (period)",
      commissionPaidCount: "Commission paid",
      commissionUnpaidCount: "Commission unpaid",
      devicesFilter: "Devices (filter)",
      commissionAmount: "Commission amount",
      valueCurrentPage: "Value (current page)",
      commissionPaidPage: "Commission paid (page)",
      unpaidPage: "Pending (page)",
      noDevicesForPeriod: "No devices for this period",
      markAsPaid: "Mark as paid",
      markAsUnpaid: "Mark as unpaid",
      loadingCommissions: "Loading commissions…",
      accountsManagement: "Account management",
      accountsCountLabel: "account",
      accountsCountLabelPlural: "accounts",
      tradeInRequestsTitle: "Trade-in requests",
      tradeInRequestsCountLabel: "request total",
      tradeInRequestsCountLabelPlural: "requests total",
      commissionsTitle: "Commissions",
      commissionsSubtitle:
        "Overview of purchases and commission payment tracking",
      productsManagement: "Product management",
      productsCountLabel: "brand",
      productsCountLabelPlural: "brands",
      modelsLabel: "model",
      modelsLabelPlural: "models",
      pricesLabel: "prices",
      incidentsTitle: "Incidents (Law 25)",
      incidentsRegister: "Incident Register",
      incidentsSubtitle: "Documentation of privacy incidents (Law 25)",
    },
  },
} as const;

export function getTranslations(locale: Locale): Translations {
  return translations[locale];
}
