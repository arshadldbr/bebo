import React from "react";
import { MessageCircle, Mail } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-pk-green-800 bg-pk-green-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col items-center gap-2 text-center">
        <p className="text-xs text-white font-semibold">Developed / Made by: A.K.A Tech</p>
        <p className="text-[11px] text-pk-green-100">(An Arshad Khan Aastik's Company)</p>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-1.5">
          <a
            href="https://wa.me/923149891182"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[11px] text-white/90 hover:text-white transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            +92 314 9891182
          </a>
          <a
            href="mailto:arshadlaidbeer@gmail.com"
            className="flex items-center gap-1.5 text-[11px] text-white/90 hover:text-white transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            arshadlaidbeer@gmail.com
          </a>
        </div>
      </div>
    </footer>
  );
};
