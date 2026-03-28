import { createConnection } from "typeorm";
import { Customer } from "../src/customers/entities/customer.entity";
import { Pet, PetGender, PetStatus } from "../src/pets/entities/pet.entity";
import { PetWeightHistory } from "../src/pets/entities/pet-weight-history.entity";
import { Store } from "../src/stores/entities/store.entity";
import { Order } from "../src/orders/entities/order.entity";
import { OrderDetail, ItemType } from "../src/orders/entities/order-detail.entity";
import { OrderStatus } from "../src/common/enum";

async function seedCustomers() {
  const connection = await createConnection({
    type: "postgres",
    url: process.env.POSTGRES_URI || "postgresql://postgres:password@localhost:5432/petcare_dev",
    entities: [__dirname + "/../src/**/*.entity.{ts,js}"],
    synchronize: false,
  });

  const customerRepo = connection.getRepository(Customer);
  const petRepo = connection.getRepository(Pet);
  const petWeightRepo = connection.getRepository(PetWeightHistory);
  const storeRepo = connection.getRepository(Store);
  const orderRepo = connection.getRepository(Order);
  const orderDetailRepo = connection.getRepository(OrderDetail);

  // ===== STORE =====
  const store = await storeRepo.findOne({ where: { id: 1 } });
  if (!store) throw new Error("Store not found");

  // ===== CUSTOMER =====
  let customer = await customerRepo.findOne({
    where: { phone: "0912345678" },
  });

  if (!customer) {
    customer = await customerRepo.save({
      full_name: "Nguyễn Văn A",
      phone: "0912345678",
      email: "vana@gmail.com",
      address: "HN",
      store_id: store.id,
    });
  }

  // ===== PET =====
  const petsData = [
    {
      name: "Bắp",
      gender: PetGender.MALE,
      breed: "Golden Retriever",
      dob: new Date("2023-05-15"),
      image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuD_gbL1uUvxpTeKreyItrNfXjzz58kID5PGAxPJ17DwMuc4FXDZ-7MnVR9TIoVrBR1TVE2NufVYX2zXli613uq9Hue3Fj-9EmGJx_CxdBxRA7NYEsOpltKIb_0jO7F6PgX53KlOJ3yWbanMxFVI84zuHoZETipXzJWD8smzkjfPnJj6aWyugRUg6p6wKu1bPvH5I_yrXuEEGjUAFzWvnJOsfp7qeI9dPzqPBfI5ZJTDhKzK0pDqKuoiUyltWJEHuREDaOMFuPphSpCz",
      status: PetStatus.ALIVE,
    },
    {
      name: "Mimi",
      gender: PetGender.FEMALE,
      breed: "Mèo Ba Tư",
      dob: new Date("2024-01-20"),
      image_url: "https://picsum.photos/id/200/200/200",
      status: PetStatus.ALIVE,
    },
  ];

  const pets: Pet[] = [];

  for (const p of petsData) {
    let pet = await petRepo.findOne({
      where: { name: p.name, customer_id: customer.customer_id },
    });

    if (!pet) {
      pet = await petRepo.save({
        ...p,
        pet_code: `PET-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        customer_id: customer.customer_id,
        store_id: store.id,
      });

      // ===== WEIGHT =====
      await petWeightRepo.save([
        {
          pet_id: pet.pet_id,
          weight: 3.2,
          recorded_date: new Date("2025-01-10"),
        },
        {
          pet_id: pet.pet_id,
          weight: 4.5,
          recorded_date: new Date("2025-02-15"),
        },
      ]);
    }

    pets.push(pet);
  }

  // ===== ORDER =====
  const order = await orderRepo.save({
    store_id: store.id,
    user_id: 1,
    customer_id: customer.customer_id,
    total_amount: 300000,
    status: OrderStatus.PAID,
    created_at: new Date(),
  });

  await orderDetailRepo.save({
    order_id: order.order_id,
    item_type: ItemType.SERVICE,
    quantity: 1,
    unit_price: 300000,
    original_cost: 250000, // 🔥 FIX
    subtotal: 300000,
    pet_id: pets[0].pet_id,
    notes: "Tiêm phòng",
  });

  console.log("✅ Seed done");
  await connection.close();
}

seedCustomers();