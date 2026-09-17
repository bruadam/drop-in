/**
 * Hand-written placeholder types mirroring the data model in the product
 * spec (§ data model). Replace with `supabase gen types typescript` once the
 * schema is actually migrated into a Supabase project — these exist so the
 * app can be built against a stable shape in the meantime.
 *
 * Every tenant-scoped table carries `tenant_id` and is protected by an RLS
 * policy of the form `tenant_id = (select tenant_id from profiles where id =
 * auth.uid())`. `org_creation_codes` and `platform_admins` are the two
 * platform-level exceptions (not tenant-scoped).
 */

export type UUID = string;
export type ISODateString = string;

export interface Tenant {
  id: UUID;
  name: string;
  slug: string;
  logo_url: string | null;
  theme: { accent?: string } | null;
  zones: string[] | null;
}

export interface InviteCode {
  id: UUID;
  tenant_id: UUID;
  code: string;
  max_uses: number;
  uses_count: number;
  expires_at: ISODateString | null;
}

export type ProfileRole = "resident" | "moderator" | "admin";

export interface Profile {
  id: UUID;
  tenant_id: UUID;
  display_name: string;
  avatar_url: string | null;
  zone: string | null;
  bio: string | null;
  role: ProfileRole;
  points_total: number;
  birth_date: string | null;
}

export interface Interest {
  id: UUID;
  tenant_id: UUID;
  label: string;
}

export interface ProfileInterest {
  profile_id: UUID;
  interest_id: UUID;
}

export type ActivityKind = "dropin" | "scheduled";
export type ActivityStatus = "open" | "full" | "cancelled" | "past";
export type ActivityLevel = "beginner" | "open" | "advanced";

export interface Activity {
  id: UUID;
  tenant_id: UUID;
  creator_id: UUID;
  interest_id: UUID;
  kind: ActivityKind;
  title: string;
  description: string | null;
  // Nullable until firmed up for `kind: "dropin"` activities created without
  // a fixed time yet (spec §3's "vague/spontaneous" flow) — same row gets
  // updated in place via chat once a time is agreed on.
  starts_at: ISODateString | null;
  created_at: ISODateString;
  location_text: string | null;
  capacity: number | null;
  status: ActivityStatus;
  duration_minutes: number | null;
  training_type: string | null;
  level: ActivityLevel | null;
  target_pace_seconds_per_km: number | null;
  route_id: UUID | null;
  is_paid: boolean;
}

export type AttendanceStatus = "going" | "interested" | "maybe";

export interface Attendance {
  activity_id: UUID;
  profile_id: UUID;
  status: AttendanceStatus;
  joined_at: ISODateString;
}

export interface Message {
  id: UUID;
  sender_id: UUID;
  body: string;
  created_at: ISODateString;
  activity_id: UUID | null;
  conversation_id: UUID | null;
}

export interface AlterEgoMatch {
  id: UUID;
  tenant_id: UUID;
  profile_a_id: UUID;
  profile_b_id: UUID;
  week_of: string;
  profile_a_opted_in: boolean;
  profile_b_opted_in: boolean;
  revealed_at: ISODateString | null;
}

export interface PushToken {
  profile_id: UUID;
  expo_push_token: string;
}

export interface Route {
  id: UUID;
  tenant_id: UUID;
  source: "strava" | "gpx_upload";
  strava_route_id: string | null;
  gpx_file_url: string | null;
  distance_m: number | null;
  elevation_gain_m: number | null;
}

export interface FitnessConnection {
  profile_id: UUID;
  provider: "strava" | "apple_health";
  external_athlete_id: string | null;
  avg_pace_seconds_per_km: number | null;
  weekly_hours_rolling_avg: number | null;
  last_synced_at: ISODateString | null;
}

export type PointsReason = "hosted" | "attended" | "streak" | "other";

export interface PointsLedgerEntry {
  id: UUID;
  tenant_id: UUID;
  profile_id: UUID;
  activity_id: UUID | null;
  points: number;
  reason: PointsReason;
  created_at: ISODateString;
}

export type ModerationSubjectType = "activity" | "message";
export type ModerationVerdict = "allow" | "review" | "block";
export type ModerationStatus = "pending" | "approved" | "rejected";

export interface ModerationQueueItem {
  id: UUID;
  subject_type: ModerationSubjectType;
  subject_id: UUID;
  ai_verdict: ModerationVerdict;
  ai_reason: string | null;
  status: ModerationStatus;
  reviewed_by: UUID | null;
  reviewed_at: ISODateString | null;
}

export type SuspensionLevel = "1_day" | "1_week" | "permanent";

export interface UserSuspension {
  id: UUID;
  profile_id: UUID;
  level: SuspensionLevel;
  reason: string;
  issued_by: UUID;
  issued_at: ISODateString;
  expires_at: ISODateString | null;
}

export interface Follow {
  follower_id: UUID;
  followed_id: UUID;
}

export interface Conversation {
  id: UUID;
  profile_a_id: UUID;
  profile_b_id: UUID;
  source: "alter_ego" | "direct";
}

export interface OrgCreationCode {
  id: UUID;
  code: string;
  created_by: UUID;
  max_uses: number;
  uses_count: number;
  expires_at: ISODateString | null;
  created_tenant_id: UUID | null;
}

export interface PlatformAdmin {
  user_id: string;
}
