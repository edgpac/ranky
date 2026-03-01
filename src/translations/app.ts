// ─── App-wide translations (non-landing) ──────────────────────────────────────
// Covers: SubPageLayout, Dashboard, all tabs, SignupPage, FAQ, Privacy, Terms

export const app = {
  en: {

    // ─── SubPageLayout nav + footer ───────────────────────────────────────────
    subLayout: {
      navCta:    'Get Started',
      address:   'HayVista Inc. · Cabo San Lucas, BCS, Mexico · hayvista@gmail.com',
      copyright: '© 2026 HayVista. AI-assisted GBP content management for local businesses.',
      privacy:   'Privacy Policy',
      terms:     'Terms of Service',
      faq:       'FAQ',
    },

    // ─── Dashboard shell ──────────────────────────────────────────────────────
    dash: {
      gbpConnected:        'GBP Connected',
      apiPending:          'API Approval Pending',
      signInUp:            'Sign In / Sign Up',
      logOut:              'Log Out',
      guestBanner:         'Browsing as guest —',
      guestBannerLink:     'Connect Google to manage your real profile',
      simulateLabel:       'Simulate business category:',
      simulateNote:        'In production, sections are fetched dynamically from GBP API based on the connected business category.',
      // GBP Gate
      gateChecking:        'Connecting to your Google Business Profile',
      gateCheckingSub:     'Verifying your account access — just a moment.',
      gateRateLimited:     "Google's API is temporarily throttled",
      gateRateLimitedSub:  'Google limits how often we can verify your account. Once the countdown ends, hit retry.',
      gateRetryIn:         'Retry in',
      gateRetry:           'Retry now →',
      gateGuestTitle:      'Connect your Google Business Profile',
      gateGuestSub:        'Create a free account and link your Google profile to start managing your content.',
      gateAuthTitle:       'Google Business Profile access needed',
      gateAuthSub:         "Your Google connection doesn't include Business Profile permissions. Reconnect to fix it.",
      connectGoogle:       'Connect Google',
      guestInlineBanner:   'Connect your Google Business Profile to see your live data here.',
      // Tab labels
      tabs: {
        profile:    'Edit Profile',
        reviews:    'Reviews',
        photos:     'Photos',
        posts:      'Posts',
        insights:   'Performance',
        services:   'Services',
        products:   'Products',
        bookings:   'Bookings',
        getreviews: 'Get Reviews',
      },
      // Category options
      categories: {
        contractor:  'General Contractor / Handyman',
        restaurant:  'Restaurant / Food',
        store:       'Retail Store',
        salon:       'Salon & Spa',
        hotel:       'Hotel / Lodging',
        doctor:      'Medical / Health',
        real_estate: 'Real Estate',
      },
    },

    // ─── Photos tab ───────────────────────────────────────────────────────────
    photos: {
      heading:          'Photos & Videos',
      subtitleMock:     'Connect your GBP to manage photos. These appear on your Google listing in Search and Maps.',
      subtitleReal:     'Photos uploaded here are synced to your GBP listing and shown to customers on Google Search and Maps.',
      addPhoto:         '+ Add Photo',
      cancel:           'Cancel',
      photo:            'photo',
      photos:           'photos',
      page:             'page',
      of:               'of',
      noPhotos:         'No photos yet — click "+ Add Photo" to upload your first one.',
      uploadHeading:    'Upload Photo',
      uploadSubtitle:   'HayVista injects SEO metadata (title, description, keywords) into the image before uploading so Google can index exactly what the photo shows.',
      uploadSuccess:    'Uploaded to Google ✓',
      uploadSuccessKw:  'Keywords:',
      dropClick:        'Click to select photo',
      dropFormats:      'JPEG · PNG · WebP · max 15 MB',
      captionPlaceholder: 'Caption (optional)',
      uploadBtn:        'Upload to Google Business Profile',
      uploading:        'Adding metadata & uploading…',
      view:             'View ↗',
      prev:             '← Prev',
      next:             'Next →',
    },

    // ─── Services tab ─────────────────────────────────────────────────────────
    services: {
      heading:      'Services',
      addService:   '+ Add Service',
      subtitleMock: 'Connect your GBP to manage services. Edit them here and HayVista will sync to Google.',
      subtitleReal: 'These services appear on your GBP listing. Edit them here and HayVista will sync to Google.',
      noServices:   'No services yet — click "+ Add Service" to get started.',
      namePlaceholder: 'Service name',
      pricePlaceholder: 'Price (e.g. From $85)',
      descPlaceholder:  'Short description',
      save:    'Save',
      cancel:  'Cancel',
      edit:    'Edit',
    },

    // ─── Posts tab ────────────────────────────────────────────────────────────
    posts: {
      heading:         'Post Automation',
      scheduleTitle:   'Automation Schedule',
      scheduleActive:  'ACTIVE',
      scheduleDays:    'Mon · Wed · Fri at 9 AM',
      scheduleSettings:'Settings',
      postsPerWeek:    'posts/week',
      tone:            'Tone',
      generateNow:     'Generate Now',
      generating:      'Generating…',
      nextRun:         'Next run:',
      pendingTitle:    'Pending Review',
      pendingEmpty:    'No pending posts — the next batch will generate on the next scheduled run.',
      autoApprove:     'auto-approves in',
      discard:         'Discard',
      approveNow:      'Approve ✓',
      publishedTitle:  'Published',
      publishedEmpty:  'No posts published yet.',
      edit:            'Edit',
      saving:          'Saving…',
      save:            'Save',
      cancel:          'Cancel',
    },

    // ─── Reviews tab ─────────────────────────────────────────────────────────
    reviews: {
      heading:     'Customer Reviews',
      subtitle:    'AI-generated reply drafts for every incoming review. Review, edit, and post directly to Google.',
      noReviews:   'No reviews yet.',
      generating:  'Generating reply…',
      posting:     'Posting…',
      postReply:   'Post Reply →',
      editReply:   'Edit Reply',
      save:        'Save',
      cancel:      'Cancel',
      replyPosted: 'Reply posted ✓',
      stars:       'stars',
    },

    // ─── Insights tab ─────────────────────────────────────────────────────────
    insights: {
      heading:          'Performance',
      interactions:     'Interactions',
      calls:            'Calls',
      directions:       'Directions',
      websiteClicks:    'Website Clicks',
      fromLastPeriod:   'from last period',
      apiPending:       'API pending',
      chartTitle:       'Profile Interactions by Month',
      profileHealth:    'Profile Health',
      critical:         'critical',
      warnings:         'warnings',
      allGood:          'All good',
      footerNote:       'Full breakdowns for calls, direction requests, and website clicks will populate once the GBP API is approved.',
      tabs: {
        photos:     'Photos',
        reviews:    'Reviews',
        getreviews: 'Get Reviews',
        profile:    'Edit Profile',
        posts:      'Posts',
      },
    },

    // ─── Get Reviews tab ──────────────────────────────────────────────────────
    getReviews: {
      heading:   'Get More Reviews',
      subtitle:  'Share your Google review link directly with customers to grow your rating.',
      linkLabel: 'Your Review Link',
      save:      'Save Link',
      saving:    'Saving…',
      saved:     'Saved ✓',
      share:     'Share',
      copy:      'Copy Link',
      copied:    'Copied!',
    },

    // ─── Products tab ─────────────────────────────────────────────────────────
    products: {
      heading:    'Products',
      addProduct: '+ Add Product',
      noProducts: 'No products yet.',
      save:       'Save',
      cancel:     'Cancel',
      edit:       'Edit',
    },

    // ─── Bookings tab ─────────────────────────────────────────────────────────
    bookings: {
      heading:  'Bookings',
      subtitle: 'Manage your booking link and appointment settings.',
    },

    // ─── Edit Profile tab ─────────────────────────────────────────────────────
    profile: {
      heading:   'Business Profile',
      save:      'Save',
      cancel:    'Cancel',
      edit:      'Edit',
      notSet:    'Not set',
    },

    // ─── Signup page ──────────────────────────────────────────────────────────
    signup: {
      tagline:    'Your GBP, always visible.',
      taglineSub: 'Real photos. Real search data. AI-crafted content published on your schedule.',
      bullets: [
        'No passwords shared. Ever.',
        'Works with your existing GBP photos.',
        'Cancel anytime. No contracts.',
      ],
      stats: [
        { v: '2 min',  l: 'setup' },
        { v: '100%',   l: 'GBP compliant' },
        { v: '3×',     l: 'posts/week' },
      ],
      step0: {
        heading: 'What would you like to manage?',
        sub:     "Choose a feature to get started — you can use all of them once you're in.",
        alreadyHave:  'Already have an account?',
        signIn:       'Sign in',
      },
      step1: {
        backBtn:       '← Back',
        signupHeading: 'Connect your Google Business Profile',
        signupSub:     'Create a free account and link your Google profile to start managing your content.',
        loginHeading:  'Welcome back',
        loginSub:      'Sign in to your HayVista account.',
        yourName:      'Your name',
        namePlaceholder: 'Your name',
        businessName:  'Business name',
        bizPlaceholder: 'Your business name',
        businessType:  'Business type',
        postTone:      'Post tone',
        postFreq:      'How often do you want to post?',
        perWeek:       'per week',
        ctaSignup:     'Continue With Google',
        ctaLogin:      'Sign In with Google',
        noAccount:     "Don't have an account?",
        getStarted:    'Get started',
        alreadyHave:   'Already have an account?',
        signIn:        'Sign in',
        legal:         'By continuing you agree to our Terms of Service and Privacy Policy.',
      },
      features: [
        { icon: '⭐', label: 'Reviews',     tab: 'reviews',     desc: 'Respond to customer reviews with AI-matched tone' },
        { icon: '📸', label: 'Photos',      tab: 'photos',      desc: "Drop in real photos from your jobs or location. We tag them with the right keywords and push them to your GBP — that's all you need to do." },
        { icon: '📝', label: 'Posts',       tab: 'posts',       desc: 'We look at your photos, services, and products, then check what people nearby are searching for — and write posts that connect the two.' },
        { icon: '📊', label: 'Insights',    tab: 'insights',    desc: 'Track views, searches, and profile activity' },
        { icon: '🛠️', label: 'Services',    tab: 'services',    desc: 'Keep your service listings up to date' },
        { icon: '🔗', label: 'Get Reviews', tab: 'get-reviews', desc: 'Share your review link and grow your rating' },
      ],
      businessTypes: [
        { value: 'general',     label: 'General / Other' },
        { value: 'restaurant',  label: 'Restaurant / Café / Food' },
        { value: 'contractor',  label: 'Contractor / Handyman / Home Services' },
        { value: 'medical',     label: 'Medical / Dental / Wellness' },
        { value: 'salon',       label: 'Salon / Barbershop / Spa' },
        { value: 'gym',         label: 'Gym / Fitness / Yoga' },
        { value: 'retail',      label: 'Retail Store / Boutique' },
        { value: 'real_estate', label: 'Real Estate' },
        { value: 'auto',        label: 'Auto Repair / Dealership' },
        { value: 'legal',       label: 'Law Firm / Legal Services' },
      ],
    },

    // ─── FAQ page ─────────────────────────────────────────────────────────────
    faq: {
      heading: 'Frequently Asked Questions',
      sub:     'Answers about Google Business Profile, local SEO, and how HayVista works.',
      contact: 'Still have questions?',
      faqs: [
        {
          q: "Why do I need a Google Business Profile if I'm already viral on social media?",
          a: "Going viral gets attention — but Google doesn't watch your Reels. When someone uploads a video or photo to Instagram or TikTok, Google sees random content on the internet. It doesn't know who made it, what service they offer, where they're located, or whether customers were happy. A Google Business Profile is how you tell Google: here's my name, here's what I do, here's where I am, here's what my customers think, and here's fresh proof that I'm still open and working. Without that structure, Google has no reason to recommend you — no matter how many followers you have.",
        },
        {
          q: 'What is Google Business Profile and why does it matter?',
          a: "Google Business Profile (GBP) is the structured record Google uses to decide which local businesses to show in Search and Maps when someone nearby is looking for a service. It holds your hours, photos, services, reviews, and posts — all organized in a way Google can read and rank. Think of it as your business's permanent address on Google's internet, not just a post that floats past and disappears.",
        },
        {
          q: 'What happens if I never post to my GBP?',
          a: "An inactive GBP signals to Google that your business might be closed, outdated, or not worth recommending. Google favors profiles that show recent activity — posts, new photos, fresh reviews, updated hours. When you go months without touching your profile, competitors who do post consistently start appearing above you, even if your work is better. Visibility on Google isn't something you earn once. It requires consistent upkeep.",
        },
        {
          q: 'Does posting on social media help my Google ranking?',
          a: "Not directly. Social media posts live inside closed platforms — Instagram, Facebook, TikTok — and Google has very limited access to that content. Even if a post about your business goes viral, it doesn't update your GBP, doesn't add a keyword to your services list, and doesn't tell Google you're actively open for business this week. Social media builds your audience. GBP builds your discoverability on Google Search and Maps — two completely different places customers find you.",
        },
        {
          q: 'How often should I post to my GBP?',
          a: "Google's own guidance recommends posting consistently, up to a few times per week. HayVista posts 3 times per week (Mon, Wed, Fri) — which sits right within Google's recommended limit for healthy profiles. Posting more than that can look spammy and may work against you. The goal is a steady, professional rhythm: new content every week that keeps your profile active without flooding it.",
        },
        {
          q: 'What kind of content does HayVista publish to my GBP?',
          a: "HayVista rotates through four post formats that Google supports: Updates (general business news or tips), Offers (promotions or seasonal deals), Events (anything date-specific at your business), and What's New posts (showcasing work, photos, or services). Each post uses real photos from your GBP and is written around the search terms people in your area are actually using — so every post is both relevant to Google and useful to the customer reading it.",
        },
        {
          q: 'How does HayVista know what to write about my business?',
          a: "On day one, HayVista reads your entire Google Business Profile: your business name, category, services, description, photos, and location. It also analyzes what people near you are searching for in your category. From that, it builds a content strategy specific to your business — no generic filler, no posts that could belong to any other shop. Your photos are matched to relevant search queries so the content actually reflects the work you do.",
        },
        {
          q: 'What about reviews — does HayVista help with those?',
          a: "Yes. HayVista drafts a reply for every incoming customer review. Whether it's a glowing 5-star or a frustrated 1-star, you get a suggested response that matches your tone — professional, friendly, or bilingual. Responding to reviews tells Google that you're engaged with your customers, which is a positive signal for your ranking. It also shows future customers that you care about the experience you deliver.",
        },
        {
          q: "Is HayVista allowed to post to my GBP? Is it Google-compliant?",
          a: "Yes. HayVista uses the official Google Business Profile API, which is the Google-approved way for software to manage GBP content on a business owner's behalf. We follow all Google API Services User Data Policy requirements, including Limited Use rules. Your data is accessed only to manage your profile — nothing else. You authorize HayVista through Google's own OAuth login, and you can revoke that access at any time from your Google Account settings.",
        },
        {
          q: 'Can I cancel anytime? What happens to my GBP when I do?',
          a: "You can cancel at any time — no contracts, no cancellation fees, no lock-in. When you cancel, HayVista stops posting to your GBP. Everything that was already published stays on your profile permanently — those posts belong to your Google Business Profile, not to HayVista. Your profile doesn't get wiped. It just stops receiving new content until you decide to restart.",
        },
      ],
    },

    // ─── Privacy page ─────────────────────────────────────────────────────────
    terms: {
      heading:    'Terms of Service',
      lastUpdated: 'Last updated: February 2026',
      sections: [
        { title: '1. Acceptance', body: 'By using HayVista, you agree to these Terms of Service. If you do not agree, do not use the platform.' },
        { title: '2. Description of Service', body: 'HayVista is a platform that connects to your Google Business Profile via OAuth to help you manage business information, posts, and profile data. You must have legitimate owner or manager access to any Google Business Profile you connect.' },
        {
          title: '3. Your Responsibilities',
          bullets: [
            'You are responsible for maintaining the security of your account credentials',
            'You may only connect Business Profiles you own or are authorized to manage',
            'You agree not to use the service for unlawful purposes',
          ],
        },
        { title: '4. Google Services', body: 'HayVista integrates with Google APIs. Your use of Google services through HayVista is also subject to', bodyLinkText: "Google's Terms of Service", bodyLinkHref: 'https://policies.google.com/terms', bodySuffix: '.' },
        { title: '5. Limitation of Liability', body: 'HayVista is provided "as is" without warranties of any kind. We are not liable for any indirect or consequential damages arising from use of the service.' },
        { title: '6. Changes to Terms', body: 'We may update these terms at any time. Continued use of the service after changes constitutes acceptance of the updated terms.' },
        { title: '7. Contact', body: 'Questions about these terms? Contact us at' },
      ],
    },

    privacy: {
      heading:    'Privacy Policy',
      lastUpdated: 'Last updated: February 2026',
      sections: [
        {
          title: '1. Overview',
          body: 'HayVista is a SaaS platform that allows business owners to connect and manage their Google Business Profile. This policy explains what data we collect, how we use it, and your rights regarding that data.',
        },
        {
          title: '2. Data We Collect',
          intro: 'When you sign in with Google, we receive:',
          bullets: [
            'Your Google account email address and display name',
            'An OAuth access token to interact with your Google Business Profile on your behalf',
            'Business location data from your connected Google Business Profile',
          ],
        },
        {
          title: '3. How We Use Your Data',
          intro: 'Your data is used exclusively to:',
          bullets: [
            'Authenticate you and maintain your session',
            'Connect to your Google Business Profile on your behalf',
            'Display and manage your business profile information within the platform',
          ],
          footer: 'We do not sell, share, or expose your data to third parties.',
        },
        {
          title: '4. Google Business Profile API Data',
          body: 'HayVista accesses Google Business Profile (GBP) data solely on behalf of authenticated users who have explicitly granted permission via Google OAuth 2.0. This includes business information, photos, posts, reviews, and performance insights belonging to the user\'s own GBP listing.',
          intro: 'This data is used exclusively to:',
          bullets: [
            "Generate and publish posts to the user's own Google Business Profile",
            'Display profile information within the HayVista dashboard',
            "Match the user's real photos to local search queries for content creation",
            'Read reviews and performance insights to inform post strategy',
          ],
          footer: 'We do not sell, share, transfer, or use GBP data for any purpose beyond delivering the HayVista service to the authenticated user. We do not access any GBP data beyond what is necessary to perform the actions explicitly requested by the user.',
          revoke: "Users can revoke HayVista's access to their Google account at any time by visiting",
          revokeSuffix: '. Upon revocation, all associated GBP data will be deleted from our systems within 30 days.',
          policy: "HayVista's use of data obtained from Google APIs adheres strictly to the",
          policyLink: 'Google API Services User Data Policy',
          policySuffix: ", including the Limited Use requirements. Access is scoped only to the authenticated user's own Business Profile. No GBP data is transferred to third parties except as strictly necessary to operate the service (e.g., Anthropic Claude for AI post generation, under strict data processing terms).",
        },
        {
          title: '5. Data Retention',
          body: 'We store your account information and OAuth tokens in a secure database for as long as your account is active. You may request deletion at any time by contacting us.',
        },
        {
          title: '6. Your Rights',
          intro: 'You have the right to:',
          bullets: [
            'Access the data we hold about you',
            'Request deletion of your account and associated data',
            'Revoke Google OAuth access at any time via your Google Account settings',
          ],
        },
        {
          title: '7. Contact',
          body: 'For privacy questions or data deletion requests, contact us at',
        },
      ],
    },

  },

  // ─── ESPAÑOL ─────────────────────────────────────────────────────────────────

  es: {

    subLayout: {
      navCta:    'Comenzar',
      address:   'HayVista Inc. · Cabo San Lucas, BCS, México · hayvista@gmail.com',
      copyright: '© 2026 HayVista. Gestión de contenido GBP asistida por IA para negocios locales.',
      privacy:   'Política de Privacidad',
      terms:     'Términos de Servicio',
      faq:       'Preguntas Frecuentes',
    },

    dash: {
      gbpConnected:        'GBP Conectado',
      apiPending:          'Aprobación de API Pendiente',
      signInUp:            'Iniciar sesión / Registrarse',
      logOut:              'Cerrar sesión',
      guestBanner:         'Navegando como invitado —',
      guestBannerLink:     'Conecta Google para gestionar tu perfil real',
      simulateLabel:       'Simular categoría de negocio:',
      simulateNote:        'En producción, las secciones se obtienen dinámicamente de la API de GBP según la categoría del negocio conectado.',
      gateChecking:        'Conectando a tu Perfil de Negocio de Google',
      gateCheckingSub:     'Verificando el acceso a tu cuenta — un momento.',
      gateRateLimited:     'La API de Google está temporalmente limitada',
      gateRateLimitedSub:  'Google limita la frecuencia con la que podemos verificar tu cuenta. Una vez que termine la cuenta regresiva, intenta de nuevo.',
      gateRetryIn:         'Reintentar en',
      gateRetry:           'Reintentar →',
      gateGuestTitle:      'Conecta tu Perfil de Negocio de Google',
      gateGuestSub:        'Crea una cuenta gratuita y vincula tu perfil de Google para comenzar a gestionar tu contenido.',
      gateAuthTitle:       'Se necesita acceso al Perfil de Negocio de Google',
      gateAuthSub:         'Tu conexión con Google no incluye permisos del Perfil de Negocio. Vuelve a conectar para solucionar esto.',
      connectGoogle:       'Conectar Google',
      guestInlineBanner:   'Conecta tu Perfil de Negocio de Google para ver tus datos en vivo aquí.',
      tabs: {
        profile:    'Editar Perfil',
        reviews:    'Reseñas',
        photos:     'Fotos',
        posts:      'Publicaciones',
        insights:   'Rendimiento',
        services:   'Servicios',
        products:   'Productos',
        bookings:   'Reservas',
        getreviews: 'Obtener Reseñas',
      },
      categories: {
        contractor:  'Contratista General / Mantenimiento',
        restaurant:  'Restaurante / Comida',
        store:       'Tienda Minorista',
        salon:       'Salón & Spa',
        hotel:       'Hotel / Alojamiento',
        doctor:      'Médico / Salud',
        real_estate: 'Bienes Raíces',
      },
    },

    photos: {
      heading:          'Fotos y Videos',
      subtitleMock:     'Conecta tu GBP para gestionar fotos. Estas aparecen en tu listado de Google en Búsqueda y Maps.',
      subtitleReal:     'Las fotos subidas aquí se sincronizan con tu listado de GBP y se muestran a clientes en Google Búsqueda y Maps.',
      addPhoto:         '+ Agregar Foto',
      cancel:           'Cancelar',
      photo:            'foto',
      photos:           'fotos',
      page:             'página',
      of:               'de',
      noPhotos:         'Aún no hay fotos — haz clic en "+ Agregar Foto" para subir la primera.',
      uploadHeading:    'Subir Foto',
      uploadSubtitle:   'HayVista inyecta metadatos SEO (título, descripción, palabras clave) en la imagen antes de subirla para que Google pueda indexar exactamente lo que muestra la foto.',
      uploadSuccess:    'Subida a Google ✓',
      uploadSuccessKw:  'Palabras clave:',
      dropClick:        'Haz clic para seleccionar foto',
      dropFormats:      'JPEG · PNG · WebP · máx. 15 MB',
      captionPlaceholder: 'Descripción (opcional)',
      uploadBtn:        'Subir al Perfil de Negocio de Google',
      uploading:        'Agregando metadatos y subiendo…',
      view:             'Ver ↗',
      prev:             '← Anterior',
      next:             'Siguiente →',
    },

    services: {
      heading:      'Servicios',
      addService:   '+ Agregar Servicio',
      subtitleMock: 'Conecta tu GBP para gestionar servicios. Edítalos aquí y HayVista los sincronizará con Google.',
      subtitleReal: 'Estos servicios aparecen en tu listado de GBP. Edítalos aquí y HayVista los sincronizará con Google.',
      noServices:   'Aún no hay servicios — haz clic en "+ Agregar Servicio" para comenzar.',
      namePlaceholder: 'Nombre del servicio',
      pricePlaceholder: 'Precio (ej. Desde $85)',
      descPlaceholder:  'Descripción breve',
      save:    'Guardar',
      cancel:  'Cancelar',
      edit:    'Editar',
    },

    posts: {
      heading:         'Automatización de Publicaciones',
      scheduleTitle:   'Horario de Automatización',
      scheduleActive:  'ACTIVO',
      scheduleDays:    'Lun · Mié · Vie a las 9 AM',
      scheduleSettings:'Configuración',
      postsPerWeek:    'publicaciones/semana',
      tone:            'Tono',
      generateNow:     'Generar Ahora',
      generating:      'Generando…',
      nextRun:         'Próxima ejecución:',
      pendingTitle:    'Pendientes de Revisión',
      pendingEmpty:    'Sin publicaciones pendientes — el próximo lote se generará en la próxima ejecución programada.',
      autoApprove:     'se aprueba automáticamente en',
      discard:         'Descartar',
      approveNow:      'Aprobar ✓',
      publishedTitle:  'Publicadas',
      publishedEmpty:  'Aún no hay publicaciones publicadas.',
      edit:            'Editar',
      saving:          'Guardando…',
      save:            'Guardar',
      cancel:          'Cancelar',
    },

    reviews: {
      heading:     'Reseñas de Clientes',
      subtitle:    'Borradores de respuesta generados por IA para cada reseña entrante. Revisa, edita y publica directamente en Google.',
      noReviews:   'Aún no hay reseñas.',
      generating:  'Generando respuesta…',
      posting:     'Publicando…',
      postReply:   'Publicar Respuesta →',
      editReply:   'Editar Respuesta',
      save:        'Guardar',
      cancel:      'Cancelar',
      replyPosted: 'Respuesta publicada ✓',
      stars:       'estrellas',
    },

    insights: {
      heading:          'Rendimiento',
      interactions:     'Interacciones',
      calls:            'Llamadas',
      directions:       'Direcciones',
      websiteClicks:    'Clics al Sitio Web',
      fromLastPeriod:   'del período anterior',
      apiPending:       'API pendiente',
      chartTitle:       'Interacciones del Perfil por Mes',
      profileHealth:    'Salud del Perfil',
      critical:         'críticos',
      warnings:         'advertencias',
      allGood:          'Todo bien',
      footerNote:       'Los desgloces completos de llamadas, solicitudes de dirección y clics al sitio web se mostrarán una vez que se apruebe la API de GBP.',
      tabs: {
        photos:     'Fotos',
        reviews:    'Reseñas',
        getreviews: 'Obtener Reseñas',
        profile:    'Editar Perfil',
        posts:      'Publicaciones',
      },
    },

    getReviews: {
      heading:   'Obtén Más Reseñas',
      subtitle:  'Comparte tu enlace de reseñas de Google directamente con los clientes para mejorar tu calificación.',
      linkLabel: 'Tu Enlace de Reseñas',
      save:      'Guardar Enlace',
      saving:    'Guardando…',
      saved:     'Guardado ✓',
      share:     'Compartir',
      copy:      'Copiar Enlace',
      copied:    '¡Copiado!',
    },

    products: {
      heading:    'Productos',
      addProduct: '+ Agregar Producto',
      noProducts: 'Aún no hay productos.',
      save:       'Guardar',
      cancel:     'Cancelar',
      edit:       'Editar',
    },

    bookings: {
      heading:  'Reservas',
      subtitle: 'Gestiona tu enlace de reservas y configuración de citas.',
    },

    profile: {
      heading:   'Perfil del Negocio',
      save:      'Guardar',
      cancel:    'Cancelar',
      edit:      'Editar',
      notSet:    'No establecido',
    },

    signup: {
      tagline:    'Tu GBP, siempre visible.',
      taglineSub: 'Fotos reales. Datos de búsqueda reales. Contenido creado por IA publicado en tu horario.',
      bullets: [
        'Sin contraseñas compartidas. Nunca.',
        'Funciona con tus fotos de GBP existentes.',
        'Cancela cuando quieras. Sin contratos.',
      ],
      stats: [
        { v: '2 min',  l: 'configuración' },
        { v: '100%',   l: 'compatible con GBP' },
        { v: '3×',     l: 'publicaciones/semana' },
      ],
      step0: {
        heading: '¿Qué te gustaría gestionar?',
        sub:     'Elige una función para comenzar — podrás usar todas una vez que estés dentro.',
        alreadyHave:  '¿Ya tienes una cuenta?',
        signIn:       'Iniciar sesión',
      },
      step1: {
        backBtn:       '← Atrás',
        signupHeading: 'Conecta tu Perfil de Negocio de Google',
        signupSub:     'Crea una cuenta gratuita y vincula tu perfil de Google para comenzar a gestionar tu contenido.',
        loginHeading:  'Bienvenido de vuelta',
        loginSub:      'Inicia sesión en tu cuenta de HayVista.',
        yourName:      'Tu nombre',
        namePlaceholder: 'Tu nombre',
        businessName:  'Nombre del negocio',
        bizPlaceholder: 'Nombre de tu negocio',
        businessType:  'Tipo de negocio',
        postTone:      'Tono de publicación',
        postFreq:      '¿Con qué frecuencia quieres publicar?',
        perWeek:       'por semana',
        ctaSignup:     'Continuar con Google',
        ctaLogin:      'Iniciar sesión con Google',
        noAccount:     '¿No tienes cuenta?',
        getStarted:    'Comenzar',
        alreadyHave:   '¿Ya tienes una cuenta?',
        signIn:        'Iniciar sesión',
        legal:         'Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad.',
      },
      features: [
        { icon: '⭐', label: 'Reseñas',         tab: 'reviews',     desc: 'Responde a reseñas de clientes con tono adaptado por IA' },
        { icon: '📸', label: 'Fotos',            tab: 'photos',      desc: 'Sube fotos reales de tus trabajos o local. Las etiquetamos con las palabras clave correctas y las publicamos en tu GBP — eso es todo lo que necesitas hacer.' },
        { icon: '📝', label: 'Publicaciones',    tab: 'posts',       desc: 'Analizamos tus fotos, servicios y productos, verificamos qué busca la gente cerca de ti — y escribimos publicaciones que los conectan.' },
        { icon: '📊', label: 'Rendimiento',      tab: 'insights',    desc: 'Rastrea vistas, búsquedas y actividad del perfil' },
        { icon: '🛠️', label: 'Servicios',        tab: 'services',    desc: 'Mantén actualizados tus listados de servicios' },
        { icon: '🔗', label: 'Obtener Reseñas',  tab: 'get-reviews', desc: 'Comparte tu enlace de reseñas y mejora tu calificación' },
      ],
      businessTypes: [
        { value: 'general',     label: 'General / Otro' },
        { value: 'restaurant',  label: 'Restaurante / Café / Comida' },
        { value: 'contractor',  label: 'Contratista / Mantenimiento / Servicios del hogar' },
        { value: 'medical',     label: 'Médico / Dental / Bienestar' },
        { value: 'salon',       label: 'Salón / Barbería / Spa' },
        { value: 'gym',         label: 'Gimnasio / Fitness / Yoga' },
        { value: 'retail',      label: 'Tienda Minorista / Boutique' },
        { value: 'real_estate', label: 'Bienes Raíces' },
        { value: 'auto',        label: 'Reparación de Autos / Concesionario' },
        { value: 'legal',       label: 'Bufete de Abogados / Servicios Legales' },
      ],
    },

    faq: {
      heading: 'Preguntas Frecuentes',
      sub:     'Respuestas sobre Google Business Profile, SEO local y cómo funciona HayVista.',
      contact: '¿Aún tienes preguntas?',
      faqs: [
        {
          q: '¿Por qué necesito un Perfil de Negocio de Google si ya soy viral en redes sociales?',
          a: 'Hacerse viral llama la atención — pero Google no mira tus Reels. Cuando alguien sube un video o foto a Instagram o TikTok, Google ve contenido aleatorio en internet. No sabe quién lo hizo, qué servicio ofrece, dónde está ubicado ni si los clientes quedaron satisfechos. Un Perfil de Negocio de Google es cómo le dices a Google: este es mi nombre, esto es lo que hago, aquí estoy, esto piensan mis clientes, y aquí hay prueba de que sigo abierto y trabajando. Sin esa estructura, Google no tiene razón para recomendarte — sin importar cuántos seguidores tengas.',
        },
        {
          q: '¿Qué es Google Business Profile y por qué importa?',
          a: 'Google Business Profile (GBP) es el registro estructurado que Google usa para decidir qué negocios locales mostrar en Búsqueda y Maps cuando alguien cercano busca un servicio. Contiene tus horarios, fotos, servicios, reseñas y publicaciones — todo organizado de una manera que Google puede leer y clasificar. Piénsalo como la dirección permanente de tu negocio en internet de Google, no solo una publicación que pasa de largo y desaparece.',
        },
        {
          q: '¿Qué pasa si nunca publico en mi GBP?',
          a: 'Un GBP inactivo le señala a Google que tu negocio podría estar cerrado, desactualizado o no vale la pena recomendar. Google favorece los perfiles que muestran actividad reciente — publicaciones, fotos nuevas, reseñas recientes, horarios actualizados. Cuando pasas meses sin tocar tu perfil, los competidores que sí publican consistentemente comienzan a aparecer por encima de ti, aunque tu trabajo sea mejor. La visibilidad en Google no es algo que ganas una vez. Requiere mantenimiento constante.',
        },
        {
          q: '¿Publicar en redes sociales ayuda a mi posición en Google?',
          a: 'No directamente. Las publicaciones en redes sociales viven dentro de plataformas cerradas — Instagram, Facebook, TikTok — y Google tiene acceso muy limitado a ese contenido. Aunque una publicación sobre tu negocio se haga viral, no actualiza tu GBP, no agrega una palabra clave a tu lista de servicios ni le dice a Google que estás activamente abierto esta semana. Las redes sociales construyen tu audiencia. GBP construye tu visibilidad en Google Búsqueda y Maps — dos lugares completamente diferentes donde los clientes te encuentran.',
        },
        {
          q: '¿Con qué frecuencia debería publicar en mi GBP?',
          a: 'La propia guía de Google recomienda publicar consistentemente, hasta varias veces por semana. HayVista publica 3 veces por semana (Lun, Mié, Vie) — lo que está dentro del límite recomendado de Google para perfiles saludables. Publicar más puede parecer spam y puede perjudicarte. El objetivo es un ritmo constante y profesional: contenido nuevo cada semana que mantiene activo tu perfil sin saturarlo.',
        },
        {
          q: '¿Qué tipo de contenido publica HayVista en mi GBP?',
          a: "HayVista alterna entre cuatro formatos de publicación que Google admite: Actualizaciones (noticias generales del negocio o consejos), Ofertas (promociones o descuentos de temporada), Eventos (cualquier cosa con fecha específica en tu negocio) y publicaciones de Novedades (mostrando trabajos, fotos o servicios). Cada publicación usa fotos reales de tu GBP y está escrita en torno a los términos de búsqueda que la gente en tu área realmente usa — así cada publicación es relevante para Google y útil para el cliente que la lee.",
        },
        {
          q: '¿Cómo sabe HayVista qué escribir sobre mi negocio?',
          a: 'Desde el primer día, HayVista lee todo tu Perfil de Negocio de Google: nombre, categoría, servicios, descripción, fotos y ubicación. También analiza qué busca la gente cerca de ti en tu categoría. Con eso, construye una estrategia de contenido específica para tu negocio — sin relleno genérico, sin publicaciones que podrían pertenecer a cualquier otra tienda. Tus fotos se emparejan con consultas de búsqueda relevantes para que el contenido refleje realmente el trabajo que haces.',
        },
        {
          q: '¿Y las reseñas? ¿HayVista ayuda con eso?',
          a: 'Sí. HayVista redacta una respuesta para cada reseña de cliente entrante. Ya sea una brillante de 5 estrellas o una frustrada de 1 estrella, obtienes una respuesta sugerida que coincide con tu tono — profesional, amigable o bilingüe. Responder a las reseñas le dice a Google que estás comprometido con tus clientes, lo que es una señal positiva para tu posición. También muestra a futuros clientes que te importa la experiencia que brindas.',
        },
        {
          q: '¿HayVista tiene permiso de publicar en mi GBP? ¿Cumple con Google?',
          a: 'Sí. HayVista usa la API oficial de Google Business Profile, que es la forma aprobada por Google para que el software gestione contenido de GBP en nombre del propietario del negocio. Seguimos todos los requisitos de la Política de Datos de Usuario de los Servicios de API de Google, incluidas las reglas de Uso Limitado. Solo se accede a tus datos para gestionar tu perfil — nada más. Autorizas a HayVista a través del inicio de sesión OAuth de Google y puedes revocar ese acceso en cualquier momento desde la configuración de tu Cuenta de Google.',
        },
        {
          q: '¿Puedo cancelar cuando quiera? ¿Qué pasa con mi GBP cuando lo hago?',
          a: 'Puedes cancelar en cualquier momento — sin contratos, sin cargos por cancelación, sin permanencia. Cuando cancelas, HayVista deja de publicar en tu GBP. Todo lo que ya estaba publicado permanece en tu perfil permanentemente — esas publicaciones pertenecen a tu Perfil de Negocio de Google, no a HayVista. Tu perfil no se borra. Simplemente deja de recibir contenido nuevo hasta que decidas reiniciar.',
        },
      ],
    },

    terms: {
      heading:    'Términos de Servicio',
      lastUpdated: 'Última actualización: febrero de 2026',
      sections: [
        { title: '1. Aceptación', body: 'Al usar HayVista, aceptas estos Términos de Servicio. Si no estás de acuerdo, no uses la plataforma.' },
        { title: '2. Descripción del Servicio', body: 'HayVista es una plataforma que se conecta a tu Perfil de Negocio de Google mediante OAuth para ayudarte a gestionar información del negocio, publicaciones y datos del perfil. Debes tener acceso legítimo de propietario o administrador a cualquier Perfil de Negocio de Google que conectes.' },
        {
          title: '3. Tus Responsabilidades',
          bullets: [
            'Eres responsable de mantener la seguridad de las credenciales de tu cuenta',
            'Solo puedes conectar Perfiles de Negocio que poseas o estés autorizado a gestionar',
            'Aceptas no usar el servicio para fines ilegales',
          ],
        },
        { title: '4. Servicios de Google', body: 'HayVista se integra con las API de Google. Tu uso de los servicios de Google a través de HayVista también está sujeto a los', bodyLinkText: 'Términos de Servicio de Google', bodyLinkHref: 'https://policies.google.com/terms', bodySuffix: '.' },
        { title: '5. Limitación de Responsabilidad', body: 'HayVista se proporciona "tal cual" sin garantías de ningún tipo. No somos responsables de ningún daño indirecto o consecuente que surja del uso del servicio.' },
        { title: '6. Cambios en los Términos', body: 'Podemos actualizar estos términos en cualquier momento. El uso continuado del servicio después de los cambios constituye la aceptación de los términos actualizados.' },
        { title: '7. Contacto', body: '¿Preguntas sobre estos términos? Contáctanos en' },
      ],
    },

    privacy: {
      heading:    'Política de Privacidad',
      lastUpdated: 'Última actualización: febrero de 2026',
      sections: [
        {
          title: '1. Resumen',
          body: 'HayVista es una plataforma SaaS que permite a los propietarios de negocios conectar y gestionar su Perfil de Negocio de Google. Esta política explica qué datos recopilamos, cómo los usamos y tus derechos sobre esos datos.',
        },
        {
          title: '2. Datos que recopilamos',
          intro: 'Cuando inicias sesión con Google, recibimos:',
          bullets: [
            'Tu dirección de correo electrónico y nombre de display de tu cuenta de Google',
            'Un token de acceso OAuth para interactuar con tu Perfil de Negocio de Google en tu nombre',
            'Datos de ubicación del negocio de tu Perfil de Negocio de Google conectado',
          ],
        },
        {
          title: '3. Cómo usamos tus datos',
          intro: 'Tus datos se usan exclusivamente para:',
          bullets: [
            'Autenticarte y mantener tu sesión',
            'Conectarte a tu Perfil de Negocio de Google en tu nombre',
            'Mostrar y gestionar la información de tu perfil de negocio dentro de la plataforma',
          ],
          footer: 'No vendemos, compartimos ni exponemos tus datos a terceros.',
        },
        {
          title: '4. Datos de la API de Google Business Profile',
          body: 'HayVista accede a los datos del Perfil de Negocio de Google (GBP) únicamente en nombre de usuarios autenticados que han otorgado permiso explícito mediante Google OAuth 2.0. Esto incluye información del negocio, fotos, publicaciones, reseñas e información de rendimiento que pertenecen al propio listado GBP del usuario.',
          intro: 'Estos datos se usan exclusivamente para:',
          bullets: [
            'Generar y publicar publicaciones en el propio Perfil de Negocio de Google del usuario',
            'Mostrar información del perfil dentro del panel de HayVista',
            'Emparejar las fotos reales del usuario con consultas de búsqueda locales para la creación de contenido',
            'Leer reseñas e información de rendimiento para informar la estrategia de contenido',
          ],
          footer: 'No vendemos, compartimos, transferimos ni usamos los datos de GBP para ningún propósito más allá de brindar el servicio de HayVista al usuario autenticado. No accedemos a ningún dato de GBP más allá de lo necesario para realizar las acciones solicitadas explícitamente por el usuario.',
          revoke: 'Los usuarios pueden revocar el acceso de HayVista a su cuenta de Google en cualquier momento visitando',
          revokeSuffix: '. Al revocar, todos los datos de GBP asociados serán eliminados de nuestros sistemas en un plazo de 30 días.',
          policy: 'El uso de datos obtenidos de las API de Google por parte de HayVista cumple estrictamente con la',
          policyLink: 'Política de Datos de Usuario de los Servicios de API de Google',
          policySuffix: ', incluidos los requisitos de Uso Limitado. El acceso está limitado únicamente al propio Perfil de Negocio del usuario autenticado. Ningún dato de GBP se transfiere a terceros excepto cuando sea estrictamente necesario para operar el servicio (p. ej., Anthropic Claude para la generación de publicaciones con IA, bajo términos estrictos de procesamiento de datos).',
        },
        {
          title: '5. Retención de datos',
          body: 'Almacenamos la información de tu cuenta y los tokens OAuth en una base de datos segura durante el tiempo que tu cuenta esté activa. Puedes solicitar la eliminación en cualquier momento contactándonos.',
        },
        {
          title: '6. Tus derechos',
          intro: 'Tienes el derecho a:',
          bullets: [
            'Acceder a los datos que tenemos sobre ti',
            'Solicitar la eliminación de tu cuenta y los datos asociados',
            'Revocar el acceso de Google OAuth en cualquier momento a través de la configuración de tu Cuenta de Google',
          ],
        },
        {
          title: '7. Contacto',
          body: 'Para preguntas de privacidad o solicitudes de eliminación de datos, contáctanos en',
        },
      ],
    },

  },
};

export type AppLang = typeof app.en;
