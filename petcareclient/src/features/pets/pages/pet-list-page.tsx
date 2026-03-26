import { useState, useEffect } from "react";
import Navbar from "../components/navbar";
import { Footer } from "../../landing-page/components/footer";
import Breadcrumb from "../components/break-crump";
import PetStats from "../components/pet-stats";
import PetFilters from "../components/pet-filter";
import PetHeader from "../components/pet-header"; 
import PetList from "../components/pet-list";
import { PetService } from "@/lib/pets"; // Import service mới
import { handleApiError } from "@/lib/api";

export default function PetListPage() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoading(true);
        const res = await PetService.getAll();
        
        // Giống như Customer, res thường là mảng trực tiếp do Interceptor trả về
        setPets(Array.isArray(res) ? res : res.data || []);
      } catch (err) {
        handleApiError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, []);

  if (loading) return <div className="p-10 text-center">Đang tải danh sách thú cưng...</div>;

  return (
    <>
      <Navbar />
      <div className="bg-[#faf7f5] min-h-screen p-8">
        <Breadcrumb />
        <PetHeader />

        {/* Truyền data thật từ state 'pets' vào các component */}
        <PetStats pets={pets} />
        <PetFilters />
        <PetList pets={pets} />
      </div>
      <Footer />
    </>
  );
}