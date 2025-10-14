"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Copy, CheckCircle2, X } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";

interface CandidateCardProps {
  candidate: {
    _id: Id<"candidates">;
    profileId: Id<"profiles">;
    bucket: "collab" | "user";
    score: number;
    rationale: string;
    icebreaker: string;
    dmDraft: string;
    profile: {
      handle: string;
      name: string;
      followers: number;
      bio: string;
      profileImageUrl?: string;
      twitterId: string;
    };
  };
}

export function CandidateCard({ candidate }: CandidateCardProps) {
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const skip = useMutation(api.candidates.skip);
  const markSent = useMutation(api.candidates.markSent);

  // Check DM history count
  const dmCount = useQuery(api.candidates.getDMCountForProfile, {
    profileId: candidate.profileId,
  });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(candidate.dmDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenDM = () => {
    const url = `https://x.com/messages/compose?recipient_id=${candidate.profile.twitterId}`;
    window.open(url, "_blank");
  };

  const handleSkip = async () => {
    await skip({ candidateId: candidate._id });
  };

  const handleMarkSent = async () => {
    await markSent({
      candidateId: candidate._id,
      notes: "Sent manually from dashboard",
    });
    setSent(true);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          {candidate.profile.profileImageUrl && (
            <img
              src={candidate.profile.profileImageUrl}
              alt={candidate.profile.name}
              className="w-12 h-12 rounded-full ring-2 ring-border"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{candidate.profile.name}</h3>
              {dmCount !== undefined && dmCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Contacted {dmCount}x
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              @{candidate.profile.handle} · {formatNumber(candidate.profile.followers)} followers
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={handleSkip} title="Skip this candidate">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Why them */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Why reach out:</p>
          <p className="text-sm">{candidate.rationale}</p>
        </div>

        {/* DM */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2 border">
          <p className="text-xs font-medium text-muted-foreground">Pre-written DM:</p>
          <p className="text-sm font-medium">{candidate.icebreaker}</p>
          <p className="text-sm">{candidate.dmDraft}</p>
        </div>

        {/* Actions */}
        {sent ? (
          <div className="flex items-center justify-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-600">DM Sent!</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleCopy} className="flex-1">
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" /> Copy DM
                  </>
                )}
              </Button>

              <Button size="sm" onClick={handleOpenDM} className="flex-1">
                <ExternalLink className="w-4 h-4 mr-1" />
                Open DM
              </Button>
            </div>
            <Button
              size="sm"
              variant="default"
              onClick={handleMarkSent}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Mark as Sent
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
