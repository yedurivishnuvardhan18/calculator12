import instagramLogo from "@/assets/instagram-logo.jpg";
import whatsappLogo from "@/assets/whatsapp-logo.jpg";

export function Footer() {
  return (
    <footer className="w-full bg-[hsl(240,15%,6%)] border-t border-[hsl(240,12%,14%)] py-4">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="TeamDino logo" className="w-7 h-7 rounded-full" />
          <span className="text-white font-display font-semibold text-sm">TeamDino</span>
        </div>

        <p className="text-[hsl(220,10%,55%)] text-xs italic text-center">
          Copyright © 2026 TeamDino | All rights reserved
        </p>

        <div className="flex items-center gap-3">
          <a
            href="https://www.instagram.com/yedurivishnuvardhan"


            className="transition-transform duration-200 hover:scale-110"
          >
            <img
              src={instagramLogo}
              alt="Instagram"
              className="w-8 h-8 rounded-lg object-cover"
            />
          </a>
          <a
            href="https://chat.whatsapp.com/IfNt62pbL79HOGVttxoMfv"


            className="transition-transform duration-200 hover:scale-110"
          >
            <img
              src={whatsappLogo}
              alt="WhatsApp"
              className="w-8 h-8 rounded-lg object-cover"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
