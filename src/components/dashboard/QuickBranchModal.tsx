import React, { useState } from 'react';
import { Building, X, Plus, CheckCircle2, MapPin, Phone, User, ShieldCheck } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { Branch } from '../../types';

interface QuickBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEPARTAMENTOS_SV = [
  'San Salvador',
  'La Libertad',
  'Santa Ana',
  'San Miguel',
  'Sonsonate',
  'Usulután',
  'Ahuachapán',
  'La Paz',
  'Cabañas',
  'Chalatenango',
  'Cuscatlán',
  'Morazán',
  'San Vicente',
  'La Unión',
];

export const QuickBranchModal: React.FC<QuickBranchModalProps> = ({ isOpen, onClose }) => {
  const { createBranch, branches, currentCompany } = useERP();

  const nextCodeNum = branches.length + 1;
  const defaultCode = `SUC-${nextCodeNum < 10 ? `0${nextCodeNum}` : nextCodeNum}`;

  const [name, setName] = useState('');
  const [code, setCode] = useState(defaultCode);
  const [department, setDepartment] = useState('San Salvador');
  const [municipality, setMunicipality] = useState('San Salvador Centro');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('2200-0000');
  const [managerName, setManagerName] = useState('');
  const [isMain, setIsMain] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createBranch({
      name: name.startsWith('Sucursal') ? name : `Sucursal ${name}`,
      code: code.trim() || defaultCode,
      department,
      municipality,
      address: address.trim() || `${department}, El Salvador`,
      phone: phone.trim() || '2200-0000',
      managerName: managerName.trim() || 'Administrador de Sede',
      isMain,
      isActive: true,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-[8px] max-w-lg w-full p-6 border border-[#E5E7EB] dark:border-slate-800 shadow-none space-y-5">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Building className="w-5 h-5 text-[#6B7280]" />
            <div>
              <h2 className="text-[16px] font-semibold text-[#111827] dark:text-white">
                Agregar nueva sucursal
              </h2>
              <p className="text-[12px] text-[#6B7280] dark:text-slate-400">
                Se sincronizará automáticamente en el resumen y filtros.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[6px] text-[#6B7280] hover:text-[#111827] dark:hover:text-white hover:bg-[#F9FAFB] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[#111827] dark:text-slate-300 mb-1">
                Nombre de la sucursal *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Santa Ana Centro, Soyapango..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111827] dark:text-white text-[14px] outline-none focus:border-[#0F766E]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#111827] dark:text-slate-300 mb-1">
                Código de sucursal *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. SUC-04"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111827] dark:text-white text-[14px] font-mono outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[#111827] dark:text-slate-300 mb-1">
                Departamento (El Salvador)
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111827] dark:text-white text-[14px] outline-none focus:border-[#0F766E]"
              >
                {DEPARTAMENTOS_SV.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#111827] dark:text-slate-300 mb-1">
                Teléfono de contacto
              </label>
              <input
                type="text"
                placeholder="2200-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111827] dark:text-white text-[14px] outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#111827] dark:text-slate-300 mb-1">
              Dirección exacta
            </label>
            <input
              type="text"
              placeholder="Ej. Centro Comercial Galerías, Nivel 2, Local 45"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111827] dark:text-white text-[14px] outline-none focus:border-[#0F766E]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#111827] dark:text-slate-300 mb-1">
              Encargado / Administrador de sede
            </label>
            <input
              type="text"
              placeholder="Nombre del gerente de sucursal"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              className="w-full px-3 py-2 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111827] dark:text-white text-[14px] outline-none focus:border-[#0F766E]"
            />
          </div>

          <div className="flex items-center gap-2 text-[12px] text-[#6B7280]">
            <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
            <span>Al registrar esta sucursal, estará disponible de inmediato en filtros y facturación DTE.</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E3E8E6] dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#F9FAFB] text-[#111827] dark:text-slate-200 text-[14px] font-medium transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white text-[14px] font-medium flex items-center gap-1.5 transition cursor-pointer shadow-none"
            >
              <Plus className="w-4 h-4" />
              <span>Guardar sucursal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
