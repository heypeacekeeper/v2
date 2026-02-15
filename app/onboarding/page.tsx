"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/providers/supabase-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Rocket,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { GlobalLoader, PageLoader, RocketLoader } from "@/components/ui/global-loader";
import type { UserRole, StartupStage } from "@/lib/types";

const ROLES: { value: UserRole; label: string; emoji: string; description: string }[] = [
  {
    value: "student",
    label: "Student Entrepreneur",
    emoji: "🎓",
    description: "Learn, ask questions, validate ideas",
  },
  {
    value: "founder",
    label: "Early-Stage Founder",
    emoji: "🚀",
    description: "Post ideas, validate, use AI",
  },
  {
    value: "mentor",
    label: "Mentor / Creator",
    emoji: "🧠",
    description: "Publish insights & resources (invite-only)",
  },
  {
    value: "admin",
    label: "Admin",
    emoji: "⚡",
    description: "Moderate content, manage users & AI",
  },
];

const STARTUP_STAGES: { value: string; label: string; emoji: string }[] = [
  { value: "Idea Phase", label: "Idea Validation Stage", emoji: "💡" },
  { value: "MVP/Prototype", label: "MVP / Building Stage", emoji: "🛠️" },
  { value: "Early Traction", label: "Early Traction", emoji: "🌱" },
  { value: "Scaling", label: "Scaling Stage", emoji: "📈" },
  { value: "Mentor/Investor", label: "Mentor / Investor", emoji: "🧠" },
];

const INTERESTS = [
  { value: "startup-ideas", label: "Startup Ideas", emoji: "💡" },
  { value: "ai-automation", label: "AI & Automation", emoji: "🤖" },
  { value: "mvp-building", label: "MVP Building", emoji: "🚀" },
  { value: "marketing", label: "Marketing", emoji: "📈" },
  { value: "web-development", label: "Web Development", emoji: "💻" },
  { value: "monetization", label: "Monetization", emoji: "💰" },
  { value: "productivity", label: "Productivity", emoji: "🧠" },
  { value: "personal-brand", label: "Personal Brand", emoji: "🎯" },
];

const SKILLS = [
  { label: "Frontend", emoji: "🎨" },
  { label: "Backend", emoji: "⚙️" },
  { label: "Mobile Dev", emoji: "📱" },
  { label: "UI/UX Design", emoji: "✨" },
  { label: "Product Management", emoji: "📋" },
  { label: "Marketing", emoji: "📣" },
  { label: "Sales", emoji: "🤝" },
  { label: "Data Science", emoji: "📊" },
  { label: "DevOps", emoji: "🔧" },
  { label: "Fundraising", emoji: "💵" },
  { label: "Leadership", emoji: "👑" },
  { label: "Content Creation", emoji: "✍️" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [role, setRole] = useState<UserRole>("student");
  const [startupStage, setStartupStage] = useState<string>("Idea Phase");
  const [bio, setBio] = useState("");
  const [college, setCollege] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const supabase = useSupabase();
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
      }
      setIsCheckingAuth(false);
    }
    checkAuth();
  }, [supabase, router]);

  if (isCheckingAuth) {
    return <PageLoader message="Preparing your onboarding..." />;
  }

  if (isRedirecting) {
    return <GlobalLoader message="All set!" submessage="Taking you to your feed..." />;
  }

  const toggleInterest = (interestValue: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interestValue)
        ? prev.filter((i) => i !== interestValue)
        : [...prev, interestValue]
    );
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  async function handleComplete() {
    setIsLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        role,
        bio,
        college,
        linkedin_url: linkedinUrl || null,
        interests: selectedInterests,
        skills: selectedSkills,
        startup_stage: startupStage,
        is_onboarded: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating profile:", error);
      setIsLoading(false);
  return;
  }
  
  setIsRedirecting(true);
  window.location.href = "/feed";
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-primary" />
            </div>
            <span className="font-semibold">StartiGeniX</span>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-6 h-1 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {"What's your role?"}
              </h1>
              <p className="text-muted-foreground text-sm">
                This helps us personalize your experience
              </p>
            </div>

            <div className="space-y-3">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={`w-full p-4 rounded-xl border transition-all flex items-center gap-4 text-left ${
                    role === r.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-secondary hover:border-primary/50"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
                      role === r.value
                        ? "bg-primary/20"
                        : "bg-muted"
                    }`}
                  >
                    {r.emoji}
                  </div>
                  <div>
                    <p className="font-medium">{r.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {r.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {"Where are you in your startup journey?"}
              </h1>
              <p className="text-muted-foreground text-sm">
                Help us connect you with the right people
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {STARTUP_STAGES.map((stage) => (
                <button
                  key={stage.value}
                  onClick={() => setStartupStage(stage.value)}
                  className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 text-center ${
                    startupStage === stage.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-secondary hover:border-primary/50"
                  }`}
                >
                  <span className="text-2xl">{stage.emoji}</span>
                  <span className="text-sm font-medium">{stage.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Tell us about yourself
              </h1>
              <p className="text-muted-foreground text-sm">
                Help others connect with you
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Share a bit about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="bg-secondary border-border min-h-[100px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="college">College/University</Label>
                <Input
                  id="college"
                  placeholder="e.g., Stanford University"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn URL (optional)</Label>
                <Input
                  id="linkedin"
                  placeholder="https://linkedin.com/in/..."
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Your interests & skills
              </h1>
              <p className="text-muted-foreground text-sm">
                Select at least 2 from each
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Interest Areas</Label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((interest) => (
                    <button
                      key={interest.value}
                      onClick={() => toggleInterest(interest.value)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                        selectedInterests.includes(interest.value)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-muted"
                      }`}
                    >
                      <span>{interest.emoji}</span>
                      <span>{interest.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Skills</Label>
                <div className="flex flex-wrap gap-2">
                  {SKILLS.map((skill) => (
                    <button
                      key={skill.label}
                      onClick={() => toggleSkill(skill.label)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                        selectedSkills.includes(skill.label)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-muted"
                      }`}
                    >
                      <span>{skill.emoji}</span>
                      <span>{skill.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-4">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)} className="flex-1">
              Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={
                isLoading ||
                selectedInterests.length < 2 ||
                selectedSkills.length < 2
              }
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <RocketLoader size="sm" className="mr-2" />
                  Setting up...
                </>
              ) : (
                <>
                  Get Started
                  <Rocket className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
