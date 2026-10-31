// Types manuels reflétant supabase/migrations/*.sql
// À terme, remplacer par `supabase gen types typescript` une fois le projet lié.
//
// Important : ces types doivent être des `type` (alias), pas des `interface`.
// supabase-js exige que chaque Row/Insert/Update soit assignable à
// Record<string, unknown> pour satisfaire sa contrainte GenericSchema ; les
// `interface` (types "ouverts", extensibles par déclaration) ne satisfont
// jamais cette contrainte en TypeScript, même à forme identique, ce qui fait
// silencieusement retomber tous les retours de requêtes sur `never`.

export type ContractType = "alternance" | "stage";
export type GenderType = "homme" | "femme" | "autre" | "non_precise";
export type SwipeDirection = "like" | "pass";
// "a_preparer" et "cloturee" : ajoutés le 24/10 (suivi des candidatures),
// par SQL lancé à la main -- voir src/lib/applications/status.ts pour le
// repli tant qu'ils n'existent pas encore en base.
export type ApplicationStatus =
  | "a_preparer"
  | "envoyee"
  | "en_cours"
  | "entretien"
  | "acceptee"
  | "refusee"
  | "cloturee";
export type OfferSource = "demo" | "manuel" | "mistral_ingest" | "adzuna" | "france_travail" | "la_bonne_alternance";
export type EmailProvider = "gmail";
export type EmailReplySentiment = "positive" | "negative" | "neutral";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  birth_date: string | null;
  gender: GenderType | null;
  city: string | null;
  bio: string | null;
  skills: string[];
  sectors: string[];
  looking_for: ContractType[];
  education_level: string | null;
  formation: string | null;
  target_jobs: string[];
  experience_level: string | null;
  mobility: string | null;
  availability_date: string | null;
  cv_path: string | null;
  // Boîte mail Stageio (voir lib/inbox/address.ts). Optionnelle : colonne
  // ajoutée à la main en base le 15/10.
  inbox_address?: string | null;
  // Téléphone du candidat, exigé par La bonne alternance pour transmettre une
  // candidature. Optionnel : colonne ajoutée à la main en base le 15/10.
  phone?: string | null;
  // Formule « Stageio Auto » (24/10) : "auto" tant que l'abonnement Auto est
  // actif, "auto_lifetime" pour l'accès à vie Auto. Optionnelle : SQL du 24/10.
  premium_tier?: string | null;
  cv_uploaded_at: string | null;
  cv_text: string | null;
  onboarding_completed: boolean;
  referral_code: string;
  referred_by: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  subscription_price_cents: number | null;
  subscription_interval: string | null;
  current_period_end: string | null;
  onboarding_completed_at: string | null;
  premium_activated_at: string | null;
  total_paid_cents: number;
  notify_new_offers: boolean;
  // Optionnelle (24/10) : fréquence des alertes d'offres ("daily" | "weekly"),
  // absente tant que le SQL n'a pas été lancé.
  offer_alert_frequency?: string;
  last_offer_alert_sent_at: string | null;
  last_active_at: string | null;
  last_active_path: string | null;
  no_swipe_reminder_sent_at: string | null;
  incomplete_payment_reminder_sent_at: string | null;
  weekly_offer_announced_at: string | null;
  daily_offer_announced_at: string | null;
  swipe_relance_sent_at: string | null;
  checkout_abandoned_reminder_sent_at: string | null;
  inactive_campaign_emails_sent: number;
  affiliate_id: string | null;
  utm_source: string | null;
  search_completed_at: string | null;
  search_completed_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type Offer = {
  id: string;
  title: string;
  company: string;
  location: string;
  contract_type: ContractType;
  sector: string | null;
  description: string;
  requirements: string | null;
  duration: string | null;
  salary: string | null;
  remote_policy: string | null;
  start_date: string | null;
  education_level: string | null;
  image_url: string | null;
  apply_url: string | null;
  source: OfferSource;
  source_url: string | null;
  external_id: string | null;
  is_active: boolean;
  published_at: string;
  created_at: string;
  last_seen_at: string;
  content_fingerprint: string | null;
  quality_score: number;
  // Optionnelle : colonne ajoutée à la main en base (14/10), absente tant
  // que le SQL n'a pas été passé -- toujours lire avec select("*").
  contact_email?: string | null;
  // Colonne calculée par Postgres (SCHOOL_AD_COLUMN_SQL, 31/10), absente
  // tant que le SQL n'a pas été passé. Jamais écrite par le code.
  is_school_ad?: boolean | null;
};

export type Swipe = {
  id: string;
  user_id: string;
  offer_id: string;
  direction: SwipeDirection;
  created_at: string;
};

export type Application = {
  id: string;
  user_id: string;
  offer_id: string;
  status: ApplicationStatus;
  cover_note: string | null;
  applied_at: string;
  updated_at: string;
  // Optionnelles : colonnes du suivi (24/10), absentes tant que le SQL
  // n'a pas été lancé -- le code lit undefined et retombe sur applied_at.
  note?: string | null;
  follow_up_at?: string | null;
  sent_at?: string | null;
};

