"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LogOut, UserRound } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useUser } from "@/components/user-context";
import { useTheme, type ThemeMode } from "@/components/theme";
import { useToast } from "@/components/toast";
import { bmiCategory, computeBmi } from "@/lib/body";
import { REGIONS } from "@/lib/regions";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const { toast } = useToast();

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
  const [scientific, setScientific] = useState(user?.scientific ?? false);
  const [region, setRegion] = useState(user?.region ?? "");
  const [climate, setClimate] = useState<"hot" | "temperate">(
    user?.climate ?? "temperate"
  );
  const [targets, setTargets] = useState({
    targetProteinG: user?.targetProteinG ?? 50,
    targetFatG: user?.targetFatG ?? 70,
    targetCarbsG: user?.targetCarbsG ?? 250,
    targetSugarG: user?.targetSugarG ?? 40,
    targetSodiumMg: user?.targetSodiumMg ?? 2300,
  });

  // password modal
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [pCurrent, setPCurrent] = useState("");
  const [pNew, setPNew] = useState("");
  const [pConfirm, setPConfirm] = useState("");
  const [pBusy, setPBusy] = useState(false);
  const [pError, setPError] = useState<string | null>(null);

  // change username modal
  const [uOpen, setUOpen] = useState(false);
  const [uCurrent, setUCurrent] = useState("");
  const [uNew, setUNew] = useState("");
  const [uBusy, setUBusy] = useState(false);
  const [uError, setUError] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
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
      region: region === "" ? null : region,
      climate,
      scientific,
      ...targets,
    };

    // only touch the API key when the user actually edited it
    if (apiKey.trim() !== "" || user?.hasOwnApiKey) {
      body.geminiApiKey = apiKey.trim();
    }

    try {
      await api("/api/settings", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      toast("Settings saved");
      router.refresh();
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Could not save settings",
        "error"
      );
    } finally {
      setBusy(false);
    }
  }

  async function changePassword() {
    if (pNew.length < 6) {
      setPError("New password must be at least 6 characters");
      return;
    }
    if (pNew !== pConfirm) {
      setPError("New passwords do not match");
      return;
    }
    setPError(null);
    setPBusy(true);
    try {
      await api("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword: pCurrent, password: pNew }),
      });
      toast("Password changed");
      setPasswordOpen(false);
      setPCurrent("");
      setPNew("");
      setPConfirm("");
    } catch (err) {
      setPError(err instanceof Error ? err.message : "Could not change password");
    } finally {
      setPBusy(false);
    }
  }

  async function changeUsername() {
    if (!uNew.trim()) {
      setUError("Enter a username");
      return;
    }
    setUError(null);
    setUBusy(true);
    try {
      await api("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword: uCurrent, username: uNew.trim() }),
      });
      toast("Username changed");
      setUOpen(false);
      setUCurrent("");
      setUNew("");
      router.refresh();
    } catch (err) {
      setUError(err instanceof Error ? err.message : "Could not change username");
    } finally {
      setUBusy(false);
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
    <>
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
            <div className="space-y-1.5">
              <Label htmlFor="region">Region</Label>
              <select
                id="region"
                className={selectClass}
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                {REGIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Suggestions will name dishes that are easy to find here.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="climate">Climate</Label>
              <select
                id="climate"
                className={selectClass}
                value={climate}
                onChange={(e) => setClimate(e.target.value as "hot" | "temperate")}
              >
                <option value="temperate">Temperate</option>
                <option value="hot">Hot and humid</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Hot climates raise the sodium target by 500mg - sweating
                increases sodium needs.
              </p>
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
              fullWidth
              value={mode}
              onChange={setMode}
              options={[
                { value: "system", label: "System" },
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
            />
            <p className="text-xs text-muted-foreground">
              Theme and light/dark follow your device by default.
            </p>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3">
              <div>
                <div className="text-sm font-medium">Scientific view</div>
                <div className="text-xs text-muted-foreground">
                  Show exact grams and kcal on the main screen
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={scientific}
                onClick={() => setScientific((s) => !s)}
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                  scientific ? "bg-primary" : "bg-secondary"
                )}
              >
                <span
                  className={cn(
                    "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                    scientific && "translate-x-5"
                  )}
                />
              </button>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPasswordOpen(true)}
              className="w-full"
            >
              <KeyRound className="h-4 w-4" />
              Change password
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setUOpen(true)}
              className="w-full"
            >
              <UserRound className="h-4 w-4" />
              Change username
            </Button>
          </CardContent>
        </Card>

        <Button type="submit" disabled={busy} className="w-full">
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

      {passwordOpen && (
        <Dialog open onOpenChange={(open) => !open && setPasswordOpen(false)}>
          <DialogContent>
            <div className="space-y-3">
              <DialogTitle className="text-base font-medium">
                Change password
              </DialogTitle>
              <div className="space-y-1.5">
                <Label htmlFor="pCurrent">Current password</Label>
                <Input
                  id="pCurrent"
                  type="password"
                  value={pCurrent}
                  onChange={(e) => setPCurrent(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pNew">New password</Label>
                <Input
                  id="pNew"
                  type="password"
                  value={pNew}
                  onChange={(e) => setPNew(e.target.value)}
                  autoComplete="new-password"
                  placeholder="min 6 characters"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pConfirm">Repeat new password</Label>
                <Input
                  id="pConfirm"
                  type="password"
                  value={pConfirm}
                  onChange={(e) => setPConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              {pError && (
                <p className="text-sm text-destructive" role="alert">
                  {pError}
                </p>
              )}
              <div className="space-y-2">
                <Button onClick={changePassword} disabled={pBusy} className="w-full">
                  {pBusy ? "Changing..." : "Change password"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPasswordOpen(false)}
                  disabled={pBusy}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {uOpen && (
        <Dialog open onOpenChange={(open) => !open && setUOpen(false)}>
          <DialogContent>
            <div className="space-y-3">
              <DialogTitle className="text-base font-medium">
                Change username
              </DialogTitle>
              <div className="space-y-1.5">
                <Label htmlFor="uCurrent">Current password</Label>
                <Input
                  id="uCurrent"
                  type="password"
                  value={uCurrent}
                  onChange={(e) => setUCurrent(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="uNew">New username</Label>
                <Input
                  id="uNew"
                  value={uNew}
                  onChange={(e) => setUNew(e.target.value)}
                  autoComplete="username"
                  placeholder="e.g. krisz"
                />
              </div>
              {uError && (
                <p className="text-sm text-destructive" role="alert">
                  {uError}
                </p>
              )}
              <div className="space-y-2">
                <Button onClick={changeUsername} disabled={uBusy} className="w-full">
                  {uBusy ? "Changing..." : "Change username"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setUOpen(false)}
                  disabled={uBusy}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
