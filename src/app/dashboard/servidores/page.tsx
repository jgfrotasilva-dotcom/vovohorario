'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';

interface ServidorItem {
  servidor: { id: string; nome: string; matricula: string; cpf: string; situacao: string; dataAdmissao: string };
  cargo?: { id: string; nome: string };
  unidade?: { id: string; nome: string };
  setor?: { id: string; nome: string };
}
interface Cargo { id: string; nome: string; }
interface Unidade { id: string; nome: string; }
interface Setor { id: string; nome: string; }

interface DiaJornada {
  ativo: boolean;
  horaEntrada: string;
  horaSaidaAlmoco: string;
  horaRetornoAlmoco: string;
  horaSaidaFinal: string;
}

const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const nomesDias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

function criarJornadasPadrao(): Record<number, DiaJornada> {
  const j: Record<number, DiaJornada> = {};
  for (let i = 0; i < 7; i++) {
    j[i] = {
      ativo: i >= 1 && i <= 5,
      horaEntrada: '08:00',
      horaSaidaAlmoco: '12:00',
      horaRetornoAlmoco: '13:00',
      horaSaidaFinal: '17:00',
    };
  }
  return j;
}

const emptyForm = {
  nome: '', matricula: '', cpf: '', rg: '',
  cargoId: '', unidadeId: '', setorId: '',
  telefone: '', email: '', dataAdmissao: '',
  tolerancia: '10', foto: '',
};

