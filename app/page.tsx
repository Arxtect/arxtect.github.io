import Header from "@/components/landing/header";
import HeroSection from "@/components/landing/hero-section";
import DemoSection from "@/components/landing/demo-section";
import DocsSection from "@/components/landing/docs-section";
import Footer from "@/components/landing/footer";

export default function Home() {
  return (
    <>
      <div className="min-h-screen bg-background font-sans">
        <Header />
        <main>
          <HeroSection />
          <DemoSection />
          <DocsSection />
        </main>
        <Footer />
      </div>
    </>
  );
}
