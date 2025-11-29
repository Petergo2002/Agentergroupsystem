"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { auth } from "@/lib/auth";
import {
  useAuthStore,
  useReportSectionsStore,
  useReportsStore,
  useReportTemplatesStore,
} from "@/lib/store";
import { IS_DEMO_MODE } from "@/lib/supabase";
import { useSimpleReportStore } from "@/stores/simpleReportStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();
  const router = useRouter();
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Get initial session
    auth.getSession().then(({ session }) => {
      const user = (session?.user as any) || null;
      setUser(user);
      setLoading(false);
      previousUserIdRef.current = user?.id || null;
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = auth.onAuthStateChange((user) => {
      const newUserId = user?.id || null;
      const previousUserId = previousUserIdRef.current;

      // Reset stores when user changes (login/logout or different user)
      if (newUserId !== previousUserId) {
        // Reset all user-specific stores to force re-fetch with new user's data
        useSimpleReportStore.setState({
          templates: [],
          initialized: false,
          activeTemplateId: null,
        });
        useReportsStore.setState({
          reports: [],
          initialized: false,
        });
        useReportTemplatesStore.setState({
          templates: [],
          initialized: false,
        });
        useReportSectionsStore.setState({
          sections: [],
          initialized: false,
        });
      }

      previousUserIdRef.current = newUserId;
      setUser(user);
      setLoading(false);

      if (!user && !IS_DEMO_MODE) {
        router.push("/auth/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading, router]);

  return <>{children}</>;
}
