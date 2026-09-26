import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { CandidateFolder, CandidateApplicant } from '../../types';
import { formatCurrencyUSD } from '../../utils/salvadoranTax';
import {
  Folder,
  FolderPlus,
  FolderOpen,
  UserPlus,
  Star,
  FileText,
  Phone,
  Mail,
  DollarSign,
  Briefcase,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Trash2,
  Search,
  Sliders,
  ChevronRight,
  UserCheck,
  X,
  Upload,
} from 'lucide-react';

export const CandidateRecruitmentTab: React.FC = () => {
  const {
    candidateFolders,
    candidateApplicants,
    createCandidateFolder,
    deleteCandidateFolder,
    createCandidateApplicant,
    updateCandidateApplicant,
    deleteCandidateApplicant,
    hireCandidateAsEmployee,
  } = useERP();

  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isNewApplicantModalOpen, setIsNewApplicantModalOpen] = useState(false);
  const [selectedApplicantForDetail, setSelectedApplicantForDetail] = useState<CandidateApplicant | null>(null);

  // Forms
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDept, setNewFolderDept] = useState('Operaciones');
  const [newFolderDesc, setNewFolderDesc] = useState('');

  const [applicantForm, setApplicantForm] = useState({
    folderId: candidateFolders[0]?.id || '',
    fullName: '',
    email: '',
    phone: '',
    expectedSalary: 550.0,
    experienceYears: 2,
    educationLevel: 'Técnico Universitario',
    status: 'recibido' as CandidateApplicant['status'],
    rating: 5,
    notes: '',
    cvFileName: '',
    cvSummaryOrUrl: '',
    skills: 'Excel, Atención al Cliente, Puntualidad',
  });

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const created = createCandidateFolder({
      name: newFolderName.trim(),
      department: newFolderDept,
      description: newFolderDesc.trim(),
    });
    setNewFolderName('');
    setNewFolderDesc('');
    setIsNewFolderModalOpen(false);
    setSelectedFolderId(created.id);
  };

  const handleCreateApplicant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantForm.fullName.trim() || !applicantForm.folderId) return;

    const folder = candidateFolders.find((f) => f.id === applicantForm.folderId);
    const skillsArray = applicantForm.skills
      ? applicantForm.skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    createCandidateApplicant({
      folderId: applicantForm.folderId,
      folderName: folder ? folder.name : 'General',
      fullName: applicantForm.fullName.trim(),
      email: applicantForm.email.trim(),
      phone: applicantForm.phone.trim(),
      appliedDate: new Date().toISOString().split('T')[0],
      expectedSalary: applicantForm.expectedSalary,
      experienceYears: applicantForm.experienceYears,
      educationLevel: applicantForm.educationLevel,
      status: applicantForm.status,
      rating: applicantForm.rating,
      notes: applicantForm.notes.trim(),
      cvFileName: applicantForm.cvFileName.trim() || `CV_${applicantForm.fullName.replace(/\s+/g, '_')}.pdf`,
      cvSummaryOrUrl: applicantForm.cvSummaryOrUrl.trim(),
      skills: skillsArray,
    });

    setIsNewApplicantModalOpen(false);
    setApplicantForm({
      folderId: candidateFolders[0]?.id || '',
      fullName: '',
      email: '',
      phone: '',
      expectedSalary: 550.0,
      experienceYears: 2,
      educationLevel: 'Técnico Universitario',
      status: 'recibido',
      rating: 5,
      notes: '',
      cvFileName: '',
      cvSummaryOrUrl: '',
      skills: 'Excel, Atención al Cliente, Puntualidad',
    });
  };

  const filteredApplicants = candidateApplicants.filter((a) => {
    const matchesFolder = selectedFolderId === 'all' || a.folderId === selectedFolderId;
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesSearch =
      a.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.phone.includes(searchTerm) ||
      (a.skills && a.skills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase())));
    return matchesFolder && matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: CandidateApplicant['status']) => {
    switch (status) {
      case 'recibido':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Recibido</span>;
      case 'en_revision':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">En Revisión</span>;
      case 'entrevista':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">Entrevista</span>;
      case 'seleccionado':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Seleccionado</span>;
      case 'descartado':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">Descartado</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-transparent border border-purple-200 dark:border-purple-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
              Reclutamiento & Talento
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              Bolsa de Trabajo & Base de Currículum Vitae (CV)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Gestiona carpetas por vacante o puesto laboral (ej: Asistente Administrativo, Diseño Gráfico, POS). Clasifica candidatos, califica perfiles y contrátalos con 1 clic directo al directorio de colaboradores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewFolderModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <FolderPlus className="w-4 h-4 text-purple-600" />
            <span>Nueva Carpeta / Vacante</span>
          </button>
          <button
            onClick={() => setIsNewApplicantModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrar Solicitante & CV</span>
          </button>
        </div>
      </div>

      {/* Folders Bar */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Carpetas de Reclutamiento ({candidateFolders.length}):
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedFolderId('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
              selectedFolderId === 'all'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Todos los Solicitantes ({candidateApplicants.length})</span>
          </button>

          {candidateFolders.map((folder) => {
            const count = candidateApplicants.filter((a) => a.folderId === folder.id).length;
            const isSelected = selectedFolderId === folder.id;

            return (
              <div
                key={folder.id}
                className={`flex items-center rounded-xl border transition shrink-0 ${
                  isSelected
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <button
                  onClick={() => setSelectedFolderId(folder.id)}
                  className="px-3 py-2 text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  <Folder className="w-3.5 h-3.5 text-purple-400" />
                  <span>{folder.name}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-purple-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                    {count}
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`¿Eliminar la carpeta "${folder.name}" y todos sus solicitantes?`)) {
                      deleteCandidateFolder(folder.id);
                      if (selectedFolderId === folder.id) setSelectedFolderId('all');
                    }
                  }}
                  className={`p-1.5 pr-2.5 hover:text-rose-400 cursor-pointer ${isSelected ? 'text-purple-200' : 'text-slate-400'}`}
                  title="Eliminar carpeta"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search and Status Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar candidato por nombre, habilidad, correo o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">Filtro Estado:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            <option value="all">Todos los Estados</option>
            <option value="recibido">Recibido</option>
            <option value="en_revision">En Revisión</option>
            <option value="entrevista">Entrevista</option>
            <option value="seleccionado">Seleccionado</option>
            <option value="descartado">Descartado</option>
          </select>
        </div>
      </div>

      {/* Applicants List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredApplicants.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-semibold">No hay solicitantes registrados en esta carpeta o criterio de búsqueda.</p>
            <button
              onClick={() => setIsNewApplicantModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrar el Primer Solicitante</span>
            </button>
          </div>
        ) : (
          filteredApplicants.map((applicant) => (
            <div
              key={applicant.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-purple-300 dark:hover:border-purple-700 transition flex flex-col justify-between space-y-3"
            >
              {/* Card Header */}
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {applicant.fullName}
                    </h4>
                    <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold block">
                      📁 {applicant.folderName}
                    </span>
                  </div>
                  {getStatusBadge(applicant.status)}
                </div>

                {/* Rating Stars */}
                <div className="flex items-center gap-1 pt-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateCandidateApplicant(applicant.id, { rating: s })}
                      className="cursor-pointer"
                      title={`${s} estrellas`}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          s <= applicant.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-[10px] text-slate-400 ml-1">({applicant.rating}/5)</span>
                </div>
              </div>

              {/* Data fields */}
              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Aspiración Salarial:</span>
                  <strong className="text-slate-900 dark:text-white font-mono">
                    {formatCurrencyUSD(applicant.expectedSalary || 0)}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Experiencia:</span>
                  <span>{applicant.experienceYears || 0} años de exp.</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Nivel Educativo:</span>
                  <span className="truncate max-w-[160px]">{applicant.educationLevel}</span>
                </div>
                <div className="flex items-center gap-2 pt-1 font-mono text-[11px]">
                  {applicant.phone && (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Phone className="w-3 h-3 text-slate-400" /> {applicant.phone}
                    </span>
                  )}
                  {applicant.email && (
                    <span className="flex items-center gap-1 text-slate-500 truncate">
                      <Mail className="w-3 h-3 text-slate-400" /> {applicant.email}
                    </span>
                  )}
                </div>
              </div>

              {/* Skills Tags */}
              {applicant.skills && applicant.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {applicant.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* CV Attachment Box */}
              <div className="p-2 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 text-[11px] flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <FileText className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span className="truncate font-mono text-purple-950 dark:text-purple-300 font-medium">
                    {applicant.cvFileName || 'CV_Curriculum.pdf'}
                  </span>
                </div>
                <span className="text-[10px] text-purple-600 font-bold">Adjunto</span>
              </div>

              {/* Actions Toolbar */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                {/* Pipeline Status Dropdown */}
                <select
                  value={applicant.status}
                  onChange={(e) =>
                    updateCandidateApplicant(applicant.id, {
                      status: e.target.value as CandidateApplicant['status'],
                    })
                  }
                  className="p-1 px-2 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <option value="recibido">Recibido</option>
                  <option value="en_revision">En Revisión</option>
                  <option value="entrevista">Entrevista</option>
                  <option value="seleccionado">Seleccionado</option>
                  <option value="descartado">Descartado</option>
                </select>

                <div className="flex items-center gap-1">
                  {/* 1-Click Hire Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          `¿Contratar a ${applicant.fullName} como Colaborador de la empresa? Se agregará automáticamente a la Base de Empleados con su salario de ${formatCurrencyUSD(applicant.expectedSalary || 500)}.`
                        )
                      ) {
                        hireCandidateAsEmployee(applicant.id);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                    title="Convertir a Empleado Activo"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Contratar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`¿Eliminar candidato "${applicant.fullName}"?`)) {
                        deleteCandidateApplicant(applicant.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    title="Eliminar candidato"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: New Folder */}
      {isNewFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-purple-600" />
                <span>Nueva Carpeta / Vacante de Selección</span>
              </h3>
              <button onClick={() => setIsNewFolderModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nombre de la Carpeta / Cargo:</label>
                <input
                  type="text"
                  placeholder="Ej: Asistente Administrativo, Diseñador Gráfico, Cajero..."
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Departamento:</label>
                <select
                  value={newFolderDept}
                  onChange={(e) => setNewFolderDept(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="Operaciones">Operaciones</option>
                  <option value="Ventas & POS">Ventas & POS</option>
                  <option value="Marketing & Diseño">Marketing & Diseño</option>
                  <option value="Administración & Contabilidad">Administración & Contabilidad</option>
                  <option value="Tecnología & Sistemas">Tecnología & Sistemas</option>
                  <option value="Logística & Bodega">Logística & Bodega</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Descripción del Perfil Buscado:</label>
                <textarea
                  rows={2}
                  placeholder="Requisitos clave, funciones principales o competencias..."
                  value={newFolderDesc}
                  onChange={(e) => setNewFolderDesc(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewFolderModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold shadow cursor-pointer"
                >
                  Crear Carpeta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Applicant & CV */}
      {isNewApplicantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg my-4 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-purple-600" />
                <span>Registrar Solicitante & Subir CV</span>
              </h3>
              <button onClick={() => setIsNewApplicantModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateApplicant} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Carpeta / Vacante de Destino:</label>
                <select
                  required
                  value={applicantForm.folderId}
                  onChange={(e) => setApplicantForm({ ...applicantForm, folderId: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                >
                  {candidateFolders.map((f) => (
                    <option key={f.id} value={f.id}>
                      📁 {f.name} ({f.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Nombre Completo del Solicitante:</label>
                <input
                  type="text"
                  placeholder="Ej: Licda. Claudia María Henríquez"
                  required
                  value={applicantForm.fullName}
                  onChange={(e) => setApplicantForm({ ...applicantForm, fullName: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Teléfono / WhatsApp:</label>
                  <input
                    type="text"
                    placeholder="7890-1234"
                    value={applicantForm.phone}
                    onChange={(e) => setApplicantForm({ ...applicantForm, phone: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Correo Electrónico:</label>
                  <input
                    type="email"
                    placeholder="candidato@gmail.com"
                    value={applicantForm.email}
                    onChange={(e) => setApplicantForm({ ...applicantForm, email: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Salario Aspirado ($):</label>
                  <input
                    type="number"
                    step="25"
                    min="1"
                    value={applicantForm.expectedSalary}
                    onChange={(e) =>
                      setApplicantForm({ ...applicantForm, expectedSalary: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Años de Exp.:</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={applicantForm.experienceYears}
                    onChange={(e) =>
                      setApplicantForm({ ...applicantForm, experienceYears: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Nivel Educativo:</label>
                  <select
                    value={applicantForm.educationLevel}
                    onChange={(e) => setApplicantForm({ ...applicantForm, educationLevel: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Bachillerato">Bachillerato</option>
                    <option value="Técnico Universitario">Técnico Univ.</option>
                    <option value="Licenciatura / Ingeniería (En curso)">Univ. En curso</option>
                    <option value="Licenciatura / Ingeniería (Graduado)">Graduado Univ.</option>
                    <option value="Maestría / Posgrado">Maestría</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Habilidades Clave (Separadas por comas):</label>
                <input
                  type="text"
                  placeholder="Excel, Redes Sociales, Servicio al Cliente, Facturación..."
                  value={applicantForm.skills}
                  onChange={(e) => setApplicantForm({ ...applicantForm, skills: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              {/* CV File metadata */}
              <div>
                <label className="block font-semibold mb-1">Archivo de Currículum Vitae (Nombre de Archivo o Link):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="CV_Claudia_Henriquez_2026.pdf o enlace a portafolio"
                    value={applicantForm.cvFileName}
                    onChange={(e) => setApplicantForm({ ...applicantForm, cvFileName: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Resumen del Perfil / Notas del Reclutador:</label>
                <textarea
                  rows={2}
                  placeholder="Comentarios de la primera impresión, disponibilidad inmediata, fortalezas..."
                  value={applicantForm.notes}
                  onChange={(e) => setApplicantForm({ ...applicantForm, notes: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewApplicantModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold shadow cursor-pointer"
                >
                  Guardar Solicitante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
