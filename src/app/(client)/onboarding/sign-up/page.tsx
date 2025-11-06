"use client";

import { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useWdk } from "@/contexts/WdkContext";
import { validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";

type TabType = "email" | "wallet";

export default function SignUpPage() {
  const [activeTab, setActiveTab] = useState<TabType>("email");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isFreelancer, setIsFreelancer] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState("");
  const [error, setError] = useState<string>("");
  const router = useRouter();
  const { createWallet, importWallet, account, hasWallet } = useWdk();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (activeTab === "wallet") {
        // Validate seed phrase
        if (!seedPhrase.trim()) {
          setError("Please enter your seed phrase");
          setIsLoading(false);
          return;
        }

        // Validate mnemonic format
        const trimmedSeed = seedPhrase.trim().toLowerCase();
        const isValid = validateMnemonic(trimmedSeed, wordlist);
        
        if (!isValid) {
          setError("Invalid seed phrase. Please check and try again.");
          setIsLoading(false);
          return;
        }

        // Import wallet with seed phrase
        await importWallet(trimmedSeed);
        
        // Wallet imported successfully - redirect to home
        // The wallet is now available in the context
        // Here you would also register the user in the smart contract
        router.push("/");
      } else {
        // Email registration - create wallet automatically (invisible to user)
        // This happens silently in the background - user doesn't need to know
        await createWallet();
        
        // Wallet created successfully - redirect to home
        // The wallet is now available in the context
        // Here you would register the user in the smart contract with email, username, etc.
        router.push("/");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      setError(error.message || "An error occurred during registration. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Navbar as elongated box */}
      <div className="w-full bg-gray-200 border-b border-gray-300">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/image.png"
                alt="OFFER-HUB Logo"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
              <span className="text-[#002333] font-bold text-lg tracking-tight">
                OFFER-HUB
              </span>
            </Link>
            <Link href="/onboarding/sign-up">
              <Button className="bg-[#002333] hover:bg-[#002333]/90 text-white">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center flex-1 px-4 py-8">
        <Card className="w-full max-w-md p-8 shadow-lg bg-white rounded-lg">
          <h1 className="text-2xl font-semibold text-center mb-2 text-gray-900">Create Account</h1>
          <p className="text-center text-sm text-gray-500 mb-6">
            Join OFFER-HUB and start your journey
          </p>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab("email")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                activeTab === "email"
                  ? "bg-white text-[#15949C] shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("wallet")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                activeTab === "wallet"
                  ? "bg-white text-[#15949C] shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Wallet
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}


          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === "email" ? (
              <>
                {/* Wallet creation message */}
                <p className="text-sm text-gray-600 mb-4 text-center">
                  Register with your email and we'll automatically create a secure Avalanche wallet for you (no action required)
                </p>
                {/* Email */}
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1 block">
                    Email
                  </Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="you@example.com" 
                    required 
                    className="w-full"
                  />
                </div>

                {/* Username */}
                <div>
                  <Label htmlFor="username" className="text-sm font-medium text-gray-700 mb-1 block">
                    Username
                  </Label>
                  <Input 
                    id="username" 
                    type="text" 
                    placeholder="yourusername" 
                    required 
                    className="w-full"
                  />
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 mb-1 block">
                    Password
                  </Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Enter your password" 
                      required 
                      className="w-full pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 mb-1 block">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input 
                      id="confirmPassword" 
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="Confirm your password" 
                      required 
                      className="w-full pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Name (optional) */}
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-1 block">
                    Name (optional)
                  </Label>
                  <Input 
                    id="name" 
                    type="text" 
                    placeholder="John Doe" 
                    className="w-full"
                  />
                </div>

                {/* Bio (optional) */}
                <div>
                  <Label htmlFor="bio" className="text-sm font-medium text-gray-700 mb-1 block">
                    Bio (optional)
                  </Label>
                  <textarea
                    id="bio"
                    placeholder="Tell us about yourself"
                    rows={4}
                    className="flex min-h-[80px] w-full rounded-[16px] border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  />
                </div>

                {/* Freelancer Checkbox */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="freelancer"
                    checked={isFreelancer}
                    onChange={(e) => setIsFreelancer(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#15949C] focus:ring-[#15949C]"
                  />
                  <Label htmlFor="freelancer" className="text-sm text-gray-700 cursor-pointer">
                    I am a freelancer
                  </Label>
                </div>
              </>
            ) : (
              <>
                {/* Wallet Tab */}
                <p className="text-sm text-gray-600 mb-4 text-center">
                  Import your existing Avalanche wallet using your seed phrase
                </p>
                
                <div>
                  <Label htmlFor="seedPhrase" className="text-sm font-medium text-gray-700 mb-1 block">
                    Seed Phrase
                  </Label>
                  <textarea
                    id="seedPhrase"
                    value={seedPhrase}
                    onChange={(e) => {
                      setSeedPhrase(e.target.value);
                      setError(""); // Clear error when user types
                    }}
                    placeholder="Enter your 12 or 24 word seed phrase separated by spaces"
                    rows={4}
                    className="flex min-h-[100px] w-full rounded-[16px] border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none font-mono"
                    required={activeTab === "wallet"}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter your seed phrase separated by spaces. This will import your existing Avalanche wallet.
                  </p>
                </div>

                <div>
                  <Label htmlFor="username-wallet" className="text-sm font-medium text-gray-700 mb-1 block">
                    Username
                  </Label>
                  <Input 
                    id="username-wallet" 
                    type="text" 
                    placeholder="yourusername" 
                    required 
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="name-wallet" className="text-sm font-medium text-gray-700 mb-1 block">
                    Name (optional)
                  </Label>
                  <Input 
                    id="name-wallet" 
                    type="text" 
                    placeholder="John Doe" 
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="bio-wallet" className="text-sm font-medium text-gray-700 mb-1 block">
                    Bio (optional)
                  </Label>
                  <textarea
                    id="bio-wallet"
                    placeholder="Tell us about yourself"
                    rows={4}
                    className="flex min-h-[80px] w-full rounded-[16px] border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="freelancer-wallet"
                    checked={isFreelancer}
                    onChange={(e) => setIsFreelancer(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#15949C] focus:ring-[#15949C]"
                  />
                  <Label htmlFor="freelancer-wallet" className="text-sm text-gray-700 cursor-pointer">
                    I am a freelancer
                  </Label>
                </div>
              </>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-[#15949C] hover:bg-[#15949C]/90 text-white font-medium py-2.5 rounded-lg mt-6"
              disabled={isLoading}
            >
              {isLoading 
                ? (activeTab === "wallet" ? "Importing Wallet..." : "Creating Account & Wallet...") 
                : "Create Account"}
            </Button>
          </form>

          <Separator className="my-6" />

          {/* Sign In Link */}
          <div className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/onboarding/sign-in" className="text-[#15949C] font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
