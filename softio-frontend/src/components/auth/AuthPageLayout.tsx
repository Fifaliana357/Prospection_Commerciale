import type { ReactNode } from "react"
import { ArrowUpRight, Sparkles } from "lucide-react"
import softioLogo from "../../assets/softio-fixed.png"

export default function AuthPageLayout({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eaf1f0] px-0 py-0 text-slate-800 sm:px-5 sm:py-6 lg:px-8">
      <div className="grid min-h-screen w-full overflow-hidden bg-white shadow-[0_24px_70px_rgba(14,70,72,0.12)] sm:min-h-0 sm:max-w-[1080px] sm:rounded-[24px] lg:min-h-[min(760px,calc(100dvh-3rem))] lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="relative flex min-h-[174px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#104f53] via-[#176d70] to-[#21898a] px-6 py-5 text-white sm:min-h-[190px] sm:px-8 lg:min-h-[660px] lg:px-12 lg:py-10">
          <div className="pointer-events-none absolute -bottom-36 -right-20 h-[350px] w-[350px] rounded-full border-[32px] border-white/[0.055] lg:-bottom-40 lg:-right-28 lg:h-[430px] lg:w-[430px] lg:border-[38px]" aria-hidden />
          <div className="pointer-events-none absolute -bottom-24 -right-8 h-[230px] w-[230px] rounded-full border-[23px] border-white/[0.055] lg:-bottom-24 lg:-right-12 lg:h-[280px] lg:w-[280px] lg:border-[28px]" aria-hidden />
          <div className="pointer-events-none absolute right-8 top-8 hidden h-24 w-24 rotate-45 rounded-2xl border border-white/10 lg:block" aria-hidden />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <img src={softioLogo} alt="Softio" className="h-9 w-auto max-w-[150px] object-contain object-left sm:h-10 lg:h-12 lg:max-w-[190px]" />
            <span className="rounded-full border border-white/20 bg-white/[0.08] px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/80 lg:hidden">
              Gestion commerciale
            </span>
          </div>
          <div className="relative z-10 mt-6 flex items-end justify-between gap-3 lg:mt-0 lg:items-center">
            <div className="max-w-[360px]">
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ffd166] lg:text-xs">
                <Sparkles size={13} /> Votre activité, en mouvement
              </p>
              <h1 className="font-display text-[1.7rem] font-bold leading-[1.06] tracking-tight text-white sm:text-3xl lg:text-[3.25rem]">
                Faites grandir
                <span className="block text-[#ffd166]">vos relations.</span>
              </h1>
              <p className="mt-3 hidden max-w-xs text-sm leading-relaxed text-white/70 lg:block">
                De la première prise de contact à la vente, avancez avec une vision claire de chaque opportunité.
              </p>
              <span className="mt-4 block h-1 w-11 rounded-full bg-[#ffd166] lg:mt-6 lg:w-14" />
            </div>
            <div className="relative mb-1 hidden w-[148px] shrink-0 rounded-2xl border border-white/15 bg-white/[0.09] p-3 shadow-xl backdrop-blur-sm sm:block lg:mb-0 lg:w-[178px] lg:p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[9px] font-medium text-white/65 lg:text-[10px]">Opportunités</p>
                  <p className="mt-1 text-lg font-bold text-white lg:text-2xl">+<span className="text-[#ffd166]">24</span></p>
                </div>
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#ffd166]/15 text-[#ffd166]"><ArrowUpRight size={15} /></span>
              </div>
              <svg viewBox="0 0 160 42" className="mt-2 h-8 w-full overflow-visible lg:h-10" aria-label="Illustration de croissance">
                <defs>
                  <linearGradient id="auth-chart-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#ffd166" stopOpacity=".35" />
                    <stop offset="100%" stopColor="#ffd166" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 34 C18 30 18 26 34 29 S54 28 68 20 S90 26 105 15 S126 19 140 8 S151 9 160 3 V42 H0Z" fill="url(#auth-chart-fill)" />
                <path d="M0 34 C18 30 18 26 34 29 S54 28 68 20 S90 26 105 15 S126 19 140 8 S151 9 160 3" fill="none" stroke="#ffd166" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="160" cy="3" r="3" fill="#fff" />
              </svg>
              <div className="mt-1 flex items-center gap-1.5 text-[8px] text-white/55 lg:text-[9px]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ffd166]" /> Suivi en temps réel
              </div>
            </div>
          </div>
          <div className="relative z-10 mt-4 hidden items-center justify-between text-[10px] text-white/55 lg:flex">
            <span>Softio · Gestion commerciale</span>
            <span>Prospection · Ventes · Équipe</span>
          </div>
        </aside>
        <main className="flex items-center justify-center px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
          <section className="w-full max-w-[420px]">
            <h2 className="font-display text-[1.8rem] font-bold tracking-tight text-[#124f55]">{title}</h2>
            <span className="mt-2 block h-[3px] w-8 rounded-full bg-[#ffc45c]" />
            <p className="mt-3 text-sm leading-relaxed text-slate-500">{description}</p>
            {children}
          </section>
        </main>
      </div>
    </div>
  )
}
