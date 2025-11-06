"use client"

import { useState } from "react"
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, Check, Network } from "lucide-react"
import { useRouter } from "next/navigation"
import { ChainSelector } from "@/components/crosschain/ChainSelector"
import { useWdkNetwork } from "@/hooks/scaffold-eth/useWdkNetwork"
import { useCrossChain } from "@/hooks/useCrossChain"

export default function PostProjectPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isCrossChain, setIsCrossChain] = useState(false)
  const [destinationChainId, setDestinationChainId] = useState<number | null>(null)
  const router = useRouter()
  const { chainId } = useWdkNetwork()
  const { createCrossChainProject, isCrossChainLoading } = useCrossChain()
  const totalSteps = 4

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
      window.scrollTo(0, 0)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      if (isCrossChain && destinationChainId) {
        // TODO: Implement real cross-chain project creation
        // const title = (document.getElementById("title") as HTMLInputElement)?.value
        // const description = (document.getElementById("description") as HTMLTextAreaElement)?.value
        // const budget = (document.getElementById("budget") as HTMLInputElement)?.value
        // const deadline = // calcular deadline
        // await createCrossChainProject(...)
        alert(`Cross-chain project will be created on chain ${destinationChainId}! (Demo Mode)`)
      } else {
        alert("Project posted successfully! (Demo Mode)")
      }
      router.push("/")
    } catch (error) {
      console.error("Error posting project:", error)
      alert("Error posting project. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">Project Details</h2>
            <div>
              <Label htmlFor="title">Project Title</Label>
              <Input id="title" placeholder="e.g., Build a mobile app" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea 
                id="description"
                className="w-full min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Describe your project in detail..."
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <select id="category" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2">
                <option>Web Development</option>
                <option>Mobile Development</option>
                <option>Design</option>
                <option>Writing</option>
                <option>Other</option>
              </select>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">Skills Required</h2>
            <div>
              <Label>Required Skills</Label>
              <Input placeholder="e.g., React, Node.js, TypeScript" />
              <p className="text-sm text-gray-500 mt-2">Separate skills with commas</p>
            </div>
            <div>
              <Label htmlFor="experience">Experience Level</Label>
              <select id="experience" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2">
                <option>Entry Level</option>
                <option>Intermediate</option>
                <option>Expert</option>
              </select>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">Budget & Timeline</h2>
            <div>
              <Label htmlFor="budget">Budget (AVAX)</Label>
              <Input id="budget" type="number" placeholder="e.g., 10" step="0.01" />
            </div>
            <div>
              <Label htmlFor="budgetType">Budget Type</Label>
              <select id="budgetType" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2">
                <option>Fixed Price</option>
                <option>Hourly Rate</option>
              </select>
            </div>
            <div>
              <Label htmlFor="duration">Project Duration</Label>
              <select id="duration" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2">
                <option>Less than 1 month</option>
                <option>1-3 months</option>
                <option>3-6 months</option>
                <option>More than 6 months</option>
              </select>
            </div>
            
            {/* Cross-Chain Option */}
            <div className="pt-4 border-t">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="crossChain"
                  checked={isCrossChain}
                  onChange={(e) => setIsCrossChain(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <Label htmlFor="crossChain" className="flex items-center gap-2 cursor-pointer">
                  <Network className="h-4 w-4" />
                  Create as Cross-Chain Project
                </Label>
              </div>
              {isCrossChain && (
                <div className="mt-3 p-4 bg-blue-50 rounded-md border border-blue-200">
                  <p className="text-sm text-blue-800 mb-3">
                    This project will be created on multiple Avalanche blockchains, allowing freelancers from different chains to participate.
                  </p>
                  <ChainSelector
                    selectedChainId={destinationChainId}
                    onChainSelect={setDestinationChainId}
                    label="Select Destination Chain"
                    currentChainId={chainId || undefined}
                    excludeCurrentChain={true}
                  />
                </div>
              )}
            </div>
          </div>
        )
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">Review & Submit</h2>
            <Card className="p-6 bg-gray-50">
              <h3 className="font-semibold mb-4">Project Summary</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Title:</span> Build a mobile app</p>
                <p><span className="font-medium">Category:</span> Mobile Development</p>
                <p><span className="font-medium">Budget:</span> $5,000 (Fixed Price)</p>
                <p><span className="font-medium">Duration:</span> 1-3 months</p>
                <p><span className="font-medium">Experience:</span> Intermediate</p>
                {isCrossChain && destinationChainId && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <Network className="h-4 w-4 text-[#15949C]" />
                      <span className="font-medium text-[#15949C]">Cross-Chain Project</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      This project will be available on multiple Avalanche blockchains
                    </p>
                  </div>
                )}
              </div>
            </Card>
            <p className="text-sm text-gray-600">
              By posting this project, you agree that this is a demo and no real project will be created.
            </p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="bg-gradient-to-r from-[#002333] to-[#15949C] text-white py-10">
          <div className="container mx-auto px-4 max-w-7xl">
            <h1 className="text-3xl font-bold mb-2">Post a Project</h1>
            <p className="opacity-90">Find the perfect freelancer for your project</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-3xl">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step <= currentStep 
                    ? "bg-[#15949C] text-white" 
                    : "bg-gray-200 text-gray-600"
                }`}>
                  {step < currentStep ? <Check className="h-5 w-5" /> : step}
                </div>
                {step < totalSteps && (
                  <div className={`flex-1 h-1 mx-2 ${
                    step < currentStep ? "bg-[#15949C]" : "bg-gray-200"
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <Card className="p-6 mb-6">
            {renderStepContent()}
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {currentStep < totalSteps ? (
              <Button onClick={handleNext} className="bg-[#15949C] hover:bg-[#15949C]/90">
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading}
                isLoading={isLoading}
                className="bg-[#15949C] hover:bg-[#15949C]/90"
              >
                {isLoading ? "Posting..." : "Post Project"}
              </Button>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

