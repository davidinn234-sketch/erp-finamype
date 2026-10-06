import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Globe, X, FileText, ExternalLink, ChevronRight } from 'lucide-react';

interface SecurityAndPrivacyBannerProps {
  onOpenSecurityModal: () => void;
}

export const SecurityAndPrivacyBanner: React.FC<SecurityAndPrivacyBannerProps> = ({
  onOpenSecurityModal,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user already acknowledged the banner in this session
    const acknowledged = sessionStorage.getItem('finapyme_security_notice_acknowledged');
    if (!acknowledged) {
      // Show banner after brief delay
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcknowledge = () => {
    sessionStorage.setItem('finapyme_security_notice_acknowledged', 'true');
    setIsDismissed(true);
    setTimeout(() => setIsVisible(false), 200);
  };

  if (!isVisible || isDismissed) {
    // Discreet floating security pill in the bottom-left corner
    return (
      <div className="fixed bottom-3 left-4 z-40 hidden sm:flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenSecurityModal}
          className="px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 text-[11px] font-medium text-[#0F766E] dark:text-teal-300 shadow-xs hover:shadow transition flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
          title="Ver Certificado de Seguridad, Auditoría IP y Términos Legales"
        >
          <span className="flex h-1.5 w-1.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
          <span>SSL 256-bit • Auditoría IP & Privacidad</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-slide-up">
      <div className="p-4 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 shadow-xl text-slate-800 dark:text-slate-100 flex flex-col gap-2.5 backdrop-blur-md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[4px] bg-teal-50 dark:bg-teal-950/70 text-[#0F766E] dark:text-teal-300 flex items-center justify-center shrink-0 border border-teal-200 dark:border-teal-800">
              <ShieldCheck className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h4 className="text-[12px] font-semibold text-[#111827] dark:text-white leading-tight">
                Aviso de Ciberseguridad & Auditoría IP
              </h4>
              <p className="text-[10px] text-[#059669] font-medium mt-0.5">
                Conexión Cifrada SSL/TLS • Registro de Sesión Antifraude
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAcknowledge}
            className="text-[#6B7280] hover:text-[#111827] dark:hover:text-white p-1 rounded transition cursor-pointer"
            title="Cerrar aviso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-[11px] text-[#6B7280] dark:text-slate-400 leading-relaxed">
          Para garantizar la máxima protección contra accesos no autorizados, ataques de fuerza bruta y fraudes financieros, este sistema registra de forma confidencial la <strong className="text-[#111827] dark:text-slate-200">dirección IP</strong> y marcas de tiempo de las transacciones empresariales, con pleno respaldo legal en la Ley de Comercio Electrónico de El Salvador.
        </p>

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E3E8E6] dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              onOpenSecurityModal();
              handleAcknowledge();
            }}
            className="text-[11px] font-medium text-[#0F766E] dark:text-teal-300 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Ver Términos & Blindaje Legal</span>
            <ChevronRight className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={handleAcknowledge}
            className="px-3 py-1 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white text-[11px] font-medium transition cursor-pointer shadow-none"
          >
            Entendido y Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
