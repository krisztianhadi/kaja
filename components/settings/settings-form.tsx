"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useUser } from "@/components/user-context";
import { useTheme, type ThemeMode } from "@/components/theme";
import { bmiCategory, computeBmi, recommendedTargets } from "@/lib/body";
import { Button, Card, CardContent, Input, Label, Segmented, Textarea } from "@/components/ui";

function NumberField({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={label}>
        {label} <span className="text-muted-foreground">({unit})</span>
      </Label>
      <Input
        id={label}
        type="number"
        min={0}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Math.max(0, Math.round(Number(e.target.value) || 0)))}
      />
    </div>
  );
}

export function SettingsForm() {
  const user = useUser();
  const router = useRouter();
  const { mode, setMode } = useTheme();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [goals, setGoals] = useState(user?.goals ?? "");
  const [diet, setDiet] = useState(user?.diet ?? "");
  const [heightCm, setHeightCm] = useState(
    user?.heightCm != null ? String(user.heightCm) : ""
  );
  const [weightKg, setWeightKg] = useState(
    user?.weightKg != null ? String(user.weightKg) : ""
  );
  const [targets, setTargets] = useState({
    targetKcal: user?.targetKcal ?? 2000,
    targetProteinG: user?.targetProteinG ?? 50,
    targetFatG: user?.targetFatG ?? 70,
    targetCarbsG: user?.targetCarbsG ?? 250,
    targetSugarG: user?.targetSugarG ?? 25,
    targetSodiumMg: user?.targetSodiumMg ?? 2300,
  });

  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const h = heightCm.trim() === "" ? null : Number(heightCm);
  const w = weightKg.trim() === "" ? null : Number(weightKg);
  const bmi = computeBmi(h, w);
  const recommended = useMemo(
    () =>
      recommendedTargets({
        heightCm: h,
        weightKg: w,
        goals,
        diet,
      }),
    [h, w, goals, diet]
  );

  function setTarget(key: keyof typeof targets) {
    return (v: number) => setTargets((prev) => ({ ...prev, [key]: v }));
  }

  function applyRecommended() {
    if (!recommended) return;
    setTargets({
      targetKcal: recommended.kcal,
      targetProteinG: recommended.proteinG,
      targetFatG: recommended.fatG,
      targetCarbsG: recommended.carbsG,
      targetSugarG: recommended.sugarG,
      targetSodiumMg: recommended.sodiumMg,
    });
    setSaved(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    setError(null);

    const body: Record<string, unknown> = {
      bio,
      goals,
      diet,
      heightCm: heightCm.trim() === "" ? null : Math.round(Number(heightCm)),
      weightKg: weightKg.trim() === "" ? null : Number(weightKg),
      ...targets,
    };

    if (newPassword) {
      if (newPassword.length < 6) {
        setError("New password must be at least 6 characters");
        setBusy(false);
        return;
      }
      if (!currentPassword) {
        setError("Enter your current password to change it");
        setBusy(false);
        return;
      }
      body.currentPassword = currentPassword;
      body.password = newPassword;
    }

    // only touch the API key when the user actually edited it
    if (apiKey.trim() !== "" || user?.hasOwnApiKey) {
      body.geminiApiKey = apiKey.trim();
    }

    try {
      await api("/api/settings", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save settings");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // still navigate away
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <Card>
        <CardContent className="space-y-3 pt-4">
          <h2 className="text-sm font-semibold">Profile</h2>
          <div className="space-y-1.5">
            <Label htmlFor="bio">Dietary notes</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. diabetes, lactose intolerance"
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="goals">Goals</Label>
            <Textarea
              id="goals"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="e.g. weight loss, healthier balanced life"
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="diet">Ongoing diet</Label>
            <Textarea
              id="diet"
              value={diet}
              onChange={(e) => setDiet(e.target.value)}
              placeholder="e.g. low sodium diet, low sugar diet"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-4">
          <h2 className="text-sm font-semibold">Body</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="heightCm">Height (cm)</Label>
              <Input
                id="heightCm"
                type="number"
                min={50}
                max={300}
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="e.g. 175"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="weightKg">Current weight (kg)</Label>
              <Input
                id="weightKg"
                type="number"
                min={10}
                max={500}
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="e.g. 72.5"
              />
            </div>
          </div>

          {bmi !== null && (
            <p className="text-sm">
              BMI: <span className="font-medium">{bmi.toFixed(1)}</span>{" "}
              <span className="text-muted-foreground">
                ({bmiCategory(bmi)})
              </span>
            </p>
          )}

          {recommended && (
            <div className="space-y-2 rounded-md bg-secondary/50 p-3">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-primary" />
                Recommended intake
              </div>
              <p className="text-xs text-muted-foreground">
                Rough estimate from your height, weight, goals and diet. Apply
                it, then tweak if you like.
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <span>
                  kcal <b>{recommended.kcal}</b>
                </span>
                <span>
                  protein <b>{recommended.proteinG} g</b>
                </span>
                <span>
                  fat <b>{recommended.fatG} g</b>
                </span>
                <span>
                  carbs <b>{recommended.carbsG} g</b>
                </span>
                <span>
                  sugar <b>{recommended.sugarG} g</b>
                </span>
                <span>
                  sodium <b>{recommended.sodiumMg} mg</b>
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={applyRecommended}
              >
                Apply to daily targets
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-4">
          <h2 className="text-sm font-semibold">Daily targets</h2>
          <p className="text-xs text-muted-foreground">
            Used for the daily intake percentages and the counter-action
            suggestions.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <NumberField label="Calories" unit="kcal" value={targets.targetKcal} onChange={setTarget("targetKcal")} />
            <NumberField label="Protein" unit="g" value={targets.targetProteinG} onChange={setTarget("targetProteinG")} />
            <NumberField label="Fat" unit="g" value={targets.targetFatG} onChange={setTarget("targetFatG")} />
            <NumberField label="Carbs" unit="g" value={targets.targetCarbsG} onChange={setTarget("targetCarbsG")} />
            <NumberField label="Sugar" unit="g" value={targets.targetSugarG} onChange={setTarget("targetSugarG")} />
            <NumberField label="Sodium" unit="mg" value={targets.targetSodiumMg} onChange={setTarget("targetSodiumMg")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-4">
          <h2 className="text-sm font-semibold">AI</h2>
          <div className="space-y-1.5">
            <Label htmlFor="apiKey">Gemini API key (optional)</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={user?.hasOwnApiKey ? "Your key is set - leave empty to keep it" : "Leave empty to use the server key"}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Bring your own free Gemini key. Unset = the server GEMINI_TOKEN
              is used.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-4">
          <h2 className="text-sm font-semibold">Appearance</h2>
          <Segmented<ThemeMode>
            value={mode}
            onChange={setMode}
            options={[
              { value: "system", label: "System" },
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
          />
          <p className="text-xs text-muted-foreground">
            Follows your device setting by default.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-4">
          <h2 className="text-sm font-semibold">Password</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="min 6 characters"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="text-sm text-primary" role="status">
          Saved.
        </p>
      )}
      <Button type="submit" disabled={busy}>
        {busy ? "Saving..." : "Save settings"}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={signOut}
        disabled={signingOut}
        className="w-full border-destructive/40 text-destructive hover:bg-destructive/10"
      >
        <LogOut className="h-4 w-4" />
        {signingOut ? "Signing out..." : "Sign out"}
      </Button>
    </form>
  );
}
