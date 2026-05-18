import Nav from "@/ui/nav/nav";
import Hero from "@/ui/hero/hero";
import FeaturesSection from "@/ui/features/features-section";
import HowSection from "@/ui/how/how-section";
import DemoStrip from "@/ui/demo/demo-strip";
import BrowsersSection from "@/ui/browsers/browsers-section";
import TestimonialsSection from "@/ui/testimonials/testimonials-section";
import PricingSection from "@/ui/pricing/pricing-section";
import FaqSection from "@/ui/faq/faq-section";
import FinalCta from "@/ui/cta/final-cta";
import LumenFooter from "@/ui/lumen-footer/lumen-footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <FeaturesSection />
        <HowSection />
        <DemoStrip />
        <BrowsersSection />
        <TestimonialsSection />
        <PricingSection />
        <FaqSection />
        <FinalCta />
      </main>
      <LumenFooter />
    </>
  );
}
