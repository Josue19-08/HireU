"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import WalletButton from "@/components/wallet/WalletButton";

interface NavbarProps {
  showAuth?: boolean;
  transparent?: boolean;
  className?: string;
}

export default function Navbar({ 
  showAuth = true, 
  transparent = false,
  className = "" 
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/talent", label: "Find Talent" },
    { href: "/post-project", label: "Post Project" },
    { href: "/profile", label: "Profile" },
    { href: "/messages", label: "Messages" },
    { href: "/wallet", label: "Wallet" },
  ];

  const isActiveRoute = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header
      className={`
        sticky top-0 z-50 w-full transition-all duration-300
        ${
          transparent && !isScrolled
            ? "bg-transparent"
            : "bg-white/80 backdrop-blur-md border-b border-gray-200"
        }
        ${isScrolled ? "shadow-sm" : ""}
        ${className}
      `}
    >
      <nav className="container mx-auto px-4 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 group transition-transform duration-200 hover:scale-105"
          >
            <Image
              src="/image.png"
              alt="OFFER-HUB Logo"
              width={50}
              height={50}
              className="object-contain"
              priority
            />
            <span className="text-[#002333] font-bold text-xl tracking-tight">
              OFFER-HUB
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  relative px-4 py-2 rounded-lg font-medium text-sm
                  transition-all duration-200
                  hover:bg-gray-100
                  ${
                    isActiveRoute(link.href)
                      ? "text-[#15949C]"
                      : "text-gray-700"
                  }
                  group
                `}
              >
                {link.label}
                {isActiveRoute(link.href) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-[#15949C] rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            <WalletButton />
            {showAuth && (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/onboarding/sign-in">
                  <Button variant="ghost" className="text-gray-700">
                    Sign In
                  </Button>
                </Link>
                <Link href="/onboarding/sign-up">
                  <Button className="bg-[#15949C] hover:bg-[#15949C]/90">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 text-gray-700" />
              ) : (
                <Menu className="h-5 w-5 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 animate-in slide-in-from-top-2">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    px-4 py-2 rounded-lg font-medium text-sm
                    transition-colors
                    ${
                      isActiveRoute(link.href)
                        ? "text-[#15949C] bg-gray-50"
                        : "text-gray-700 hover:bg-gray-50"
                    }
                  `}
                >
                  {link.label}
                </Link>
              ))}
              {showAuth && (
                <>
                  <div className="border-t border-gray-200 my-2" />
                  <Link href="/onboarding/sign-in">
                    <Button variant="ghost" className="w-full justify-start">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/onboarding/sign-up">
                    <Button className="w-full bg-[#15949C] hover:bg-[#15949C]/90">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

