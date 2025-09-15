import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    doc, 
    addDoc, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    onSnapshot, 
    serverTimestamp,
    getDoc
} from 'firebase/firestore';

// --- Helper Functions (ฟังก์ชันช่วย) ---
const formatCurrency = (amount, compact = false) => {
    if (typeof amount !== 'number') return 'N/A';
    const options = { 
        style: 'currency', 
        currency: 'THB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    };
    if (compact) {
        options.notation = 'compact';
    }
    return new Intl.NumberFormat('th-TH', options).format(amount);
};

// --- Icon Components (คอมโพเนนต์ไอคอน) ---
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const ReceiptIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const CashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const ChartBarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const CogIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-6-6h6a6 6 0 00-6 6z" /></svg>;
const ArrowUturnLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>;
const BanknotesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.75A.75.75 0 013 4.5h.75m0 0h.75A.75.75 0 015.25 6v.75m0 0v.75A.75.75 0 014.5 8.25h-.75m0 0h.75a.75.75 0 01.75.75v.75m0 0v.75A.75.75 0 013.75 11.25h-.75m0 0v.75A.75.75 0 013 12.75h.75m0 0h.75a.75.75 0 01.75.75v.75m0 0v.75a.75.75 0 01-.75.75h-.75m0 0H3.75m0 0h-.75a.75.75 0 01-.75-.75V15m0 0V9.75m0 0l1.25-1.25a.75.75 0 011.06 0l1.25 1.25m-2.5 0h2.5m7.5 0l-1.25-1.25a.75.75 0 00-1.06 0l-1.25 1.25m2.5 0h-2.5m1.5 0l-1.25-1.25a.75.75 0 00-1.06 0l-1.25 1.25m2.5 0h-2.5m7.5 0l-1.25-1.25a.75.75 0 00-1.06 0l-1.25 1.25m2.5 0h-2.5m1.5 0l-1.25-1.25a.75.75 0 00-1.06 0l-1.25 1.25m2.5 0h-2.5" /></svg>;
const PaperClipIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>;
const PencilIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const DocumentReportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;


// --- Main App Component ---
export default function App() {
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [firebaseConfig, setFirebaseConfig] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [pettyCash, setPettyCash] = useState({ balance: 0, refillRequests: [] });
    const [settings, setSettings] = useState({ expenseThreshold: 5000 });

    const [loggedInUser, setLoggedInUser] = useState(null);
    const [activeView, setActiveView] = useState('dashboard');
    const [selectedProjectId, setSelectedProjectId] = useState(null);

    useEffect(() => {
        try {
            const config = {
              apiKey: "AIzaSyBMPieOXmB71LiZ_UN51rGfwZCar0iCMaQ",
              authDomain: "project-expense-app.firebaseapp.com",
              projectId: "project-expense-app",
              storageBucket: "project-expense-app.firebasestorage.app",
              messagingSenderId: "111177302835",
              appId: "1:111177302835:web:8c5cc1cd2e46887a02f446"
            };
            setFirebaseConfig(config);

            const app = initializeApp(config);
            const authInstance = getAuth(app);
            const dbInstance = getFirestore(app);
            setDb(dbInstance);
            setAuth(authInstance);

            const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
                if (user) {
                    const userDocRef = doc(dbInstance, "users", user.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        setLoggedInUser({ id: user.uid, uid: user.uid, ...userDocSnap.data() });
                    } else {
                        console.error("No user profile found for UID:", user.uid);
                        await signOut(authInstance);
                        setLoggedInUser(null);
                    }
                } else {
                    setLoggedInUser(null);
                }
                setIsLoading(false);
            });
            return () => unsubscribe();
        } catch (error) {
            console.error("Firebase initialization error:", error);
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // เพิ่มเงื่อนไข && loggedInUser เพื่อให้แน่ใจว่าเริ่มดึงข้อมูลเมื่อผู้ใช้ login แล้วเท่านั้น
        if (db && loggedInUser) {
            const processSnapshot = (snapshot) => {
                return snapshot.docs.map(docSnapshot => {
                    const data = docSnapshot.data();
                    return {
                        id: docSnapshot.id,
                        ...data,
                        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : data.createdAt || '',
                        closedAt: data.closedAt?.toDate ? data.closedAt.toDate().toISOString().split('T')[0] : data.closedAt || null,
                    };
                });
            };

            const unsubscribers = [
                onSnapshot(collection(db, "users"), snapshot => setUsers(processSnapshot(snapshot)), err => console.error("Error fetching users:", err)),
                onSnapshot(collection(db, "projects"), snapshot => setProjects(processSnapshot(snapshot)), err => console.error("Error fetching projects:", err)),
                onSnapshot(collection(db, "expenses"), snapshot => setExpenses(processSnapshot(snapshot)), err => console.error("Error fetching expenses:", err)),
                onSnapshot(doc(db, "companyData", "pettyCash"), docSnapshot => { if (docSnapshot.exists()) setPettyCash({ id: docSnapshot.id, ...docSnapshot.data() }); }, err => console.error("Error fetching petty cash:", err)),
                onSnapshot(doc(db, "companyData", "settings"), docSnapshot => { if (docSnapshot.exists()) setSettings({ id: docSnapshot.id, ...docSnapshot.data() }); }, err => console.error("Error fetching settings:", err))
            ];
            
            return () => unsubscribers.forEach(unsub => unsub());
        }
    }, [db, loggedInUser]); // เพิ่ม loggedInUser เข้าไปใน dependency array
    
    const projectDetails = useMemo(() => {
        if (!selectedProjectId) return null;
        const project = projects.find(p => p.id === selectedProjectId);
        if (!project) return null;

        const projectExpenses = expenses.filter(e => e.projectId === project.id && e.status === 'approved');
        const totalSpent = projectExpenses.reduce((sum, e) => sum + e.amount, 0);
        const remainingBudget = project.currentBudget - totalSpent;
        const profit = project.sales > 0 ? (project.sales - totalSpent) : null;

        return { ...project, allExpenses: expenses.filter(e => e.projectId === project.id), totalSpent, remainingBudget, profit };
    }, [selectedProjectId, projects, expenses]);
    
    const handleLogout = async () => {
        if (auth) {
            try {
                await signOut(auth);
            } catch (error) {
                console.error("Error signing out:", error);
            }
        }
    };

    const navigate = (view, projectId = null) => {
        setActiveView(view);
        setSelectedProjectId(projectId);
    };

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center font-sans text-lg">กำลังโหลดข้อมูล...</div>;
    }

    if (!loggedInUser) {
        return <LoginScreen auth={auth} />;
    }

    const hasPermission = (requiredRoles) => requiredRoles.includes(loggedInUser.role);
    const dbProps = { db, auth, currentUser: loggedInUser, firebaseConfig };

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <aside className="w-64 bg-gray-800 text-white flex flex-col">
                <div className="h-16 flex items-center justify-center text-2xl font-bold border-b border-gray-700">
                    <span>ProjectFlow</span>
                </div>
                <nav className="flex-1 px-4 py-4 space-y-2">
                    <SidebarButton icon={<ChartBarIcon />} text="Dashboard" onClick={() => navigate('dashboard')} active={activeView === 'dashboard'} />
                    <SidebarButton icon={<BriefcaseIcon />} text="โปรเจค" onClick={() => navigate('projects')} active={activeView === 'projects' || activeView === 'project-details'} />
                    {(hasPermission(['owner'])) && (<SidebarButton icon={<DocumentReportIcon />} text="รายงาน" onClick={() => navigate('reports')} active={activeView === 'reports'} />)}
                    {(hasPermission(['accountant', 'owner'])) && (<SidebarButton icon={<ReceiptIcon />} text="รายจ่ายทั้งหมด" onClick={() => navigate('expenses')} active={activeView === 'expenses'} />)}
                    {(hasPermission(['accountant', 'owner'])) && (<SidebarButton icon={<ArrowUturnLeftIcon />} text="ยืนยันการคืนเงิน" onClick={() => navigate('cash-return')} active={activeView === 'cash-return'} />)}
                    {(hasPermission(['accountant', 'owner'])) && (<SidebarButton icon={<BanknotesIcon />} text="อนุมัติเบิกงบ" onClick={() => navigate('budget-request')} active={activeView === 'budget-request'} />)}
                    {(hasPermission(['accountant', 'owner'])) && (<SidebarButton icon={<CashIcon />} text="กองกลาง" onClick={() => navigate('petty-cash')} active={activeView === 'petty-cash'} />)}
                    {(hasPermission(['owner'])) && (<SidebarButton icon={<UsersIcon />} text="จัดการผู้ใช้" onClick={() => navigate('user-management')} active={activeView === 'user-management'} />)}
                    {(hasPermission(['owner'])) && (<SidebarButton icon={<CogIcon />} text="ตั้งค่า" onClick={() => navigate('settings')} active={activeView === 'settings'} />)}
                </nav>
                <div className="p-4 border-t border-gray-700">
                    <p className="text-sm">ผู้ใช้: <strong>{loggedInUser.username}</strong></p>
                    <p className="text-xs text-gray-400">สิทธิ์: {loggedInUser.role}</p>
                    <button onClick={handleLogout} className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition">
                        ออกจากระบบ
                    </button>
                </div>
            </aside>

            <main className="flex-1 p-8 overflow-y-auto">
                 {activeView === 'dashboard' && <DashboardView projects={projects} expenses={expenses} pettyCash={pettyCash} currentUser={loggedInUser} navigate={navigate} />}
                 {activeView === 'projects' && <ProjectsView users={users} projects={projects} expenses={expenses} {...dbProps} navigate={navigate} />}
                 {activeView === 'reports' && hasPermission(['owner']) && <ReportsView projects={projects} expenses={expenses} users={users} />}
                 {activeView === 'project-details' && <ProjectDetailsView projectDetails={projectDetails} users={users} navigate={navigate} expenses={expenses} settings={settings} projects={projects} pettyCash={pettyCash} {...dbProps}  />}
                 {activeView === 'expenses' && hasPermission(['accountant', 'owner']) && <ExpensesView users={users} expenses={expenses} projects={projects} pettyCash={pettyCash} settings={settings} {...dbProps} />}
                 {activeView === 'cash-return' && hasPermission(['accountant', 'owner']) && <CashReturnView projects={projects} pettyCash={pettyCash} users={users} expenses={expenses} {...dbProps} />}
                 {activeView === 'budget-request' && hasPermission(['accountant', 'owner']) && <BudgetRequestView projects={projects} pettyCash={pettyCash} users={users} {...dbProps} />}
                 {activeView === 'petty-cash' && hasPermission(['accountant', 'owner']) && <PettyCashView pettyCash={pettyCash} {...dbProps} />}
                 {activeView === 'user-management' && hasPermission(['owner']) && <UserManagementView users={users} {...dbProps} />}
                 {activeView === 'settings' && hasPermission(['owner']) && <SettingsView settings={settings} {...dbProps} />}
            </main>
        </div>
    );
}

