"use client";

import Image from "next/image";
import Link from "next/link";
import { Facebook, Twitter, Linkedin, Instagram, Github, Mail, Phone } from "lucide-react";

export default function Footer() {
  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Github, href: "#", label: "Github" },
  ];

  return (
    <footer className="bg-gradient-to-br from-[#002333] via-[#003d4d] to-[#002333] text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#15949C] rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#15949C] rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="pt-16 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Company Info */}
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center mb-6 w-fit group gap-3">
                <Image
                  src="/image.png"
                  alt="OFFER-HUB logo"
                  width={48}
                  height={48}
                  className="rounded-xl transition-transform duration-200 group-hover:scale-105"
                  priority
                />
                <span className="text-2xl font-bold">OFFER-HUB</span>
              </Link>
              <p className="text-white/70 mb-6 max-w-xs leading-relaxed text-sm">
                Connecting talented professionals with clients worldwide for
                successful collaborations. (Demo UI Only)
              </p>
              
              {/* Social Links */}
              <div className="flex gap-3 mb-6">
                {socialLinks.map((social) => (
                  <Link
                    key={social.label}
                    href={social.href}
                    className="
                      p-2 bg-white/10 hover:bg-[#15949C] 
                      rounded-lg transition-all duration-200
                      hover:scale-110
                    "
                    aria-label={social.label}
                  >
                    <social.icon className="w-4 h-4" />
                  </Link>
                ))}
              </div>

              {/* Contact */}
              <div className="space-y-2 text-sm text-white/70">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>hello@offer-hub.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>+1 (555) 123-4567</span>
                </div>
              </div>
            </div>

            {/* For Clients */}
            <div>
              <h3 className="font-bold text-lg mb-4 text-white">For Clients</h3>
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/talent" 
                    className="text-white/70 hover:text-[#15949C] transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#15949C] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Find Talent
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/post-project" 
                    className="text-white/70 hover:text-[#15949C] transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#15949C] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Post a Project
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/messages" 
                    className="text-white/70 hover:text-[#15949C] transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#15949C] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Messages
                  </Link>
                </li>
              </ul>
            </div>

            {/* For Freelancers */}
            <div>
              <h3 className="font-bold text-lg mb-4 text-white">For Freelancers</h3>
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/talent" 
                    className="text-white/70 hover:text-[#15949C] transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#15949C] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Find Work
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/profile" 
                    className="text-white/70 hover:text-[#15949C] transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#15949C] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    My Profile
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/messages" 
                    className="text-white/70 hover:text-[#15949C] transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#15949C] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Messages
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-bold text-lg mb-4 text-white">Resources</h3>
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="#" 
                    className="text-white/70 hover:text-[#15949C] transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#15949C] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Help & Support
                  </Link>
                </li>
                <li>
                  <Link 
                    href="#" 
                    className="text-white/70 hover:text-[#15949C] transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#15949C] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link 
                    href="#" 
                    className="text-white/70 hover:text-[#15949C] transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#15949C] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Community
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/60 text-sm">
              © {new Date().getFullYear()} OFFER-HUB. All rights reserved. (UI Demo Only)
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="#" className="text-white/60 hover:text-[#15949C] transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="text-white/60 hover:text-[#15949C] transition-colors">
                Terms of Service
              </Link>
              <Link href="#" className="text-white/60 hover:text-[#15949C] transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

