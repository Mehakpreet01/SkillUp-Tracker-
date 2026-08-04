"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase, supabaseConfigStatus } from "./supabaseClient";

const GlobalContext = createContext({});

const MOCK_USER = { id: "local-user", email: "demo@skillup.local" };

export function GlobalProvider({ children }) {
  const [user, setUser] = useState(MOCK_USER);
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState([]);
  const [targets, setTargets] = useState([]);
  const [leetcodeProfile, setLeetcodeProfile] = useState(null);
  const router = useRouter();

  const loadData = useCallback(async (userId) => {
    if (!userId) return;
    
    // Fetch Skills
    const { data: skillsData } = await supabase
      .from("skills")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setSkills(skillsData || []);

    // Fetch Targets
    const { data: targetsData } = await supabase
      .from("weekly_targets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setTargets(targetsData || []);

    // Fetch LeetCode
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setLeetcodeProfile(profileData || null);
  }, []);

  useEffect(() => {
    if (!supabaseConfigStatus.hasSupabaseConfig) {
      setUser(MOCK_USER);
      setLoading(false);
      return;
    }

    setLoading(true);

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push("/login");
      } else {
        setUser(data.session.user);
        loadData(data.session.user.id);
      }
      setLoading(false);
    }).catch(() => {
      setUser(MOCK_USER);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
        loadData(session.user.id);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [router, loadData]);

  const refreshData = () => {
    if (user && user.id) loadData(user.id);
  };

  return (
    <GlobalContext.Provider value={{
      user, loading,
      skills, targets, leetcodeProfile,
      refreshData
    }}>
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobalContext() {
  return useContext(GlobalContext);
}
