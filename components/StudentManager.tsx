
import React, { useState, useMemo, useRef } from 'react';
import { Student, CLASSES, SPECIFIC_CLASSES, CustomFieldDefinition, User } from '../types';
import { Plus, Search, Filter, Download, FileSpreadsheet, Edit2, Trash2, X, GraduationCap, MapPin, Phone, Calendar, Info, Settings, ShieldCheck, UserPlus, ChevronDown, Upload, FileDown, AlertCircle, CheckCircle2, ArrowLeft, Save, Sparkles, Smartphone } from 'lucide-react';
import * as XLSX from 'xlsx';

interface StudentManagerProps {
  students: Student[];
  setStudents: (val: React.SetStateAction<Student[]>) => void;
  customFieldDefs: CustomFieldDefinition[];
  setCustomFieldDefs: React.Dispatch<React.SetStateAction<CustomFieldDefinition[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: User;
}

const StudentManager: React.FC<StudentManagerProps> = ({ 
  students, 
  setStudents, 
  customFieldDefs, 
  setCustomFieldDefs,
  users,
  setUsers,
  currentUser
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpecificClass, setFilterSpecificClass] = useState('');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error' | 'info'} | null>(null);

  const [formData, setFormData] = useState<Partial<Student>>({
    name: '',
    rollNo: '',
    className: 'Class 1',
    medium: 'English',
    dob: '',
    placeOfBirth: '',
    address: '',
    phone: '',
    alternatePhone: '',
    customFields: {}
  });

  const [newFieldName, setNewFieldName] = useState('');

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.rollNo.includes(searchQuery);
      let matchesClass = true;
      if (filterSpecificClass) {
          const [cls, med] = filterSpecificClass.split('|');
          matchesClass = s.className === cls && (s.medium || 'English') === med;
      }
      return matchesSearch && matchesClass;
    }).sort((a, b) => (parseInt(a.rollNo) || 0) - (parseInt(b.rollNo) || 0));
  }, [students, searchQuery, filterSpecificClass]);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const validateStudent = (s: Partial<Student>): { valid: boolean, errors: string[] } => {
    const errors: string[] = [];
    
    // Name validation: Alphanumeric and spaces only
    const nameRegex = /^[a-zA-Z0-9 ]+$/;
    if (!s.name || !nameRegex.test(s.name)) {
      errors.push("Name must be alphanumeric only (no special characters).");
    }

    // Phone validation: Exactly 10 digits
    const phoneRegex = /^\d{10}$/;
    if (!s.phone || !phoneRegex.test(s.phone)) {
      errors.push("Primary Phone must be exactly 10 numeric digits.");
    }
    
    if (s.alternatePhone && s.alternatePhone.trim() !== '' && !phoneRegex.test(s.alternatePhone)) {
      errors.push("Alternate Phone must be 10 numeric digits.");
    }

    if (!s.rollNo) errors.push("Roll Number is required.");
    if (!s.className) errors.push("Class selection is required.");

    return { valid: errors.length === 0, errors };
  };

  const handleInputChange = (field: keyof Student, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      customFields: { ...(prev.customFields || {}), [fieldId]: value }
    }));
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const { valid, errors } = validateStudent(formData);
    if (!valid) {
      alert(`Correction Required:\n\n• ${errors.join('\n• ')}`);
      return;
    }

    const newStudent: Student = {
      id: formData.id || crypto.randomUUID(),
      name: (formData.name || '').trim(),
      rollNo: formData.rollNo || '',
      className: formData.className || 'Class 1',
      medium: (formData.medium as any) || 'English',
      dob: formData.dob || '',
      placeOfBirth: formData.placeOfBirth || '',
      address: formData.address || '',
      phone: formData.phone || '',
      alternatePhone: formData.alternatePhone || '',
      customFields: formData.customFields || {}
    };

    if (formData.id) {
      setStudents(prev => prev.map(s => s.id === formData.id ? newStudent : s));
      showToast("Profile Updated", "success");
    } else {
      setStudents(prev => [...prev, newStudent]);
      showToast("Admission Confirmed", "success");
    }
    
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', rollNo: '', className: 'Class 1', medium: 'English', dob: '', placeOfBirth: '', address: '', phone: '', alternatePhone: '', customFields: {} });
  };

  const editStudent = (student: Student) => {
    setFormData(student);
    setIsModalOpen(true);
  };

  const handleAddFieldDef = () => {
    if (!newFieldName.trim()) return;
    const newDef: CustomFieldDefinition = { id: crypto.randomUUID(), label: newFieldName.trim() };
    setCustomFieldDefs(prev => [...prev, newDef]);
    setNewFieldName('');
  };

  const removeFieldDef = (id: string) => {
    if (window.confirm("Remove this field? Existing student data for this field will be hidden.")) {
        setCustomFieldDefs(prev => prev.filter(d => d.id !== id));
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        'Full Name': 'Rahul Patil',
        'Roll No': '101',
        'Class': 'Class 1',
        'Medium': 'English',
        'DOB': '2015-05-20',
        'Place of Birth': 'Mumbai',
        'Address': 'Sector 18, Koparkhairane',
        'Phone': '9876543210',
        'Alternate Phone': '8876543210',
        ...customFieldDefs.reduce((acc, def) => ({ ...acc, [def.label]: '' }), {})
      }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "School_Admission_Template.xlsx");
  };

  const handleBulkImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);

        const newStudents: Student[] = [];
        let successCount = 0;
        let failCount = 0;

        data.forEach((row: any) => {
          const studentData: Partial<Student> = {
            name: String(row['Full Name'] || row['Name'] || '').trim(),
            rollNo: String(row['Roll No'] || row['Roll Number'] || ''),
            className: String(row['Class'] || 'Class 1'),
            medium: String(row['Medium'] || 'English').toLowerCase().includes('semi') ? 'Semi' : 'English',
            dob: String(row['DOB'] || row['Date of Birth'] || ''),
            placeOfBirth: String(row['Place of Birth'] || ''),
            address: String(row['Address'] || ''),
            phone: String(row['Phone'] || row['Mobile'] || '').replace(/\D/g, ''),
            alternatePhone: String(row['Alternate Phone'] || '').replace(/\D/g, ''),
            customFields: {}
          };

          // Map Custom Fields by Matching Labels
          customFieldDefs.forEach(def => {
            if (row[def.label]) studentData.customFields![def.id] = String(row[def.label]);
          });

          const { valid } = validateStudent(studentData);
          if (valid) {
            newStudents.push({ ...(studentData as Student), id: crypto.randomUUID() });
            successCount++;
          } else {
            failCount++;
          }
        });

        if (newStudents.length > 0) {
          setStudents(prev => [...prev, ...newStudents]);
          showToast(`Imported ${successCount} Students. ${failCount > 0 ? `${failCount} errors skipped.` : ''}`, 'success');
        } else {
          showToast("Import failed. Check formatting and 10-digit phone requirement.", "error");
        }
      } catch (err) {
        showToast("Error processing file", "error");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 border ${
          toast.type === 'success' ? 'bg-emerald-600 text-white border-emerald-400' : 
          toast.type === 'error' ? 'bg-rose-600 text-white border-rose-400' : 'bg-slate-800 text-white border-slate-700'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={20}/> : <AlertCircle size={20}/>}
          <span className="text-sm font-bold uppercase tracking-wider">{toast.msg}</span>
        </div>
      )}

      {/* Main List Controls */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Search name or roll no..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all" />
            </div>
            <div className="relative">
                <select value={filterSpecificClass} onChange={(e) => setFilterSpecificClass(e.target.value)}
                    className="appearance-none pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none cursor-pointer">
                    <option value="">All Classes</option>
                    {SPECIFIC_CLASSES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
            </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1">
            <button onClick={downloadTemplate} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest whitespace-nowrap"><FileDown size={16} /> Template</button>
            <button onClick={() => fileInputRef.current?.click()} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-100 text-[10px] font-black uppercase tracking-widest whitespace-nowrap"><Upload size={16} /> Import<input type="file" ref={fileInputRef} onChange={handleBulkImport} accept=".xlsx,.xls,.csv" className="hidden" /></button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all shadow-sm"><Settings size={20} /></button>
            <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 whitespace-nowrap"><UserPlus size={18} /> Admit Student</button>
        </div>
      </div>

      {/* Student Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.length === 0 ? (
            <div className="col-span-full py-24 text-center bg-white rounded-3xl border border-dashed border-slate-300 flex flex-col items-center">
                <Sparkles size={48} className="text-slate-100 mb-4" />
                <p className="text-slate-300 italic font-black uppercase tracking-widest">No Students Found</p>
                <p className="text-xs text-slate-300 font-bold mt-2">Adjust your filters or admit a new student.</p>
            </div>
        ) : (
            filteredStudents.map(student => (
                <div key={student.id} className={`bg-white rounded-2xl border transition-all ${expandedStudentId === student.id ? 'border-indigo-500 ring-4 ring-indigo-50 shadow-xl' : 'border-slate-200 hover:border-indigo-200 shadow-sm'}`}>
                    <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpandedStudentId(expandedStudentId === student.id ? null : student.id)}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm ${expandedStudentId === student.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{student.rollNo}</div>
                        <div className="flex-1 overflow-hidden">
                            <h3 className="font-black text-slate-800 text-sm truncate uppercase">{student.name}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded uppercase">{student.className} ({student.medium || 'English'})</span>
                            </div>
                        </div>
                        <ChevronDown size={18} className={`text-slate-300 transition-transform ${expandedStudentId === student.id ? 'rotate-180 text-indigo-500' : ''}`} />
                    </div>
                    {expandedStudentId === student.id && (
                        <div className="px-5 pb-5 pt-2 animate-in slide-in-from-top-2 duration-300">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-[11px] font-bold">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-slate-600"><Calendar size={14} className="text-slate-400" /> DOB: {student.dob || 'N/A'}</div>
                                    <div className="flex items-center gap-2 text-slate-600"><MapPin size={14} className="text-slate-400" /> {student.placeOfBirth || '-'}</div>
                                    <div className="flex items-center gap-2 text-slate-600"><Phone size={14} className="text-slate-400" /> {student.phone}</div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2 text-slate-600"><Info size={14} className="text-slate-400 mt-0.5" /> <span className="line-clamp-3">{student.address || 'No Address Recorded'}</span></div>
                                </div>
                            </div>
                            
                            {customFieldDefs.length > 0 && (
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    {customFieldDefs.map(def => (
                                        <div key={def.id} className="p-2 bg-white border border-slate-100 rounded-lg shadow-sm">
                                            <div className="text-[9px] text-slate-400 uppercase font-black">{def.label}</div>
                                            <div className="text-xs font-bold text-slate-700">{student.customFields?.[def.id] || '-'}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-5 flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                                <button onClick={() => editStudent(student)} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-indigo-100">Edit Profile</button>
                                <button onClick={() => { if(window.confirm('Delete student record? This cannot be undone.')) setStudents(prev => prev.filter(s => s.id !== student.id)); }} className="px-4 py-2 bg-rose-50 text-rose-700 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-rose-100">Remove</button>
                            </div>
                        </div>
                    )}
                </div>
            ))
        )}
      </div>

      {/* FULLSCREEN ADMISSION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-50 z-[200] flex flex-col animate-in slide-in-from-bottom duration-300 overflow-hidden">
            <form onSubmit={handleAddStudent} className="flex flex-col h-full">
                {/* Fullscreen Header */}
                <div className="bg-white px-4 h-16 sm:h-20 flex items-center justify-between border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="p-2.5 -ml-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all">
                            <ArrowLeft size={24} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg hidden xs:flex">
                                <GraduationCap size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">
                                    {formData.id ? 'Update Profile' : 'Student Admission'}
                                </h3>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Academic Session 2025-26</p>
                            </div>
                        </div>
                    </div>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="hidden sm:block p-2.5 text-slate-400 hover:bg-slate-100 rounded-xl transition-all">
                        <X size={24} />
                    </button>
                </div>

                {/* Fullscreen Content Area */}
                <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 no-scrollbar bg-slate-50/50">
                    <div className="max-w-4xl mx-auto space-y-12 pb-24">
                        
                        {/* Section 1: Identification */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                                <ShieldCheck size={18} className="text-indigo-600" />
                                <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Identification Details</h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
                                <div className="sm:col-span-8">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Full Student Name (Alphanumeric Only)</label>
                                    <input type="text" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} 
                                        className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl text-base font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none shadow-sm transition-all" 
                                        placeholder="Enter full name" required />
                                </div>
                                <div className="sm:col-span-4">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Roll Number</label>
                                    <input type="text" value={formData.rollNo} onChange={(e) => handleInputChange('rollNo', e.target.value)} 
                                        className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl text-base font-black text-center focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none shadow-sm transition-all" 
                                        placeholder="000" required />
                                </div>
                                <div className="sm:col-span-6">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Select Grade (Class)</label>
                                    <div className="relative">
                                        <select value={formData.className} onChange={(e) => handleInputChange('className', e.target.value)} 
                                            className="w-full appearance-none px-4 py-4 bg-white border border-slate-200 rounded-2xl text-base font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none shadow-sm transition-all">
                                            {CLASSES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                                    </div>
                                </div>
                                <div className="sm:col-span-6">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Medium of Instruction</label>
                                    <div className="flex bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200">
                                        <button type="button" onClick={() => handleInputChange('medium', 'English')} 
                                            className={`flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all ${formData.medium === 'English' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>
                                            English
                                        </button>
                                        <button type="button" onClick={() => handleInputChange('medium', 'Semi')} 
                                            className={`flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all ${formData.medium === 'Semi' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>
                                            Semi-English
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Personal Details */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                                <MapPin size={18} className="text-indigo-600" />
                                <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Geographic & Personal</h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Date of Birth</label>
                                    <input type="date" value={formData.dob} onChange={(e) => handleInputChange('dob', e.target.value)} 
                                        className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl text-base font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none shadow-sm transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Place of Birth</label>
                                    <input type="text" value={formData.placeOfBirth} onChange={(e) => handleInputChange('placeOfBirth', e.target.value)} 
                                        placeholder="Town or City" 
                                        className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl text-base font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none shadow-sm transition-all" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Residential Address</label>
                                    <textarea value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} 
                                        className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl text-base font-medium focus:ring-4 focus:ring-indigo-500/5 outline-none min-h-[120px] shadow-sm transition-all" 
                                        placeholder="Full address details..." />
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Contact */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                                <Phone size={18} className="text-indigo-600" />
                                <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Contact Information</h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Primary Phone (Strict 10 Digits)</label>
                                    <div className="relative">
                                        <Smartphone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="tel" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, ''))} 
                                            placeholder="9XXXXXXXXX" maxLength={10}
                                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-base font-black focus:ring-4 focus:ring-indigo-500/5 outline-none shadow-sm transition-all" required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Emergency / Alternate Phone</label>
                                    <input type="tel" value={formData.alternatePhone} onChange={(e) => handleInputChange('alternatePhone', e.target.value.replace(/\D/g, ''))} 
                                        placeholder="Optional 10 digits" maxLength={10}
                                        className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl text-base font-black focus:ring-4 focus:ring-indigo-500/5 outline-none shadow-sm transition-all" />
                                </div>
                            </div>
                        </section>

                        {/* Customizable Fields Section */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <div className="flex items-center gap-2">
                                    <Settings size={18} className="text-indigo-600" />
                                    <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Customizable Data Fields</h4>
                                </div>
                                <button type="button" onClick={() => setIsSettingsOpen(true)} className="text-[9px] font-black bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg uppercase tracking-widest border border-indigo-100">+ Configure Fields</button>
                            </div>
                            
                            {customFieldDefs.length === 0 ? (
                                <div className="p-8 text-center bg-slate-100/50 rounded-3xl border border-dashed border-slate-300">
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest italic">No custom fields defined. Click 'Configure Fields' to add items like Bank Acc, Aadhar, etc.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {customFieldDefs.map(def => (
                                        <div key={def.id}>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">{def.label}</label>
                                            <input type="text" value={formData.customFields?.[def.id] || ''} onChange={(e) => handleCustomFieldChange(def.id, e.target.value)} 
                                                className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl text-base font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none shadow-sm transition-all" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </div>

                {/* Sticky Action Footer */}
                <div className="bg-white border-t border-slate-200 p-4 sm:p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] sticky bottom-0 z-10">
                    <div className="max-w-4xl mx-auto flex gap-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} 
                            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">
                            Cancel
                        </button>
                        <button type="submit" 
                            className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">
                            {formData.id ? 'Save Profile Updates' : 'Confirm & Complete Admission'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
      )}

      {/* Field Configuration Modal */}
      {isSettingsOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[210] p-4">
              <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200 border border-slate-200">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-black text-slate-800">Field Configurator</h3>
                      <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={24}/></button>
                  </div>
                  <div className="space-y-6">
                      <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Create New Field Label</label>
                          <div className="flex gap-2">
                              <input type="text" value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} placeholder="e.g. Bank Acc No" className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5" />
                              <button onClick={handleAddFieldDef} className="bg-indigo-600 text-white p-2.5 rounded-xl"><Plus size={20}/></button>
                          </div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mt-2 italic px-1">Fields created here will appear in the Admission form.</p>
                      </div>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                          {customFieldDefs.map(def => (
                              <div key={def.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                  <span className="text-sm font-bold text-slate-700">{def.label}</span>
                                  <button onClick={() => removeFieldDef(def.id)} className="text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={16}/></button>
                              </div>
                          ))}
                      </div>
                  </div>
                  <button onClick={() => setIsSettingsOpen(false)} className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all">Close & Apply</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default StudentManager;
