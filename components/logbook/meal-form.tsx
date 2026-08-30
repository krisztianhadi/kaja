/* eslint-disable @next/next/no-img-element -- photos are base64 data URIs, next/image adds nothing */
"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, UtensilsCrossed, Users, X } from "lucide-react";
import { api, tzOffsetMinutes } from "@/lib/api";
import { fileToDownscaledDataUri } from "@/lib/image";
import type { Suggestion } from "@/lib/db/schema";
import type { Totals } from "@/lib/nutrition";
import type { MealDto } from "@/lib/types";
import { useUser } from "@/components/user-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MealResult } from "./meal-result";
import { AnalysisOverlay } from "./analysis-overlay";

interface RecordResponse {
  meal: MealDto;
  totals: Totals;
  suggestion: Suggestion;
}

export function MealForm({
  onRecorded,
}: {
  onRecorded: (meal: MealDto) => void;
}) {
  const user = useUser();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [showShared, setShowShared] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<RecordResponse | null>(null);

  const { data: family } = useQuery({
    queryKey: ["users"],
    queryFn: () => api<{ users: { id: string; username: string }[] }>("/api/users"),
  });

  const others = (family?.users ?? []).filter((u) => u.id !== user?.id);
  const canSubmit = !busy && (description.trim().length > 0 || photo !== null);

  async function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setError("Photo too large (max 4MB)");
      return;
    }
    try {
      const dataUri = await fileToDownscaledDataUri(file);
      setPhoto(dataUri);
      setError(null);
    } catch {
      setError("Could not read that image");
    }
  }

  function toggleParticipant(id: string) {
    setParticipants((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      if (description.trim()) form.append("description", description.trim());
      if (photo) form.append("imageData", photo);
      if (participants.length > 0) {
        form.append("participantIds", JSON.stringify(participants));
      }
      form.append("tzOffsetMinutes", String(tzOffsetMinutes()));

      const data = await api<RecordResponse>("/api/meals", {
        method: "POST",
        body: form,
      });
      setLast(data);
      setDescription("");
      setPhoto(null);
      setParticipants([]);
      onRecorded(data.meal);
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record the meal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="space-y-3 pt-4">
          <form onSubmit={submit}>
            <div className="flex items-center gap-2">
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What did you eat? (photo also works)"
                aria-label="Food description"
                disabled={busy}
                className="flex-1"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={pickPhoto}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                title="Add a photo"
                aria-label="Add a photo"
                disabled={busy}
              >
                <ImagePlus className="h-5 w-5" />
              </Button>
            </div>

            {photo && (
              <div className="relative mt-3 inline-block">
                <img
                  src={photo}
                  alt="Selected meal photo"
                  className="h-24 w-24 rounded-xl object-cover shadow-soft"
                />
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  className="absolute -right-2 -top-2 rounded-full bg-card p-1.5 shadow-lifted"
                  aria-label="Remove photo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {others.length > 0 ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowShared((s) => !s)}
                  className="w-full"
                >
                  <Users className="h-4 w-4" />
                  Shared
                  {participants.length > 0 && (
                    <span className="rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                      {participants.length}
                    </span>
                  )}
                </Button>
                <Button type="submit" disabled={!canSubmit} className="w-full">
                  {busy ? (
                    "Estimating..."
                  ) : (
                    <>
                      <UtensilsCrossed className="h-4 w-4" />
                      Record
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Button
                type="submit"
                disabled={!canSubmit}
                className="mt-3 w-full"
              >
                {busy ? (
                  "Estimating..."
                ) : (
                  <>
                    <UtensilsCrossed className="h-4 w-4" />
                    Record
                  </>
                )}
              </Button>
            )}

            {showShared && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t pt-3">
                <span className="text-xs text-muted-foreground">
                  Who shared this meal? (split equally)
                </span>
                {others.length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    No other family members yet
                  </span>
                )}
                {others.map((u) => {
                  const active = participants.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleParticipant(u.id)}
                      className={
                        "rounded-full border px-2.5 py-0.5 text-xs transition-colors " +
                        (active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:bg-accent")
                      }
                    >
                      {u.username}
                    </button>
                  );
                })}
              </div>
            )}
          </form>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      <AnalysisOverlay show={busy} label="Analyzing your meal..." />

      {last && (
        <MealResult
          data={last}
          onUpdated={(meal) =>
            setLast((prev) => (prev ? { ...prev, meal } : prev))
          }
        />
      )}
    </div>
  );
}
