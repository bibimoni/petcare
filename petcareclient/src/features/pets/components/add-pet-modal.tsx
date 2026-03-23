import { X, Save, Upload, Trash2, PawPrint } from "lucide-react";
import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function AddPetModal({ open, onClose }: Props) {
  const [pet, setPet] = useState({
    name: "",
    breed: "",
    birth: "",
    gender: "",
    notes: "",
    image: "",
  });
  const initialPet = {
    name: "",
    breed: "",
    birth: "",
    gender: "",
    notes: "",
    image: "",
  };

  const resetForm = () => {
    setPet(initialPet);
    setErrors({});
  };

  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  if (!open) return null;

  // validate form
  const validate = () => {
    const newErrors: any = {};
    if (!pet.name.trim()) newErrors.name = "Vui lòng nhập tên thú cưng";
    if (!pet.breed.trim()) newErrors.breed = "Vui lòng nhập giống loài";
    if (!pet.gender) newErrors.gender = "Vui lòng chọn giới tính";
    if (!pet.birth) newErrors.birth = "Vui lòng chọn ngày sinh";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // submit
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      console.log("Pet saved:", pet);
      setLoading(false);
      onClose();
      alert("Thêm thú cưng thành công");
    }, 800);
  };

  // convert image -> url
  const handleImage = (file: File) => {
    const url = URL.createObjectURL(file);
    setPet({ ...pet, image: url });
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
                        setPet({ ...pet, image: "" });
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
              className="px-5 py-2.5 bg-orange-400 text-white rounded-xl font-semibold flex items-center gap-2"
            >
              <Save size={18} />
              Lưu thông tin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