function SidebarButton({ icon, text, onClick, active }) {
    return (
        <button onClick={onClick} className={`w-full flex items-center px-4 py-2 rounded-lg transition ${active ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
            {icon}
            <span>{text}</span>
        </button>
    );
}

function LoginScreen({ auth }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        if (!auth) {
            setError("Authentication service is not ready.");
            return;
        }
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
            console.error("Login Error:", err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
            <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-sm">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">ProjectFlow</h1>
                <p className="text-center text-gray-500 mb-8">กรุณาเข้าสู่ระบบ</p>
                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label className="block text-gray-700 font-semibold mb-2">อีเมล</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            className="w-full px-3 py-2 border rounded-lg font-sans" 
                            required 
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 font-semibold mb-2">รหัสผ่าน</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            className="w-full px-3 py-2 border rounded-lg font-sans" 
                            required 
                        />
                    </div>
                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                        เข้าสู่ระบบ
                    </button>
                </form>
            </div>
        </div>
    );
}

// --- Status Badge, Chart Components... (no changes, keeping for brevity) ---
function StatusBadge({ status, type = 'default', tooltip = '' }) {
    const statusStyles = {
        default: {
            pending_approval: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            closed: 'bg-gray-200 text-gray-800',
            budget_increase_pending: 'bg-blue-100 text-blue-800',
            pending_reopen_approval: 'bg-purple-100 text-purple-800',
            pending_cash_return: 'bg-orange-100 text-orange-800',
            pending_budget_return: 'bg-indigo-100 text-indigo-800',
        },
        verification: {
            pending_verification: 'bg-yellow-100 text-yellow-800',
            verified: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
        }
    };
    const statusText = {
        default: {
            pending_approval: 'รออนุมัติ', approved: 'อนุมัติแล้ว', closed: 'ปิดโปรเจค',
            budget_increase_pending: 'รออนุมัติเพิ่มงบ', pending_reopen_approval: 'รออนุมัติเปิดใหม่',
            pending_cash_return: 'รอคืนเงิน', pending_budget_return: 'รออนุมัติเบิกงบ',
        },
        verification: {
            pending_verification: 'รอตรวจสอบ', verified: 'ตรวจสอบแล้ว', rejected: 'ไม่ผ่าน',
        }
    }
    return (
        <span title={tooltip} className={`px-2 py-1 text-xs font-medium rounded-full ${tooltip ? 'cursor-help' : ''} ${statusStyles[type][status]}`}>
            {statusText[type][status] || status}
        </span>
    );
}
function ChartCard({ title, children }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-md h-96 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
            <div className="flex-grow">{children}</div>
        </div>
    );
}
function ProjectStatusPieChart({ data, statusTextMap, statusColors }) {
    const total = data.reduce((sum, item) => sum + item.count, 0);
    if (total === 0) return <div className="flex items-center justify-center h-full text-gray-500">ไม่มีข้อมูลโปรเจค</div>;
    let cumulativePercent = 0;
    const gradients = data.map(item => {
        const percent = (item.count / total) * 100;
        const start = cumulativePercent;
        cumulativePercent += percent;
        const end = cumulativePercent;
        return `${statusColors[item.status]} ${start}% ${end}%`;
    });
    return (
        <div className="flex items-center justify-center h-full space-x-8">
            <div className="relative w-48 h-48 rounded-full" style={{ background: `conic-gradient(${gradients.join(', ')})` }}></div>
            <div className="text-sm">
                <h4 className="font-bold mb-2">สถานะทั้งหมด ({total})</h4>
                <ul>
                    {data.map(item => (
                        <li key={item.status} className="flex items-center mb-1">
                            <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: statusColors[item.status] }}></span>
                            <span>{statusTextMap[item.status]}:</span>
                            <span className="font-semibold ml-1">{item.count}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
function MonthlyExpensesBarChart({ data }) {
     if (data.length === 0) return <div className="flex items-center justify-center h-full text-gray-500">ไม่มีข้อมูลค่าใช้จ่าย</div>;
    const maxAmount = data.length > 0 ? Math.max(...data.map(d => d.amount)) : 1;
    return (
        <div className="w-full h-full flex items-end justify-around space-x-2 px-4">
            {data.map(item => (
                <div key={item.month} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-blue-500 rounded-t-md hover:bg-blue-600 transition-colors"
                        style={{ height: `${(item.amount / maxAmount) * 100}%` }}
                        title={`${item.month}: ${formatCurrency(item.amount)}`}>
                    </div>
                    <span className="text-xs text-gray-500 mt-1">{item.month}</span>
                </div>
            ))}
        </div>
    );
}
function TopProjectsBarChart({ data }) {
    if (data.length === 0) return <div className="flex items-center justify-center h-full text-gray-500">ไม่มีข้อมูล</div>;
    const maxAmount = data.length > 0 ? Math.max(...data.map(p => Math.abs(p.spent))) : 1;
    return (
        <div className="space-y-3 pr-4">
            {data.map(project => (
                <div key={project.id} className="grid grid-cols-3 items-center gap-2">
                    <span className="text-sm text-gray-600 truncate" title={project.name}>{project.name}</span>
                    <div className="col-span-2 bg-gray-200 rounded-full h-6">
                        <div className={`h-6 rounded-full flex items-center justify-end px-2 text-white text-xs font-medium ${project.spent >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${(Math.abs(project.spent) / maxAmount) * 100}%` }}>
                           {formatCurrency(project.spent, true)}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// --- Views (Dashboard, Projects, etc.) ---
function DashboardView({ projects, expenses, pettyCash, currentUser, navigate }) {
    const isOwner = currentUser.role === 'owner';
    const projectsForStats = isOwner ? projects : projects.filter(p => p.createdBy === currentUser.id);
    const expensesForStats = isOwner ? expenses.filter(e => e.status === 'approved') : expenses.filter(e => e.createdBy === currentUser.id && e.status === 'approved');

    const projectStatusData = useMemo(() => {
        const counts = projectsForStats.reduce((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {});
        return Object.keys(counts).map(status => ({ status, count: counts[status] }));
    }, [projectsForStats]);

    const monthlyExpensesData = useMemo(() => {
        const months = expensesForStats.reduce((acc, e) => {
            if (!e.createdAt) return acc;
            const month = e.createdAt.substring(0, 7);
            if (!acc[month]) acc[month] = 0;
            acc[month] += e.amount;
            return acc;
        }, {});
        return Object.keys(months).map(month => ({ month, amount: months[month] })).sort((a,b) => a.month.localeCompare(b.month));
    }, [expensesForStats]);

    const topProjectsData = useMemo(() => {
        const projectSpending = expensesForStats.reduce((acc, e) => {
            if (e.projectId) { if (!acc[e.projectId]) acc[e.projectId] = 0; acc[e.projectId] += e.amount; }
            return acc;
        }, {});
        return Object.keys(projectSpending).map(projectId => ({
            id: projectId, name: projects.find(p => p.id === projectId)?.name || 'Unknown', spent: projectSpending[projectId]
        })).sort((a, b) => b.spent - a.spent).slice(0, 5);
    }, [expensesForStats, projects]);
    
    const statusTextMap = {
        pending_approval: 'รออนุมัติ', approved: 'อนุมัติแล้ว', closed: 'ปิดโปรเจค',
        budget_increase_pending: 'รอเพิ่มงบ', pending_reopen_approval: 'รอเปิดใหม่',
        pending_cash_return: 'รอคืนเงิน', pending_budget_return: 'รอเบิกงบ',
    };
    const statusColors = {
        pending_approval: '#FBBF24', approved: '#34D399', closed: '#9CA3AF',
        budget_increase_pending: '#60A5FA', pending_reopen_approval: '#A78BFA',
        pending_cash_return: '#F97316', pending_budget_return: '#818CF8',
    };

    const needsOwnerApprovalProjects = projects.filter(p => ['pending_approval', 'budget_increase_pending', 'pending_reopen_approval'].includes(p.status));
    const needsOwnerApprovalExpenses = expenses.filter(e => e.status === 'pending_approval');
    const needsOwnerApprovalPettyCash = (pettyCash.refillRequests || []).filter(r => r.status === 'pending_approval');
    const needsAccountantVerification = expenses.filter(e => e.verifiedStatus === 'pending_verification' && e.status === 'approved');
    const needsCashReturnConfirmation = projects.filter(p => p.status === 'pending_cash_return');
    const needsBudgetReturnApproval = projects.filter(p => p.status === 'pending_budget_return');
    const projectsNeedingBudgetReturnRequest = projects.filter(p => p.createdBy === currentUser.id && p.status === 'approved' && (p.reopenBudgetRequired || 0) > 0);
    const myRejectedExpenses = expenses.filter(e => e.createdBy === currentUser.id && e.verifiedStatus === 'rejected');
    const hasPettyCashAccess = ['accountant', 'owner'].includes(currentUser.role);

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2"><ChartCard title="ค่าใช้จ่ายรายเดือน"><MonthlyExpensesBarChart data={monthlyExpensesData} /></ChartCard></div>
                <div><ChartCard title="สัดส่วนสถานะโปรเจค"><ProjectStatusPieChart data={projectStatusData} statusTextMap={statusTextMap} statusColors={statusColors}/></ChartCard></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2"><ChartCard title="5 โปรเจคที่ใช้งบประมาณสูงสุด"><TopProjectsBarChart data={topProjectsData} /></ChartCard></div>
                {hasPettyCashAccess && (<div className="bg-white p-6 rounded-xl shadow-md flex flex-col justify-center items-center">
                    <h3 className="text-xl font-semibold text-gray-500">เงินกองกลางคงเหลือ</h3>
                    <p className="text-6xl font-bold text-green-600 my-4">{formatCurrency(pettyCash.balance)}</p>
                </div>)}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">รายการที่ต้องดำเนินการ</h2>
            <div className="space-y-4">
                {currentUser.role === 'employee' && (
                    <>
                        {projectsNeedingBudgetReturnRequest.length > 0 && <ActionItemCard title="โปรเจคที่ต้องร้องของบประมาณคืน" count={projectsNeedingBudgetReturnRequest.length} color="indigo" onClick={() => navigate('projects')} />}
                        {myRejectedExpenses.length > 0 && <ActionItemCard title="รายจ่ายที่ไม่ผ่านการตรวจสอบ" count={myRejectedExpenses.length} color="red" onClick={() => navigate('projects')} />}
                        {projectsNeedingBudgetReturnRequest.length === 0 && myRejectedExpenses.length === 0 && <p className="text-gray-500">ไม่มีรายการที่ต้องดำเนินการ</p>}
                    </>
                )}
                {currentUser.role === 'accountant' && (
                     <>
                        {needsBudgetReturnApproval.length > 0 && <ActionItemCard title="คำขอเบิกงบประมาณโปรเจค" count={needsBudgetReturnApproval.length} color="indigo" onClick={() => navigate('budget-request')} />}
                        {needsCashReturnConfirmation.length > 0 && <ActionItemCard title="โปรเจคที่ต้องยืนยันการคืนเงิน" count={needsCashReturnConfirmation.length} color="orange" onClick={() => navigate('cash-return')} />}
                        {needsAccountantVerification.length > 0 && <ActionItemCard title="รายจ่ายที่ต้องตรวจสอบ" count={needsAccountantVerification.length} color="blue" onClick={() => navigate('expenses')} />}
                        {projects.filter(p => p.status === 'pending_approval' && p.createdBy === currentUser.id).length > 0 && <ActionItemCard title="โปรเจคของฉันที่รออนุมัติ" count={projects.filter(p => p.status === 'pending_approval' && p.createdBy === currentUser.id).length} onClick={() => navigate('projects')} />}
                        {expenses.filter(e => e.status === 'pending_approval' && e.createdBy === currentUser.id).length > 0 && <ActionItemCard title="รายจ่ายของฉันที่รออนุมัติ" count={expenses.filter(e => e.status === 'pending_approval' && e.createdBy === currentUser.id).length} onClick={() => navigate('projects')} />}
                        {needsBudgetReturnApproval.length === 0 && needsCashReturnConfirmation.length === 0 && needsAccountantVerification.length === 0 && projects.filter(p => p.status === 'pending_approval' && p.createdBy === currentUser.id).length === 0 && expenses.filter(e => e.status === 'pending_approval' && e.createdBy === currentUser.id).length === 0 && <p className="text-gray-500">ไม่มีรายการที่ต้องดำเนินการ</p>}
                     </>
                )}
                {currentUser.role === 'owner' && (
                     <>
                        {needsOwnerApprovalProjects.length > 0 && <ActionItemCard title="โปรเจคที่ต้องอนุมัติ/เพิ่มงบ/เปิดใหม่" count={needsOwnerApprovalProjects.length} color="green" onClick={() => navigate('projects')} />}
                        {needsOwnerApprovalExpenses.length > 0 && <ActionItemCard title="รายจ่ายที่ต้องอนุมัติ" count={needsOwnerApprovalExpenses.length} color="green" onClick={() => navigate('expenses')} />}
                        {needsOwnerApprovalPettyCash.length > 0 && <ActionItemCard title="คำขอเบิกกองกลาง" count={needsOwnerApprovalPettyCash.length} color="green" onClick={() => navigate('petty-cash')} />}
                        {needsBudgetReturnApproval.length > 0 && <ActionItemCard title="คำขอเบิกงบประมาณโปรเจค" count={needsBudgetReturnApproval.length} color="indigo" onClick={() => navigate('budget-request')} />}
                        {needsCashReturnConfirmation.length > 0 && <ActionItemCard title="โปรเจคที่ต้องยืนยันการคืนเงิน" count={needsCashReturnConfirmation.length} color="orange" onClick={() => navigate('cash-return')} />}
                        {needsAccountantVerification.length > 0 && <ActionItemCard title="รายจ่ายที่ต้องตรวจสอบ" count={needsAccountantVerification.length} color="blue" onClick={() => navigate('expenses')} />}
                        {needsOwnerApprovalProjects.length === 0 && needsOwnerApprovalExpenses.length === 0 && needsOwnerApprovalPettyCash.length === 0 && needsAccountantVerification.length === 0 && needsCashReturnConfirmation.length === 0 && needsBudgetReturnApproval.length === 0 && <p className="text-gray-500">ไม่มีรายการที่ต้องดำเนินการ</p>}
                     </>
                )}
            </div>
        </div>
    );
}
function ActionItemCard({ title, count, onClick, color = 'yellow' }) {
    const colors = { yellow: 'border-yellow-400 bg-yellow-50 hover:bg-yellow-100', blue: 'border-blue-400 bg-blue-50 hover:bg-blue-100', green: 'border-green-400 bg-green-50 hover:bg-green-100', orange: 'border-orange-400 bg-orange-50 hover:bg-orange-100', indigo: 'border-indigo-400 bg-indigo-50 hover:bg-indigo-100', red: 'border-red-400 bg-red-50 hover:bg-red-100' };
    return ( <div onClick={onClick} className={`p-4 rounded-lg border-l-4 cursor-pointer transition ${colors[color]}`}> <div className="flex justify-between items-center"> <p className="font-semibold text-gray-700">{title}</p> <span className="font-bold text-xl text-gray-800">{count}</span> </div> </div> );
}

function ProjectsView({ users, projects, expenses, currentUser, navigate, db }) {
    const [showModal, setShowModal] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectCost, setNewProjectCost] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const handleCreateProject = async (e) => {
        e.preventDefault();
        if(!newProjectName || !newProjectCost || parseFloat(newProjectCost) <= 0) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง');
            return;
        }
        const newProject = {
            name: newProjectName, initialCost: parseFloat(newProjectCost), currentBudget: parseFloat(newProjectCost),
            status: 'pending_approval', createdBy: currentUser.id, createdAt: serverTimestamp(), closedAt: null, sales: 0,
        };
        try {
            await addDoc(collection(db, "projects"), newProject);
            setShowModal(false); setNewProjectName(''); setNewProjectCost('');
        } catch (error) { console.error("Error creating project:", error); alert("Failed to create project."); }
    }
    
    const processedProjects = useMemo(() => {
        const roleFilteredProjects = currentUser.role === 'owner' ? projects : projects.filter(p => p.createdBy === currentUser.id);
        const searchFilteredProjects = roleFilteredProjects.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        const statusFilteredProjects = statusFilter === 'all' ? searchFilteredProjects : searchFilteredProjects.filter(p => p.status === statusFilter);
        const sortedProjects = [...statusFilteredProjects].sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
        return sortedProjects.map(p => {
            const spent = expenses.filter(e => e.projectId === p.id && e.status === 'approved').reduce((sum, e) => sum + e.amount, 0);
            const remaining = p.currentBudget - spent;
            const creator = users.find(u => u.id === p.createdBy);
            return {...p, spent, remaining, creatorName: creator ? creator.username : 'N/A'};
        });
    }, [projects, expenses, currentUser, users, searchTerm, statusFilter]);

    const totalPages = Math.ceil(processedProjects.length / itemsPerPage);
    const paginatedProjects = processedProjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const isOwner = currentUser.role === 'owner';
    
    useEffect(() => { setCurrentPage(1); }, [searchTerm, itemsPerPage, statusFilter]);

    const statusOptions = { all: 'ทุกสถานะ', pending_approval: 'รออนุมัติ', approved: 'อนุมัติแล้ว', closed: 'ปิดโปรเจค', budget_increase_pending: 'รออนุมัติเพิ่มงบ', pending_reopen_approval: 'รออนุมัติเปิดใหม่', pending_cash_return: 'รอคืนเงิน', pending_budget_return: 'รออนุมัติเบิกงบ' };

    return (
         <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">โปรเจคทั้งหมด</h1>
                {['employee', 'accountant', 'owner'].includes(currentUser.role) && (
                    <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition">+ สร้างโปรเจคใหม่</button>
                )}
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <input type="text" placeholder="ค้นหาชื่อโปรเจค..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-4 py-2 border rounded-lg w-full md:w-64 font-sans" />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-lg bg-white w-full md:w-auto font-sans">
                        {Object.entries(statusOptions).map(([value, label]) => (<option key={value} value={value}>{label}</option>))}
                    </select>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-gray-600">แสดง:</span>
                    <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="px-4 py-2 border rounded-lg bg-white font-sans">
                        <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option><option value={100}>100</option>
                    </select>
                     <span className="text-gray-600">รายการต่อหน้า</span>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
                 <div className={`grid ${isOwner ? 'grid-cols-6' : 'grid-cols-5'} gap-4 font-bold text-gray-500 px-4 py-2 border-b`}>
                    <div>ชื่อโปรเจค</div>{isOwner && <div>ผู้ดูแล</div>}<div className="text-right">งบประมาณ</div><div className="text-right">ใช้ไป</div><div className="text-right">คงเหลือ</div><div className="text-center">สถานะ</div>
                </div>
                {paginatedProjects.map(p => (
                    <div key={p.id} onClick={() => navigate('project-details', p.id)} className={`grid ${isOwner ? 'grid-cols-6' : 'grid-cols-5'} gap-4 items-center px-4 py-4 border-b hover:bg-gray-50 cursor-pointer rounded-lg`}>
                        <div className="font-semibold">{p.name}</div>
                        {isOwner && <div className="text-sm text-gray-600">{p.creatorName}</div>}
                        <div className="text-right">{formatCurrency(p.currentBudget)}</div>
                        <div className="text-right text-red-600">{formatCurrency(p.spent)}</div>
                        <div className="text-right text-green-600">{formatCurrency(p.remaining)}</div>
                        <div className="text-center"><StatusBadge status={p.status} /></div>
                    </div>
                ))}
                {processedProjects.length === 0 && (<p className="text-center text-gray-500 py-6">{searchTerm || statusFilter !== 'all' ? 'ไม่พบโปรเจคตามเงื่อนไข' : isOwner ? 'ไม่พบโปรเจคในระบบ' : 'ไม่พบโปรเจคที่คุณสร้าง'}</p>)}
            </div>
             {totalPages > 1 && (
                <div className="flex justify-center items-center mt-6 space-x-2">
                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">ก่อนหน้า</button>
                    <span className="text-gray-700">หน้า {currentPage} จาก {totalPages}</span>
                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">ถัดไป</button>
                </div>
            )}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4">สร้างโปรเจคใหม่</h2>
                        <form onSubmit={handleCreateProject}>
                            <div className="mb-4"><label className="block text-gray-700 font-semibold mb-2">ชื่อโปรเจค</label><input type="text" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} className="w-full px-3 py-2 border rounded-lg font-sans" required /></div>
                            <div className="mb-6"><label className="block text-gray-700 font-semibold mb-2">ต้นทุน / งบประมาณตั้งต้น</label><input type="number" value={newProjectCost} onChange={(e) => setNewProjectCost(e.target.value)} className="w-full px-3 py-2 border rounded-lg font-sans" required min="1" /></div>
                            <div className="flex justify-end space-x-4"><button type="button" onClick={() => setShowModal(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">ยกเลิก</button><button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">สร้างโปรเจค</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function ProjectDetailsView({ projectDetails, currentUser, users, navigate, expenses, settings, pettyCash, db }) {
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [showSalesModal, setShowSalesModal] = useState(false);
    const [showConfirmCloseModal, setShowConfirmCloseModal] = useState(false);
    const [deletingExpense, setDeletingExpense] = useState(null);
    const [increaseAmount, setIncreaseAmount] = useState('');
    const [salesAmount, setSalesAmount] = useState('');
    
    if (!projectDetails) return <div>กำลังโหลด... หรือไม่พบโปรเจค</div>;
    
    const projectRef = doc(db, "projects", projectDetails.id);

    const handleSaveExpense = async (expenseData) => {
        try {
            if (editingExpense) {
                await updateDoc(doc(db, "expenses", editingExpense.id), { ...expenseData, verifiedStatus: 'pending_verification', rejectionReason: '' });
            } else {
                await addDoc(collection(db, "expenses"), {
                    projectId: projectDetails.id, ...expenseData,
                    status: expenseData.amount < settings.expenseThreshold ? 'approved' : 'pending_approval',
                    verifiedStatus: 'pending_verification', rejectionReason: '',
                    createdBy: currentUser.id, createdAt: serverTimestamp(),
                });
            }
        } catch (error) { console.error("Error saving expense:", error); } 
        finally { setShowExpenseModal(false); setEditingExpense(null); }
    };

    const handleConfirmDeleteExpense = async () => {
        if (!deletingExpense) return;
        try {
            if (deletingExpense.status === 'approved' && !deletingExpense.projectId) {
                await updateDoc(doc(db, "companyData", "pettyCash"), { balance: pettyCash.balance + deletingExpense.amount });
            }
            await deleteDoc(doc(db, "expenses", deletingExpense.id));
        } catch (error) { console.error("Error deleting expense:", error); } 
        finally { setDeletingExpense(null); }
    };

    const handleProjectAction = async (action) => {
        let updateData = {};
        if (action === 'approve_project') updateData = { status: 'approved' };
        if (action === 'reopen_request') updateData = { status: 'pending_reopen_approval' };
        if (action === 'request_budget_return') updateData = { status: 'pending_budget_return' };
        await updateDoc(projectRef, updateData);
    }
    
    const handleConfirmCloseProject = async () => {
        await updateDoc(projectRef, { closedAt: serverTimestamp(), status: projectDetails.remainingBudget > 0 ? 'pending_cash_return' : 'closed' });
        setShowConfirmCloseModal(false);
    }

    const handleRequestBudgetIncrease = async (e) => {
        e.preventDefault();
        const amount = parseFloat(increaseAmount);
        if(!amount || amount <= 0) return;
        await updateDoc(projectRef, { status: 'budget_increase_pending', requestedBudget: amount });
        setShowBudgetModal(false); setIncreaseAmount('');
    }

    const handleApproveBudgetIncrease = async () => {
        await updateDoc(projectRef, { status: 'approved', currentBudget: projectDetails.currentBudget + projectDetails.requestedBudget, requestedBudget: 0 });
    }

    const handleApproveReopen = async () => {
        await updateDoc(projectRef, { status: 'approved', reopenBudgetRequired: projectDetails.remainingBudget, preCloseBudget: projectDetails.currentBudget, currentBudget: 0 });
    }
    
    const handleAddSales = async (e) => {
        e.preventDefault();
        const amount = parseFloat(salesAmount);
        if(isNaN(amount) || amount < 0) return;
        await updateDoc(projectRef, { sales: (projectDetails.sales || 0) + amount });
        setShowSalesModal(false); setSalesAmount('');
    }
    
    const visibleExpenses = useMemo(() => {
        if (!projectDetails) return [];
        const allProjectExpenses = expenses.filter(e => e.projectId === projectDetails.id)
            .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map(e => ({...e, creatorName: users.find(u => u.id === e.createdBy)?.username || 'N/A'}));
        return currentUser.role === 'owner' ? allProjectExpenses : allProjectExpenses.filter(e => e.createdBy === currentUser.id);
    }, [projectDetails, currentUser, expenses, users]);

    const canAddExpense = (['approved', 'budget_increase_pending'].includes(projectDetails.status)) && (currentUser.role === 'owner' || (projectDetails.createdBy === currentUser.id && !projectDetails.reopenBudgetRequired));
    const canRequestBudget = canAddExpense;
    const isOwner = currentUser.role === 'owner';
    const isCreator = projectDetails.createdBy === currentUser.id;
    const needsToRequestBudget = projectDetails.status === 'approved' && projectDetails.reopenBudgetRequired > 0;

    return (
        <div>
            <button onClick={() => navigate('projects')} className="text-blue-600 hover:underline mb-4">&larr; กลับไปที่โปรเจคทั้งหมด</button>
            <div className="bg-white p-8 rounded-xl shadow-md mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{projectDetails.name}</h1>
                        <div className="mt-2"><StatusBadge status={projectDetails.status} /></div>
                        {projectDetails.status === 'budget_increase_pending' && (<p className="text-blue-600 font-semibold mt-2">ร้องขอเพิ่มงบ: {formatCurrency(projectDetails.requestedBudget)}</p>)}
                        {projectDetails.status === 'pending_reopen_approval' && (<p className="text-purple-600 font-semibold mt-2">โปรเจคนี้ถูกร้องขอให้เปิดใหม่อีกครั้ง</p>)}
                        {projectDetails.status === 'pending_cash_return' && (<p className="text-orange-600 font-semibold mt-2 bg-orange-50 p-2 rounded-md">รอการยืนยันคืนเงินงบประมาณจากฝ่ายบัญชี</p>)}
                        {needsToRequestBudget && (<div className="text-indigo-600 font-semibold mt-2 bg-indigo-50 p-3 rounded-md">
                            <p className="mb-2">โปรเจคได้รับการอนุมัติให้เปิดใหม่แล้ว แต่ยังไม่มีงบประมาณ</p>
                            {(isCreator || isOwner) && (<button onClick={() => handleProjectAction('request_budget_return')} className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-1 px-3 rounded-lg text-sm">ร้องของบประมาณคืน</button>)}
                        </div>)}
                    </div>
                    <div className="flex space-x-2">
                         {isOwner && projectDetails.status === 'pending_approval' && (<button onClick={() => handleProjectAction('approve_project')} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">อนุมัติโปรเจค</button>)}
                         {isOwner && projectDetails.status === 'budget_increase_pending' && (<button onClick={handleApproveBudgetIncrease} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">อนุมัติเพิ่มงบ</button>)}
                         {isOwner && projectDetails.status === 'pending_reopen_approval' && (<button onClick={handleApproveReopen} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">อนุมัติการเปิดใหม่</button>)}
                         {(isOwner || isCreator) && ['approved', 'budget_increase_pending'].includes(projectDetails.status) && (<button onClick={() => setShowConfirmCloseModal(true)} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">ปิดโปรเจค</button>)}
                         {(isOwner || isCreator) && projectDetails.status === 'closed' && (<button onClick={() => handleProjectAction('reopen_request')} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">เปิดโปรเจคอีกครั้ง</button>)}
                    </div>
                </div>
                <div className={`mt-6 grid grid-cols-1 md:grid-cols-2 ${isOwner ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 text-center`}>
                    <div className="p-4 bg-gray-50 rounded-lg"><h4 className="text-sm font-semibold text-gray-500">งบประมาณทั้งหมด</h4><p className="text-2xl font-bold text-gray-800">{formatCurrency(projectDetails.currentBudget)}</p></div>
                    <div className="p-4 bg-gray-50 rounded-lg"><h4 className="text-sm font-semibold text-gray-500">ใช้ไปแล้ว</h4><p className="text-2xl font-bold text-red-600">{formatCurrency(projectDetails.totalSpent)}</p></div>
                    <div className="p-4 bg-gray-50 rounded-lg"><h4 className="text-sm font-semibold text-gray-500">งบประมาณคงเหลือ</h4><p className="text-2xl font-bold text-green-600">{formatCurrency(projectDetails.remainingBudget)}</p></div>
                    {isOwner && (<div className="p-4 bg-gray-50 rounded-lg"><h4 className="text-sm font-semibold text-gray-500">กำไร / ขาดทุน</h4><p className={`text-2xl font-bold ${projectDetails.profit === null ? 'text-gray-400' : projectDetails.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{projectDetails.profit !== null ? formatCurrency(projectDetails.profit) : 'N/A'}</p></div>)}
                </div>
                {isOwner && (<div className="mt-4 flex items-center justify-end"><p className="text-lg mr-4">ยอดขาย: <span className="font-bold">{formatCurrency(projectDetails.sales)}</span></p><button onClick={() => setShowSalesModal(true)} className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm py-1 px-3 rounded-lg">+ เพิ่มยอดขาย</button></div>)}
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-4">
                     <h2 className="text-2xl font-bold text-gray-800">รายการค่าใช้จ่าย</h2>
                     <div><button onClick={() => setShowBudgetModal(true)} disabled={!canRequestBudget} className="mr-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed" title={!canRequestBudget ? "คุณสามารถขอเพิ่มงบได้เฉพาะโปรเจคที่ตัวเองสร้างและมีงบประมาณ" : ""}>ขอเพิ่มงบ</button><button onClick={() => setShowExpenseModal(true)} disabled={!canAddExpense} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed" title={!canAddExpense ? "คุณสามารถเพิ่มรายจ่ายได้เฉพาะโปรเจคที่ตัวเองสร้างและมีงบประมาณ" : ""}>+ เพิ่มรายจ่าย</button></div>
                </div>
                {!isOwner && (<p className="text-sm text-gray-500 mb-4 bg-blue-50 p-2 rounded-md">หมายเหตุ: คุณจะเห็นเฉพาะรายการค่าใช้จ่ายที่คุณสร้างขึ้นเองเท่านั้น</p>)}
                <div className={`grid ${isOwner ? 'grid-cols-7' : 'grid-cols-6'} gap-4 font-bold text-gray-500 px-4 py-2 border-b`}>
                    <div>วันที่</div><div className="col-span-2">รายละเอียด</div>{isOwner && <div>ผู้สร้าง</div>}<div className="text-right">จำนวนเงิน</div><div className="text-center">สถานะ</div><div className="text-center">การดำเนินการ</div>
                </div>
                {visibleExpenses.map(e => {
                     const canEdit = currentUser.role === 'owner' || (currentUser.id === e.createdBy && e.verifiedStatus === 'rejected');
                     const canDelete = currentUser.role === 'owner' || currentUser.id === e.createdBy;
                     return(
                        <div key={e.id} className={`grid ${isOwner ? 'grid-cols-7' : 'grid-cols-6'} gap-4 items-center px-4 py-3 border-b`}>
                            <div>{e.createdAt}</div><div className="col-span-2 flex items-center">{e.description}{e.proofFileName && <span title={e.proofFileName} className="ml-2 cursor-help"><PaperClipIcon/></span>}</div>{isOwner && <div>{e.creatorName}</div>}
                            <div className="text-right">{formatCurrency(e.amount)}</div><div className="text-center space-x-2"><StatusBadge status={e.status} /><StatusBadge status={e.verifiedStatus} type="verification" tooltip={e.rejectionReason} /></div>
                            <div className="text-center space-x-2">{canEdit && <button onClick={() => { setEditingExpense(e); setShowExpenseModal(true);}} className="p-1 hover:bg-gray-200 rounded" title="แก้ไข"><PencilIcon /></button>}{canDelete && <button onClick={() => setDeletingExpense(e)} className="p-1 hover:bg-gray-200 rounded" title="ลบ"><TrashIcon /></button>}</div>
                        </div>);
                })}
                {visibleExpenses.length === 0 && <p className="text-center text-gray-500 py-4">ไม่พบรายการค่าใช้จ่าย</p>}
            </div>
            {showExpenseModal && (<ExpenseModal onClose={() => {setShowExpenseModal(false); setEditingExpense(null);}} onSave={handleSaveExpense} expense={editingExpense} settings={settings}/>)}
            {showBudgetModal && (<Modal title="ขอเพิ่มงบประมาณ" onClose={() => setShowBudgetModal(false)}><form onSubmit={handleRequestBudgetIncrease}><div className="mb-6"><label className="block text-gray-700 font-semibold mb-2">จำนวนเงินที่ต้องการขอเพิ่ม</label><input type="number" value={increaseAmount} onChange={(e) => setIncreaseAmount(e.target.value)} className="w-full px-3 py-2 border rounded-lg font-sans" required min="1" /></div><div className="flex justify-end space-x-4"><button type="button" onClick={() => setShowBudgetModal(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">ยกเลิก</button><button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">ส่งคำขอ</button></div></form></Modal>)}
            {showSalesModal && (<Modal title="เพิ่มยอดขาย" onClose={() => setShowSalesModal(false)}><form onSubmit={handleAddSales}><div className="mb-6"><label className="block text-gray-700 font-semibold mb-2">จำนวนเงิน</label><input type="number" value={salesAmount} onChange={(e) => setSalesAmount(e.target.value)} className="w-full px-3 py-2 border rounded-lg font-sans" required min="0" /></div><div className="flex justify-end space-x-4"><button type="button" onClick={() => setShowSalesModal(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">ยกเลิก</button><button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">บันทึก</button></div></form></Modal>)}
            {showConfirmCloseModal && (<Modal title="ยืนยันการปิดโปรเจค" onClose={() => setShowConfirmCloseModal(false)}><div><p className="text-gray-700 mb-4">คุณแน่ใจหรือไม่ว่าต้องการปิดโปรเจค "{projectDetails.name}"?</p>{projectDetails.remainingBudget > 0 ? (<p className="font-semibold bg-yellow-50 p-3 rounded-lg">งบประมาณคงเหลือ <span className="text-green-600">{formatCurrency(projectDetails.remainingBudget)}</span> จะถูกส่งให้ฝ่ายบัญชียืนยันเพื่อคืนเข้ากองกลาง</p>) : (<p className="font-semibold bg-gray-100 p-3 rounded-lg">โปรเจคนี้ไม่มีงบประมาณคงเหลือและจะถูกปิดทันที</p>)}<div className="flex justify-end space-x-4 mt-6"><button onClick={() => setShowConfirmCloseModal(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">ยกเลิก</button><button onClick={handleConfirmCloseProject} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">ยืนยันการปิด</button></div></div></Modal>)}
            {deletingExpense && (<Modal title="ยืนยันการลบรายจ่าย" onClose={() => setDeletingExpense(null)}><div><p className="text-gray-700 mb-4">คุณแน่ใจหรือไม่ว่าต้องการลบรายจ่าย: <span className="font-semibold">{deletingExpense.description}</span>?</p>{deletingExpense.status === 'approved' && (<p className="font-semibold bg-yellow-50 p-3 rounded-lg">การดำเนินการนี้จะคืนเงินจำนวน <span className="text-green-600">{formatCurrency(deletingExpense.amount)}</span> กลับสู่ {deletingExpense.projectId ? 'งบประมาณโปรเจค' : 'กองกลาง'}</p>)}<div className="flex justify-end space-x-4 mt-6"><button onClick={() => setDeletingExpense(null)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">ยกเลิก</button><button onClick={handleConfirmDeleteExpense} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">ยืนยันการลบ</button></div></div></Modal>)}
        </div>
    );
}

function Modal({ title, onClose, children }) {
    return ( <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"> <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md"> <div className="flex justify-between items-center mb-4"> <h2 className="text-2xl font-bold">{title}</h2> <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button> </div> {children} </div> </div> );
}

function ExpensesView({ users, expenses, projects, currentUser, pettyCash, settings, db }) {
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [rejectingExpense, setRejectingExpense] = useState(null);
    const [deletingExpense, setDeletingExpense] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [projectFilter, setProjectFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [verificationFilter, setVerificationFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const handleSaveExpense = async (expenseData) => {
        try {
            if (editingExpense) {
                await updateDoc(doc(db, "expenses", editingExpense.id), {...expenseData, verifiedStatus: 'pending_verification', rejectionReason: ''});
            } else {
                const amount = expenseData.amount;
                if (amount > pettyCash.balance) { alert(`ไม่สามารถเพิ่มรายจ่ายได้เนื่องจากเงินในกองกลางไม่เพียงพอ\nยอดคงเหลือ: ${formatCurrency(pettyCash.balance)}`); return; }
                const newExpense = { projectId: null, ...expenseData, status: 'approved', verifiedStatus: 'pending_verification', rejectionReason: '', createdBy: currentUser.id, createdAt: serverTimestamp() };
                await addDoc(collection(db, "expenses"), newExpense);
                await updateDoc(doc(db, "companyData", "pettyCash"), { balance: pettyCash.balance - amount });
            }
        } catch (error) { console.error("Error saving expense", error); } 
        finally { setShowAddModal(false); setEditingExpense(null); }
    }

    const handleVerifyExpense = async (expenseId, verification, reason = '') => {
        await updateDoc(doc(db, "expenses", expenseId), { verifiedStatus: verification, rejectionReason: reason });
        setRejectingExpense(null);
    }
    
    const handleConfirmDeleteExpense = async () => {
        if (!deletingExpense) return;
        try {
            if (deletingExpense.status === 'approved' && !deletingExpense.projectId) {
                await updateDoc(doc(db, "companyData", "pettyCash"), { balance: pettyCash.balance + deletingExpense.amount });
            }
            await deleteDoc(doc(db, "expenses", deletingExpense.id));
        } catch (error) { console.error("Error deleting expense:", error); } 
        finally { setDeletingExpense(null); }
    };
    
    const handleApproveExpense = async (expenseId) => {
        await updateDoc(doc(db, "expenses", expenseId), { status: 'approved' });
    }

    const filteredExpenses = useMemo(() => {
        return expenses.filter(e => {
            if (searchTerm && !e.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            if (projectFilter !== 'all') { if (projectFilter === 'none' && e.projectId !== null) return false; if (projectFilter !== 'none' && e.projectId !== projectFilter) return false; }
            if (statusFilter !== 'all' && e.status !== statusFilter) return false;
            if (verificationFilter !== 'all' && e.verifiedStatus !== verificationFilter) return false;
            if (startDate && e.createdAt < startDate) return false;
            if (endDate && e.createdAt > endDate) return false;
            return true;
        }).sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt))
          .map(e => ({...e, creatorName: users.find(u => u.id === e.createdBy)?.username || 'N/A'}));
    }, [expenses, searchTerm, projectFilter, statusFilter, verificationFilter, startDate, endDate, users]);

    const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
    const paginatedExpenses = filteredExpenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    useEffect(() => { setCurrentPage(1); }, [searchTerm, projectFilter, statusFilter, verificationFilter, startDate, endDate, itemsPerPage]);

    const getProjectName = (projectId) => {
        if (!projectId) return <span className="italic text-gray-500">ค่าใช้จ่ายทั่วไป</span>;
        return projects.find(p => p.id === projectId)?.name || 'ไม่พบโปรเจค';
    }
    const resetFilters = () => { setSearchTerm(''); setProjectFilter('all'); setStatusFilter('all'); setVerificationFilter('all'); setStartDate(''); setEndDate(''); setItemsPerPage(10); }

    const handleExportCSV = () => {
        const headers = ["วันที่", "โปรเจค", "รายละเอียด", "จำนวนเงิน", "ผู้สร้าง", "สถานะอนุมัติ", "สถานะการตรวจสอบ", "เหตุผลที่ไม่ผ่าน"];
        const rows = filteredExpenses.map(e => [ e.createdAt, e.projectId ? (projects.find(p => p.id === e.projectId)?.name || 'N/A') : 'ค่าใช้จ่ายทั่วไป', `"${e.description.replace(/"/g, '""')}"`, e.amount, e.creatorName, e.status, e.verifiedStatus, e.rejectionReason ? `"${e.rejectionReason.replace(/"/g, '""')}"` : '' ]);
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", "expenses_report.csv");
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    return (
         <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">รายจ่ายทั้งหมด</h1>
                <div className="flex space-x-2"><button onClick={handleExportCSV} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">Export to CSV</button><button onClick={() => { setEditingExpense(null); setShowAddModal(true);}} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">+ เพิ่มรายจ่ายนอกโปรเจค</button></div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md mb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input type="text" placeholder="ค้นหารายละเอียด..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-4 py-2 border rounded-lg w-full font-sans" />
                    <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="px-4 py-2 border rounded-lg bg-white w-full font-sans"><option value="all">ทุกโปรเจค</option><option value="none">ค่าใช้จ่ายทั่วไป</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-lg bg-white w-full font-sans"><option value="all">ทุกสถานะอนุมัติ</option><option value="approved">อนุมัติแล้ว</option><option value="pending_approval">รออนุมัติ</option></select>
                    <select value={verificationFilter} onChange={(e) => setVerificationFilter(e.target.value)} className="px-4 py-2 border rounded-lg bg-white w-full font-sans"><option value="all">ทุกสถานะการตรวจ</option><option value="verified">ตรวจสอบแล้ว</option><option value="pending_verification">รอตรวจสอบ</option><option value="rejected">ไม่ผ่าน</option></select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                    <div className="flex items-center space-x-2 col-span-2"><label className="text-gray-600">วันที่:</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-4 py-2 border rounded-lg w-full font-sans" /><span className="text-gray-600">ถึง</span><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-4 py-2 border rounded-lg w-full font-sans" /></div>
                    <div className="col-span-2 flex justify-end items-center gap-4"><button onClick={resetFilters} className="text-sm text-blue-600 hover:underline">ล้างค่า</button><div className="flex items-center space-x-2"><span className="text-gray-600">แสดง:</span><select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="px-4 py-2 border rounded-lg bg-white font-sans"><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option><option value={100}>100</option></select></div></div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="grid grid-cols-8 gap-4 font-bold text-gray-500 px-4 py-2 border-b"><div>วันที่</div><div>โปรเจค</div><div className="col-span-2">รายละเอียด</div><div className="text-right">จำนวนเงิน</div><div>ผู้สร้าง</div><div className="text-center">สถานะ</div><div className="text-center">การดำเนินการ</div></div>
                {paginatedExpenses.map(e => {
                    const canEdit = currentUser.role === 'owner' || (currentUser.id === e.createdBy && e.verifiedStatus === 'rejected');
                    const canDelete = currentUser.role === 'owner' || currentUser.id === e.createdBy;
                    return (<div key={e.id} className="grid grid-cols-8 gap-4 items-center px-4 py-3 border-b">
                        <div className="text-sm text-gray-600">{e.createdAt}</div><div className="text-sm">{getProjectName(e.projectId)}</div><div className="col-span-2 flex items-center">{e.description} {e.proofFileName && <span title={e.proofFileName} className="ml-2 cursor-help"><PaperClipIcon/></span>}</div>
                        <div className="text-right">{formatCurrency(e.amount)}</div><div>{e.creatorName}</div><div className="text-center space-x-2"><StatusBadge status={e.status} /><StatusBadge status={e.verifiedStatus} type="verification" tooltip={e.rejectionReason} /></div>
                        <div className="text-center space-x-2">
                            {e.status === 'pending_approval' && currentUser.role === 'owner' && <button onClick={() => handleApproveExpense(e.id)} className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">อนุมัติ</button>}
                            {e.status === 'approved' && e.verifiedStatus === 'pending_verification' && (<><button onClick={() => handleVerifyExpense(e.id, 'verified')} className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">ตรวจแล้ว</button><button onClick={() => setRejectingExpense(e)} className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">ไม่ผ่าน</button></>)}
                            {canEdit && <button onClick={() => { setEditingExpense(e); setShowAddModal(true);}} className="p-1 hover:bg-gray-200 rounded" title="แก้ไข"><PencilIcon /></button>}
                            {canDelete && <button onClick={() => setDeletingExpense(e)} className="p-1 hover:bg-gray-200 rounded" title="ลบ"><TrashIcon /></button>}
                        </div>
                    </div>);
                })}
                {filteredExpenses.length === 0 && (<p className="text-center text-gray-500 py-6">ไม่พบรายจ่ายตามเงื่อนไขที่กำหนด</p>)}
            </div>
            {totalPages > 1 && (<div className="flex justify-center items-center mt-6 space-x-2"><button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">ก่อนหน้า</button><span className="text-gray-700">หน้า {currentPage} จาก {totalPages}</span><button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">ถัดไป</button></div>)}
            {showAddModal && <ExpenseModal onClose={() => { setShowAddModal(false); setEditingExpense(null); }} onSave={handleSaveExpense} expense={editingExpense} settings={settings} isNonProject={!editingExpense || !editingExpense.projectId} pettyCashBalance={pettyCash.balance} />}
            {rejectingExpense && <RejectionModal expense={rejectingExpense} onClose={() => setRejectingExpense(null)} onConfirm={handleVerifyExpense} />}
            {deletingExpense && (<Modal title="ยืนยันการลบรายจ่าย" onClose={() => setDeletingExpense(null)}><div><p className="text-gray-700 mb-4">คุณแน่ใจหรือไม่ว่าต้องการลบรายจ่าย: <span className="font-semibold">{deletingExpense.description}</span>?</p>{deletingExpense.status === 'approved' && (<p className="font-semibold bg-yellow-50 p-3 rounded-lg">การดำเนินการนี้จะคืนเงินจำนวน <span className="text-green-600">{formatCurrency(deletingExpense.amount)}</span> กลับสู่ {deletingExpense.projectId ? 'งบประมาณโปรเจค' : 'กองกลาง'}</p>)}<div className="flex justify-end space-x-4 mt-6"><button onClick={() => setDeletingExpense(null)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">ยกเลิก</button><button onClick={handleConfirmDeleteExpense} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">ยืนยันการลบ</button></div></div></Modal>)}
        </div>
    );
}

function CashReturnView({ projects, pettyCash, users, expenses, db }) {
    const pendingReturnProjects = useMemo(() => {
        return projects.filter(p => p.status === 'pending_cash_return').map(p => {
            const spent = expenses.filter(e => e.projectId === p.id && e.status === 'approved').reduce((sum, e) => sum + e.amount, 0);
            return {...p, amountToReturn: p.currentBudget - spent, creatorName: users.find(u => u.id === p.createdBy)?.username || 'N/A' };
        });
    }, [projects, expenses, users]);

    const handleConfirmReturn = async (projectToConfirm) => {
        try {
            await updateDoc(doc(db, "companyData", "pettyCash"), { balance: pettyCash.balance + projectToConfirm.amountToReturn });
            await updateDoc(doc(db, "projects", projectToConfirm.id), { status: 'closed' });
        } catch (error) { console.error("Error confirming cash return:", error); }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">ยืนยันการคืนเงินงบประมาณ</h1>
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="grid grid-cols-5 gap-4 font-bold text-gray-500 px-4 py-2 border-b"><div className="col-span-2">ชื่อโปรเจค</div><div>ผู้ดูแล</div><div className="text-right">ยอดเงินคืน</div><div className="text-center">การดำเนินการ</div></div>
                {pendingReturnProjects.map(p => (
                    <div key={p.id} className="grid grid-cols-5 gap-4 items-center px-4 py-3 border-b">
                        <div className="col-span-2 font-semibold">{p.name}</div><div>{p.creatorName}</div><div className="text-right font-bold text-green-600">{formatCurrency(p.amountToReturn)}</div>
                        <div className="text-center"><button onClick={() => handleConfirmReturn(p)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-lg text-sm">ยืนยันรับเงิน</button></div>
                    </div>
                ))}
                {pendingReturnProjects.length === 0 && (<p className="text-center text-gray-500 py-6">ไม่มีรายการรอการยืนยัน</p>)}
            </div>
        </div>
    );
}

function BudgetRequestView({ projects, pettyCash, users, db }) {
     const pendingBudgetRequests = useMemo(() => {
        return projects.filter(p => p.status === 'pending_budget_return').map(p => ({...p, creatorName: users.find(u => u.id === p.createdBy)?.username || 'N/A' }));
    }, [projects, users]);

    const handleApproveBudgetRequest = async (projectToApprove) => {
        if (pettyCash.balance < projectToApprove.reopenBudgetRequired) {
            alert(`ไม่สามารถอนุมัติได้เนื่องจากเงินในกองกลางไม่เพียงพอ\nต้องการ: ${formatCurrency(projectToApprove.reopenBudgetRequired)}\nคงเหลือ: ${formatCurrency(pettyCash.balance)}`);
            return;
        }
        try {
            await updateDoc(doc(db, "companyData", "pettyCash"), { balance: pettyCash.balance - projectToApprove.reopenBudgetRequired });
            await updateDoc(doc(db, "projects", projectToApprove.id), { status: 'approved', currentBudget: projectToApprove.preCloseBudget, reopenBudgetRequired: 0, preCloseBudget: 0 });
        } catch(error) { console.error("Error approving budget request:", error); }
    };

    return (
         <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">อนุมัติเบิกงบประมาณโปรเจค</h1>
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="grid grid-cols-5 gap-4 font-bold text-gray-500 px-4 py-2 border-b"><div className="col-span-2">ชื่อโปรเจค</div><div>ผู้ดูแล</div><div className="text-right">ยอดเงินที่ขอเบิก</div><div className="text-center">การดำเนินการ</div></div>
                {pendingBudgetRequests.map(p => (
                    <div key={p.id} className="grid grid-cols-5 gap-4 items-center px-4 py-3 border-b">
                        <div className="col-span-2 font-semibold">{p.name}</div><div>{p.creatorName}</div><div className="text-right font-bold text-blue-600">{formatCurrency(p.reopenBudgetRequired)}</div>
                        <div className="text-center"><button onClick={() => handleApproveBudgetRequest(p)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-lg text-sm">อนุมัติเบิกงบ</button></div>
                    </div>
                ))}
                {pendingBudgetRequests.length === 0 && (<p className="text-center text-gray-500 py-6">ไม่มีรายการรอการอนุมัติ</p>)}
            </div>
        </div>
    );
}

function PettyCashView({ pettyCash, currentUser, db }) {
    const [showModal, setShowModal] = useState(false);
    const [requestAmount, setRequestAmount] = useState('');
    const pettyCashRef = doc(db, "companyData", "pettyCash");

    const handleRequestRefill = async (e) => {
        e.preventDefault();
        const amount = parseFloat(requestAmount);
        if(!amount || amount <= 0) return;
        const newRequest = { id: 'pc' + Date.now(), amount, status: 'pending_approval', requestedBy: currentUser.id, createdAt: new Date().toISOString().split('T')[0] };
        try {
            await updateDoc(pettyCashRef, { refillRequests: [...(pettyCash.refillRequests || []), newRequest] });
            setShowModal(false); setRequestAmount('');
        } catch (error) { console.error("Error requesting refill:", error); }
    }

    const handleApproveRefill = async (requestId) => {
        const request = pettyCash.refillRequests.find(r => r.id === requestId);
        if (!request) return;
        const updatedRequests = pettyCash.refillRequests.map(r => r.id === requestId ? {...r, status: 'approved'} : r);
        try {
            await updateDoc(pettyCashRef, { balance: pettyCash.balance + request.amount, refillRequests: updatedRequests });
        } catch (error) { console.error("Error approving refill:", error); }
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">กองกลาง (Petty Cash)</h1>
            <div className="bg-white p-8 rounded-xl shadow-md mb-8 text-center">
                 <h3 className="text-xl font-semibold text-gray-500">ยอดเงินคงเหลือ</h3><p className="text-6xl font-bold text-green-600 my-4">{formatCurrency(pettyCash.balance)}</p>
                 <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg">ตั้งเบิก</button>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">ประวัติการเบิก</h2>
                <div className="grid grid-cols-4 gap-4 font-bold text-gray-500 px-4 py-2 border-b"><div>วันที่</div><div className="text-right">จำนวนเงิน</div><div className="text-center">สถานะ</div><div className="text-center">การดำเนินการ</div></div>
                 {[...(pettyCash.refillRequests || [])].sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt)).map(r => (
                    <div key={r.id} className="grid grid-cols-4 gap-4 items-center px-4 py-3 border-b">
                        <div>{r.createdAt}</div><div className="text-right">{formatCurrency(r.amount)}</div><div className="text-center"><StatusBadge status={r.status} /></div>
                        <div className="text-center">{r.status === 'pending_approval' && currentUser.role === 'owner' && (<button onClick={() => handleApproveRefill(r.id)} className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">อนุมัติ</button>)}</div>
                    </div>
                 ))}
            </div>
             {showModal && (<Modal title="ตั้งเบิกเงินเข้ากองกลาง" onClose={() => setShowModal(false)}><form onSubmit={handleRequestRefill}><div className="mb-6"><label className="block text-gray-700 font-semibold mb-2">จำนวนเงิน</label><input type="number" value={requestAmount} onChange={(e) => setRequestAmount(e.target.value)} className="w-full px-3 py-2 border rounded-lg font-sans" required min="1" /></div><div className="flex justify-end space-x-4"><button type="button" onClick={() => setShowModal(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">ยกเลิก</button><button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">ส่งคำขอ</button></div></form></Modal>)}
        </div>
    );
}

function SettingsView({ settings, db }) {
    const [threshold, setThreshold] = useState(settings.expenseThreshold);
    const handleSave = async () => {
        try {
            await updateDoc(doc(db, "companyData", "settings"), { expenseThreshold: parseFloat(threshold) });
            alert('บันทึกการตั้งค่าเรียบร้อยแล้ว');
        } catch (error) { console.error("Error saving settings:", error); alert('ไม่สามารถบันทึกการตั้งค่าได้'); }
    }
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">ตั้งค่าระบบ</h1>
            <div className="bg-white p-8 rounded-xl shadow-md max-w-lg">
                <div className="mb-6"><label htmlFor="threshold" className="block text-lg font-semibold text-gray-700 mb-2">เกณฑ์การอนุมัติรายจ่าย (Threshold)</label><p className="text-sm text-gray-500 mb-2">รายจ่ายที่น้อยกว่าเกณฑ์นี้ พนักงานสามารถอนุมัติเองได้ทันที</p><input id="threshold" type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-lg font-sans" min="0"/></div>
                 <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg">บันทึก</button>
            </div>
        </div>
    );
}

function UserManagementView({ users, db, firebaseConfig }) {
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('employee');

    const handleCreateUser = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            alert("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
            return;
        }
        
        let tempApp;
        try {
            // Use a temporary, uniquely named app instance for user creation
            // to avoid interfering with the admin's auth state.
            tempApp = initializeApp(firebaseConfig, `user-creation-${Date.now()}`);
            const tempAuth = getAuth(tempApp);
            
            const userCredential = await createUserWithEmailAndPassword(tempAuth, newEmail, newPassword);
            const newUser = userCredential.user;

            await setDoc(doc(db, "users", newUser.uid), {
                username: newUsername,
                email: newEmail,
                role: newRole
            });

            alert(`สร้างผู้ใช้ ${newUsername} สำเร็จแล้ว`);
            setShowAddUserModal(false);
            setNewUsername(''); setNewEmail(''); setNewPassword(''); setNewRole('employee');
        } catch (error) {
            console.error("Error creating user:", error);
            alert(`เกิดข้อผิดพลาดในการสร้างผู้ใช้: ${error.message}`);
        }
    };

    return (
         <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">จัดการผู้ใช้งาน</h1>
                <button onClick={() => setShowAddUserModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">+ เพิ่มผู้ใช้ใหม่</button>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
                 <div className="grid grid-cols-3 gap-4 font-bold text-gray-500 px-4 py-2 border-b"><div>อีเมล</div><div>ชื่อผู้ใช้</div><div>สิทธิ์</div></div>
                {users.map(user => (
                    <div key={user.id} className="grid grid-cols-3 gap-4 items-center px-4 py-3 border-b">
                        <div>{user.email}</div>
                        <div className="font-semibold">{user.username}</div>
                        <div className="capitalize">{user.role}</div>
                    </div>
                ))}
            </div>
            {showAddUserModal && (
                <Modal title="สร้างผู้ใช้ใหม่" onClose={() => setShowAddUserModal(false)}>
                    <form onSubmit={handleCreateUser}>
                        <div className="mb-4"><label className="block text-gray-700 font-semibold mb-2">ชื่อผู้ใช้</label><input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} className="w-full px-3 py-2 border rounded-lg font-sans" required /></div>
                        <div className="mb-4"><label className="block text-gray-700 font-semibold mb-2">อีเมล</label><input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg font-sans" required /></div>
                        <div className="mb-4"><label className="block text-gray-700 font-semibold mb-2">รหัสผ่าน</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg font-sans" required /></div>
                        <div className="mb-6"><label className="block text-gray-700 font-semibold mb-2">สิทธิ์</label>
                            <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full px-3 py-2 border rounded-lg font-sans bg-white">
                                <option value="employee">Employee</option><option value="accountant">Accountant</option><option value="owner">Owner</option>
                            </select>
                        </div>
                        <div className="flex justify-end space-x-4"><button type="button" onClick={() => setShowAddUserModal(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">ยกเลิก</button><button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">สร้างผู้ใช้</button></div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

function ExpenseModal({ onClose, onSave, expense, settings, isNonProject = false, pettyCashBalance = 0 }) {
    const [description, setDescription] = useState(expense?.description || '');
    const [amount, setAmount] = useState(expense?.amount || '');
    const [proofFile, setProofFile] = useState(null);
    const [proofFileName, setProofFileName] = useState(expense?.proofFileName || '');

    const handleFileChange = (e) => {
        if (e.target.files[0]) { setProofFile(e.target.files[0]); setProofFileName(e.target.files[0].name); }
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ description, amount: parseFloat(amount), proofFileName });
    };

    const title = expense ? 'แก้ไขรายจ่าย' : (isNonProject ? 'เพิ่มรายจ่ายนอกโปรเจค' : 'เพิ่มรายจ่ายในโปรเจค');
    return (
        <Modal title={title} onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <div className="mb-4"><label className="block text-gray-700 font-semibold mb-2">รายละเอียด</label><input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-lg font-sans" required /></div>
                <div className="mb-4"><label className="block text-gray-700 font-semibold mb-2">จำนวนเงิน</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 border rounded-lg font-sans" required min="1" /></div>
                <div className="mb-6"><label className="block text-gray-700 font-semibold mb-2">แนบหลักฐาน (ถ้ามี)</label><div className="flex items-center space-x-4"><label className="w-full flex items-center px-4 py-2 bg-white text-blue-500 rounded-lg shadow-sm tracking-wide uppercase border border-blue-500 cursor-pointer hover:bg-blue-500 hover:text-white"><svg className="w-6 h-6 mr-2" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4 4-4-4h3v-3h2v3z" /></svg><span className="text-sm leading-normal">{proofFileName ? 'เปลี่ยนไฟล์' : 'เลือกไฟล์'}</span><input type='file' className="hidden" onChange={handleFileChange} /></label>{proofFileName && <span className="text-sm text-gray-500 truncate" title={proofFileName}>{proofFileName}</span>}</div></div>
                {isNonProject ? (<p className="text-sm text-gray-500 mb-4 bg-yellow-50 p-2 rounded-md">รายจ่ายนี้จะถูกหักจากเงินกองกลาง ยอดคงเหลือ: <strong>{formatCurrency(pettyCashBalance)}</strong></p>) : (<p className="text-sm text-gray-500 mb-4">รายจ่ายที่มากกว่าหรือเท่ากับ {formatCurrency(settings.expenseThreshold)} จะต้องรออนุมัติ</p>)}
                <div className="flex justify-end space-x-4"><button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">ยกเลิก</button><button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">บันทึก</button></div>
            </form>
        </Modal>
    );
}

function RejectionModal({ expense, onClose, onConfirm }) {
    const [reason, setReason] = useState('');
    const handleSubmit = (e) => { e.preventDefault(); if (!reason.trim()) { alert('กรุณากรอกเหตุผล'); return; } onConfirm(expense.id, 'rejected', reason); };
    return (
        <Modal title="ระบุเหตุผลที่ไม่ผ่าน" onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <p className="mb-2">โปรดระบุเหตุผลที่ไม่ผ่านสำหรับรายจ่าย:</p><p className="font-semibold text-gray-800 mb-4">{expense.description} ({formatCurrency(expense.amount)})</p>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2 border rounded-lg font-sans" rows="3" required></textarea>
                <div className="flex justify-end space-x-4 mt-6"><button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">ยกเลิก</button><button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">ยืนยัน</button></div>
            </form>
        </Modal>
    );
}

function ReportsView({ projects, expenses, users }) {
    const today = new Date();
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(firstDayOfYear);
    const [endDate, setEndDate] = useState(todayStr);

    const monthlyReportData = useMemo(() => {
        const monthlyData = {};
        projects.forEach(p => {
            if (p.status === 'closed' && p.closedAt) {
                const month = p.closedAt.substring(0, 7);
                if (!monthlyData[month]) monthlyData[month] = { closedProjects: 0, totalSales: 0, totalSpentOnClosed: 0, generalExpenses: 0 };
                const projectExpenses = expenses.filter(e => e.projectId === p.id && e.status === 'approved').reduce((sum, e) => sum + e.amount, 0);
                monthlyData[month].closedProjects += 1; monthlyData[month].totalSales += p.sales; monthlyData[month].totalSpentOnClosed += projectExpenses;
            }
        });
        expenses.forEach(e => {
            if (!e.projectId && e.status === 'approved') {
                 const month = e.createdAt.substring(0, 7);
                 if (!monthlyData[month]) monthlyData[month] = { closedProjects: 0, totalSales: 0, totalSpentOnClosed: 0, generalExpenses: 0 };
                monthlyData[month].generalExpenses += e.amount;
            }
        });
        return Object.keys(monthlyData).map(month => {
            const data = monthlyData[month];
            const projectProfit = data.totalSales - data.totalSpentOnClosed;
            const netProfit = projectProfit - data.generalExpenses;
            return { month, ...data, projectProfit, netProfit }
        }).sort((a,b) => b.month.localeCompare(a.month));
    }, [projects, expenses]);

    const reportData = useMemo(() => {
        const filteredProjectsByCreation = projects.filter(p => p.createdAt >= startDate && p.createdAt <= endDate);
        const filteredExpenses = expenses.filter(e => e.createdAt >= startDate && e.createdAt <= endDate && e.status === 'approved');
        const totalSales = filteredProjectsByCreation.reduce((sum, p) => sum + p.sales, 0);
        const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
        const totalProjectExpenses = filteredExpenses.filter(e => e.projectId).reduce((sum, e) => sum + e.amount, 0);
        const totalGeneralExpenses = filteredExpenses.filter(e => !e.projectId).reduce((sum, e) => sum + e.amount, 0);
        const netProfit = totalSales - totalExpenses;
        const projectProfitability = projects.map(p => {
            const spent = expenses.filter(e => e.projectId === p.id && e.status === 'approved').reduce((sum, e) => sum + e.amount, 0);
            return { ...p, spent, profit: p.sales - spent };
        }).sort((a, b) => b.profit - a.profit);
        const top5ProfitableProjects = [...projectProfitability].filter(p => p.profit > 0).slice(0, 5);
        const expenseByUser = users.map(user => {
            const userExpenses = filteredExpenses.filter(e => e.createdBy === user.id);
            return { id: user.id, name: user.username, count: userExpenses.length, total: userExpenses.reduce((sum, e) => sum + e.amount, 0) };
        }).filter(u => u.count > 0).sort((a,b) => b.total - a.total);
        return { newProjectsCount: filteredProjectsByCreation.length, totalSales, totalExpenses, totalProjectExpenses, totalGeneralExpenses, netProfit, projectProfitability, top5ProfitableProjects, expenseByUser };
    }, [projects, expenses, users, startDate, endDate]);

    const expenseBreakdownData = [ { name: 'ในโปรเจค', value: reportData.totalProjectExpenses, color: '#3B82F6' }, { name: 'ทั่วไป', value: reportData.totalGeneralExpenses, color: '#EF4444' } ];

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">รายงาน</h1>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">สรุปผลประกอบการรายเดือน</h2>
            <div className="bg-white p-4 rounded-xl shadow-md mb-8 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-7 gap-4 font-bold text-gray-500 px-4 py-2 border-b sticky top-0 bg-white"><div>เดือน</div><div className="text-center">โปรเจคที่ปิด</div><div className="text-right">ยอดขาย</div><div className="text-right">ค่าใช้จ่ายโปรเจค</div><div className="text-right">กำไรจากโปรเจค</div><div className="text-right">ค่าใช้จ่ายทั่วไป</div><div className="text-right">กำไรสุทธิ</div></div>
                {monthlyReportData.map(m => (
                    <div key={m.month} className="grid grid-cols-7 gap-4 px-4 py-3 border-b">
                        <div className="font-semibold">{m.month}</div><div className="text-center">{m.closedProjects}</div><div className="text-right text-green-600">{formatCurrency(m.totalSales)}</div>
                        <div className="text-right text-red-500">{formatCurrency(m.totalSpentOnClosed)}</div><div className={`text-right font-bold ${m.projectProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(m.projectProfit)}</div>
                        <div className="text-right text-red-500">{formatCurrency(m.generalExpenses)}</div><div className={`text-right font-bold ${m.netProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(m.netProfit)}</div>
                    </div>
                ))}
                 {monthlyReportData.length === 0 && <p className="text-center text-gray-500 py-4">ไม่พบข้อมูลสรุปรายเดือน</p>}
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md mb-6 flex items-center space-x-4"><label className="font-semibold">เลือกช่วงวันที่สำหรับรายงานด้านล่าง:</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-2 border rounded-lg font-sans" /><span>ถึง</span><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-2 border rounded-lg font-sans" /></div>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">ภาพรวมประสิทธิภาพ (ตามช่วงวันที่)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-md"><h3 className="text-lg font-semibold text-gray-500">ยอดขายรวม</h3><p className="text-4xl font-bold text-green-600">{formatCurrency(reportData.totalSales)}</p></div>
                <div className="bg-white p-6 rounded-xl shadow-md"><h3 className="text-lg font-semibold text-gray-500">ค่าใช้จ่ายรวม</h3><p className="text-4xl font-bold text-red-500">{formatCurrency(reportData.totalExpenses)}</p></div>
                <div className="bg-white p-6 rounded-xl shadow-md"><h3 className="text-lg font-semibold text-gray-500">โปรเจคใหม่</h3><p className="text-4xl font-bold text-blue-600">{reportData.newProjectsCount}</p></div>
                <div className={`bg-white p-6 rounded-xl shadow-md ${reportData.netProfit >= 0 ? 'border-green-500' : 'border-red-500'} border-2`}><h3 className="text-lg font-semibold text-gray-500">กำไร / ขาดทุนสุทธิ</h3><p className={`text-4xl font-bold ${reportData.netProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(reportData.netProfit)}</p></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div><h2 className="text-2xl font-bold text-gray-700 mb-4">วิเคราะห์โปรเจค</h2><div className="bg-white p-6 rounded-xl shadow-md"><h3 className="font-semibold mb-2">5 โปรเจคที่ทำกำไรสูงสุด</h3><TopProjectsBarChart data={reportData.top5ProfitableProjects.map(p => ({id: p.id, name: p.name, spent: p.profit}))} /></div></div>
                <div><h2 className="text-2xl font-bold text-gray-700 mb-4">วิเคราะห์ค่าใช้จ่าย</h2><div className="bg-white p-6 rounded-xl shadow-md flex flex-col justify-center items-center h-full"><h3 className="font-semibold mb-2">สัดส่วนค่าใช้จ่าย</h3><ProjectStatusPieChart data={expenseBreakdownData.map(d => ({status: d.name, count: d.value}))} statusTextMap={{'ในโปรเจค': 'ในโปรเจค', 'ทั่วไป': 'ทั่วไป'}} statusColors={{'ในโปรเจค': '#3B82F6', 'ทั่วไป': '#EF4444'}}/></div></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div><h2 className="text-2xl font-bold text-gray-700 mb-4">ตารางสรุปกำไร-ขาดทุนโปรเจค</h2><div className="bg-white p-4 rounded-xl shadow-md max-h-96 overflow-y-auto"><div className="grid grid-cols-4 gap-4 font-bold text-gray-500 px-4 py-2 border-b sticky top-0 bg-white"><div>โปรเจค</div><div className="text-right">ค่าใช้จ่ายจริง</div><div className="text-right">ยอดขาย</div><div className="text-right">กำไร/ขาดทุน</div></div>{reportData.projectProfitability.map(p => (<div key={p.id} className="grid grid-cols-4 gap-4 px-4 py-3 border-b"><div className="font-semibold truncate">{p.name}</div><div className="text-right">{formatCurrency(p.spent)}</div><div className="text-right">{formatCurrency(p.sales)}</div><div className={`text-right font-bold ${p.profit >=0 ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(p.profit)}</div></div>))}</div></div>
                <div><h2 className="text-2xl font-bold text-gray-700 mb-4">ตารางสรุปค่าใช้จ่ายตามพนักงาน</h2><div className="bg-white p-4 rounded-xl shadow-md max-h-96 overflow-y-auto"><div className="grid grid-cols-3 gap-4 font-bold text-gray-500 px-4 py-2 border-b sticky top-0 bg-white"><div>ชื่อพนักงาน</div><div className="text-center">จำนวนรายการ</div><div className="text-right">ยอดรวม</div></div>{reportData.expenseByUser.map(u => (<div key={u.id} className="grid grid-cols-3 gap-4 px-4 py-3 border-b"><div className="font-semibold">{u.name}</div><div className="text-center">{u.count}</div><div className="text-right font-bold text-red-500">{formatCurrency(u.total)}</div></div>))}</div></div>
            </div>
        </div>
    );
}


