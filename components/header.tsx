"use client";

import { Button } from "@/components/ui/button";
import { Play, RefreshCw, Moon, Sun, History } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

interface HeaderProps {
  onRunCreatorPipeline: () => void;
  onRunUserPipeline: () => void;
  isRunningCreators: boolean;
  isRunningUsers: boolean;
}

export function Header({ onRunCreatorPipeline, onRunUserPipeline, isRunningCreators, isRunningUsers }: HeaderProps) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const root = document.documentElement;
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || "dark";
    setTheme(initialTheme);
    root.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="border-b bg-card sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">X DM Hub</h1>
          <p className="text-xs text-muted-foreground">{today}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/history">
            <Button variant="ghost" size="sm">
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
          </Link>

          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          <Button onClick={onRunCreatorPipeline} disabled={isRunningCreators} size="sm">
            {isRunningCreators ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Creators
              </>
            )}
          </Button>

          <Button onClick={onRunUserPipeline} disabled={isRunningUsers} size="sm">
            {isRunningUsers ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Users
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