// Boîte mail Stageio : emails reçus sur l'adresse de l'étudiant ("in") et
// candidatures envoyées depuis elle ("out"). Table créée à la main le 15/10.
export type InboxMessage = {
  id: string;
  user_id: string;
  direction: "in" | "out";
  resend_email_id: string | null;
  from_address: string;
  from_name: string | null;
  to_address: string;
  subject: string | null;
  body_text: string | null;
  offer_id: string | null;
  read_at: string | null;
  created_at: string;
};

export type EmailConnection = {
  id: string;
  user_id: string;
  provider: EmailProvider;
  email_address: string;
  refresh_token: string;
  last_synced_at: string | null;
  connected_at: string;
};

export type EmailReply = {
  id: string;
  user_id: string;
  application_id: string | null;
  provider_message_id: string;
  from_address: string | null;
  subject: string | null;
  snippet: string | null;
  sentiment: EmailReplySentiment;
  confidence: number | null;
  received_at: string | null;
  created_at: string;
};

export type Referral = {
  id: string;
  referrer_id: string;
  referred_id: string;
  code: string;
  reward_status: "pending" | "granted";
  notified_at: string | null;
  created_at: string;
};

export type AccessCode = {
  id: string;
  code: string;
  note: string | null;
  max_uses: number;
  use_count: number;
  created_by: string | null;
  created_at: string;
};

export type AccessCodeRedemption = {
  id: string;
  code_id: string;
  user_id: string;
  redeemed_at: string;
};

