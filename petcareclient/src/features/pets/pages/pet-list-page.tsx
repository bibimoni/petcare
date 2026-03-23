import { Footer } from "../../landing-page/components/footer";
import Breadcrumb from "../components/break-crump";
import Navbar from "../components/navbar";
import PetFilters from "../components/pet-filter";
import PetHeader from "../components/pet-header";
import PetList from "../components/pet-list";
import PetStats from "../components/pet-stats";
import { mockPets } from "../data/mockPet";

export default function PetListPage() {
  return (
    <>
      <Navbar />

      <div className="bg-[#faf7f5] min-h-screen p-8">
        <Breadcrumb />
        <PetHeader />

        <PetStats pets={mockPets} />

        <PetFilters />

        <PetList pets={mockPets} />
      </div>

      <Footer />
    </>
  );
}
