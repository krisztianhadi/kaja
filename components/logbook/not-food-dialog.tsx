"use client";

import { Skull } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Shown when the AI says the recorded thing is not food (brick, plastic,
 * electronics, ...). Nothing was saved - Dismiss just closes it.
 */

const NOT_FOOD_MESSAGES = [
  "I hope you did not eat that - not good for your teeth.",
  "That is not food. The plate would probably win the fight.",
  "Looks more like home improvement than dinner.",
  "Your stomach said no, and so did I.",
  "We are a food logbook, not a hardware store.",
];

function pickMessage(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return NOT_FOOD_MESSAGES[hash % NOT_FOOD_MESSAGES.length];
}

export function NotFoodDialog({
  item,
  onDismiss,
}: {
  item: string | null;
  onDismiss: () => void;
}) {
  const message = pickMessage(item ?? "that");
  return (
    <Dialog open onOpenChange={(open) => !open && onDismiss()}>
      <DialogContent>
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(8_55%_45%_/_0.1)]">
            <Skull className="h-8 w-8 text-[hsl(8_55%_45%)]" aria-hidden />
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-base font-medium">
              That is not food
            </DialogTitle>
            <DialogDescription className="text-sm">
              {message}
            </DialogDescription>
            {item && (
              <p className="text-xs text-muted-foreground">
                &ldquo;{item}&rdquo; was not recorded.
              </p>
            )}
          </div>
          <Button onClick={onDismiss} className="w-full">
            Dismiss
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
