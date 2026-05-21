'use client'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { useState, useEffect, useRef } from 'react'
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Toaster, toast } from 'sonner'
import { Eye, EyeOff, Loader2, LogOut, Printer, RefreshCw } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'

// ===== Query Client =====
const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } }
})

// ===== API Helper =====
const api = {
  post: (url: string, body: any) => fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(r => r.json()),
  
  get: (url: string) => fetch(url).then(r => r.json())
}

// ===== Main App =====
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainApp />
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  )
}

function MainApp() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/me').then(setUser).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="h-screen flex items-center justify-center">جار التحميل...</div>
  if (!user) return <LoginScreen onLogin={setUser} />

  return <Dashboard user={user} onLogout={() => setUser(null)} />
}

// ===== Login Screen =====
function LoginScreen({ onLogin }: { onLogin: (u: any) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    api.get('/api/users/active').then(setUsers)
  }, [])

  const loginMutation = useMutation({
    mutationFn: (data: any) => api.post('/api/auth/login', data),
    onSuccess: (data) => {
      if (data.success) {
        onLogin(data.user)
        toast.success('تم تسجيل الدخول بنجاح')
      } else {
        toast.error(data.error)
      }
    }
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🎖️</div>
          <h1 className="text-2xl font-bold">الراشدي للصرافة والتحويلات</h1>
        </div>

        <div className="space-y-4">
          <select 
            value={username} 
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="">اختر المستخدم</option>
            {users.map(u => (
              <option key={u.id} value={u.username}>{u.name} - {u.username}</option>
            ))}
          </select>

          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border p-2 rounded pr-10"
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-3 top-2.5">
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button 
            className="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50" 
            disabled={loginMutation.isPending}
            onClick={() => loginMutation.mutate({ username, password })}
          >
            {loginMutation.isPending && <Loader2 className="animate-spin inline ml-2" size={16} />}
            تسجيل الدخول
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== Dashboard =====
function Dashboard({ user, onLogout }: { user: any, onLogout: () => void }) {
  const printRef = useRef(null)
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('operations')

  const handlePrint = useReactToPrint({ content: () => printRef.current })
  
  const logoutMutation = useMutation({
    mutationFn: () => api.post('/api/auth/logout', {}),
    onSuccess: onLogout
  })

  return (
    <div className="min-h-screen flex-col">
      {/* Header */}
      <header className="border-b px-6 py-3 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            {user.role}
          </span>
          <span className="font-medium">{user.name}</span>
        </div>
        <button className="px-3 py-1 text-sm hover:bg-gray-100 rounded" onClick={() => logoutMutation.mutate()}>
          <LogOut size={16} className="inline ml-2" />
          خروج
        </button>
      </header>

      {/* Tabs */}
      <div className="flex-1 flex-col">
        <div className="border-b px-6 bg-white">
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('employees')}
              className={`px-4 py-2 ${activeTab === 'employees' ? 'border-b-2 border-blue-600' : ''}`}
            >
              إدارة الموظفين
            </button>
            <button 
              onClick={() => setActiveTab('operations')}
              className={`px-4 py-2 ${activeTab === 'operations' ? 'border-b-2 border-blue-600' : ''}`}
            >
              العمليات
            </button>
          </div>
        </div>

        <main className="flex-1 p-6 bg-gray-50 overflow-auto">
          <div ref={printRef}>
            {activeTab === 'employees' && <EmployeesTab />}
            {activeTab === 'operations' && <OperationsTab />}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t px-6 py-3 flex items-center gap-3 bg-white">
          <button className="px-3 py-1 border rounded text-sm" onClick={() => queryClient.invalidateQueries()}>
            <RefreshCw size={16} className="inline ml-2" />
            تحديث
          </button>
          <button className="px-3 py-1 border rounded text-sm" onClick={handlePrint}>
            <Printer size={16} className="inline ml-2" />
            طباعة
          </button>
        </footer>
      </div>
    </div>
  )
}

// ===== Employees Tab =====
function EmployeesTab() {
  const [activeTab, setActiveTab] = useState('add')
  return (
    <div>
      <div className="flex gap-2 mb-4 border-b">
        <button 
          onClick={() => setActiveTab('add')}
          className={`px-4 py-2 ${activeTab === 'add' ? 'border-b-2 border-blue-600' : ''}`}
        >
          إضافة موظف
        </button>
        <button 
          onClick={() => setActiveTab('manage')}
          className={`px-4 py-2 ${activeTab === 'manage' ? 'border-b-2 border-blue-600' : ''}`}
        >
          تعديل/إيقاف/حذف
        </button>
      </div>
        
      {activeTab === 'add' && <AddEmployeeForm />}
      {activeTab === 'manage' && <ManageEmployees />}
    </div>
  )
}

function AddEmployeeForm() {
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'موظف', branch_id: '' })
  const queryClient = useQueryClient()
  
  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/api/employees/create', data),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('تم إضافة الموظف')
        setForm({ name: '', username: '', password: '', role: 'موظف', branch_id: '' })
        queryClient.invalidateQueries({ queryKey: ['employees'] })
      } else {
        toast.error(data.error)
      }
    }
  })

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get('/api/branches')
  })

  return (
    <div className="max-w-md space-y-4 bg-white p-6 rounded-lg">
      <input placeholder="اسم الموظف" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border p-2 rounded" />
      <input placeholder="اسم المستخدم" value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="w-full border p-2 rounded" />
      <input type="password" placeholder="كلمة المرور" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full border p-2 rounded" />
      
      <select value={form.branch_id} onChange={e => setForm({...form, branch_id: e.target.value})} className="w-full border p-2 rounded">
        <option value="">اختر الفرع</option>
        {branches?.map((b: any) => <option key={b.id} value={b.id.toString()}>{b.name}</option>)}
      </select>

      <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full border p-2 rounded">
        <option value="مدير عام">مدير عام</option>
        <option value="مدير">مدير</option>
        <option value="موظف">موظف</option>
      </select>

      <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
        حفظ
      </button>
    </div>
  )
}

