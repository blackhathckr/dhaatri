import Image from "next/image";
import Link from "next/link";

/**
 * Two panels: the pitch on the left, the form on the right. The left panel
 * carries a real scene rather than a flat colour block — the product is about
 * land, and the first screen should look like it.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden overflow-hidden lg:flex lg:w-[46%]">
        <Image
          src="/scenes/forest-banner.png"
          alt=""
          fill
          sizes="46vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B2419]/85 via-[#0B2419]/75 to-[#0B2419]/92" />

        <div className="relative flex w-full flex-col justify-between p-12">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/brand/logo-mark.png" alt="" width={34} height={34} />
            <span className="font-onest text-[19px] font-semibold tracking-[-0.5px] text-white">
              Dhaatri
            </span>
          </Link>

          <div className="max-w-[420px]">
            <h1 className="font-onest text-[40px] font-semibold leading-[1.08] tracking-[-1.8px] text-white">
              Plant a tree.
              <br />
              <span className="font-playfair italic font-semibold text-[#95D5B2]">
                Prove
              </span>{" "}
              it&apos;s still alive.
            </h1>
            <p className="mt-5 text-[16px] leading-[27px] text-white/55">
              A national platform where every plantation is assessed, planned, monitored
              and measured — and every rupee is publicly traceable.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-6">
              {[
                { v: "1,247+", l: "trees planted" },
                { v: "93%", l: "verified survival" },
                { v: "48t", l: "CO₂ per year" },
              ].map((s) => (
                <div key={s.l}>
                  <p className="font-onest text-[26px] font-semibold leading-none tracking-[-1px] text-white">
                    {s.v}
                  </p>
                  <p className="mt-1.5 text-[13px] text-white/45">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          <Image
            src="/mascot/sprout-waving.png"
            alt=""
            width={110}
            height={110}
            className="drop-shadow-[0_14px_36px_rgba(0,0,0,0.4)]"
          />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-[#F5F1EB] p-6">
        <div className="w-full max-w-[400px]">
          <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <Image src="/brand/logo-mark.png" alt="" width={30} height={30} />
            <span className="font-onest text-[17px] font-semibold tracking-[-0.4px] text-[#1B4332]">
              Dhaatri
            </span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
