"use client";

import { Button } from "@/components/ui/button";
import { Github, Chrome } from "lucide-react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";

export default function SigninPage() {
  const [isLoading, setIsLoading] = useState<"github" | "google" | null>(null);
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("callbackURL") || "/";
  const handleGithubLogin = () => {
    setIsLoading("github");
    authClient.signIn.social({
      provider: "github",
      errorCallbackURL: "/signin",
      callbackURL,
    });
  };

  const handleGoogleLogin = () => {
    setIsLoading("google");
    authClient.signIn.social({
      provider: "google",
      errorCallbackURL: "/signin",
    });
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="mb-12 text-center">
          <div className="bg-primary mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg">
            <span className="text-primary-foreground text-lg font-bold">
              {"</>"}
            </span>
          </div>
          <h1 className="text-foreground mb-2 text-3xl font-bold">CIDE</h1>
          <p className="text-muted-foreground text-lg">
            Collaborative IDE for modern development
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6 text-center">
          {/* Heading */}
          <div className="mb-12 space-y-2">
            <h2 className="text-foreground text-3xl font-semibold">
              Welcome back
            </h2>
            <p className="text-muted-foreground text-lg">
              Sign in to your development workspace
            </p>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleGithubLogin}
              disabled={isLoading !== null}
              variant="outline"
              className="border-border bg-card hover:bg-secondary text-foreground hover:text-foreground h-11 w-full cursor-pointer gap-3"
            >
              <Github className="size-6" />
              <span>
                {isLoading === "github"
                  ? "Connecting..."
                  : "Continue with GitHub"}
              </span>
            </Button>

            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading !== null}
              variant="outline"
              className="border-border bg-card hover:bg-secondary text-foreground hover:text-foreground h-11 w-full cursor-pointer gap-3"
            >
              <Chrome className="size-6" />
              <span>
                {isLoading === "google"
                  ? "Connecting..."
                  : "Continue with Google"}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
