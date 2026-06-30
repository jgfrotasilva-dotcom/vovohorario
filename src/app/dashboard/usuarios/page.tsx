'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Shield, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  perfil: string;
  ativo: boolean;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cpf: '',
    senha: '',
    perfil: 'SERVIDOR',
  });

  useEffect(() => { fetchUsuarios(); }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function fetchUsuarios() {
    try {
      const res = await fetch('/api/usuarios');
      if (res.ok) {
        const data = await res.json();
        setUsuarios(data.usuarios || []);
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar');
      setToast({ type: 'success', message: `Usuário "${formData.nome}" criado com sucesso!` });
      setOpen(false);
      setFormData({ nome: '', email: '', cpf: '', senha: '', perfil: 'SERVIDOR' });
      fetchUsuarios();
    } catch (error: any) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(id: string, nome: string, ativo: boolean) {
    const novoStatus = !ativo;
    const acao = novoStatus ? 'ativar' : 'desativar';
    if (!confirm(`Deseja ${acao} o usuário "${nome}"?`)) return;
    try {
      const res = await fetch(`/api/usuarios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: novoStatus }),
      });
      if (!res.ok) throw new Error('Erro ao alterar status');
      setToast({ type: 'success', message: `Usuário "${nome}" ${novoStatus ? 'ativado' : 'desativado'}!` });
      fetchUsuarios();
    } catch (e: any) {
      setToast({ type: 'error', message: e.message });
    }
  }

  const getPerfilBadge = (perfil: string) => {
    const styles: Record<string, string> = {
      ADMINISTRADOR: 'bg-red-100 text-red-800',
      RH: 'bg-purple-100 text-purple-800',
      GESTOR: 'bg-blue-100 text-blue-800',
      SECRETARIO: 'bg-green-100 text-green-800',
      SERVIDOR: 'bg-gray-100 text-gray-800',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[perfil] || styles.SERVIDOR}`}>{perfil}</span>;
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
          <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-600 mt-1">Gerenciar usuários e permissões do sistema</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Novo Usuário</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Usuário</DialogTitle>
              <DialogDescription>Crie um novo acesso ao sistema</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div><Label>Nome *</Label><Input value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} required placeholder="Nome completo" /></div>
              <div><Label>E-mail *</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required placeholder="usuario@email.com" /></div>
              <div><Label>CPF *</Label><Input value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: e.target.value.replace(/\D/g, '')})} maxLength={11} required placeholder="Apenas números" /></div>
              <div><Label>Senha *</Label><Input type="password" value={formData.senha} onChange={(e) => setFormData({...formData, senha: e.target.value})} required minLength={6} placeholder="Mínimo 6 caracteres" /></div>
              <div>
                <Label>Perfil *</Label>
                <Select value={formData.perfil} onValueChange={(v) => setFormData({...formData, perfil: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMINISTRADOR">Administrador</SelectItem>
                    <SelectItem value="RH">RH</SelectItem>
                    <SelectItem value="GESTOR">Gestor</SelectItem>
                    <SelectItem value="SECRETARIO">Secretário</SelectItem>
                    <SelectItem value="SERVIDOR">Servidor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : 'Salvar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" />Lista de Usuários ({usuarios.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" /></div>
          ) : usuarios.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg font-medium">Nenhum usuário cadastrado</p>
              <p className="text-sm mt-1">Clique em "Novo Usuário" para começar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.nome}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.cpf}</TableCell>
                    <TableCell>{getPerfilBadge(u.perfil)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${u.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={u.ativo ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                        onClick={() => handleToggleStatus(u.id, u.nome, u.ativo)}
                      >
                        {u.ativo ? 'Desativar' : 'Ativar'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
