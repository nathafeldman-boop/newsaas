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
export type ApplicationStatus =
  | "envoyee"
  | "en_cours"
  | "entretien"
  | "acceptee"
  | "refusee";
export type OfferSource = "demo" | "manuel" | "mistral_ingest" | "adzuna";
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
  cv_uploaded_at: string | null;
  onboarding_completed: boolean;
  referral_code: string;
  referred_by: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
  onboarding_completed_at: string | null;
  premium_activated_at: string | null;
  total_paid_cents: number;
  notify_new_offers: boolean;
  last_offer_alert_sent_at: string | null;
  last_active_at: string | null;
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
      user_events: {
        Row: UserEvent;
        Insert: Partial<UserEvent> & { user_id: string; event_type: string };
        Update: Partial<UserEvent>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_total_paid: {
        Args: { p_stripe_customer_id: string; p_amount_cents: number };
        Returns: undefined;
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
