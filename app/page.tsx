"use client";

import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { QueueColumn } from "@/components/queue-column";
import { Header } from "@/components/header";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

export default function HomePage() {
  const todayData = useQuery(api.candidates.getToday, {});
  const runCreatorPipeline = useAction(api.pipeline.runManualCreators);
  const runUserPipeline = useAction(api.pipeline.runManualUsers);
  const [isRunningCreators, setIsRunningCreators] = useState(false);
  const [isRunningUsers, setIsRunningUsers] = useState(false);

  const handleRunCreatorPipeline = async () => {
    setIsRunningCreators(true);
    try {
      const result = await runCreatorPipeline({});
      console.log("Creator pipeline result:", result);

      if (result && result.success) {
        alert(`Creator pipeline completed! Found ${result.creators} new creators`);
        window.location.reload();
      } else {
        alert("Creator pipeline failed - check console for details");
      }
    } catch (error) {
      console.error("Creator pipeline error:", error);
      alert("Failed to run creator pipeline: " + String(error));
    } finally {
      setIsRunningCreators(false);
    }
  };

  const handleRunUserPipeline = async () => {
    setIsRunningUsers(true);
    try {
      const result = await runUserPipeline({});
      console.log("User pipeline result:", result);

      if (result && result.success) {
        alert(`User pipeline completed! Found ${result.users} new users`);
        window.location.reload();
      } else {
        alert("User pipeline failed - check console for details");
      }
    } catch (error) {
      console.error("User pipeline error:", error);
      alert("Failed to run user pipeline: " + String(error));
    } finally {
      setIsRunningUsers(false);
    }
  };

  if (todayData === undefined) {
    return (
      <>
        <Header
          onRunCreatorPipeline={handleRunCreatorPipeline}
          onRunUserPipeline={handleRunUserPipeline}
          isRunningCreators={isRunningCreators}
          isRunningUsers={isRunningUsers}
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  // Group candidates by bucket
  const collab = todayData?.filter((c) => c.bucket === "collab") || [];
  const users = todayData?.filter((c) => c.bucket === "user") || [];

  return (
    <>
      <Header
        onRunCreatorPipeline={handleRunCreatorPipeline}
        onRunUserPipeline={handleRunUserPipeline}
        isRunningCreators={isRunningCreators}
        isRunningUsers={isRunningUsers}
      />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {collab.length === 0 && users.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="max-w-2xl text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">No prospects yet</h2>
                <p className="text-lg text-muted-foreground">
                  Click "Run Pipeline" to discover today's DM prospects
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mt-8">
                <div className="p-6 border rounded-lg bg-card">
                  <h3 className="font-semibold mb-2">🎯 Collab Creators (10/day)</h3>
                  <p className="text-sm text-muted-foreground">
                    Amplifiers who spotlight small builders. Perfect for getting your posts retweeted.
                  </p>
                </div>
                <div className="p-6 border rounded-lg bg-card">
                  <h3 className="font-semibold mb-2">💼 SubWise Users (20/day)</h3>
                  <p className="text-sm text-muted-foreground">
                    People who need a subscription tracker. Potential users for your app.
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-6">
                The pipeline searches Twitter, classifies prospects with AI, and writes personalized DMs.
                <br />
                Takes about 2-3 minutes to run.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Today's Prospects</h2>
                <p className="text-muted-foreground">
                  {collab.length + users.length} candidates ready for outreach
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <QueueColumn
                title={`🎯 Collab Creators (${collab.length}/10)`}
                candidates={collab}
                emptyMessage="No collab creators today"
              />

              <QueueColumn
                title={`💼 SubWise Users (${users.length}/20)`}
                candidates={users}
                emptyMessage="No user prospects today"
              />
            </div>
          </div>
        )}
      </main>
    </>
  );
}
