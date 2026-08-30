"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { api } from "@/lib/api";
import { useUser } from "@/components/user-context";
import { useTheme, type ThemeMode } from "@/components/theme";
import { bmiCategory, computeBmi } from "@/lib/body";
import {
  ACTIVITY_LABELS,
  ACTIVITY_MULTIPLIERS,
  computeBmr,
  computeBudget,
  GOAL_LABELS,
  type ActivityLevel,
  type Gender,
  type Goal,
} from "@/lib/budget";
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

const selectClass =
  "flex h-11 w-full rounded-xl border border-input bg-card px-3.5 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

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
  const [age, setAge] = useState(user?.age != null ? String(user.age) : "");
  const [gender, setGender] = useState<Gender | "">(user?.gender ?? "");
  const [activity, setActivity] = useState<ActivityLevel>(
    user?.activity ?? "sedentary"
  );
  const [goal, setGoal] = useState<Goal>(user?.goal ?? "maintain");
  const [manualMode, setManualMode] = useState<"auto" | "manual">(
    user?.manualKcal != null ? "manual" : "auto"
  );
  const [manualKcal, setManualKcal] = useState(
    user?.manualKcal != null ? String(user.manualKcal) : ""
  );
  const [targets, setTargets] = useState({
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
  const a = age.trim() === "" ? null : Number(age);
  const bmi = computeBmi(h, w);
  const bmr = computeBmr(w, h, a, gender === "" ? null : gender);
  const tdee = bmr !== null ? bmr * ACTIVITY_MULTIPLIERS[activity] : null;
  const budget = useMemo(
    () =>
      computeBudget({
        weightKg: w,
        heightCm: h,
        age: a,
        gender: gender === "" ? null : gender,
        activity,
        goal,
        manualKcal:
          manualMode === "manual" && manualKcal.trim() !== ""
            ? Number(manualKcal)
            : null,
        overrideMode: "usual",
      }),
    [w, h, a, gender, activity, goal, manualMode, manualKcal]
  );

  function setTarget(key: keyof typeof targets) {
    return (v: number) => setTargets((prev) => ({ ...prev, [key]: v }));
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
      age: age.trim() === "" ? null : Math.round(Number(age)),
      gender: gender === "" ? null : gender,
      activity,
      goal,
      manualKcal:
        manualMode === "manual" && manualKcal.trim() !== ""
          ? Math.round(Number(manualKcal))
          : null,
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
          <h2 className="text-sm font-semibold">Body and calorie budget</h2>
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
            <div className="space-y-1">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                min={10}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 34"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                className={selectClass}
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender | "")}
              >
                <option value="">-</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="activity">Activity baseline</Label>
              <select
                id="activity"
                className={selectClass}
                value={activity}
                onChange={(e) => setActivity(e.target.value as ActivityLevel)}
              >
                {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((k) => (
                  <option key={k} value={k}>
                    {ACTIVITY_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="goal">Goal</Label>
              <select
                id="goal"
                className={selectClass}
                value={goal}
                onChange={(e) => setGoal(e.target.value as Goal)}
              >
                {(Object.keys(GOAL_LABELS) as Goal[]).map((k) => (
                  <option key={k} value={k}>
                    {GOAL_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(bmi !== null || bmr !== null) && (
            <p className="text-sm">
              {bmi !== null && (
                <span>
                  BMI: <span className="font-medium">{bmi.toFixed(1)}</span>{" "}
                  <span className="text-muted-foreground">
                    ({bmiCategory(bmi)})
                  </span>
                </span>
              )}
              {bmi !== null && bmr !== null && " - "}
              {bmr !== null && (
                <span>
                  BMR: <span className="font-medium">{Math.round(bmr)}</span>
                  {tdee !== null && (
                    <>
                      {" "}
                      kcal - TDEE:{" "}
                      <span className="font-medium">{Math.round(tdee)}</span>{" "}
                      kcal
                    </>
                  )}
                </span>
              )}
            </p>
          )}

          <div className="space-y-2 rounded-xl bg-secondary/50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">Calorie goal</div>
                <div className="text-xs text-muted-foreground">
                  {budget.auto
                    ? budget.complete
                      ? "Auto-calculated from your BMR, activity and goal"
                      : "Add age and gender for an accurate budget (using 2000 kcal meanwhile)"
                    : "Set manually - auto-calculation is off"}
                </div>
              </div>
              <Segmented<"auto" | "manual">
                value={manualMode}
                onChange={setManualMode}
                options={[
                  { value: "auto", label: "Auto" },
                  { value: "manual", label: "Manual" },
                ]}
              />
            </div>
            {manualMode === "manual" ? (
              <div className="space-y-1">
                <Label htmlFor="manualKcal">Daily calorie goal (kcal)</Label>
                <Input
                  id="manualKcal"
                  type="number"
                  min={500}
                  max={10000}
                  value={manualKcal}
                  onChange={(e) => setManualKcal(e.target.value)}
                  placeholder="e.g. 1800"
                />
              </div>
            ) : (
              <p className="text-sm">
                Daily budget:{" "}
                <span className="font-semibold">{budget.kcal} kcal</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-4">
          <h2 className="text-sm font-semibold">Daily targets</h2>
          <p className="text-xs text-muted-foreground">
            Calories come from the budget above. The rest are used for the
            daily intake percentages and counter-action suggestions.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
