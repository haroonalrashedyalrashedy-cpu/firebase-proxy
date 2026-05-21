// app/page.tsx
'use client'
import { useState, useEffect, useRef } from 'react'
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Toaster, toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
          <Select value={username} onValueChange={setUsername}>
            <SelectTrigger>
              <SelectValue placeholder="اختر المستخدم" />
            </SelectTrigger>
            <SelectContent>
              {users.map(u => (
                <SelectItem key={u.id} value={u.username}>{u.name} - {u.username}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative">
            <Input
              type={showPass ? 'text' : 'password'}
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-3 top-2.5">
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <Button 
            className="w-full" 
            disabled={loginMutation.isPending}
            onClick={() => loginMutation.mutate({ username, password })}
          >
            {loginMutation.isPending && <Loader2 className="animate-spin ml-2" size={16} />}
            تسجيل الدخول
          </Button>
        </div>
      </div>
    </div>
  )
}

// ===== Dashboard =====
function Dashboard({ user, onLogout }: { user: any, onLogout: () => void }) {
  const printRef = useRef(null)
  const queryClient = useQueryClient()

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
        <Button variant="ghost" size="sm" onClick={() => logoutMutation.mutate()}>
          <LogOut size={16} className="ml-2" />
          خروج
        </Button>
      </header>

      {/* Tabs */}
      <Tabs defaultValue="operations" className="flex-1 flex-col">
        <div className="border-b px-6 bg-white">
          <TabsList>
            <TabsTrigger value="employees">إدارة الموظفين</TabsTrigger>
            <TabsTrigger value="operations">العمليات</TabsTrigger>
          </TabsList>
        </div>

        <main className="flex-1 p-6 bg-gray-50 overflow-auto">
          <div ref={printRef}>
            <TabsContent value="employees">
              <EmployeesTab />
            </TabsContent>
            <TabsContent value="operations">
              <OperationsTab />
            </TabsContent>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t px-6 py-3 flex items-center gap-3 bg-white">
          <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries()}>
            <RefreshCw size={16} className="ml-2" />
            تحديث
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer size={16} className="ml-2" />
            طباعة
          </Button>
        </footer>
      </Tabs>
    </div>
  )
}

