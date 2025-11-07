"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalendarCheck, ShieldCheck, Coins } from "lucide-react";
import { motion } from "framer-motion";

// Component to highlight the project creation flow with a styled preview card
export default function CreateProjectPreview() {
  const highlights = [
    {
      icon: CalendarCheck,
      title: "Milestones ready",
      description: "Break down deliverables, set timelines, and keep everyone aligned."
    },
    {
      icon: ShieldCheck,
      title: "Escrow secured",
      description: "Guard every payment with Avalanche smart contracts releasing on approval."
    },
    {
      icon: Coins,
      title: "USDT payouts",
      description: "Price work in stable value with transparent fees and instant settlement."
    }
  ];

  const talentInitials = ["UX", "3D", "FE"];

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-[#E6F8FA] via-[#F4FBFD] to-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          className="grid gap-12 lg:grid-cols-[1.1fr_1fr] items-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="space-y-6 text-[#002333]">
            <span className="inline-flex items-center rounded-full border border-[#9fd8df] bg-white px-4 py-1 text-sm font-semibold uppercase tracking-wide text-[#0f5b66]">
              Create a project preview
            </span>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              Launch a project that inspires confidence from the first glance
            </h2>
            <p className="text-[#0f5b66] text-lg">
              Showcase scope, budget and milestones in a single view. OfferHub guides you through every step so talent understands expectations before sending proposals.
            </p>
            <ul className="space-y-4">
              {highlights.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex items-start gap-4">
                  <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-[#d8f1f4] border border-[#b7e3e9]">
                    <Icon className="h-5 w-5 text-[#15949C]" />
                  </span>
                  <div>
                    <p className="font-semibold text-lg text-[#002333]">{title}</p>
                    <p className="text-[#0f5b66] text-sm md:text-base">{description}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="pt-4">
              <Link href="/post-project">
                <Button size="lg" className="bg-[#16c0c9] hover:bg-[#16c0c9]/90 text-[#002333] font-semibold text-lg px-8 shadow-lg shadow-[#16c0c9]/25">
                  Create a project
                </Button>
              </Link>
            </div>
          </div>

          <motion.div
            className="relative"
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="absolute -top-6 -left-6 h-24 w-24 rounded-full bg-[#94e3ea]/40 blur-2xl" aria-hidden />
            <div className="absolute -bottom-10 -right-8 h-32 w-32 rounded-full bg-[#b9f3f7]/40 blur-3xl" aria-hidden />
            <div className="relative rounded-3xl border border-[#c3e9ed] bg-white p-8 shadow-[0_25px_45px_-15px_rgba(21,148,156,0.25)]">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-wide text-[#0f5b66]">Project preview</p>
                  <h3 className="text-2xl font-semibold text-[#002333]">Metaverse storefront launch</h3>
                </div>
                <span className="rounded-full bg-[#16c0c9]/15 px-4 py-2 text-xs font-semibold uppercase text-[#0f5b66]">
                  In progress
                </span>
              </div>
              <div className="space-y-6">
                <div className="rounded-2xl border border-[#c3e9ed] bg-[#f6fbfc] p-4">
                  <p className="text-sm uppercase tracking-wide text-[#0f5b66]">Budget</p>
                  <p className="text-xl font-semibold text-[#002333]">4,500 USDT</p>
                  <p className="text-xs text-[#3c6f79]">Split across 3 milestones</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { label: "Discovery & wireframes", eta: "5 days", status: "Approved" },
                    { label: "Smart contract handoff", eta: "7 days", status: "Pending review" }
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-[#c3e9ed] bg-[#f6fbfc] p-4">
                      <p className="text-sm font-semibold text-[#002333]">{item.label}</p>
                      <p className="text-xs uppercase tracking-wide text-[#3c6f79]">ETA · {item.eta}</p>
                      <span className={`mt-3 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                        item.status === "Approved"
                          ? "border-[#34c77f]/30 text-[#1b7a47] bg-[#daf6e7]"
                          : "border-[#f6c06c]/30 text-[#946127] bg-[#fff1d8]"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-[#c3e9ed] bg-[#f6fbfc] p-4">
                  <p className="text-sm uppercase tracking-wide text-[#0f5b66]">Talent shortlist</p>
                  <div className="mt-3 flex items-center -space-x-2">
                    {talentInitials.map((initials) => (
                      <span key={initials} className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#15949C]/15 text-xs font-semibold text-[#0f5b66]">
                        {initials}
                      </span>
                    ))}
                    <span className="ml-4 text-sm text-[#3c6f79]">+12 proposals awaiting review</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
