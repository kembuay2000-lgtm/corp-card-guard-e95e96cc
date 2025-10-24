import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { StatsOverview } from "@/components/StatsOverview";
import { AlertsSection } from "@/components/AlertsSection";
import { TestsProgram } from "@/components/TestsProgram";
import { TransactionImport } from "@/components/TransactionImport";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <div className="container mx-auto px-4 py-8">
        <TransactionImport />
      </div>
      <StatsOverview />
      <AlertsSection />
      <TestsProgram />
    </div>
  );
};

export default Index;
