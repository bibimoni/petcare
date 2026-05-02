import { X, Save, Upload, Trash2, PawPrint } from "lucide-react";
import { useState, useEffect } from "react";

import { CustomerService } from "@/lib/customers";
import { PetService } from "@/lib/pets";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => Promise<void> | void;
};

type ApiCustomer = {
  full_name: string;
  customer_id: number;
};

const normalizeCustomers = (payload: unknown): ApiCustomer[] => {
  if (Array.isArray(payload)) {
    return payload as ApiCustomer[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const responseObject = payload as Record<string, unknown>;

  if (Array.isArray(responseObject.data)) {
    return responseObject.data as ApiCustomer[];
  }

  return Object.values(responseObject).filter(
    (item): item is ApiCustomer =>
      !!item && typeof item === "object" && "customer_id" in item,
  );
};

export default function AddPetModal({ open, onClose, onCreated }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pet, setPet] = useState({
    customerId: "",
    name: "",
    breed: "",
    birth: "",
    gender: "",
    notes: "",
    avatarPublicId: "",
    image: "",
    status: "ALIVE",
  });

  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [loading, setLoading] = useState(false);

  const initialPet = {
    customerId: "",
    name: "",
    breed: "",
    birth: "",
    gender: "",
    notes: "",
    avatarPublicId: "",
    image: "",
    status: "ALIVE",
  };

  const resetForm = () => {
    if (pet.image.startsWith("blob:")) {
      URL.revokeObjectURL(pet.image);
    }

    setSelectedFile(null);
    setPet(initialPet);
    setErrors({});
  };

  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (!open) {
      return;
    }

    const fetchCustomers = async () => {
      try {
        const customerRes = await CustomerService.getAll();
        setCustomers(normalizeCustomers(customerRes));
      } catch (err) {
        // API error is handled globally
      }
    };

    void fetchCustomers();
  }, [open]);

  if (!open) return null;

  // validate form
  const validate = () => {
    const newErrors: any = {};
    if (!pet.customerId) newErrors.customerId = "Vui lòng chọn chủ sở hữu";
    if (!pet.name.trim()) newErrors.name = "Vui lòng nhập tên thú cưng";
    if (!pet.breed.trim()) newErrors.breed = "Vui lòng nhập giống loài";
    if (!pet.gender) newErrors.gender = "Vui lòng chọn giới tính";
    if (!pet.birth) newErrors.birth = "Vui lòng chọn ngày sinh";
    if (!selectedFile || !pet.image.trim()) {
      newErrors.image = "Vui lòng tải ảnh thú cưng";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const extractPetId = (payload: unknown): number | null => {
    if (!payload || typeof payload !== "object") {
      return null;
    }

    const responseObject = payload as Record<string, unknown>;
    const directPetId = Number(responseObject.pet_id ?? responseObject.id);

    if (Number.isFinite(directPetId)) {
      return directPetId;
    }

    if (responseObject.data && typeof responseObject.data === "object") {
      const dataObject = responseObject.data as Record<string, unknown>;
      const nestedPetId = Number(dataObject.pet_id ?? dataObject.id);
      if (Number.isFinite(nestedPetId)) {
        return nestedPetId;
      }
    }

    return null;
  };

  // submit
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!validate()) return;
    if (!selectedFile) return;

    try {
      setLoading(true);

      const createdPet = await PetService.createByCustomer(
        Number(pet.customerId),
        {
          breed: pet.breed,
          dob: pet.birth,
          gender: pet.gender as "MALE" | "FEMALE",
          name: pet.name,
          notes: pet.notes,
          status: pet.status,
        },
      );

      const petId = extractPetId(createdPet);
      if (!petId) {
        throw new Error("Không lấy được pet_id sau khi tạo pet");
      }

      await PetService.uploadAvatar(petId, selectedFile);

      resetForm();
      onClose();
      alert("Thêm thú cưng thành công");
      await onCreated?.();
    } catch (err) {
      // API error is handled globally
    } finally {
      setLoading(false);
    }
  };

  // convert image -> url
  const handleImage = (file: File) => {
    const url = URL.createObjectURL(file);
    const autoPublicId = `blob_${file.name}_${file.size}_${file.lastModified}`
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_.-]/g, "");

    if (pet.image.startsWith("blob:")) {
      URL.revokeObjectURL(pet.image);
    }

    setSelectedFile(file);

    setPet({
      ...pet,
      image: url,
      avatarPublicId: autoPublicId,
    });
    setErrors((prev: any) => ({ ...prev, image: undefined }));
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImage(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
      // onClick={() =>{
      //   resetForm();
      //   onClose();
      // }}
      />

      {/* modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border p-6 max-h-[85vh] overflow-y-auto">
        {/* header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-xl text-orange-500">
              <PawPrint size={22} />
            </div>

            <h2 className="text-2xl font-bold">Thêm Pet Mới</h2>
          </div>

          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-2 hover:bg-red-50 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* row 1 */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="font-semibold text-sm">Chủ sở hữu *</label>

              <select
                className="w-full mt-2 px-3 py-2.5 rounded-xl border bg-gray-50"
                value={pet.customerId}
                onChange={(e) => setPet({ ...pet, customerId: e.target.value })}
              >
                <option value="">Chọn khách hàng</option>
                {customers.map((customer) => (
                  <option
                    key={customer.customer_id}
                    value={customer.customer_id}
                  >
                    {customer.full_name}
                  </option>
                ))}
              </select>

              {errors.customerId && (
                <p className="text-red-500 text-xs mt-1">{errors.customerId}</p>
              )}
            </div>

            {/* name */}
            <div>
              <label className="font-semibold text-sm">Tên thú cưng *</label>

              <input
                className="w-full mt-2 px-3 py-2.5 rounded-xl border bg-gray-50"
                value={pet.name}
                onChange={(e) => setPet({ ...pet, name: e.target.value })}
              />

              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* breed */}
            <div>
              <label className="font-semibold text-sm">Giống loài *</label>

              <input
                className="w-full mt-2 px-3 py-2.5 rounded-xl border bg-gray-50"
                placeholder="VD: Golden Retriever"
                value={pet.breed}
                onChange={(e) => setPet({ ...pet, breed: e.target.value })}
              />

              {errors.breed && (
                <p className="text-red-500 text-xs mt-1">{errors.breed}</p>
              )}
            </div>
          </div>

          {/* row 2 */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* birth */}
              <div>
                <label className="font-semibold text-sm">Ngày sinh *</label>

                <input
                  type="date"
                  className="w-full mt-2 px-3 py-2.5 rounded-xl border bg-gray-50"
                  value={pet.birth}
                  onChange={(e) => setPet({ ...pet, birth: e.target.value })}
                />

                {errors.birth && (
                  <p className="text-red-500 text-xs mt-1">{errors.birth}</p>
                )}
              </div>

              {/* gender */}
              <div>
                <label className="font-semibold text-sm">Giới tính *</label>

                <select
                  className="w-full mt-2 px-3 py-2.5 rounded-xl border bg-gray-50"
                  value={pet.gender}
                  onChange={(e) => setPet({ ...pet, gender: e.target.value })}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="MALE">Đực</option>
                  <option value="FEMALE">Cái</option>
                </select>

                {errors.gender && (
                  <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
                )}
              </div>

              {/* notes */}
              <div>
                <label className="font-semibold text-sm">Ghi chú</label>

                <textarea
                  rows={3}
                  className="w-full mt-2 px-3 py-2.5 rounded-xl border bg-gray-50"
                  placeholder="Thông tin thêm về thú cưng..."
                  value={pet.notes}
                  onChange={(e) => setPet({ ...pet, notes: e.target.value })}
                />
              </div>

              <div>
                <label className="font-semibold text-sm">Trạng thái</label>

                <select
                  className="w-full mt-2 px-3 py-2.5 rounded-xl border bg-gray-50"
                  value={pet.status}
                  onChange={(e) => setPet({ ...pet, status: e.target.value })}
                >
                  <option value="ALIVE">Khoẻ mạnh</option>
                  <option value="DECEASED">Bị bệnh</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-sm">
                  Avatar Public ID
                </label>

                <input
                  className="w-full mt-2 px-3 py-2.5 rounded-xl border bg-gray-50"
                  value={pet.avatarPublicId}
                  onChange={(e) =>
                    setPet({ ...pet, avatarPublicId: e.target.value })
                  }
                  placeholder="avatar_public_id_12345"
                />
              </div>

              {/* info */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5 text-sm text-gray-600">
                Vui lòng kiểm tra kỹ thông tin trước khi lưu.
              </div>
            </div>
            {/* upload */}
            <div className="flex flex-col">
              <label className="font-semibold text-sm mb-2">
                Hình ảnh thú cưng
              </label>

              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="relative h-[220px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-5 cursor-pointer hover:bg-orange-50 transition"
              >
                {pet.image ? (
                  <>
                    <img
                      src={pet.image}
                      className="absolute inset-0 w-full h-full object-cover rounded-xl"
                    />

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        if (pet.image.startsWith("blob:")) {
                          URL.revokeObjectURL(pet.image);
                        }
                        setSelectedFile(null);
                        setPet({ ...pet, image: "", avatarPublicId: "" });
                      }}
                      className="absolute top-2 right-2 bg-white p-1 rounded-lg shadow hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <Upload size={36} className="text-orange-400 mb-3" />

                    <p className="font-semibold">Chọn ảnh thú cưng</p>

                    <p className="text-sm text-gray-500">
                      Kéo thả hoặc click để tải ảnh
                    </p>
                  </>
                )}

                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleImage(e.target.files![0])}
                />
              </label>

              {errors.image && (
                <p className="text-red-500 text-xs mt-1">{errors.image}</p>
              )}
            </div>
          </div>

          {/* buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="px-6 py-3 bg-gray-100 rounded-xl font-semibold"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-orange-400 text-white rounded-xl font-semibold flex items-center gap-2"
            >
              <Save size={18} />
              {loading ? "Đang lưu..." : "Lưu thông tin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
