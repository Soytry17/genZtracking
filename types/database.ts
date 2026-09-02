/**
 * Hand-written mirror of supabase/migrations (0001_init.sql through
 * 0005_goal_badges.sql).
 *
 * There is no live Supabase project yet, so this file is NOT generated. If you
 * add a migration, update this file in the same commit and keep the shape
 * compatible with `supabase gen types typescript` so it can be swapped later.
 *
 * Conventions
 *   - `date` columns are ISO `YYYY-MM-DD` strings (see the ISODate alias below).
 *   - `timestamptz` columns are ISO 8601 strings.
 *   - `Insert` marks a field optional when the column is nullable or has a
 *     database default. `habit_logs.user_id` is optional because a trigger
 *     fills it from the parent habit.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          username: string | null;
          avatar_url: string | null;
          xp: number;
          level: number;
          freeze_tokens: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          xp?: number;
          level?: number;
          freeze_tokens?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          xp?: number;
          level?: number;
          freeze_tokens?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      habits: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          duration_days: number | null;
          start_date: string;
          end_date: string;
          color: string;
          icon: string;
          status: Database["public"]["Enums"]["habit_status"];
          current_streak: number;
          longest_streak: number;
          completed_at: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          duration_days?: number | null;
          start_date: string;
          end_date: string;
          color?: string;
          icon?: string;
          status?: Database["public"]["Enums"]["habit_status"];
          current_streak?: number;
          longest_streak?: number;
          completed_at?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          duration_days?: number | null;
          start_date?: string;
          end_date?: string;
          color?: string;
          icon?: string;
          status?: Database["public"]["Enums"]["habit_status"];
          current_streak?: number;
          longest_streak?: number;
          completed_at?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "habits_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      habit_logs: {
        Row: {
          id: string;
          habit_id: string;
          user_id: string;
          log_date: string;
          status: Database["public"]["Enums"]["habit_log_status"];
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          habit_id: string;
          /** Filled in by the habit_logs_sync_user_id trigger; safe to omit. */
          user_id?: string;
          log_date: string;
          status?: Database["public"]["Enums"]["habit_log_status"];
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          habit_id?: string;
          user_id?: string;
          log_date?: string;
          status?: Database["public"]["Enums"]["habit_log_status"];
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey";
            columns: ["habit_id"];
            isOneToOne: false;
            referencedRelation: "habits";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "habit_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      xp_events: {
        Row: {
          id: string;
          user_id: string;
          habit_id: string | null;
          kind: Database["public"]["Enums"]["xp_event_kind"];
          amount: number;
          log_date: string | null;
          dedupe_key: string | null;
          meta: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          habit_id?: string | null;
          kind: Database["public"]["Enums"]["xp_event_kind"];
          amount: number;
          log_date?: string | null;
          dedupe_key?: string | null;
          meta?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          habit_id?: string | null;
          kind?: Database["public"]["Enums"]["xp_event_kind"];
          amount?: number;
          log_date?: string | null;
          dedupe_key?: string | null;
          meta?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "xp_events_habit_id_fkey";
            columns: ["habit_id"];
            isOneToOne: false;
            referencedRelation: "habits";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "xp_events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      freeze_ledger: {
        Row: {
          id: string;
          user_id: string;
          habit_id: string | null;
          delta: number;
          reason: Database["public"]["Enums"]["freeze_reason"];
          log_date: string | null;
          dedupe_key: string | null;
          meta: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          habit_id?: string | null;
          delta: number;
          reason: Database["public"]["Enums"]["freeze_reason"];
          log_date?: string | null;
          dedupe_key?: string | null;
          meta?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          habit_id?: string | null;
          delta?: number;
          reason?: Database["public"]["Enums"]["freeze_reason"];
          log_date?: string | null;
          dedupe_key?: string | null;
          meta?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "freeze_ledger_habit_id_fkey";
            columns: ["habit_id"];
            isOneToOne: false;
            referencedRelation: "habits";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "freeze_ledger_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      badges: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon: string;
          kind: Database["public"]["Enums"]["badge_kind"];
          threshold: number | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          description: string;
          icon: string;
          kind: Database["public"]["Enums"]["badge_kind"];
          threshold?: number | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          icon?: string;
          kind?: Database["public"]["Enums"]["badge_kind"];
          threshold?: number | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          habit_id: string | null;
          earned_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_id: string;
          habit_id?: string | null;
          earned_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          badge_id?: string;
          habit_id?: string | null;
          earned_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey";
            columns: ["badge_id"];
            isOneToOne: false;
            referencedRelation: "badges";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_badges_habit_id_fkey";
            columns: ["habit_id"];
            isOneToOne: false;
            referencedRelation: "habits";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_badges_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      goal_badges: {
        Row: {
          id: string;
          user_id: string;
          habit_id: string | null;
          title: string;
          description: string | null;
          icon: string;
          awarded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          habit_id?: string | null;
          title: string;
          description?: string | null;
          icon?: string;
          awarded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          habit_id?: string | null;
          title?: string;
          description?: string | null;
          icon?: string;
          awarded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "goal_badges_habit_id_fkey";
            columns: ["habit_id"];
            isOneToOne: true;
            referencedRelation: "habits";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "goal_badges_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      habit_presets: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          category: string;
          icon: string;
          color: string;
          suggested_duration_days: number | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id: string;
          title: string;
          description?: string | null;
          category: string;
          icon: string;
          color: string;
          suggested_duration_days?: number | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          category?: string;
          icon?: string;
          color?: string;
          suggested_duration_days?: number | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      app_time_zone: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      /** "Today" as an ISO date in the app's fixed timezone. */
      app_today: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      freeze_retro_window_days: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      maybe_earn_freeze: {
        Args: { p_habit_id: string };
        Returns: undefined;
      };
      recalc_habit_streak: {
        Args: { p_habit_id: string };
        Returns: undefined;
      };
      /**
       * Spends one banked freeze on a habit day.
       * Throws (Postgrest error) when the bank is empty, the day is already
       * logged, the day is outside the habit range, or it is older than the
       * 2 day retro window.
       */
      spend_freeze: {
        Args: { p_habit_id: string; p_log_date: string };
        Returns: Database["public"]["CompositeTypes"]["spend_freeze_result"];
      };
      /** Resolves a unique username to the linked auth email. Null when unknown. */
      email_for_username: {
        Args: { p_username: string };
        Returns: string | null;
      };
      /** True when no profile owns this handle. Arg name must stay p_username. */
      username_available: {
        Args: { p_username: string };
        Returns: boolean;
      };
    };
    Enums: {
      habit_status: "active" | "paused" | "completed" | "archived";
      habit_log_status: "done" | "skipped" | "frozen";
      xp_event_kind:
        | "day_completed"
        | "streak_bonus"
        | "badge_unlocked"
        | "habit_created"
        | "habit_completed"
        | "adjustment";
      freeze_reason: "earned" | "spent" | "expired" | "adjustment";
      badge_kind:
        | "streak"
        | "first_habit"
        | "habit_completed"
        | "comeback"
        | "level";
    };
    CompositeTypes: {
      spend_freeze_result: {
        habit_id: string;
        log_date: string;
        freeze_tokens_remaining: number;
        current_streak: number;
        longest_streak: number;
      };
    };
  };
};

// ---------------------------------------------------------------------------
// Convenience aliases. Prefer these in app code over the deep Database paths.
// ---------------------------------------------------------------------------

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T];
export type CompositeTypes<T extends keyof PublicSchema["CompositeTypes"]> =
  PublicSchema["CompositeTypes"][T];