function ManageEmployees() {
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showDeactivate, setShowDeactivate] = useState(false)
  const [reason, setReason] = useState('')
  const queryClient = useQueryClient()

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.get('/api/employees')
  })

  const toggleStatusMutation = useMutation({
    mutationFn: (data: any) => api.post('/api/employees/toggle-status', data),
    onSuccess: () => {
      toast.success('تم تحديث الحالة')
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setShowDeactivate(false)
      setReason('')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.post('/api/employees/delete', { id }),
    onSuccess: () => {
      toast.success('تم حذف الموظف')
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    }
  })

  return (
    <div className="space-y-4">
      <select onChange={e => setSelectedUser(employees?.find((e: any) => e.id.toString() === e.target.value))} className="max-w-md w-full border p-2 rounded">
        <option value="">اختر الموظف</option>
        {employees?.map((e: any) => (
          <option key={e.id} value={e.id.toString()}>{e.name} - {e.status}</option>
        ))}
      </select>

      {selectedUser && (
        <div className="flex gap-2">
          <button className="px-4 py-2 border rounded">تعديل</button>
          <button 
            className={`px-4 py-2 rounded text-white ${selectedUser.status === 'نشط' ? 'bg-red-600' : 'bg-green-600'}`}
            onClick={() => setShowDeactivate(true)}
          >
            {selectedUser.status === 'نشط' ? 'إيقاف' : 'إلغاء الإيقاف'}
          </button>
          <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={() => {
            if (confirm('هل أنت متأكد من الحذف؟')) deleteMutation.mutate(selectedUser.id)
          }}>
            حذف
          </button>
        </div>
      )}

      {showDeactivate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded max-w-md w-full">
            <h2 className="text-lg font-bold mb-4">سبب الإيقاف</h2>
            <input placeholder="اكتب السبب" value={reason} onChange={e => setReason(e.target.value)} className="w-full border p-2 rounded mb-4" />
            <div className="flex gap-2">
              <button onClick={() => toggleStatusMutation.mutate({ id: selectedUser?.id, reason })} className="px-4 py-2 bg-blue-600 text-white rounded">
                تأكيد
              </button>
              <button onClick={() => setShowDeactivate(false)} className="px-4 py-2 border rounded">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ===== Operations Tab =====
function OperationsTab() {
  const [activeTab, setActiveTab] = useState('buy')
  
  return (
    <div>
      <div className="flex gap-2 mb-4 border-b">
        <button onClick={() => setActiveTab('buy')} className={`px-4 py-2 ${activeTab === 'buy' ? 'border-b-2 border-blue-600' : ''}`}>شراء</button>
        <button onClick={() => setActiveTab('sell')} className={`px-4 py-2 ${activeTab === 'sell' ? 'border-b-2 border-blue-600' : ''}`}>بيع</button>
        <button onClick={() => setActiveTab('deposit')} className={`px-4 py-2 ${activeTab === 'deposit' ? 'border-b-2 border-blue-600' : ''}`}>إيداع</button>
        <button onClick={() => setActiveTab('withdrawal')} className={`px-4 py-2 ${activeTab === 'withdrawal' ? 'border-b-2 border-blue-600' : ''}`}>صرف</button>
      </div>

      {activeTab === 'buy' && <ExchangeForm type="شراء" />}
      {activeTab === 'sell' && <ExchangeForm type="بيع" />}
      {activeTab === 'deposit' && <DepositForm />}
      {activeTab === 'withdrawal' && <WithdrawalForm />}
    </div>
  )
}

function ExchangeForm({ type }: { type: 'شراء' | 'بيع' }) {
  const [form, setForm] = useState({ currency: 'USD', amount: '', rate: '', account_id: '' })
  const [rateLimits, setRateLimits] = useState<any>(null)
  const queryClient = useQueryClient()

  const { data: currencies } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => api.get('/api/currencies')
  })

  useEffect(() => {
    if (form.currency) {
      api.get(`/api/exchange/rate?currency=${form.currency}`).then(setRateLimits)
    }
  }, [form.currency])

  useEffect(() => {
    if (rateLimits) {
      const defaultRate = type === 'شراء' ? rateLimits.buy_min : rateLimits.sell_max
      setForm(f => ({ ...f, rate: defaultRate?.toString() || '' }))
    }
  }, [rateLimits, type])

  const validateRate = (value: number) => {
    const min = type === 'شراء' ? rateLimits?.buy_min : rateLimits?.sell_min
    const max = type === 'شراء' ? rateLimits?.buy_max : rateLimits?.sell_max
    
    if (value < min) {
      toast.error('لقد تجاوزت الحد الأدنى للسعر')
      setForm(f => ({ ...f, rate: min.toString() }))
      return false
    }
    if (value > max) {
      toast.error('لقد تجاوزت الحد الأعلى للسعر')
      setForm(f => ({ ...f, rate: max.toString() }))
      return false
    }
    return true
  }

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/api/exchange', data),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`تمت العملية: ${data.tx_number}`)
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        setForm(f => ({ ...f, amount: '' }))
      } else {
        toast.error(data.error)
      }
    }
  })

  const result = form.amount && form.rate ? (parseFloat(form.amount) * parseFloat(form.rate)).toFixed(2) : 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})} className="border p-2 rounded">
          {currencies?.map((c: any) => <option key={c.code} value={c.code}>{c.code}</option>)}
        </select>
        
        <input 
          type="number" 
          placeholder="المبلغ" 
          value={form.amount} 
          onChange={e => setForm({...form, amount: e.target.value})}
          className="border p-2 rounded" 
        />
        
        <input 
          type="number" 
          placeholder="السعر" 
          value={form.rate}
          onChange={e => setForm({...form, rate: e.target.value})}
          onBlur={e => validateRate(parseFloat(e.target.value))}
          className="border p-2 rounded"
        />
      </div>

      <input readOnly value={result} placeholder="النتيجة" className="border p-2 rounded w-full bg-gray-100" />
      
      <button 
        onClick={() => mutation.mutate({
          uuid: crypto.randomUUID(),
          type,
          currency: form.currency,
          amount: parseFloat(form.amount),
          rate: parseFloat(form.rate),
          account_id: form.account_id,
          branch_id: 1
        })}
        disabled={mutation.isPending || !form.amount || !form.rate}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        تنفيذ {type}
      </button>

      <div className="mt-6">
        <h3 className="font-bold mb-2">سجل العمليات</h3>
        <TransactionsTable type={type} />
      </div>
    </div>
  )
}

