import type { Metadata } from "next";
import LandingHeader from "@/components/landing/LandingHeader";
import Hero from "@/components/landing/Hero";
import AccessSection from "@/components/landing/AccessSection";
import ServicesSection from "@/components/landing/ServicesSection";
import WhyUsSection from "@/components/landing/WhyUsSection";
import CooperationSection from "@/components/landing/CooperationSection";
import TechSection from "@/components/landing/TechSection";
import BrochureSection from "@/components/landing/BrochureSection";
import CtaSection from "@/components/landing/CtaSection";
import LandingFooter from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "HurdExpress — Хүргэлтийн цогц шийдэл",
  description:
    "Онлайн дэлгүүр болон бизнес байгууллагуудын бараа бүтээгдэхүүнийг хурдан, найдвартай хүргэх үйлчилгээ. Хүргэлт шалгах, харилцагчаар нэвтрэх.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-navy">
      <LandingHeader />
      <main>
        <Hero />
        <AccessSection />
        <ServicesSection />
        <WhyUsSection />
        <CooperationSection />
        <TechSection />
        <BrochureSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
