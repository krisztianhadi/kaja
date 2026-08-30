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
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MealResultDialog } from "./meal-result-dialog";
import { NotFoodDialog } from "./not-food-dialog";
import { AnalysisOverlay } from "./analysis-overlay";

interface RecordResponse {
  meal: MealDto;
  totals: Totals;
  suggestion: Suggestion;
}

/** The AI decided the item is not food - nothing was saved. */
interface NotFoodResponse {
  notFood: true;
  mealName: string | null;
  description: string;
}

export function MealForm({
  onRecorded,
  className,
}: {
  onRecorded: (meal: MealDto) => void;
  className?: string;
}) {
  const user = useUser();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [showShared, setShowShared] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<RecordResponse | null>(null);
  const [notFood, setNotFood] = useState<NotFoodResponse | null>(null);
  const { toast } = useToast();

  /** Dismiss removes the just-recorded meal (undo the record). */
  async function dismissFreshMeal() {
    if (!last) return;
    setDismissing(true);
    try {
      await api(`/api/meals/${last.meal.id}`, { method: "DELETE" });
      toast("Meal discarded");
      setLast(null);
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Could not discard the meal",
        "error"
      );
      setDismissing(false);
    }
  }

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
    // sanity cap only - phone photos (8-12MB) are fine, they get
    // downscaled below; this only stops absurd/huge files
    if (file.size > 30 * 1024 * 1024) {
      setError("Photo too large (max 30MB)");
      return;
    }
    try {
      const dataUri = await fileToDownscaledDataUri(file);
      if (dataUri.length > 4 * 1024 * 1024 * 1.4) {
        setError("Photo too large (max 4MB)");
        return;
      }
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

      const data = await api<RecordResponse | NotFoodResponse>("/api/meals", {
        method: "POST",
        body: form,
      });
      setDescription("");
      setPhoto(null);
      setParticipants([]);
      if ("notFood" in data) {
        // the AI said this is not food - nothing was saved, show the fun modal
        setNotFood(data as NotFoodResponse);
        queryClient.invalidateQueries({ queryKey: ["meals"] });
        queryClient.invalidateQueries({ queryKey: ["stats"] });
        return;
      }
      const result = data as RecordResponse;
      setLast(result);
      onRecorded(result.meal);
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
      <Card className={className}>
        <CardContent className="space-y-3 pt-4">
          <form onSubmit={submit}>
            {/* the photo button lives inside the input's right corner so
                the box can grow without moving it around */}
            <div className="relative">
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() =>
                  setTimeout(() => setFocused(false), 150)
                }
                placeholder="What did you eat? (photo also works)"
                aria-label="Food description"
                disabled={busy}
                className="pr-12"
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
                className="absolute right-1.5 top-1/2 h-9 w-9 -translate-y-1/2 rounded-xl"
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

            {/* action row appears when the field is active or there is
                content; the Record button only shows once there is
                something to record */}
            {(focused || canSubmit) && (
              <div className="mt-3 animate-sheet-in-bottom">
                {others.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
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
                    {canSubmit && (
                      <Button type="submit" className="w-full">
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
                  </div>
                ) : canSubmit ? (
                  <Button type="submit" className="w-full">
                    {busy ? (
                      "Estimating..."
                    ) : (
                      <>
                        <UtensilsCrossed className="h-4 w-4" />
                        Record
                      </>
                    )}
                  </Button>
                ) : null}
              </div>
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

      {notFood && (
        <NotFoodDialog
          item={notFood.mealName ?? notFood.description}
          onDismiss={() => setNotFood(null)}
        />
      )}

      {last && (
        <MealResultDialog
          meal={last.meal}
          suggestion={last.suggestion}
          busy={dismissing}
          onSave={() => setLast(null)}
          onDismiss={dismissFreshMeal}
          onUpdated={(meal) =>
            setLast((prev) => (prev ? { ...prev, meal } : prev))
          }
        />
      )}
    </div>
  );
}
