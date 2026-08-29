import React from "react";
import { MessageCircle, Mail } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer
      className="flex-shrink-0 relative z-10 px-4 py-3.5"
      style={{
        background: "linear-gradient(155deg, #146c3a, #01411c 75%)",
        boxShadow: "0 -4px 12px -4px rgba(0,0,0,0.15)",
      }}
    >
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <p className="text-[11px] text-white font-bold">Developed / Made by: A.K.A Tech</p>
          <p className="text-[10px] text-emerald-100/80 mt-0.5">(An Arshad Khan Aastik's Company)</p>
        </div>

        <div className="flex flex-col items-center gap-1.5 mt-2.5">
          <a
            href="https://wa.me/923149891182"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] text-white font-medium px-3 py-1 rounded-full max-w-full hover:bg-white/20 transition-colors"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            <MessageCircle className="w-3 h-3 flex-shrink-0" />
            <span className="whitespace-nowrap">+92 314 9891182</span>
          </a>
          <a
            href="mailto:arshadlaidbeer@gmail.com"
            className="flex items-center gap-1.5 text-[10px] text-white font-medium px-3 py-1 rounded-full max-w-full hover:bg-white/20 transition-colors"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            <Mail className="w-3 h-3 flex-shrink-0" />
            <span className="whitespace-nowrap">arshadlaidbeer@gmail.com</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
