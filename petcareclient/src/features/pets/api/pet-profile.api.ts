import {
  PetService,
  type PetWithHistory,
  type PetWeightHistory,
  type ServiceHistory,
} from "@/lib/pets";

export type PetProfileData = {
  pet: PetWithHistory;
  weights: PetWeightHistory[];
  services: ServiceHistory[];
};

export const getPetProfileData = async (
  petId: number,
): Promise<PetProfileData> => {
  const [pet, weights, services] = await Promise.all([
    PetService.getPetDetails(petId),
    PetService.getPetWeightHistory(petId, 20),
    PetService.getPetServiceHistory(petId),
  ]);

  return {
    pet,
    weights,
    services,
  };
};
