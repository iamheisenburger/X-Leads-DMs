"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import { Calendar, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";

export default function HistoryPage() {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const deleteSentDM = useMutation(api.candidates.deleteSentDM);
  const deleteAllForDate = useMutation(api.candidates.deleteAllSentForDate);

  // Get last 30 days
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const startDate = thirtyDaysAgo.toISOString().split("T")[0];
  const endDate = today.toISOString().split("T")[0];

  const groupedHistory = useQuery(api.candidates.getSentByDateRange, {
    startDate,
    endDate,
  });

  const toggleDate = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  const handleDelete = async (candidateId: any, date: string) => {
    if (confirm("Delete this DM record?")) {
      await deleteSentDM({ candidateId });
    }
  };

  const handleDeleteAll = async (date: string, count: number) => {
    if (confirm(`Delete all ${count} DMs from this date?`)) {
      await deleteAllForDate({ date });
    }
  };

  if (groupedHistory === undefined) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Loading history...</p>
        </div>
      </div>
    );
  }

  const dates = Object.keys(groupedHistory).sort().reverse();

  if (dates.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">No sent DMs yet</h2>
            <p className="text-muted-foreground">
              Start sending DMs from your dashboard to see them here
            </p>
            <Link href="/">
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm">
            ← Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sent DMs History</h1>
        <p className="text-muted-foreground">
          Track all DMs you've sent in the last 30 days
        </p>
      </div>

      <div className="space-y-6">
        {dates.map((date) => {
          const items = groupedHistory[date];
          const collabCount = items.filter((i) => i.bucket === "collab").length;
          const userCount = items.filter((i) => i.bucket === "user").length;

          const isExpanded = expandedDates.has(date);

          return (
            <Card key={date} className="cursor-pointer" onClick={() => toggleDate(date)}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </CardTitle>
                  <div className="flex gap-2 items-center">
                    <Badge variant="secondary">
                      🎯 {collabCount} Collab
                    </Badge>
                    <Badge variant="secondary">
                      💼 {userCount} Users
                    </Badge>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAll(date, items.length);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {isExpanded && (
                <CardContent onClick={(e) => e.stopPropagation()}>
                  <div className="space-y-4">
                    {items.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      {item.profile?.profileImageUrl && (
                        <img
                          src={item.profile.profileImageUrl}
                          alt={item.profile.name}
                          className="w-10 h-10 rounded-full ring-2 ring-border"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">
                            {item.profile?.name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            @{item.profile?.handle}
                          </span>
                          {item.profile?.followers && (
                            <span className="text-xs text-muted-foreground">
                              · {formatNumber(item.profile.followers)} followers
                            </span>
                          )}
                          <Badge
                            variant="outline"
                            className="ml-auto"
                          >
                            {item.bucket === "collab" ? "🎯 Collab" : "💼 User"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {item.rationale}
                        </p>
                        <div className="bg-muted/50 rounded p-3 text-sm space-y-1">
                          <p className="font-medium">{item.icebreaker}</p>
                          <p>{item.dmDraft}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const url = `https://x.com/messages/compose?recipient_id=${item.profile?.twitterId}`;
                              window.open(url, "_blank");
                            }}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Open DM
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(item._id, date)}
                          >
                            <Trash2 className="w-3 h-3 mr-1 text-red-500" />
                            Delete
                          </Button>
                          <span className="text-xs text-muted-foreground ml-auto">
                            Sent {new Date(item.sentAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
