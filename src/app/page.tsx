import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Briefcase, Shield, Zap } from "lucide-react";

export default function HomePage() {
  const features = [
    {
      icon: Users,
      title: "Find Top Talent",
      description: "Connect with skilled professionals ready to bring your projects to life"
    },
    {
      icon: Briefcase,
      title: "Post Projects",
      description: "Share your vision and receive proposals from qualified freelancers"
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Protected transactions ensure everyone gets paid fairly"
    },
    {
      icon: Zap,
      title: "Fast Delivery",
      description: "Get your projects completed quickly with dedicated professionals"
    }
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#002333] via-[#003d4d] to-[#15949C] text-white py-20 lg:py-32">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 right-20 w-96 h-96 bg-[#15949C] rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-20 w-96 h-96 bg-[#002333] rounded-full blur-3xl"></div>
          </div>
          
          <div className="container mx-auto px-4 max-w-7xl relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Find the Perfect Talent for Your Next Project
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8">
                Connect with skilled professionals and get your work done efficiently
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/talent">
                  <Button size="lg" className="bg-white text-[#002333] hover:bg-white/90 text-lg h-12 px-8">
                    Find Talent
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/post-project">
                  <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 text-lg h-12 px-8">
                    Post a Project
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[#002333] mb-4">
                Why Choose OFFER-HUB?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Everything you need to hire talent and manage projects successfully
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-[#15949C] to-[#002333] rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#002333] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-[#15949C] to-[#002333] text-white">
          <div className="container mx-auto px-4 max-w-7xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of clients and freelancers collaborating on OFFER-HUB
            </p>
            <Link href="/onboarding/sign-up">
              <Button size="lg" className="bg-white text-[#002333] hover:bg-white/90 text-lg h-12 px-8">
                Create Free Account
              </Button>
            </Link>
            <p className="mt-4 text-sm text-white/70">
              This is a UI demonstration only - no real accounts are created
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
