export default function Footer() {
  return (
    <footer className="bg-[#FAFAF8] text-[#0B0B0B] border-t border-[#E3E3E0]">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div>
          <span className="font-serif text-lg">nexep</span>
          <p className="text-xs text-[#686863] mt-0.5">ABES Engineering College</p>
        </div>

        <div className="text-xs text-[#686863] flex flex-col sm:flex-row items-center gap-1 sm:gap-4">
          <span>Akhil Singh · 2400320100125</span>
          <span className="hidden sm:inline">•</span>
          <span>Aditya Choudhary · 2400320100074</span>
        </div>

        <p className="text-xs text-[#686863]">
          © 2026 Nexep. Built for freshers and the people who hire them.
        </p>
      </div>
    </footer>
  );
}
