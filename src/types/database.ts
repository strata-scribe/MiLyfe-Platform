/** 
 * Supabase Database Types — MiLyfe MVP
 * Generated from 25-table schema. Keep in sync with migrations.
 */

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          bio: string;
          neighborhood: string | null;
          onboarding_complete: boolean;
          role: 'citizen' | 'moderator' | 'steward' | 'admin';
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string;
          avatar_url?: string | null;
          bio?: string;
          neighborhood?: string | null;
          onboarding_complete?: boolean;
          role?: 'citizen' | 'moderator' | 'steward' | 'admin';
          metadata?: Record<string, unknown>;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      wallets: {
        Row: {
          id: string;
          user_id: string;
          spending_balance: number;
          savings_balance: number;
          community_balance: number;
          total_earned: number;
          total_spent: number;
          last_ubi_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          spending_balance?: number;
          savings_balance?: number;
          community_balance?: number;
        };
        Update: Partial<Database['public']['Tables']['wallets']['Insert']>;
      };
      transactions: {
        Row: {
          id: string;
          from_user_id: string | null;
          to_user_id: string | null;
          amount: number;
          type: 'ubi' | 'transfer' | 'reward' | 'spend' | 'burn' | 'community_contribution';
          pot: 'spending' | 'savings' | 'community';
          description: string;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          from_user_id?: string | null;
          to_user_id?: string | null;
          amount: number;
          type: 'ubi' | 'transfer' | 'reward' | 'spend' | 'burn' | 'community_contribution';
          pot?: 'spending' | 'savings' | 'community';
          description?: string;
          metadata?: Record<string, unknown>;
        };
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>;
      };
      standing: {
        Row: {
          id: string;
          user_id: string;
          neighbor: number;
          carer: number;
          maker: number;
          teacher: number;
          keeper: number;
          voice: number;
          shop: number;
          helper: number;
          overall: number;
          last_decay_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
        };
        Update: {
          neighbor?: number;
          carer?: number;
          maker?: number;
          teacher?: number;
          keeper?: number;
          voice?: number;
          shop?: number;
          helper?: number;
        };
      };
      attestations: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          facet: 'neighbor' | 'carer' | 'maker' | 'teacher' | 'keeper' | 'voice' | 'shop' | 'helper';
          weight: number;
          reason: string;
          created_at: string;
        };
        Insert: {
          from_user_id: string;
          to_user_id: string;
          facet: 'neighbor' | 'carer' | 'maker' | 'teacher' | 'keeper' | 'voice' | 'shop' | 'helper';
          weight?: number;
          reason: string;
        };
        Update: Partial<Database['public']['Tables']['attestations']['Insert']>;
      };
      proposals: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          body: string;
          category: 'general' | 'treasury' | 'policy' | 'amendment' | 'recall';
          status: 'draft' | 'active' | 'passed' | 'rejected' | 'expired';
          votes_for: number;
          votes_against: number;
          quorum_required: number;
          opens_at: string | null;
          closes_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          author_id: string;
          title: string;
          body: string;
          category?: 'general' | 'treasury' | 'policy' | 'amendment' | 'recall';
          status?: 'draft' | 'active' | 'passed' | 'rejected' | 'expired';
          quorum_required?: number;
          opens_at?: string | null;
          closes_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['proposals']['Insert']>;
      };
      votes: {
        Row: {
          id: string;
          proposal_id: string;
          user_id: string;
          direction: 'for' | 'against' | 'abstain';
          weight: number;
          created_at: string;
        };
        Insert: {
          proposal_id: string;
          user_id: string;
          direction: 'for' | 'against' | 'abstain';
          weight?: number;
        };
        Update: Partial<Database['public']['Tables']['votes']['Insert']>;
      };
      forum_spaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          icon: string;
          post_count: number;
          member_count: number;
          created_at: string;
        };
        Insert: {
          name: string;
          slug: string;
          description?: string;
          icon?: string;
        };
        Update: Partial<Database['public']['Tables']['forum_spaces']['Insert']>;
      };
      forum_posts: {
        Row: {
          id: string;
          space_id: string;
          author_id: string;
          title: string;
          body: string;
          pinned: boolean;
          locked: boolean;
          upvotes: number;
          reply_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          space_id: string;
          author_id: string;
          title: string;
          body: string;
          pinned?: boolean;
          locked?: boolean;
        };
        Update: Partial<Database['public']['Tables']['forum_posts']['Insert']>;
      };
      forum_replies: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          body: string;
          upvotes: number;
          parent_reply_id: string | null;
          created_at: string;
        };
        Insert: {
          post_id: string;
          author_id: string;
          body: string;
          parent_reply_id?: string | null;
        };
        Update: Partial<Database['public']['Tables']['forum_replies']['Insert']>;
      };
      wiki_pages: {
        Row: {
          id: string;
          slug: string;
          title: string;
          body: string;
          category: string;
          author_id: string;
          last_editor_id: string | null;
          revision_count: number;
          published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          slug: string;
          title: string;
          body?: string;
          category?: string;
          author_id: string;
          published?: boolean;
        };
        Update: Partial<Database['public']['Tables']['wiki_pages']['Insert']> & {
          last_editor_id?: string;
          revision_count?: number;
        };
      };
      wiki_revisions: {
        Row: {
          id: string;
          page_id: string;
          editor_id: string;
          body: string;
          summary: string;
          created_at: string;
        };
        Insert: {
          page_id: string;
          editor_id: string;
          body: string;
          summary?: string;
        };
        Update: Partial<Database['public']['Tables']['wiki_revisions']['Insert']>;
      };
      health_checkins: {
        Row: {
          id: string;
          user_id: string;
          mood: number;
          energy: number | null;
          sleep_hours: number | null;
          notes: string;
          tags: string[];
          created_at: string;
        };
        Insert: {
          user_id: string;
          mood: number;
          energy?: number | null;
          sleep_hours?: number | null;
          notes?: string;
          tags?: string[];
        };
        Update: Partial<Database['public']['Tables']['health_checkins']['Insert']>;
      };
      health_resources: {
        Row: {
          id: string;
          name: string;
          category: 'clinic' | 'mental_health' | 'crisis' | 'harm_reduction' | 'wellness' | 'pharmacy';
          description: string;
          address: string | null;
          phone: string | null;
          url: string | null;
          accepts_mly: boolean;
          latitude: number | null;
          longitude: number | null;
          hours: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          name: string;
          category: 'clinic' | 'mental_health' | 'crisis' | 'harm_reduction' | 'wellness' | 'pharmacy';
          description?: string;
          address?: string | null;
          phone?: string | null;
          url?: string | null;
          accepts_mly?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          hours?: Record<string, unknown>;
        };
        Update: Partial<Database['public']['Tables']['health_resources']['Insert']>;
      };
      news_articles: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          slug: string;
          body: string;
          excerpt: string;
          cover_image: string | null;
          category: 'community' | 'governance' | 'economy' | 'safety' | 'culture' | 'events';
          published: boolean;
          featured: boolean;
          view_count: number;
          created_at: string;
          published_at: string | null;
        };
        Insert: {
          author_id: string;
          title: string;
          slug: string;
          body: string;
          excerpt?: string;
          cover_image?: string | null;
          category?: 'community' | 'governance' | 'economy' | 'safety' | 'culture' | 'events';
          published?: boolean;
          featured?: boolean;
        };
        Update: Partial<Database['public']['Tables']['news_articles']['Insert']>;
      };
      news_comments: {
        Row: {
          id: string;
          article_id: string;
          author_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          article_id: string;
          author_id: string;
          body: string;
        };
        Update: Partial<Database['public']['Tables']['news_comments']['Insert']>;
      };
      connections: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: 'pending' | 'accepted' | 'blocked';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          requester_id: string;
          addressee_id: string;
          status?: 'pending' | 'accepted' | 'blocked';
        };
        Update: {
          status?: 'pending' | 'accepted' | 'blocked';
        };
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          body: string;
          read: boolean;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          sender_id: string;
          receiver_id: string;
          body: string;
          metadata?: Record<string, unknown>;
        };
        Update: {
          read?: boolean;
        };
      };
      rewards: {
        Row: {
          id: string;
          user_id: string;
          type: 'ubi' | 'quest' | 'attestation' | 'contribution' | 'milestone' | 'welcome';
          amount: number;
          title: string;
          description: string;
          claimed: boolean;
          claimed_at: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          type: 'ubi' | 'quest' | 'attestation' | 'contribution' | 'milestone' | 'welcome';
          amount: number;
          title: string;
          description?: string;
          expires_at?: string | null;
        };
        Update: {
          claimed?: boolean;
          claimed_at?: string | null;
        };
      };
      badges: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon: string;
          category: 'general' | 'standing' | 'economy' | 'governance' | 'social' | 'health';
          criteria: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          name: string;
          description: string;
          icon?: string;
          category?: 'general' | 'standing' | 'economy' | 'governance' | 'social' | 'health';
          criteria?: Record<string, unknown>;
        };
        Update: Partial<Database['public']['Tables']['badges']['Insert']>;
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          earned_at: string;
        };
        Insert: {
          user_id: string;
          badge_id: string;
        };
        Update: never;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'info' | 'ubi' | 'social' | 'safety' | 'governance' | 'reward' | 'system';
          title: string;
          body: string;
          link: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          type?: 'info' | 'ubi' | 'social' | 'safety' | 'governance' | 'reward' | 'system';
          title: string;
          body?: string;
          link?: string | null;
        };
        Update: {
          read?: boolean;
        };
      };
      apps: {
        Row: {
          id: string;
          developer_id: string;
          name: string;
          slug: string;
          description: string;
          icon_url: string | null;
          url: string | null;
          category: 'utility' | 'social' | 'economy' | 'governance' | 'health' | 'education' | 'safety' | 'media';
          status: 'draft' | 'review' | 'published' | 'suspended';
          install_count: number;
          rating: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          developer_id: string;
          name: string;
          slug: string;
          description?: string;
          icon_url?: string | null;
          url?: string | null;
          category?: 'utility' | 'social' | 'economy' | 'governance' | 'health' | 'education' | 'safety' | 'media';
          status?: 'draft' | 'review' | 'published' | 'suspended';
        };
        Update: Partial<Database['public']['Tables']['apps']['Insert']>;
      };
      app_reviews: {
        Row: {
          id: string;
          app_id: string;
          user_id: string;
          rating: number;
          body: string;
          created_at: string;
        };
        Insert: {
          app_id: string;
          user_id: string;
          rating: number;
          body?: string;
        };
        Update: Partial<Database['public']['Tables']['app_reviews']['Insert']>;
      };
      community_treasury: {
        Row: {
          id: string;
          balance: number;
          total_burned: number;
          total_distributed: number;
          citizen_count: number;
          snapshot_at: string;
        };
        Insert: {
          balance?: number;
          total_burned?: number;
          total_distributed?: number;
          citizen_count?: number;
        };
        Update: Partial<Database['public']['Tables']['community_treasury']['Insert']>;
      };
    };
  };
};

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