// ===== Employees Tab =====
function EmployeesTab() {
  const [activeTab, setActiveTab] = useState('add')
  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="add">إضافة موظف</TabsTrigger>
          <TabsTrigger value="manage">تعديل/إيقاف/حذف</TabsTrigger>
        </TabsList>
        
        <TabsContent value="add"><AddEmployeeForm /></TabsContent>
        <TabsContent value="manage"><ManageEmployees /></TabsContent>
      </Tabs>
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
      <Input placeholder="اسم الموظف" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
      <Input placeholder="اسم المستخدم" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
      <Input type="password" placeholder="كلمة المرور" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
      
      <Select value={form.branch_id} onValueChange={v => setForm({...form, branch_id: v})}>
        <SelectTrigger><SelectValue placeholder="اختر الفرع" /></SelectTrigger>
        <SelectContent>
          {branches?.map((b: any) => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={form.role} onValueChange={v => setForm({...form, role: v})}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="مدير عام">مدير عام</SelectItem>
          <SelectItem value="مدير">مدير</SelectItem>
          <SelectItem value="موظف">موظف</SelectItem>
        </SelectContent>
      </Select>

      <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
        حفظ
      </Button>
    </div>
  )
}

function ManageEmployees() {
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showEdit, setShowEdit] = useState(false)
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
      <Select onValueChange={v => setSelectedUser(employees?.find((e: any) => e.id.toString() === v))}>
        <SelectTrigger className="max-w-md">
          <SelectValue placeholder="اختر الموظف" />
        </SelectTrigger>
        <SelectContent>
          {employees?.map((e: any) => (
            <SelectItem key={e.id} value={e.id.toString()}>{e.name} - {e.status}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedUser && (
        <div className="flex gap-2">
          <Button onClick={() => setShowEdit(true)}>تعديل</Button>
          <Button 
            variant={selectedUser.status === 'نشط' ? 'destructive' : 'default'}
            onClick={() => setShowDeactivate(true)}
          >
            {selectedUser.status === 'نشط' ? 'إيقاف' : 'إلغاء الإيقاف'}
          </Button>
          <Button variant="destructive" onClick={() => {
            if (confirm('هل أنت متأكد من الحذف؟')) deleteMutation.mutate(selectedUser.id)
          }}>
            حذف
          </Button>
        </div>
      )}

      <Dialog open={showDeactivate} onOpenChange={setShowDeactivate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>سبب الإيقاف</DialogTitle>
          </DialogHeader>
          <Input placeholder="اكتب السبب" value={reason} onChange={e => setReason(e.target.value)} />
          <DialogFooter>
            <Button onClick={() => toggleStatusMutation.mutate({ id: selectedUser?.id, reason })}>
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ===== Operations Tab =====
function OperationsTab() {
  return (
    <Tabs defaultValue="buy">
      <TabsList className="mb-4">
        <TabsTrigger value="buy">شراء</TabsTrigger>
        <TabsTrigger value="sell">بيع</TabsTrigger>
        <TabsTrigger value="deposit">إيداع</TabsTrigger>
        <TabsTrigger value="withdrawal">صرف</TabsTrigger>
      </TabsList>

      <TabsContent value="buy"><ExchangeForm type="شراء" /></TabsContent>
      <TabsContent value="sell"><ExchangeForm type="بيع" /></TabsContent>
      <TabsContent value="deposit"><DepositForm /></TabsContent>
      <TabsContent value="withdrawal"><WithdrawalForm /></TabsContent>
    </Tabs>
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
        <Select value={form.currency} onValueChange={v => setForm({...form, currency: v})}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {currencies?.map((c: any) => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}
          </SelectContent>
        </Select>
        
        <Input 
          type="number" 
          placeholder="المبلغ" 
          value={form.amount} 
          onChange={e => setForm({...form, amount: e.target.value})} 
        />
        
        <Input 
          type="number" 
          placeholder="السعر" 
          value={form.rate}
          onChange={e => setForm({...form, rate: e.target.value})}
          onBlur={e => validateRate(parseFloat(e.target.value))}
        />
      </div>

      <Input readOnly value={result} placeholder="النتيجة" />
      
      <Button 
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
      >
        تنفيذ {type}
      </Button>

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
      <Select value={form.account_id} onValueChange={v => setForm({...form, account_id: v})}>
        <SelectTrigger><SelectValue placeholder="اختر الحساب" /></SelectTrigger>
        <SelectContent>
          {accounts?.map((a: any) => <SelectItem key={a.id} value={a.id.toString()}>{a.name} - {a.account_number}</SelectItem>)}
        </SelectContent>
      </Select>

      <div className="grid grid-cols-2 gap-4">
        <Input type="number" placeholder="المبلغ" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
        <Select value={form.currency} onValueChange={v => setForm({...form, currency: v})}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="YER">YER</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="SAR">SAR</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Input placeholder="اسم المودع" value={form.depositor_name} onChange={e => setForm({...form, depositor_name: e.target.value})} />
      <Input placeholder="ملاحظات" value={form.note} onChange={e => setForm({...form, note: e.target.value})} />

      <Button onClick={() => mutation.mutate({
        uuid: crypto.randomUUID(),
        ...form,
        amount: parseFloat(form.amount),
        account_id: parseInt(form.account_id)
      })}>
        تنفيذ إيداع
      </Button>

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
      <Select value={form.account_id} onValueChange={v => setForm({...form, account_id: v})}>
        <SelectTrigger><SelectValue placeholder="اختر الحساب" /></SelectTrigger>
        <SelectContent>
          {accounts?.map((a: any) => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <div className="grid grid-cols-2 gap-4">
        <Input type="number" placeholder="المبلغ" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
        <Select value={form.currency} onValueChange={v => setForm({...form, currency: v})}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="YER">YER</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="SAR">SAR</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Input placeholder="اسم المستلم" value={form.receiver_name} onChange={e => setForm({...form, receiver_name: e.target.value})} />
      <Input placeholder="ملاحظات" value={form.note} onChange={e => setForm({...form, note: e.target.value})} />

      <Button onClick={() => mutation.mutate({
        uuid: crypto.randomUUID(),
        ...form,
        amount: parseFloat(form.amount),
        account_id: parseInt(form.account_id)
      })}>
        تنفيذ صرف
      </Button>

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
    <div className="border rounded-lg bg-white" data-print="true">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>رقم العملية</TableHead>
            <TableHead>المبلغ</TableHead>
            <TableHead>العملة</TableHead>
            <TableHead>السعر</TableHead>
            <TableHead>النتيجة</TableHead>
            <TableHead>العملية</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>التاريخ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((tx: any) => (
            <TableRow key={tx.id}>
              <TableCell>{tx.tx_number}</TableCell>
              <TableCell>{tx.amount}</TableCell>
              <TableCell>{tx.currency}</TableCell>
              <TableCell>{tx.rate}</TableCell>
              <TableCell>{tx.result_amount}</TableCell>
              <TableCell>{tx.type}</TableCell>
              <TableCell>{tx.status}</TableCell>
              <TableCell>{new Date(tx.created_at).toLocaleString('ar-SA')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
