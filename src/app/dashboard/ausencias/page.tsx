'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, CheckCircle, AlertCircle, X, Loader2, Trash2, Clock, Filter } from 'lucide-react';

interface Servidor { id: string; nome: string; matricula: string; }
interface Ausencia {
  ausencia: {
    id: string; tipo: string; dataInicio: string; dataFim: string;
    motivo: string | null; aprovado: boolean | null;
    criadoEm: string; criadoPor: string;
  };
  servidor: { id: string; nome: string; matricula: string } | null;
  cargo: { nome: string } | null;
  dias: number;
}

const tiposAusencia = [
  { value: 'FALTA', label: 'Falta', cor: 'bg-red-100 text-red-800' },
  { value: 'FALTA_JUSTIFICADA', label: 'Falta Justificada', cor: 'bg-yellow-100 text-yellow-800' },
  { value: 'ABONO', label: 'Abono', cor: 'bg-green-100 text-green-800' },
  { value: 'FERIAS', label: 'Férias', cor: 'bg-blue-100 text-blue-800' },
  { value: 'LICENCA_SAUDE', label: 'Licença Saúde', cor: 'bg-purple-100 text-purple-800' },
  { value: 'LICENCA_PREMIO', label: 'Licença Prêmio', cor: 'bg-indigo-100 text-indigo-800' },
  { value: 'LICENCA_GESTANTE', label: 'Licença Gestante', cor: 'bg-pink-100 text-pink-800' },
  { value: 'LICENCA_PATERNIDADE', label: 'Licença Paternidade', cor: 'bg-cyan-100 text-cyan-800' },
  { value: 'LICENCA_NOJO', label: 'Licença Nojo', cor: 'bg-gray-100 text-gray-800' },
  { value: 'LICENCA_GALA', label: 'Licença Gala', cor: 'bg-amber-100 text-amber-800' },
  { value: 'AFASTAMENTO', label: 'Afastamento', cor: 'bg-orange-100 text-orange-800' },
  { value: 'CURSO', label: 'Curso', cor: 'bg-teal-100 text-teal-800' },
  { value: 'HOME_OFFICE', label: 'Home Office', cor: 'bg-violet-100 text-violet-800' },
  { value: 'COMPENSACAO', label: 'Compensação', cor: 'bg-emerald-100 text-emerald-800' },
  { value: 'DISPENSA', label: 'Dispensa', cor: 'bg-lime-100 text-lime-800' },
  { value: 'RECESSO', label: 'Recesso', cor: 'bg-sky-100 text-sky-800' },
  { value: 'PONTO_FACULTATIVO', label: 'Ponto Facultativo', cor: 'bg-fuchsia-100 text-fuchsia-800' },
  { value: 'OUTRO', label: 'Outro', cor: 'bg-slate-100 text-slate-800' },
];

