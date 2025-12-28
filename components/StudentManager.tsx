
import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Student, SPECIFIC_CLASSES, CustomFieldDefinition, User, SIMPLIFIED_CLASSES } from '../types';
import { Plus, Trash2, Edit2, Phone, Search, Settings, X, GraduationCap, ChevronDown, MapPin, Calendar, Info, Key, UserCheck, ArrowUpFromLine, ArrowDownToLine, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

// Optimize high-frequency components
const StudentRow = React.memo(({ 
    student, 
    isExpanded, 
    onToggle, 
    onEdit, 
    onDelete, 
    credentials 
}: { 
    student: Student, 
    isExpanded: boolean, 
    onToggle: (id: string) => void, 
    onEdit: (s: Student) => void, 
    onDelete: (id: string, e: any) => void,
    credentials?: any
}) => {
    return (
        <div className={`bg-white rounded-2xl border transition-all duration-200 ${isExpanded ? 'border-indigo-500 ring-4 ring-indigo-50 shadow-xl' : 'border-slate-200 shadow-sm active:scale-[0.99]'}`}>
            <div 
                onClick={() => onToggle(student.id)}
                className="p-4 flex justify-between items-start cursor-pointer select-none"
            >
                <div className="flex gap-3 items-center">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-xs border transition-colors ${isExpanded ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                        {student.rollNo}
                    </div>
                    <div className="overflow-hidden">
                        <div className="font-bold text-slate-800 leading-tight truncate pr-2">{student.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{student.className} • {student.medium || 'English'}</div>
                        <div className="text-[11px] font-mono text-indigo-600 font-bold mt-1 flex items-center gap-1">
                            <Phone size={10}/> {student.phone}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                    <ChevronDown size={18} className={`text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-indigo-500' : ''}`} />
                </div>
            </div>

            {isExpanded && (
                <div className="px-4 pb-5 pt-1 border-t border-slate-50 animate-in slide-in-from-top-4 duration-300">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <a href={`tel:${student.phone}`} className="flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 py-3 rounded-xl border border-indigo-100 text-xs font-black uppercase">
                                <Phone size={14}/> Call Now
                            </a>
                            <button 
                                onClick={() => onEdit(student)}
                                className="flex items-center justify-center gap-2 bg-slate-800 text-white py-3 rounded-xl text-xs font-black uppercase"
                            >
                                <Edit2 size={14}/> Edit Profile
                            </button>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                            <div className="flex items-start gap-3">
                                <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
                                <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Address</div>
                                    <div className="text-sm text-slate-700 leading-relaxed font-medium">{student.address || 'Not Provided'}</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar size={16} className="text-slate-400 mt-0.5 shrink-0" />
                                <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Birth Details</div>
                                    <div className="text-sm text-slate-700 font-medium">{student.dob || 'Unknown DOB'} {student.placeOfBirth ? ` • ${student.placeOfBirth}` : ''}</div>
                                </div>
                            </div>
                            {credentials && (
                                <div className="mt-4 bg-slate-900 text-slate-400 p-3 rounded-xl border border-slate-800">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Key size={14} className="text-indigo-400"/>
                                            <div className="text-[10px] font-black uppercase tracking-widest">Portal Access</div>
                                        </div>
                                        <div className="text-[10px] font-mono select-all">UID: {credentials.username} / PASS: {credentials.password}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={(e) => onDelete(student.id, e)}
                            className="w-full py-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 mt-2"
                        >
                            <Trash2 size={14}/> Remove Student Profile
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}, (prev, next) => prev.isExpanded === next.isExpanded && prev.student === next.student);

interface StudentManagerProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
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
  const [selectedSpecificClass, setSelectedSpecificClass] = useState('');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFieldManagerOpen, setIsFieldManagerOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // High-performance list state
  const [visibleCount, setVisibleCount] = useState(25);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Form State
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [formClassName, setFormClassName] = useState('');
  const [dob, setDob] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [address, setAddress] = useState('');
  const [medium, setMedium] = useState<'English' | 'Semi'>('English');
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = useCallback((studentName: string, studentDob: string) => {
      const nameParts = studentName.trim().split(/\s+/);
      const first = nameParts[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      const last = nameParts.length > 1 ? nameParts[nameParts.length - 1].toLowerCase().replace(/[^a-z0-9]/g, '') : '';
      const cleanDob = studentDob.replace(/[^0-9]/g, '');
      const primaryId = `${first}${cleanDob || '00000000'}`;
      const exists = students.some(s => s.id === primaryId && s.id !== editingStudent?.id);
      return exists ? `${first}${last}${cleanDob || '00000000'}` : primaryId;
  }, [students, editingStudent]);

  const generateInitialPassword = (studentName: string) => {
      const initials = studentName.split(/\s+/).map(p => p[0]?.toLowerCase() || '').join('');
      const rand = Math.floor(100 + Math.random() * 900);
      return `${initials}${rand}`;
  };

  const filteredStudents = useMemo(() => {
    let result = students;
    if (selectedSpecificClass) {
        const [className, classMedium] = selectedSpecificClass.split('|');
        result = result.filter(s => s.className === className && (s.medium || 'English') === classMedium);
    }
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        result = result.filter(s => s.name.toLowerCase().includes(q) || s.rollNo.includes(q));
    }
    return result.sort((a, b) => (parseInt(a.rollNo) || 0) - (parseInt(b.rollNo) || 0));
  }, [students, selectedSpecificClass, searchQuery]);

  // Infinite scroll logic for DOM performance
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 300) {
        setVisibleCount(prev => Math.min(prev + 25, filteredStudents.length));
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [filteredStudents.length]);

  // Reset visibility when search or class changes
  useEffect(() => {
    setVisibleCount(25);
    window.scrollTo(0, 0);
  }, [searchQuery, selectedSpecificClass]);

  const visibleStudents = useMemo(() => filteredStudents.slice(0, visibleCount), [filteredStudents, visibleCount]);

  const handleOpenModal = useCallback((student?: Student) => {
    setErrors({});
    if (student) {
      setEditingStudent(student);
      setName(student.name);
      setRollNo(student.rollNo);
      setFormClassName(student.className);
      setDob(student.dob || '');
      setPlaceOfBirth(student.placeOfBirth || '');
      setPhone(student.phone || '');
      setAlternatePhone(student.alternatePhone || '');
      setAddress(student.address || '');
      setMedium(student.medium || 'English');
      setCustomValues(student.customFields || {});
      const creds = users.find(u => u.linkedStudentId === student.id && u.role === 'student');
      setPassword(creds ? creds.password : '');
    } else {
      setEditingStudent(null);
      setName('');
      setRollNo('');
      setDob('');
      setPlaceOfBirth('');
      setPhone('');
      setAlternatePhone('');
      setAddress('');
      setFormClassName(selectedSpecificClass ? selectedSpecificClass.split('|')[0] : 'Class 1');
      setMedium(selectedSpecificClass ? (selectedSpecificClass.split('|')[1] as any) : 'English');
      setCustomValues({});
      setPassword('');
    }
    setIsModalOpen(true);
  }, [selectedSpecificClass, users]);

  const handleSave = () => {
    const trimmedName = name.trim();
    const trimmedRollNo = rollNo.trim();
    const trimmedPhone = phone.trim();
    const newErrors: Record<string, string> = {};

    if (!trimmedName || trimmedName.split(/\s+/).length < 2) newErrors.name = "Full Name required.";
    if (!formClassName) newErrors.className = "Class required.";
    if (!trimmedRollNo) newErrors.rollNo = "Roll No required.";
    if (!/^\d{10}$/.test(trimmedPhone)) newErrors.phone = "10-digit phone required.";

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }

    const studentId = generateId(trimmedName, dob);
    const finalPassword = password || generateInitialPassword(trimmedName);

    if (editingStudent) {
      setStudents(prev => prev.map(s => s.id === editingStudent.id ? { 
        ...s, id: studentId, name: trimmedName, rollNo: trimmedRollNo, className: formClassName,
        dob, placeOfBirth, phone: trimmedPhone, alternatePhone, address, medium, customFields: customValues
      } : s));
      setUsers(prev => {
          const ex = prev.find(u => u.linkedStudentId === editingStudent.id);
          if (ex) return prev.map(u => u.id === ex.id ? { ...u, username: studentId, password: finalPassword } : u);
          return [...prev, { id: crypto.randomUUID(), username: studentId, password: finalPassword, name: trimmedName, role: 'student', linkedStudentId: studentId }];
      });
    } else {
      setStudents(prev => [...prev, { id: studentId, name: trimmedName, rollNo: trimmedRollNo, className: formClassName, dob, placeOfBirth, phone: trimmedPhone, alternatePhone, address, medium, customFields: customValues }]);
      setUsers(prev => [...prev, { id: crypto.randomUUID(), username: studentId, password: finalPassword, name: trimmedName, role: 'student', linkedStudentId: studentId }]);
    }
    setIsModalOpen(false);
  };
  
  const handleDelete = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('Delete student and login credentials?')) {
      setStudents(prev => prev.filter(s => s.id !== id));
      setUsers(prev => prev.filter(u => u.linkedStudentId !== id));
    }
  }, [setStudents, setUsers]);

  const handleExportExcel = () => {
    const exportData = students.map(s => ({
        'Full Name': s.name, 'Roll No': s.rollNo, 'Class': s.className, 'Medium': s.medium || 'English',
        'DOB': s.dob, 'Place of Birth': s.placeOfBirth || '', 'Phone': s.phone, 'Address': s.address,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, `Students_Export.xlsx`);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]) as any[];
      const newStudents: Student[] = [];
      const newUsers: User[] = [];
      jsonData.forEach((row) => {
        const name = row['Full Name'] || row['Name'];
        if (!name) return;
        const sid = generateId(name, String(row['DOB'] || ''));
        newStudents.push({
          id: sid, name, rollNo: String(row['Roll No'] || ''), className: row['Class'] || 'Class 1',
          medium: row['Medium'] || 'English', dob: String(row['DOB'] || ''), phone: String(row['Phone'] || ''), address: String(row['Address'] || '')
        });
        newUsers.push({ id: crypto.randomUUID(), username: sid, password: generateInitialPassword(name), name, role: 'student', linkedStudentId: sid });
      });
      setStudents(prev => [...prev, ...newStudents]);
      setUsers(prev => [...prev, ...newUsers]);
      alert(`Imported ${newStudents.length} students.`);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx, .xls" className="hidden" />

      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
              <div><h2 className="text-lg sm:text-xl font-bold text-slate-800">Students</h2><p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Management & Admissions ({filteredStudents.length} Records)</p></div>
              <div className="flex items-center gap-2">
                  <button onClick={handleExportExcel} className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-indigo-600 flex items-center justify-center hover:bg-slate-50 transition-all"><ArrowUpFromLine size={20} /></button>
                  <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-emerald-600 flex items-center justify-center hover:bg-slate-50 transition-all"><ArrowDownToLine size={20} /></button>
                  <button onClick={() => handleOpenModal()} className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-all ml-1"><Plus size={24} /></button>
              </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Search thousands of students..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" /></div>
              <select value={selectedSpecificClass} onChange={(e) => setSelectedSpecificClass(e.target.value)} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500">
                  <option value="">All Classes</option>
                  {SPECIFIC_CLASSES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
          </div>
        </div>
      </div>

      <div className="space-y-3">
         {visibleStudents.length === 0 ? (
            <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border border-dashed border-slate-200">No students found matching your criteria.</div>
         ) : (
            <>
                {visibleStudents.map(student => (
                    <StudentRow 
                        key={student.id} 
                        student={student} 
                        isExpanded={expandedStudentId === student.id}
                        onToggle={setExpandedStudentId}
                        onEdit={handleOpenModal}
                        onDelete={handleDelete}
                        credentials={users.find(u => u.linkedStudentId === student.id && u.role === 'student')}
                    />
                ))}
                {visibleCount < filteredStudents.length && (
                    <div className="py-8 flex flex-col items-center text-slate-400 gap-2">
                        <Loader2 className="animate-spin" size={20} />
                        <span className="text-xs font-bold uppercase tracking-widest">Loading more records...</span>
                    </div>
                )}
            </>
         )}
      </div>
      
      {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4">
             <div className="bg-white rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[92vh] overflow-y-auto border border-slate-200">
                <div className="flex justify-between items-center mb-8">
                    <div><h3 className="text-2xl font-black text-slate-800 tracking-tight">{editingStudent ? 'Edit Profile' : 'New Admission'}</h3><p className="text-xs text-slate-500 uppercase font-bold mt-1">Academic Cycle 2024-25</p></div>
                    <button onClick={() => setIsModalOpen(false)} className="p-3 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X size={24}/></button>
                </div>
                <div className="space-y-8 pb-10">
                    <section className="space-y-5">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2"><GraduationCap size={18} className="text-indigo-600"/><h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Personal Details</h4></div>
                        <div><label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">Student Full Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl text-base font-bold outline-none focus:ring-4 focus:ring-indigo-50 ${errors.name ? 'border-rose-400' : 'border-slate-100 focus:border-indigo-500'}`} placeholder="e.g. Rahul Patil"/></div>
                        <div className="grid grid-cols-2 gap-4">
                             <div><label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">Roll No</label><input type="number" value={rollNo} onChange={(e) => setRollNo(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-base font-bold outline-none focus:border-indigo-500"/></div>
                             <div><label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">Primary Phone</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-base font-bold outline-none focus:border-indigo-500" placeholder="10 Digits"/></div>
                        </div>
                    </section>
                </div>
                <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-slate-100 flex gap-3">
                    <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-500 bg-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button>
                    <button onClick={handleSave} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">{editingStudent ? 'Update Profile' : 'Confirm Admission'}</button>
                </div>
             </div>
          </div>
      )}
    </div>
  );
};

export default StudentManager;
