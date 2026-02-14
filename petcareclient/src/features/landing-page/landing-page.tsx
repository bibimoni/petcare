import { Fragment } from "react";

import Navbar from "./components/navbar";
import HeroSectionPage from "./sections/hero";

export default function LandingPage() {
  return (
    <Fragment>
      <Navbar />
      <HeroSectionPage />
    </Fragment>
  );
}