export default function AusenciasPage() {
  const [ausencias, setAusencias] = useState<Ausencia[]>([]);
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroServidor, setFiltroServidor] = useState('todos');

  const mesAtual = new Date().getMonth() + 1;
  const anoAtual = new Date().getFullYear();
  const [mes, setMes] = useState(mesAtual);
  const [ano, setAno] = useState(anoAtual);

  const [form, setForm] = useState({
    servidorId: '', tipo: 'FERIAS', dataInicio: '', dataFim: '', motivo: '',
  });

  useEffect(() => { fetchData(); fetchServidores(); }, [mes, ano, filtroStatus, filtroServidor]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 5000); return () => clearTimeout(t); } }, [toast]);

  async function fetchServidores() {
    try {
      const res = await fetch('/api/servidores');
      if (res.ok) {
        const data = await res.json();
        setServidores((data.servidores || []).map((s: any) => ({
          id: s.servidor.id, nome: s.servidor.nome, matricula: s.servidor.matricula,
        })));
      }
    } catch (e) { console.error(e); }
  }

  async function fetchData() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ mes: String(mes), ano: String(ano) });
      if (filtroStatus !== 'todos') params.append('status', filtroStatus);
      if (filtroServidor !== 'todos') params.append('servidorId', filtroServidor);

      const res = await fetch(`/api/ausencias?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAusencias(data.ausencias || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/ausencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar');

      setToast({ type: 'success', message: data.message || 'Ausência criada!' });
      setOpen(false);
      setForm({ servidorId: '', tipo: 'FERIAS', dataInicio: '', dataFim: '', motivo: '' });
      fetchData();
    } catch (e: any) {
      setToast({ type: 'error', message: e.message });
    } finally { setSaving(false); }
  }

  async function handleExcluir(id: string) {
    if (!confirm('Excluir esta ausência? Os registros de ponto serão removidos.')) return;
    try {
      const res = await fetch(`/api/ausencias/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir');
      setToast({ type: 'success', message: 'Ausência excluída!' });
      fetchData();
    } catch (e: any) {
      setToast({ type: 'error', message: e.message });
    }
  }

  const getTipoBadge = (tipo: string) => {
    const t = tiposAusencia.find(t => t.value === tipo);
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${t?.cor || 'bg-gray-100 text-gray-800'}`}>{t?.label || tipo}</span>;
  };

  const getStatusBadge = (aprovado: boolean | null) => {
    if (aprovado === null) return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">⏳ Pendente</span>;
    if (aprovado) return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">✓ Aprovado</span>;
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">✗ Rejeitado</span>;
  };

  const formatarData = (d: string) => { const [y, m, dd] = d.split('-'); return `${dd}/${m}/${y}`; };

  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const totalDias = ausencias.reduce((acc, a) => acc + a.dias, 0);
  const pendentes = ausencias.filter(a => a.ausencia.aprovado === null).length;
  const aprovadas = ausencias.filter(a => a.ausencia.aprovado === true).length;

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Modal Criar */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Ausência</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCriar} className="space-y-4 mt-4">
            <div>
              <Label>Servidor *</Label>
              <Select value={form.servidorId} onValueChange={(v) => setForm({ ...form, servidorId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o servidor" /></SelectTrigger>
                <SelectContent>
                  {servidores.map(s => <SelectItem key={s.id} value={s.id}>{s.nome} ({s.matricula})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de Ausência *</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tiposAusencia.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Início *</Label>
                <Input type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} required />
              </div>
              <div>
                <Label>Data Fim *</Label>
                <Input type="date" value={form.dataFim} onChange={(e) => setForm({ ...form, dataFim: e.target.value })} required />
              </div>
            </div>
            <div>
              <Label>Motivo / Observação</Label>
              <Input value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} placeholder="Ex: Atestado médico, férias programadas..." />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              💡 Ao criar a ausência, o sistema automaticamente criará registros de ponto para cada dia útil no período.
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Criar Ausência'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ausências</h1>
          <p className="text-gray-600 mt-1">Gerenciar férias, licenças e afastamentos</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" /> Nova Ausência</Button>
      </div>

      {/* Cards Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{ausencias.length}</p>
            <p className="text-sm text-gray-500">Total Ausências</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{totalDias}</p>
            <p className="text-sm text-gray-500">Total Dias</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-yellow-600">{pendentes}</p>
            <p className="text-sm text-gray-500">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{aprovadas}</p>
            <p className="text-sm text-gray-500">Aprovadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtros:</span>
            </div>
            <select value={mes} onChange={(e) => setMes(parseInt(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
              {meses.map((m: string, i: number) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
            <select value={ano} onChange={(e) => setAno(parseInt(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
              {[anoAtual - 1, anoAtual, anoAtual + 1].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
              <option value="todos">Todos os Status</option>
              <option value="pendente">Pendentes</option>
              <option value="aprovado">Aprovados</option>
              <option value="rejeitado">Rejeitados</option>
            </select>
            <select value={filtroServidor} onChange={(e) => setFiltroServidor(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
              <option value="todos">Todos os Servidores</option>
              {servidores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Ausências - {meses[mes - 1]}/{ano}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" /></div>
          ) : ausencias.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">Nenhuma ausência registrada</p>
              <p className="text-sm mt-1">Clique em "Nova Ausência" para começar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Servidor</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-center">Dias</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ausencias.map((item) => (
                    <TableRow key={item.ausencia.id}>
                      <TableCell className="font-medium">{item.servidor?.nome || '-'}</TableCell>
                      <TableCell>{item.servidor?.matricula || '-'}</TableCell>
                      <TableCell>{getTipoBadge(item.ausencia.tipo)}</TableCell>
                      <TableCell className="text-sm">
                        {formatarData(item.ausencia.dataInicio)} a {formatarData(item.ausencia.dataFim)}
                      </TableCell>
                      <TableCell className="text-center font-bold">{item.dias}</TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">{item.ausencia.motivo || '-'}</TableCell>
                      <TableCell>{getStatusBadge(item.ausencia.aprovado)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleExcluir(item.ausencia.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