function DepositForm() {
  const [form, setForm] = useState({ account_id: '', currency: 'YER', amount: '', depositor_name: '', note: '' })
  const queryClient = useQueryClient()

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get('/api/accounts')
  })

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/api/deposit', data),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('تم الإيداع')
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        setForm({ account_id: '', currency: 'YER', amount: '', depositor_name: '', note: '' })
      } else {
        toast.error(data.error)
      }
    }
  })

  return (
    <div className="space-y-4">
      <select value={form.account_id} onChange={e => setForm({...form, account_id: e.target.value})} className="w-full border p-2 rounded">
        <option value="">اختر الحساب</option>
        {accounts?.map((a: any) => <option key={a.id} value={a.id.toString()}>{a.name} - {a.account_number}</option>)}
      </select>

      <div className="grid grid-cols-2 gap-4">
        <input type="number" placeholder="المبلغ" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="border p-2 rounded" />
        <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})} className="border p-2 rounded">
          <option value="YER">YER</option>
          <option value="USD">USD</option>
          <option value="SAR">SAR</option>
        </select>
      </div>

      <input placeholder="اسم المودع" value={form.depositor_name} onChange={e => setForm({...form, depositor_name: e.target.value})} className="w-full border p-2 rounded" />
      <input placeholder="ملاحظات" value={form.note} onChange={e => setForm({...form, note: e.target.value})} className="w-full border p-2 rounded" />

      <button onClick={() => mutation.mutate({
        uuid: crypto.randomUUID(),
        ...form,
        amount: parseFloat(form.amount),
        account_id: parseInt(form.account_id)
      })} className="px-4 py-2 bg-blue-600 text-white rounded">
        تنفيذ إيداع
      </button>

      <div className="mt-6">
        <h3 className="font-bold mb-2">سجل الإيداعات</h3>
        <TransactionsTable type="ايداع" />
      </div>
    </div>
  )
}