export default function ServidoresPage() {
  const [servidores, setServidores] = useState<ServidorItem[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [jornadasForm, setJornadasForm] = useState<Record<number, DiaJornada>>(criarJornadasPadrao());
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 5000); return () => clearTimeout(t); } }, [toast]);

  async function fetchData() {
    setLoading(true);
    try {
      const [s, c, u, se] = await Promise.all([fetch('/api/servidores'), fetch('/api/cargos'), fetch('/api/unidades'), fetch('/api/setores')]);
      if (s.ok) setServidores((await s.json()).servidores || []);
      if (c.ok) setCargos((await c.json()).cargos || []);
      if (u.ok) setUnidades((await u.json()).unidades || []);
      if (se.ok) setSetores((await se.json()).setores || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function abrirNovo() {
    setEditId(null);
    setFormData(emptyForm);
    setJornadasForm(criarJornadasPadrao());
    setOpen(true);
  }

  async function abrirEditar(id: string) {
    try {
      const res = await fetch(`/api/servidores/${id}`);
      if (!res.ok) throw new Error('Erro ao buscar');
      const data = await res.json();
      const s = data.servidor;
      const lista: any[] = data.jornadas || [];

      setEditId(id);
      setFormData({
        nome: s.nome || '', matricula: s.matricula || '', cpf: s.cpf || '',
        rg: s.rg || '', cargoId: s.cargoId || '', unidadeId: s.unidadeId || '',
        setorId: s.setorId || '', telefone: s.telefone || '', email: s.email || '',
        dataAdmissao: s.dataAdmissao || '', tolerancia: '10', foto: s.foto || '',
      });

      // Preencher jornadas do banco
      const j = criarJornadasPadrao();
      for (const item of lista) {
        j[item.diaSemana] = {
          ativo: true,
          horaEntrada: item.horaEntrada || '08:00',
          horaSaidaAlmoco: item.horaSaidaAlmoco || '',
          horaRetornoAlmoco: item.horaRetornoAlmoco || '',
          horaSaidaFinal: item.horaSaidaFinal || '17:00',
        };
      }
      // Marcar como inativo os dias que não estão na lista
      for (let i = 0; i < 7; i++) {
        if (!lista.find((l: any) => l.diaSemana === i)) {
          j[i].ativo = false;
        }
      }
      setJornadasForm(j);
      setOpen(true);
    } catch (e: any) {
      setToast({ type: 'error', message: e.message });
    }
  }

  function atualizarJornada(dia: number, campo: keyof DiaJornada, valor: any) {
    setJornadasForm(prev => ({
      ...prev,
      [dia]: { ...prev[dia], [campo]: valor },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const diasAtivos = Object.entries(jornadasForm)
        .filter(([_, j]) => j.ativo)
        .map(([d]) => parseInt(d));

      if (diasAtivos.length === 0) {
        throw new Error('Selecione pelo menos um dia da semana');
      }

      const payload: any = {
        ...formData,
        diasSemana: diasAtivos,
        jornadas: jornadasForm,
      };

      const url = editId ? `/api/servidores/${editId}` : '/api/servidores';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar');

      setToast({ type: 'success', message: editId ? `Servidor atualizado!` : (data.message || 'Servidor cadastrado!') });
      setOpen(false);
      setFormData(emptyForm);
      setEditId(null);
      fetchData();
    } catch (e: any) {
      setToast({ type: 'error', message: e.message });
    } finally { setSaving(false); }
  }

  async function handleToggleStatus(id: string, nome: string, situacaoAtual: string) {
    const novoStatus = situacaoAtual === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    const acao = novoStatus === 'ATIVO' ? 'ativar' : 'desativar';
    
    if (!confirm(`Deseja ${acao} o servidor "${nome}"?`)) return;
    
    try {
      const res = await fetch(`/api/servidores/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situacao: novoStatus }),
      });
      if (!res.ok) throw new Error('Erro ao alterar status');
      setToast({ type: 'success', message: `"${nome}" ${novoStatus === 'ATIVO' ? 'ativado' : 'desativado'}!` });
      fetchData();
    } catch (e: any) { setToast({ type: 'error', message: e.message }); }
  }

  const getSituacaoBadge = (s: string) => {
    const st: Record<string, string> = { ATIVO: 'bg-green-100 text-green-800', INATIVO: 'bg-gray-100 text-gray-800' };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${st[s] || st.ATIVO}`}>{s}</span>;
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Servidores</h1>
          <p className="text-gray-600 mt-1">Gerenciar cadastro e jornada de trabalho</p>
        </div>
        <Button onClick={abrirNovo}><Plus className="w-4 h-4 mr-2" /> Novo Servidor</Button>
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); setFormData(emptyForm); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar Servidor' : 'Novo Servidor'}</DialogTitle>
            <DialogDescription>Preencha os dados e configure a jornada por dia da semana</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Dados Pessoais */}
            <h3 className="font-semibold text-gray-700 border-b pb-2">👤 Dados Pessoais</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nome Completo *</Label>
                <Input value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} required />
              </div>
              <div>
                <Label>Matrícula *</Label>
                <Input value={formData.matricula} onChange={(e) => setFormData({ ...formData, matricula: e.target.value })} required />
              </div>
              <div>
                <Label>CPF *</Label>
                <Input value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: e.target.value.replace(/\D/g, '') })} maxLength={11} required />
              </div>
              <div>
                <Label>RG</Label>
                <Input value={formData.rg} onChange={(e) => setFormData({ ...formData, rg: e.target.value })} />
              </div>
              <div>
                <Label>Data de Admissão *</Label>
                <Input type="date" value={formData.dataAdmissao} onChange={(e) => setFormData({ ...formData, dataAdmissao: e.target.value })} required />
              </div>
              <div>
                <Label>Cargo</Label>
                <Select value={formData.cargoId} onValueChange={(v) => setFormData({ ...formData, cargoId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {cargos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unidade</Label>
                <Select value={formData.unidadeId} onValueChange={(v) => setFormData({ ...formData, unidadeId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {unidades.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Setor</Label>
                <Select value={formData.setorId} onValueChange={(v) => setFormData({ ...formData, setorId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {setores.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Foto do Servidor</Label>
                <div className="flex items-center gap-4 mt-1">
                  {formData.foto && (
                    <img src={formData.foto} alt="Foto" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setFormData({ ...formData, foto: ev.target?.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    {formData.foto && (
                      <button type="button" onClick={() => setFormData({ ...formData, foto: '' })} className="text-xs text-red-600 mt-1 hover:underline">
                        Remover foto
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Jornada Flexível */}
            <h3 className="font-semibold text-gray-700 border-b pb-2 mt-4">⏰ Jornada de Trabalho por Dia da Semana</h3>
            <p className="text-xs text-gray-500">Ative os dias e configure horários diferentes para cada dia.</p>

            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6, 0].map((dia) => {
                const j = jornadasForm[dia];
                return (
                  <div key={dia} className={`border rounded-lg p-3 ${j.ativo ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="checkbox"
                        checked={j.ativo}
                        onChange={(e) => atualizarJornada(dia, 'ativo', e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      <span className={`font-semibold text-sm ${j.ativo ? 'text-blue-800' : 'text-gray-500'}`}>
                        {nomesDias[dia]}
                      </span>
                    </div>
                    {j.ativo && (
                      <div className="grid grid-cols-4 gap-3 ml-7">
                        <div>
                          <Label className="text-xs">Entrada</Label>
                          <Input type="time" value={j.horaEntrada} onChange={(e) => atualizarJornada(dia, 'horaEntrada', e.target.value)} className="h-8 text-sm" />
                        </div>
                        <div>
                          <Label className="text-xs">Saída Almoço</Label>
                          <Input type="time" value={j.horaSaidaAlmoco} onChange={(e) => atualizarJornada(dia, 'horaSaidaAlmoco', e.target.value)} className="h-8 text-sm" />
                        </div>
                        <div>
                          <Label className="text-xs">Retorno</Label>
                          <Input type="time" value={j.horaRetornoAlmoco} onChange={(e) => atualizarJornada(dia, 'horaRetornoAlmoco', e.target.value)} className="h-8 text-sm" />
                        </div>
                        <div>
                          <Label className="text-xs">Saída Final</Label>
                          <Input type="time" value={j.horaSaidaFinal} onChange={(e) => atualizarJornada(dia, 'horaSaidaFinal', e.target.value)} className="h-8 text-sm" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving} className="min-w-[140px]">
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : editId ? 'Atualizar' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lista */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Servidores ({servidores.length})</CardTitle>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Buscar..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" /></div>
          ) : servidores.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg font-medium">Nenhum servidor cadastrado</p>
              <p className="text-sm mt-1">Clique em "Novo Servidor" para começar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {servidores.filter((item) => {
                    if (!search) return true;
                    const s = search.toLowerCase();
                    return item.servidor.nome.toLowerCase().includes(s) || item.servidor.matricula.toLowerCase().includes(s) || item.servidor.cpf.includes(s);
                  }).map((item) => (
                    <TableRow key={item.servidor.id}>
                      <TableCell className="font-medium">{item.servidor.matricula}</TableCell>
                      <TableCell>{item.servidor.nome}</TableCell>
                      <TableCell>{item.servidor.cpf}</TableCell>
                      <TableCell>{item.cargo?.nome || '-'}</TableCell>
                      <TableCell>{item.unidade?.nome || '-'}</TableCell>
                      <TableCell>{getSituacaoBadge(item.servidor.situacao)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => abrirEditar(item.servidor.id)}><Edit className="w-4 h-4" /></Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={item.servidor.situacao === 'ATIVO' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                            onClick={() => handleToggleStatus(item.servidor.id, item.servidor.nome, item.servidor.situacao)}
                          >
                            {item.servidor.situacao === 'ATIVO' ? 'Desativar' : 'Ativar'}
                          </Button>
                        </div>
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
