"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login
    setTimeout(() => {
      alert("Login successful! (Demo Mode)");
      setIsLoading(false);
      router.push("/");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-muted flex flex-col">
      <div className="p-4">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="w-10 h-10 bg-gradient-to-br from-[#15949C] to-[#002333] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">H</span>
          </div>
          <span className="text-[#002333] font-bold text-lg">HIRE U</span>
        </Link>
      </div>
      
      <div className="flex flex-col items-center justify-start flex-1 px-4 pt-8">
        <Card className="w-full max-w-md p-6 shadow-lg">
          <h1 className="text-2xl font-semibold text-center mb-2">Welcome Back</h1>
          <p className="text-center text-sm text-gray-500 mb-6">
            Sign in to your OFFER-HUB account
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="john@example.com" 
                required 
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                required 
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <Link href="#" className="text-sm text-[#149A9B] hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#15949C] hover:bg-[#15949C]/90"
              disabled={isLoading}
              isLoading={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <Separator className="my-6" />

          <div className="text-center text-sm">
            Don't have an account?{" "}
            <Link href="/onboarding/sign-up" className="text-[#149A9B] font-medium hover:underline">
              Sign up
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

