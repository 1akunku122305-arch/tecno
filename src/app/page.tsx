import { LandingNavbar } from "@/components/landing/navbar";
import {
  CtaSection,
  FeatureSection,
  FieldsSection,
  Footer,
  Hero,
  ProblemSection,
  SolutionSection,
} from "@/components/landing/sections";
import { getPublicCategoriesSafe } from "@/services/public-catalog.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { categories, error } = await getPublicCategoriesSafe();

  return (
    <>
      <LandingNavbar />
      <main>
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <FeatureSection />
        <FieldsSection categories={categories} error={error} />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
