"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useUser } from "@/components/user-context";
import { Button, Card, CardContent, Input, Label, Textarea } from "@/components/ui";

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

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [goals, setGoals] = useState(user?.goals ?? "");
  const [diet, setDiet] = useState(user?.diet ?? "");
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
    </form>
  );
}