export type UserEvent = {
  id: string;
  user_id: string;
  event_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type SiteVisit = {
  id: string;
  visitor_id: string;
  path: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
};

export type StripeProcessedInvoice = {
  invoice_id: string;
  stripe_customer_id: string;
  amount_cents: number;
  created_at: string;
};

// Vues TikTok/créateurs saisies à la main dans /admin/rpm (SOP 16) : vues
// des 7 jours qui finissent le `recorded_on`, par source (utm_source).
// Objectifs de chiffre d'affaires par mois (26/10, admin « Objectifs »).
export type RevenueGoal = {
  month: string;
  target_cents: number;
  updated_at: string;
};

export type ContentView = {
  recorded_on: string;
  source: string;
  views: number;
  created_at: string;
};

// Vues d'un jour pour un canal (« TikTok · commentaire »…), saisies dans
// /admin/canaux pour le RPM par canal (30/10).
export type ChannelView = {
  day: string;
  channel: string;
  views: number;
  created_at: string;
};

export type ReviewStatus = "pending" | "approved" | "rejected";

export type Review = {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  created_at: string;
};

export type AffiliateStatus = "pending" | "approved" | "rejected";

export type Affiliate = {
  id: string;
  user_id: string;
  code: string;
  status: AffiliateStatus;
  payout_email: string | null;
  created_at: string;
  approved_at: string | null;
};

export type AffiliateCommissionStatus = "pending" | "paid";

export type AffiliateCommission = {
  id: string;
  affiliate_id: string;
  referred_user_id: string;
  invoice_id: string;
  amount_paid_cents: number;
  commission_cents: number;
  plan_interval: string;
  status: AffiliateCommissionStatus;
  created_at: string;
  paid_at: string | null;
};

export type AffiliateClick = {
  id: string;
  affiliate_id: string;
  visitor_id: string;
  created_at: string;
};

export type SubscriptionCancellation = {
  id: string;
  user_id: string;
  reason: string;
  detail: string | null;
  created_at: string;
};

export type JimmyMessageRole = "user" | "assistant";

export type JimmyMessage = {
  id: string;
  user_id: string;
  role: JimmyMessageRole;
  content: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      offers: {
        Row: Offer;
        Insert: Partial<Offer> & {
          title: string;
          company: string;
          location: string;
          contract_type: ContractType;
        };
        Update: Partial<Offer>;
        Relationships: [];
      };
      swipes: {
        Row: Swipe;
        Insert: Partial<Swipe> & {
          user_id: string;
          offer_id: string;
          direction: SwipeDirection;
        };
        Update: Partial<Swipe>;
        Relationships: [];
      };
      applications: {
        Row: Application;
        Insert: Partial<Application> & { user_id: string; offer_id: string };
        Update: Partial<Application>;
        Relationships: [];
      };
      referrals: {
        Row: Referral;
        Insert: Partial<Referral> & {
          referrer_id: string;
          referred_id: string;
          code: string;
        };
        Update: Partial<Referral>;
        Relationships: [];
      };
      affiliates: {
        Row: Affiliate;
        Insert: Partial<Affiliate> & { user_id: string; code: string };
        Update: Partial<Affiliate>;
        Relationships: [];
      };
      affiliate_commissions: {
        Row: AffiliateCommission;
        Insert: Partial<AffiliateCommission> & {
          affiliate_id: string;
          referred_user_id: string;
          invoice_id: string;
          amount_paid_cents: number;
          commission_cents: number;
          plan_interval: string;
        };
        Update: Partial<AffiliateCommission>;
        Relationships: [];
      };
      affiliate_clicks: {
        Row: AffiliateClick;
        Insert: Partial<AffiliateClick> & { affiliate_id: string; visitor_id: string };
        Update: Partial<AffiliateClick>;
        Relationships: [];
      };
      email_connections: {
        Row: EmailConnection;
        Insert: Partial<EmailConnection> & {
          user_id: string;
          email_address: string;
          refresh_token: string;
        };
        Update: Partial<EmailConnection>;
        Relationships: [];
      };
      email_replies: {
        Row: EmailReply;
        Insert: Partial<EmailReply> & {
          user_id: string;
          provider_message_id: string;
          sentiment: EmailReplySentiment;
        };
        Update: Partial<EmailReply>;
        Relationships: [];
      };
      access_codes: {
        Row: AccessCode;
        Insert: Partial<AccessCode> & { code: string };
        Update: Partial<AccessCode>;
        Relationships: [];
      };
      access_code_redemptions: {
        Row: AccessCodeRedemption;
        Insert: Partial<AccessCodeRedemption> & { code_id: string; user_id: string };
        Update: Partial<AccessCodeRedemption>;
        Relationships: [];
      };
      inbox_messages: {
        Row: InboxMessage;
        Insert: Partial<InboxMessage> & {
          user_id: string;
          direction: "in" | "out";
          from_address: string;
          to_address: string;
        };
        Update: Partial<InboxMessage>;
        Relationships: [];
      };
      user_events: {
        Row: UserEvent;
        Insert: Partial<UserEvent> & { user_id: string; event_type: string };
        Update: Partial<UserEvent>;
        Relationships: [];
      };
      revenue_goals: {
        Row: RevenueGoal;
        Insert: Partial<RevenueGoal> & { month: string; target_cents: number };
        Update: Partial<RevenueGoal>;
        Relationships: [];
      };
      content_views: {
        Row: ContentView;
        Insert: Partial<ContentView> & { recorded_on: string; source: string; views: number };
        Update: Partial<ContentView>;
        Relationships: [];
      };
      channel_views: {
        Row: ChannelView;
        Insert: Partial<ChannelView> & { day: string; channel: string; views: number };
        Update: Partial<ChannelView>;
        Relationships: [];
      };
      site_visits: {
        Row: SiteVisit;
        Insert: Partial<SiteVisit> & { visitor_id: string; path: string };
        Update: Partial<SiteVisit>;
        Relationships: [];
      };
      reviews: {
        Row: Review;
        Insert: Partial<Review> & { user_id: string; rating: number };
        Update: Partial<Review>;
        Relationships: [];
      };
      stripe_processed_invoices: {
        Row: StripeProcessedInvoice;
        Insert: Partial<StripeProcessedInvoice> & {
          invoice_id: string;
          stripe_customer_id: string;
          amount_cents: number;
        };
        Update: Partial<StripeProcessedInvoice>;
        Relationships: [];
      };
      subscription_cancellations: {
        Row: SubscriptionCancellation;
        Insert: Partial<SubscriptionCancellation> & { user_id: string; reason: string };
        Update: Partial<SubscriptionCancellation>;
        Relationships: [];
      };
      jimmy_messages: {
        Row: JimmyMessage;
        Insert: Partial<JimmyMessage> & { user_id: string; role: JimmyMessageRole; content: string };
        Update: Partial<JimmyMessage>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_total_paid: {
        Args: { p_stripe_customer_id: string; p_amount_cents: number };
        Returns: undefined;
      };
      credit_invoice_payment: {
        Args: { p_invoice_id: string; p_stripe_customer_id: string; p_amount_cents: number };
        Returns: boolean;
      };
      sum_total_paid_cents: {
        Args: Record<string, never>;
        Returns: number;
      };
      onboarding_funnel_stats: {
        Args: Record<string, never>;
        Returns: { step: string | null; viewed_count: number; completed_count: number }[];
      };
      onboarding_funnel_stats_since: {
        Args: { p_since: string };
        Returns: { step: string | null; viewed_count: number; completed_count: number }[];
      };
      // Comptage des visites (SQL du 24/10, section 5) : réservé au service_role.
      admin_visitors_by_day_source: {
        Args: { p_since: string; p_until: string };
        Returns: { day: string; source: string; visitors: number }[];
      };
      admin_visitors_by_source: {
        Args: { p_since: string; p_until: string };
        Returns: { source: string; visitors: number; signup_page_visitors: number }[];
      };
      admin_landing_pages: {
        Args: { p_since: string; p_until: string; p_limit?: number };
        Returns: { path: string; visitors: number }[];
      };
    };
    Enums: {
      contract_type: ContractType;
      gender_type: GenderType;
      swipe_direction: SwipeDirection;
      application_status: ApplicationStatus;
      offer_source: OfferSource;
      email_provider: EmailProvider;
      email_reply_sentiment: EmailReplySentiment;
    };
    CompositeTypes: Record<string, never>;
  };
};
