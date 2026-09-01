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
export type OfferSource = "demo" | "manuel" | "mistral_ingest";

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
  cv_path: string | null;
  cv_uploaded_at: string | null;
  onboarding_completed: boolean;
  referral_code: string;
  referred_by: string | null;
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
  image_url: string | null;
  apply_url: string | null;
  source: OfferSource;
  source_url: string | null;
  external_id: string | null;
  is_active: boolean;
  published_at: string;
  created_at: string;
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

export type Referral = {
  id: string;
  referrer_id: string;
  referred_id: string;
  code: string;
  reward_status: "pending" | "granted";
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      contract_type: ContractType;
      gender_type: GenderType;
      swipe_direction: SwipeDirection;
      application_status: ApplicationStatus;
      offer_source: OfferSource;
    };
    CompositeTypes: Record<string, never>;
  };
};