/** An ISO calendar date, `YYYY-MM-DD`. Every `date` column uses this shape. */
export type ISODate = string;

export type Profile = Tables<"profiles">;
export type ProfileInsert = TablesInsert<"profiles">;
export type ProfileUpdate = TablesUpdate<"profiles">;

export type Habit = Tables<"habits">;
export type HabitInsert = TablesInsert<"habits">;
export type HabitUpdate = TablesUpdate<"habits">;

export type HabitLog = Tables<"habit_logs">;
export type HabitLogInsert = TablesInsert<"habit_logs">;
export type HabitLogUpdate = TablesUpdate<"habit_logs">;

export type XpEvent = Tables<"xp_events">;
export type XpEventInsert = TablesInsert<"xp_events">;

export type FreezeLedgerEntry = Tables<"freeze_ledger">;
export type FreezeLedgerEntryInsert = TablesInsert<"freeze_ledger">;

export type Badge = Tables<"badges">;
export type UserBadge = Tables<"user_badges">;
export type GoalBadge = Tables<"goal_badges">;
export type GoalBadgeInsert = TablesInsert<"goal_badges">;
export type GoalBadgeUpdate = TablesUpdate<"goal_badges">;
export type HabitPreset = Tables<"habit_presets">;

export type HabitStatus = Enums<"habit_status">;
export type HabitLogStatus = Enums<"habit_log_status">;
export type XpEventKind = Enums<"xp_event_kind">;
export type FreezeReason = Enums<"freeze_reason">;
export type BadgeKind = Enums<"badge_kind">;

export type SpendFreezeResult = CompositeTypes<"spend_freeze_result">;

/** A habit joined with its badge row, as returned by `select('*, badges(*)')`. */
export type UserBadgeWithBadge = UserBadge & { badges: Badge };

/**
 * One cell of a habit's day grid: every date in start_date..end_date left
 * joined against habit_logs. Built client/server side, never stored.
 */
export type HabitDay = {
  date: ISODate;
  /** null when the day has not been marked yet. */
  status: HabitLogStatus | null;
  note: string | null;
  logId: string | null;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  /** 1-based position of this day within the habit's range. */
  dayNumber: number;
};
