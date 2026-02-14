import { Fragment } from "react";

import Navbar from "./components/navbar";
import Features from "./sections/Features";
import HeroSectionPage from "./sections/Hero";
import TestimonialsPage from "./sections/Testimonals";

export default function LandingPage() {
  return (
    <Fragment>
      <Navbar />
      <HeroSectionPage />
      <Features />
      <TestimonialsPage />
    </Fragment>
  );
}