function WithdrawalForm() {
  const [form, setForm] = useState({ account_id: '', currency: 'YER', amount: '', receiver_name: '', note: '' })
  const queryClient = useQueryClient()

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get('/api/accounts')
  })

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/api/withdrawal', data),
    onSuccess: (data) => {
      if (data.success === 'PENDING_APPROVAL') {
        toast.warning('العملية تحتاج موافقة')
      } else if (data.success) {
        toast.success('تم الصرف')
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
      } else {
        toast.error(data.error)
      }
    }
  })

  return (
    <div className="space-y-4">
      <select value={form.account_id} onChange={e => setForm({...form, account_id: e.target.value})} className="w-full border p-2 rounded">
        <option value="">اختر الحساب</option>
        {accounts?.map((a: any) => <option key={a.id} value={a.id.toString()}>{a.name}</option>)}
      </select>

      <div className="grid grid-cols-2 gap-4">
        <input type="number" placeholder="المبلغ" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="border p-2 rounded" />
        <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})} className="border p-2 rounded">
          <option value="YER">YER</option>
          <option value="USD">USD</option>
          <option value="SAR">SAR</option>
        </select>
      </div>

      <input placeholder="اسم المستلم" value={form.receiver_name} onChange={e => setForm({...form, receiver_name: e.target.value})} className="w-full border p-2 rounded" />
      <input placeholder="ملاحظات" value={form.note} onChange={e => setForm({...form, note: e.target.value})} className="w-full border p-2 rounded" />

      <button onClick={() => mutation.mutate({
        uuid: crypto.randomUUID(),
        ...form,
        amount: parseFloat(form.amount),
        account_id: parseInt(form.account_id)
      })} className="px-4 py-2 bg-blue-600 text-white rounded">
        تنفيذ صرف
      </button>

      <div className="mt-6">
        <h3 className="font-bold mb-2">سجل الصرف</h3>
        <TransactionsTable type="صرف" />
      </div>
    </div>
  )
}

function TransactionsTable({ type }: { type?: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['transactions', type],
    queryFn: () => api.get(`/api/transactions?type=${type || ''}`)
  })

  if (isLoading) return <div>جار التحميل...</div>

  return (
    <div className="border rounded-lg bg-white overflow-x-auto" data-print="true">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2 text-right">رقم العملية</th>
            <th className="p-2 text-right">المبلغ</th>
            <th className="p-2 text-right">العملة</th>
            <th className="p-2 text-right">السعر</th>
            <th className="p-2 text-right">النتيجة</th>
            <th className="p-2 text-right">العملية</th>
            <th className="p-2 text-right">الحالة</th>
            <th className="p-2 text-right">التاريخ</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((tx: any) => (
            <tr key={tx.id} className="border-t">
              <td className="p-2">{tx.tx_number}</td>
              <td className="p-2">{tx.amount}</td>
              <td className="p-2">{tx.currency}</td>
              <td className="p-2">{tx.rate}</td>
              <td className="p-2">{tx.result_amount}</td>
              <td className="p-2">{tx.type}</td>
              <td className="p-2">{tx.status}</td>
              <td className="p-2">{new Date(tx.created_at).toLocaleString('ar-SA')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
