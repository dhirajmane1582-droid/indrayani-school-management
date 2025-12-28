
import React, { useState, useMemo, useRef } from 'react';
import { Student, CLASSES, SPECIFIC_CLASSES, CustomFieldDefinition, User } from '../types';
import { Plus, Search, Filter, Download, FileSpreadsheet, Edit2, Trash2, X, GraduationCap, MapPin, Phone, Calendar, Info, Settings, ShieldCheck, UserPlus, ChevronDown, Upload, FileDown, AlertCircle, CheckCircle2 } from 'lucide-react';
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

  // Form State
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

  // Settings State for Custom Field Definition
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
    const nameRegex = /^[a-zA-Z0-9 .]+$/;
    if (!s.name || !nameRegex.test(s.name)) {
      errors.push("Name must be alphanumeric.");
    }
    const phoneRegex = /^\d{10}$/;
    if (!s.phone || !phoneRegex.test(s.phone)) {
      errors.push("Primary Phone must be 10 digits.");
    }
    if (!s.rollNo) errors.push("Roll Number is required.");
    if (!s.className) errors.push("Class is required.");
    return { valid: errors.length === 0, errors };
  };

  const handleInputChange = (field: keyof Student, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const { valid, errors } = validateStudent(formData);
    if (!valid) {
      alert(`Validation Errors:\n- ${errors.join('\n- ')}`);
      return;
    }

    const newStudent: Student = {
      id: formData.id || crypto.randomUUID(),
      name: (formData.name || '').trim(),
      rollNo: formData.rollNo || '',
      className: formData.className || 'Class 1',
      medium: formData.medium || 'English',
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
      showToast("Admitted Successfully", "success");
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

  const deleteStudent = (id: string) => {
    if (window.confirm('Permanently delete student?')) {
      setStudents(prev => prev.filter(s => s.id !== id));
      setUsers(prev => prev.filter(u => u.linkedStudentId !== id));
      showToast("Record Deleted", "info");
    }
  };

  const handleAddFieldDef = () => {
    if (!newFieldName.trim()) return;
    setCustomFieldDefs(prev => [...prev, { id: crypto.randomUUID(), label: newFieldName.trim() }]);
    setNewFieldName('');
  };

  const downloadTemplate = () => {
    const template = [{ 'Full Name': 'Rahul Patil', 'Roll No': '101', 'Class': 'Class 1', 'Medium': 'English', 'Phone': '9876543210' }];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Import_Template.xlsx");
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
        const newBatch: Student[] = [];
        data.forEach((row: any) => {
          let cls = String(row['Class'] || 'Class 1');
          if (!cls.startsWith('Class') && !['Nursery', 'Jr. KG', 'Sr. KG'].includes(cls)) {
              cls = `Class ${cls}`;
          }
          const s: Student = {
            id: crypto.randomUUID(),
            name: String(row['Full Name'] || '').trim(),
            rollNo: String(row['Roll No'] || ''),
            className: cls,
            medium: String(row['Medium'] || '').toLowerCase().includes('semi') ? 'Semi' : 'English',
            phone: String(row['Phone'] || '').replace(/\D/g, ''),
            dob: String(row['DOB'] || ''),
            address: String(row['Address'] || ''),
            customFields: {}
          };
          if (s.name && s.phone.length === 10) newBatch.push(s);
        });
        if (newBatch.length) {
          setStudents(prev => [...prev, ...newBatch]);
          showToast(`Imported ${newBatch.length} Students`, 'success');
        }
      } catch (err) { showToast("Import Failed", "error"); }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 border ${
          toast.type === 'success' ? 'bg-emerald-600 text-white border-emerald-400' : 
          toast.type === 'error' ? 'bg-rose-600 text-white border-rose-400' : 'bg-slate-800 text-white border-slate-700'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={20}/> : <AlertCircle size={20}/>}
          <span className="text-sm font-bold uppercase tracking-wider">{toast.msg}</span>
        </div>
      )}

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
                    <option value="">All Mediums & Classes</option>
                    {SPECIFIC_CLASSES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
            </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1">
            <button onClick={downloadTemplate} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest whitespace-nowrap"><FileDown size={16} /> Template</button>
            <button onClick={() => fileInputRef.current?.click()} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-100 text-[10px] font-black uppercase tracking-widest whitespace-nowrap"><Upload size={16} /> Import<input type="file" ref={fileInputRef} onChange={handleBulkImport} accept=".xlsx,.xls,.csv" className="hidden" /></button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"><Settings size={20} /></button>
            <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 whitespace-nowrap"><UserPlus size={18} /> Admit</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-300 text-slate-300 italic font-bold uppercase tracking-widest">No Students Found</div>
        ) : (
            filteredStudents.map(student => (
                <div key={student.id} className={`bg-white rounded-2xl border transition-all ${expandedStudentId === student.id ? 'border-indigo-500 ring-4 ring-indigo-50 shadow-xl' : 'border-slate-200 hover:border-slate-300 shadow-sm'}`}>
                    <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpandedStudentId(expandedStudentId === student.id ? null : student.id)}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm ${expandedStudentId === student.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{student.rollNo}</div>
                        <div className="flex-1 overflow-hidden">
                            <h3 className="font-black text-slate-800 text-sm truncate uppercase">{student.name}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded uppercase">{student.className} ({(student.medium || 'English')})</span>
                            </div>
                        </div>
                        <ChevronDown size={18} className={`text-slate-300 transition-transform ${expandedStudentId === student.id ? 'rotate-180 text-indigo-500' : ''}`} />
                    </div>
                    {expandedStudentId === student.id && (
                        <div className="px-5 pb-5 pt-2 animate-in slide-in-from-top-2 duration-300">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-[11px] font-bold">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-slate-600"><Calendar size={14} className="text-slate-400" /> DOB: {student.dob || 'N/A'}</div>
                                    <div className="flex items-center gap-2 text-slate-600"><Phone size={14} className="text-slate-400" /> {student.phone}</div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2 text-slate-600"><MapPin size={14} className="text-slate-400 mt-0.5" /> <span className="line-clamp-2">{student.address || 'No Address'}</span></div>
                                </div>
                            </div>
                            <div className="mt-5 flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                                <button onClick={() => editStudent(student)} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-wider">Edit</button>
                                <button onClick={() => deleteStudent(student.id)} className="px-4 py-2 bg-rose-50 text-rose-700 rounded-lg text-[10px] font-black uppercase tracking-wider">Delete</button>
                            </div>
                        </div>
                    )}
                </div>
            ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full my-auto animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-200">
                <form onSubmit={handleAddStudent} className="flex flex-col max-h-[90vh]">
                    <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg"><GraduationCap size={24} /></div>
                            <div><h3 className="text-xl font-black text-slate-800 tracking-tight">Student Admission</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Session 2024-25</p></div>
                        </div>
                        <button type="button" onClick={() => setIsModalOpen(false)} className="p-2.5 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><X size={24} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                        <section className="space-y-4">
                            <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={14} /> Identity</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                                <div className="sm:col-span-8">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Student Name</label>
                                    <input type="text" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none" required />
                                </div>
                                <div className="sm:col-span-4">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Roll No</label>
                                    <input type="text" value={formData.rollNo} onChange={(e) => handleInputChange('rollNo', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-center focus:ring-4 focus:ring-indigo-500/5 outline-none" required />
                                </div>
                                <div className="sm:col-span-12">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Class & Medium</label>
                                    <select value={formData.className ? `${formData.className}|${formData.medium || 'English'}` : ''} onChange={(e) => { const [cls, med] = e.target.value.split('|'); handleInputChange('className', cls); handleInputChange('medium', med); }} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none">
                                        {SPECIFIC_CLASSES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        </section>
                        <section className="space-y-4">
                            <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><MapPin size={14} /> Contact</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Phone</label><input type="tel" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none" required /></div>
                                <div className="sm:col-span-2"><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Address</label><textarea value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none min-h-[80px]" /></div>
                            </div>
                        </section>
                    </div>
                    <div className="p-8 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate-500 hover:bg-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Cancel</button>
                        <button type="submit" className="px-10 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">{formData.id ? 'Save Changes' : 'Confirm Admission'}</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default StudentManager;
