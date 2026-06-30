'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, ChevronLeft, ChevronRight, Clock, CheckCircle, AlertCircle, X, Loader2, UserX } from 'lucide-react';

interface ServidorDia {
  servidor: { id: string; nome: string; matricula: string; cpf: string };
  cargo?: { nome: string };
  unidade?: { nome: string };
  registro: {
    id: string; horaEntrada: string | null; horaSaidaAlmoco: string | null;
    horaRetornoAlmoco: string | null; horaSaidaFinal: string | null;
    cargaDiaria: string | null; status: string;
  } | null;
  jornada: { horaEntrada: string; horaSaidaFinal: string } | null;
  temRegistro: boolean;
}

const tiposAusencia = [
  { value: 'FALTA', label: 'Falta' },
  { value: 'FALTA_JUSTIFICADA', label: 'Falta Justificada' },
  { value: 'FERIAS', label: 'Férias' },
  { value: 'LICENCA_SAUDE', label: 'Licença Saúde' },
  { value: 'LICENCA_PREMIO', label: 'Licença Prêmio' },
  { value: 'LICENCA_GESTANTE', label: 'Licença Gestante' },
  { value: 'LICENCA_PATERNIDADE', label: 'Licença Paternidade' },
  { value: 'LICENCA_NOJO', label: 'Licença Nojo' },
  { value: 'LICENCA_GALA', label: 'Licença Gala' },
  { value: 'AFASTAMENTO', label: 'Afastamento' },
  { value: 'CURSO', label: 'Curso' },
  { value: 'HOME_OFFICE', label: 'Home Office' },
];

