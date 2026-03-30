import { X, Save, Upload, Trash2, PawPrint } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { handleApiError } from "@/lib/api";
import { PetService, type PetWithHistory } from "@/lib/pets";

type Props = {
  open: boolean;
  onClose: () => void;
  pet: PetWithHistory | null;
  onUpdated?: (updatedPet: PetWithHistory) => Promise<void> | void;
};

export default function EditPetModal({ open, onClose, pet, onUpdated }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: "",
    breed: "",
    birth: "",
    gender: "",
    notes: "",
    image: "",
    status: "ALIVE",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  useEffect(() => {
    if (pet && open) {
      setForm({
        name: pet.name || "",
        breed: pet.breed || "",
        birth: pet.dob ? pet.dob.slice(0, 10) : "",
        gender: pet.gender || "",
        notes: pet.notes || "",
        image: (pet as any).avatar_url || pet.image_url || "",
        status: pet.status || "ALIVE",
      });
      setSelectedFile(null);
      setErrors({});
    }
  }, [pet, open]);

  if (!open || !pet) return null;

  const validate = () => {
    const newErrors: any = {};
    if (!form.name.trim()) newErrors.name = "Vui lòng nhập tên thú cưng";
    if (!form.breed.trim()) newErrors.breed = "Vui lòng nhập giống loài";
    if (!form.gender) newErrors.gender = "Vui lòng chọn giới tính";
    if (!form.birth) newErrors.birth = "Vui lòng chọn ngày sinh";
    if (!form.image.trim() && !selectedFile) {
      newErrors.image = "Vui lòng tải ảnh thú cưng";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImage = (file: File) => {
    const url = URL.createObjectURL(file);
    if (form.image.startsWith("blob:")) {
      URL.revokeObjectURL(form.image);
    }
    setSelectedFile(file);
    setForm({ ...form, image: url });
    setErrors((prev: any) => ({ ...prev, image: undefined }));
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImage(file);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      const updateData = {
        name: form.name,
        breed: form.breed,
        dob: form.birth,
        gender: form.gender as "MALE" | "FEMALE",
        notes: form.notes,
        status: form.status as "ALIVE" | "DECEASED",
      };
      const petId = pet.id ?? (pet as any).pet_id;
      if (!petId) {
        toast.error("Không tìm thấy ID thú cưng để cập nhật!");
        setLoading(false);
        return;
      }
      const updated = await PetService.updatePet(petId, updateData);
      if (selectedFile) {
        await PetService.uploadAvatar(petId, selectedFile);
      }
      toast.success("Cập nhật thú cưng thành công!");
      onClose();
      if (onUpdated) await onUpdated(updated);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      {/* modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border p-6 max-h-[85vh] overflow-y-auto">
        {/* header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-xl text-orange-500">
              <PawPrint size={22} />
            </div>
            <h2 className="text-2xl font-bold">Cập nhật Pet</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-50 rounded-lg"
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* row 1 */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="font-semibold text-sm">Tên thú cưng *</label>
              <input
                className="w-full mt-2 px-3 py-2.5 rounded-xl border bg-gray-50"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>
            <div>
              <label className="font-semibold text-sm">Giống loài *</label>
              <input
                className="w-full mt-2 px-3 py-2.5 rounded-xl border bg-gray-50"
                placeholder="VD: Golden Retriever"
                value={form.breed}
                onChange={(e) => setForm({ ...form, breed: e.target.value })}
              />
              {errors.breed && (
                <p className="text-red-500 text-xs mt-1">{errors.breed}</p>
              )}
            </div>
          </div>
          {/* row 2 */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="font-semibold text-sm">Ngày sinh *</label>
                <input
                  type="date"
                  className="w-full mt-2 px-3 py-2.5 rounded-xl border bg-gray-50"
                  value={form.birth}
                  onChange={(e) => setForm({ ...form, birth: e.target.value })}
                />
                {errors.birth && (
                  <p className="text-red-500 text-xs mt-1">{errors.birth}</p>
                )}
              </div>
              <div>
                <label className="font-semibold text-sm">Giới tính *</label>
                <select
                  className="w-full mt-2 px-3 py-2.5 rounded-xl border bg-gray-50"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="MALE">Đực</option>
                  <option value="FEMALE">Cái</option>
                </select>
                {errors.gender && (
                  <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
                )}
              </div>
              <div>
                <label className="font-semibold text-sm">Ghi chú</label>
                <textarea
                  rows={3}
                  className="w-full mt-2 px-3 py-2.5 rounded-xl border bg-gray-50"
                  placeholder="Thông tin thêm về thú cưng..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div>
                <label className="font-semibold text-sm">Trạng thái</label>
                <select
                  className="w-full mt-2 px-3 py-2.5 rounded-xl border bg-gray-50"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="ALIVE">Khoẻ mạnh</option>
                  <option value="DECEASED">Bị bệnh</option>
                </select>
              </div>
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
                {form.image || pet?.image_url ? (
                  <>
                    <img
                      src={form.image || pet?.image_url}
                      className="absolute inset-0 w-full h-full object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        if (form.image && form.image.startsWith("blob:")) {
                          URL.revokeObjectURL(form.image);
                        }
                        setSelectedFile(null);
                        setForm({
                          ...form,
                          image: "",
                        });
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
              onClick={onClose}
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
