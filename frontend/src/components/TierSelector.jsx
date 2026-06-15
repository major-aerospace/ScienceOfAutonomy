import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Baby, BookOpen, GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";

const TIERS = [
  { id: "eli12", title: "ELI12", icon: Baby, sub: "Friendlier" },
  { id: "standard", title: "Standard", icon: BookOpen, sub: "Default" },
  { id: "deep", title: "Deep dive", icon: GraduationCap, sub: "With the math" },
];

export default function TierSelector({ inline = false }) {
  const { user, setUser } = useAuth();
  const tier = (user && user !== false) ? (user.tier || "standard") : "standard";

  const choose = async (id) => {
    if (id === tier) return;
    if (!user || user === false) {
      // Local-only fallback for guests — persist in localStorage.
      localStorage.setItem("soa_tier_guest", id);
      window.dispatchEvent(new CustomEvent("soa-tier", { detail: id }));
      return;
    }
    try {
      const { data } = await api.patch("/auth/tier", { tier: id });
      setUser(data.user);
      toast.success(`Set to ${TIERS.find((t) => t.id === id).title}`);
    } catch {
      toast.error("Could not save preference");
    }
  };

  return (
    <div className={inline ? "inline-flex gap-1.5" : "flex gap-1.5"} data-testid="tier-selector">
      {TIERS.map((t) => {
        const Icon = t.icon;
        const active = t.id === tier;
        return (
          <button
            key={t.id}
            data-testid={`tier-${t.id}`}
            onClick={() => choose(t.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 border rounded-sm transition-colors ${
              active
                ? "border-[#0047FF] bg-[#0047FF] text-white"
                : "border-[rgb(var(--soa-line))] text-[rgb(var(--soa-ink-2))] hover:border-[rgb(var(--soa-ink))]"
            }`}
            title={t.sub}
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={1.6} />
            <span className="soa-mono text-[11px] font-bold uppercase tracking-widest">{t.title}</span>
          </button>
        );
      })}
    </div>
  );
}

export function useTier() {
  const { user } = useAuth();
  const [guestTier, setGuestTier] = useState(
    () => (typeof window !== "undefined" ? localStorage.getItem("soa_tier_guest") || "standard" : "standard")
  );
  useEffect(() => {
    const onChange = (e) => setGuestTier(e.detail || "standard");
    window.addEventListener("soa-tier", onChange);
    return () => window.removeEventListener("soa-tier", onChange);
  }, []);
  if (user && user !== false) return user.tier || "standard";
  return guestTier;
}
