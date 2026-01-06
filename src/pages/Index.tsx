import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import SecuritySection from "@/components/SecuritySection";
import PricingSection from "@/components/PricingSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>KlarGehalt.de - EU-Entgelttransparenz rechtssicher umsetzen</title>
        <meta 
          name="description" 
          content="B2B-Compliance-SaaS für die EU-Entgelttransparenzrichtlinie. Schützen Sie Ihr Unternehmen vor Klagen, Bußgeldern und Chaos mit unserer DSGVO-konformen Lösung." 
        />
        <meta name="keywords" content="Entgelttransparenz, EU-Richtlinie, Compliance, DSGVO, Gehaltsdaten, B2B SaaS, Pay Transparency" />
        <link rel="canonical" href="https://klargehalt.de" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <HeroSection />
          <FeaturesSection />
          <SecuritySection />
          <PricingSection />
          <ContactSection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