export default function RegistroPontoPage() {
  const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0]);
  const [servidores, setServidores] = useState<ServidorDia[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [openAusencia, setOpenAusencia] = useState(false);
  const [servidorAusencia, setServidorAusencia] = useState<ServidorDia | null>(null);
  const [formAusencia, setFormAusencia] = useState({
    tipo: 'FALTA', dataInicio: '', dataFim: '', motivo: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchServidores(); }, [dataSelecionada]);

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }
  }, [toast]);

  async function fetchServidores() {
    setLoading(true);
    try {
      const res = await fetch(`/api/registro-ponto/admin?data=${dataSelecionada}`);
      if (res.ok) {
        const data = await res.json();
        setServidores(data.servidores || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function mudarDia(dias: number) {
    const d = new Date(dataSelecionada + 'T12:00:00');
    d.setDate(d.getDate() + dias);
    setDataSelecionada(d.toISOString().split('T')[0]);
  }

  function abrirAusencia(serv: ServidorDia) {
    setServidorAusencia(serv);
    setFormAusencia({
      tipo: 'FALTA',
      dataInicio: dataSelecionada,
      dataFim: dataSelecionada,
      motivo: '',
    });
    setOpenAusencia(true);
  }

  async function salvarAusencia() {
    if (!servidorAusencia) return;
    setSaving(true);
    try {
      const res = await fetch('/api/ausencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servidorId: servidorAusencia.servidor.id,
          tipo: formAusencia.tipo,
          dataInicio: formAusencia.dataInicio,
          dataFim: formAusencia.dataFim,
          motivo: formAusencia.motivo,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao lançar ausência');

      setToast({ type: 'success', message: `Ausência lançada para ${servidorAusencia.servidor.nome}!` });
      setOpenAusencia(false);
      fetchServidores();
    } catch (e: any) {
      setToast({ type: 'error', message: e.message });
    } finally { setSaving(false); }
  }

  const formatarData = (d: string) => {
    const [y, m, dd] = d.split('-');
    return `${dd}/${m}/${y}`;
  };

  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const getDiaSemana = (d: string) => diasSemana[new Date(d + 'T12:00:00').getDay()];

  const getStatusBadge = (status: string) => {
    const s: Record<string, { bg: string; text: string; label: string }> = {
      PRESENTE: { bg: 'bg-green-100', text: 'text-green-800', label: '✔ Presente' },
      FALTA: { bg: 'bg-red-100', text: 'text-red-800', label: '❌ Falta' },
      FALTA_JUSTIFICADA: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '🟡 Justificada' },
      FERIAS: { bg: 'bg-blue-100', text: 'text-blue-800', label: '🔵 Férias' },
      LICENCA: { bg: 'bg-purple-100', text: 'text-purple-800', label: '🟣 Licença' },
      AFASTAMENTO: { bg: 'bg-orange-100', text: 'text-orange-800', label: '🟠 Afastamento' },
      PENDENTE: { bg: 'bg-gray-100', text: 'text-gray-800', label: '🔴 Pendente' },
    };
    const st = s[status] || s.PENDENTE;
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${st.bg} ${st.text}`}>{st.label}</span>;
  };

  const presentes = servidores.filter(s => s.registro?.status === 'PRESENTE').length;
  const ausentes = servidores.filter(s => !s.temRegistro || s.registro?.status === 'FALTA').length;
  const total = servidores.length;

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Modal Ausência */}
      {openAusencia && servidorAusencia && (
        <Dialog open={openAusencia} onOpenChange={setOpenAusencia}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lançar Ausência - {servidorAusencia.servidor.nome}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Tipo de Ausência *</Label>
                <Select value={formAusencia.tipo} onValueChange={(v) => setFormAusencia({ ...formAusencia, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {tiposAusencia.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data Início *</Label>
                  <Input type="date" value={formAusencia.dataInicio} onChange={(e) => setFormAusencia({ ...formAusencia, dataInicio: e.target.value })} />
                </div>
                <div>
                  <Label>Data Fim *</Label>
                  <Input type="date" value={formAusencia.dataFim} onChange={(e) => setFormAusencia({ ...formAusencia, dataFim: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Motivo</Label>
                <Input value={formAusencia.motivo} onChange={(e) => setFormAusencia({ ...formAusencia, motivo: e.target.value })} placeholder="Observações..." />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setOpenAusencia(false)}>Cancelar</Button>
                <Button onClick={salvarAusencia} disabled={saving}>
                  {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Lançar Ausência'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Registro de Ponto</h1>
        <p className="text-gray-600 mt-1">Visualizar e gerenciar registros de todos os servidores</p>
      </div>

      {/* Navegação de Data */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={() => mudarDia(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{formatarData(dataSelecionada)}</p>
              <p className="text-sm text-gray-500">{getDiaSemana(dataSelecionada)}</p>
            </div>
            <Button variant="outline" size="icon" onClick={() => mudarDia(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex justify-center mt-3">
            <Input
              type="date"
              value={dataSelecionada}
              onChange={(e) => setDataSelecionada(e.target.value)}
              className="w-auto"
            />
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{total}</p>
            <p className="text-sm text-gray-500">Total Servidores</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{presentes}</p>
            <p className="text-sm text-gray-500">Presentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{ausentes}</p>
            <p className="text-sm text-gray-500">Sem Registro</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Servidores */}
      <Card>
        <CardHeader>
          <CardTitle>Servidores - {formatarData(dataSelecionada)}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" /></div>
          ) : servidores.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="font-medium">Nenhum servidor ativo cadastrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead className="text-center">Entrada</TableHead>
                    <TableHead className="text-center">Saída Almoço</TableHead>
                    <TableHead className="text-center">Retorno</TableHead>
                    <TableHead className="text-center">Saída Final</TableHead>
                    <TableHead className="text-center">Carga</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {servidores.map((item) => (
                    <TableRow key={item.servidor.id} className={!item.temRegistro ? 'bg-red-50' : ''}>
                      <TableCell className="font-medium">{item.servidor.matricula}</TableCell>
                      <TableCell>{item.servidor.nome}</TableCell>
                      <TableCell>{item.cargo?.nome || '-'}</TableCell>
                      <TableCell className="text-center font-mono">{item.registro?.horaEntrada || '-'}</TableCell>
                      <TableCell className="text-center font-mono">{item.registro?.horaSaidaAlmoco || '-'}</TableCell>
                      <TableCell className="text-center font-mono">{item.registro?.horaRetornoAlmoco || '-'}</TableCell>
                      <TableCell className="text-center font-mono">{item.registro?.horaSaidaFinal || '-'}</TableCell>
                      <TableCell className="text-center font-mono">{item.registro?.cargaDiaria ? `${item.registro.cargaDiaria}h` : '-'}</TableCell>
                      <TableCell className="text-center">
                        {item.registro ? getStatusBadge(item.registro.status) : <span className="text-red-600 text-sm font-medium">Sem registro</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {!item.temRegistro && (
                          <Button size="sm" variant="outline" className="text-orange-600 border-orange-300 hover:bg-orange-50" onClick={() => abrirAusencia(item)}>
                            <UserX className="w-4 h-4 mr-1" /> Lançar Ausência
                          </Button>
                        )}
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
