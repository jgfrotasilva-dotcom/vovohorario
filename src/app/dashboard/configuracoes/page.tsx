'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, BriefcaseBusiness, Users2, Plus, Loader2, CheckCircle, AlertCircle, X, Trash2 } from 'lucide-react';

export default function ConfiguracoesPage() {
  const [unidades, setUnidades] = useState<any[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);
  const [setores, setSetores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [openUnidade, setOpenUnidade] = useState(false);
  const [openCargo, setOpenCargo] = useState(false);
  const [openSetor, setOpenSetor] = useState(false);

  const [unidadeForm, setUnidadeForm] = useState({ nome: '', codigo: '', endereco: '', telefone: '', email: '' });
  const [cargoForm, setCargoForm] = useState({ nome: '', categoria: '', cargaHorariaPadrao: 40 });
  const [setorForm, setSetorForm] = useState({ nome: '', unidadeId: '' });

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function fetchData() {
    setLoading(true);
    try {
      const [u, c, s] = await Promise.all([
        fetch('/api/unidades'),
        fetch('/api/cargos'),
        fetch('/api/setores'),
      ]);

      if (u.ok) setUnidades((await u.json()).unidades || []);
      if (c.ok) setCargos((await c.json()).cargos || []);
      if (s.ok) setSetores((await s.json()).setores || []);
    } catch (error) {
      console.error('Erro ao carregar:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUnidadeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/unidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unidadeForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar');
      setToast({ type: 'success', message: `Unidade "${unidadeForm.nome}" cadastrada com sucesso!` });
      setOpenUnidade(false);
      setUnidadeForm({ nome: '', codigo: '', endereco: '', telefone: '', email: '' });
      fetchData();
    } catch (error: any) {
      setToast({ type: 'error', message: error.message || 'Erro ao salvar unidade.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleCargoSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/cargos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cargoForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar');
      setToast({ type: 'success', message: `Cargo "${cargoForm.nome}" cadastrado com sucesso!` });
      setOpenCargo(false);
      setCargoForm({ nome: '', categoria: '', cargaHorariaPadrao: 40 });
      fetchData();
    } catch (error: any) {
      setToast({ type: 'error', message: error.message || 'Erro ao salvar cargo.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleSetorSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/setores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setorForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar');
      setToast({ type: 'success', message: `Setor "${setorForm.nome}" cadastrado com sucesso!` });
      setOpenSetor(false);
      setSetorForm({ nome: '', unidadeId: '' });
      fetchData();
    } catch (error: any) {
      setToast({ type: 'error', message: error.message || 'Erro ao salvar setor.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(tipo: string, id: string, nome: string) {
    if (!confirm(`Deseja excluir "${nome}"?`)) return;
    try {
      const res = await fetch(`/api/${tipo}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir');
      setToast({ type: 'success', message: `"${nome}" excluído com sucesso!` });
      fetchData();
    } catch (error: any) {
      setToast({ type: 'error', message: error.message || 'Erro ao excluir.' });
    }
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-1">Configure os parâmetros básicos do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* UNIDADES */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Unidades ({unidades.length})
            </CardTitle>
            <CardDescription>Escolas e unidades</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="text-center py-4"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" /></div>
            ) : unidades.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhuma unidade cadastrada</p>
            ) : (
              unidades.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium text-sm">{u.nome}</p>
                    {u.codigo && <p className="text-xs text-gray-500">{u.codigo}</p>}
                  </div>
                  <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleDelete('unidades', u.id, u.nome)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
            <Dialog open={openUnidade} onOpenChange={setOpenUnidade}>
              <DialogTrigger asChild>
                <Button className="w-full" size="sm"><Plus className="w-4 h-4 mr-2" />Nova Unidade</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Cadastrar Unidade</DialogTitle></DialogHeader>
                <form onSubmit={handleUnidadeSubmit} className="space-y-4">
                  <div><Label>Nome *</Label><Input value={unidadeForm.nome} onChange={(e) => setUnidadeForm({...unidadeForm, nome: e.target.value})} required placeholder="Ex: Escola Municipal Centro" /></div>
                  <div><Label>Código</Label><Input value={unidadeForm.codigo} onChange={(e) => setUnidadeForm({...unidadeForm, codigo: e.target.value})} placeholder="Ex: EM001" /></div>
                  <div><Label>Endereço</Label><Input value={unidadeForm.endereco} onChange={(e) => setUnidadeForm({...unidadeForm, endereco: e.target.value})} placeholder="Rua, número - Cidade" /></div>
                  <div><Label>Telefone</Label><Input value={unidadeForm.telefone} onChange={(e) => setUnidadeForm({...unidadeForm, telefone: e.target.value})} placeholder="(00) 0000-0000" /></div>
                  <div><Label>E-mail</Label><Input type="email" value={unidadeForm.email} onChange={(e) => setUnidadeForm({...unidadeForm, email: e.target.value})} placeholder="contato@escola.gov.br" /></div>
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : 'Salvar'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* CARGOS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BriefcaseBusiness className="w-5 h-5" />
              Cargos ({cargos.length})
            </CardTitle>
            <CardDescription>Funções dos servidores</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="text-center py-4"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" /></div>
            ) : cargos.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum cargo cadastrado</p>
            ) : (
              cargos.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium text-sm">{c.nome}</p>
                    {c.categoria && <p className="text-xs text-gray-500">{c.categoria}</p>}
                  </div>
                  <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleDelete('cargos', c.id, c.nome)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
            <Dialog open={openCargo} onOpenChange={setOpenCargo}>
              <DialogTrigger asChild>
                <Button className="w-full" size="sm"><Plus className="w-4 h-4 mr-2" />Novo Cargo</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Cadastrar Cargo</DialogTitle></DialogHeader>
                <form onSubmit={handleCargoSubmit} className="space-y-4">
                  <div><Label>Nome *</Label><Input value={cargoForm.nome} onChange={(e) => setCargoForm({...cargoForm, nome: e.target.value})} required placeholder="Ex: Professor, Diretor" /></div>
                  <div><Label>Categoria</Label><Input value={cargoForm.categoria} onChange={(e) => setCargoForm({...cargoForm, categoria: e.target.value})} placeholder="Ex: Docente, Administrativo" /></div>
                  <div><Label>Carga Horária (horas/semana)</Label><Input type="number" value={cargoForm.cargaHorariaPadrao} onChange={(e) => setCargoForm({...cargoForm, cargaHorariaPadrao: parseInt(e.target.value) || 40})} /></div>
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : 'Salvar'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* SETORES */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users2 className="w-5 h-5" />
              Setores ({setores.length})
            </CardTitle>
            <CardDescription>Departamentos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="text-center py-4"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" /></div>
            ) : setores.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum setor cadastrado</p>
            ) : (
              setores.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2 border rounded">
                  <p className="font-medium text-sm">{s.nome}</p>
                  <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleDelete('setores', s.id, s.nome)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
            <Dialog open={openSetor} onOpenChange={setOpenSetor}>
              <DialogTrigger asChild>
                <Button className="w-full" size="sm" disabled={unidades.length === 0}>
                  <Plus className="w-4 h-4 mr-2" />Novo Setor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Cadastrar Setor</DialogTitle></DialogHeader>
                <form onSubmit={handleSetorSubmit} className="space-y-4">
                  <div><Label>Nome *</Label><Input value={setorForm.nome} onChange={(e) => setSetorForm({...setorForm, nome: e.target.value})} required placeholder="Ex: Administração, Pedagógico" /></div>
                  <div>
                    <Label>Unidade *</Label>
                    <Select value={setorForm.unidadeId} onValueChange={(v) => setSetorForm({...setorForm, unidadeId: v})}>
                      <SelectTrigger><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
                      <SelectContent>
                        {unidades.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : 'Salvar'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-2">📋 Passos para começar:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Cadastre pelo menos uma <strong>Unidade</strong> (ex: Escola Municipal Centro)</li>
            <li>Cadastre <strong>Cargos</strong> (ex: Professor, Auxiliar Administrativo, Diretor)</li>
            <li>Cadastre <strong>Setores</strong> (ex: Administração, Pedagógico)</li>
            <li>Vá em <strong>Servidores</strong> e comece a cadastrar os funcionários</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
