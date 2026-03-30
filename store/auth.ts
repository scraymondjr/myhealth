import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthStore {
  user: User | null;
  session: Session | null;
  /** True while a sign-in / sign-up request is in-flight */
  loading: boolean;
  /** True once the initial session check has resolved */
  initialized: boolean;

  // Called from app layout once on mount
  init: () => () => void;

  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;

  _setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  session: null,
  loading: false,
  initialized: false,

  init: () => {
    // Immediately resolve from any persisted session
    supabase.auth.getSession().then(({ data: { session } }) => {
      get()._setSession(session);
    });

    // Keep state in sync with Supabase auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      get()._setSession(session);
    });

    return () => subscription.unsubscribe();
  },

  signIn: async (email, password) => {
    set({ loading: true });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    set({ loading: false });
    return error?.message ?? null;
  },

  signUp: async (email, password) => {
    set({ loading: true });
    const { error } = await supabase.auth.signUp({ email, password });
    set({ loading: false });
    return error?.message ?? null;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    // _setSession(null) will fire via the onAuthStateChange listener above
  },

  _setSession: (session) => {
    set({
      session,
      user: session?.user ?? null,
      initialized: true,
    });
  },
}));
