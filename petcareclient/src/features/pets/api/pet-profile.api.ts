import {
  PetService,
  type PetWithHistory,
  type ServiceHistory,
  type PetWeightHistory,
} from "@/lib/pets";

export type PetProfileData = {
  pet: PetWithHistory;
  services: ServiceHistory[];
  weights: PetWeightHistory[];
};

export const getPetProfileData = async (
  petId: number,
): Promise<PetProfileData> => {
  const [pet, weights] = await Promise.all([
    PetService.getPetDetails(petId),
    PetService.getPetWeightHistory(petId, 20),
  ]);

  return {
    pet,
    weights,
    services: [],
  };
};
