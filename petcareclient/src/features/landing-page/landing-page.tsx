import { Fragment } from "react";

import Navbar from "./components/navbar";
import { CtaSection } from "./sections/Cta";
import Features from "./sections/Features";
import HeroSectionPage from "./sections/Hero";

export default function LandingPage() {
  return (
    <Fragment>
      <Navbar />
      <HeroSectionPage />
      <Features />
      <CtaSection />
    </Fragment>
  );
}
