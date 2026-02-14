import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="section-padding-y" aria-labelledby="cta-heading">
      <div className="container-padding-x container mx-auto max-w-5xl px-4 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#3d2e28] via-[#2d1f1a] to-[#1a1410] px-8 py-16 md:px-12 md:py-20">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 md:gap-10">
            {/* Section Title */}
            <div className="flex flex-col items-center text-center gap-4 md:gap-6">
              {/* Main Heading */}
              <h2
                id="cta"
                className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight"
              >
                Sẵn sàng nâng tầm cửa hàng của bạn?
              </h2>
              {/* Description */}
              <p className="text-base md:text-lg text-white/70 max-w-2xl">
                Trải nghiệm miễn phí 14 ngày trọn bộ tính năng. Không cần thẻ
                tín dụng. Hủy bất kỳ lúc nào.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="text-gray-900 font-bold hover:bg-white/90 px-6 md:px-8 w-full sm:w-auto cursor-pointer"
                aria-label="Get started with our service"
              >
                Dùng thử miễn phí
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-white/30 font-bold text-background bg-white/10 hover:bg-white/20 hover:text-background cursor-pointer px-6 md:px-8 w-full sm:w-auto"
                aria-label="Get advice"
              >
                Liên hệ tư vấn
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
