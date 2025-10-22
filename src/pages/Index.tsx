import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { StatsOverview } from "@/components/StatsOverview";
import { AlertsSection } from "@/components/AlertsSection";
import { TestsProgram } from "@/components/TestsProgram";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <StatsOverview />
      <AlertsSection />
      <TestsProgram />
    </div>
  );
};

export default Index;
