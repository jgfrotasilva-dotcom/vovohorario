'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, Printer, Download, CheckCircle, AlertCircle, X } from 'lucide-react';

interface ServidorItem { id: string; nome: string; matricula: string; cargo: string; }
interface DiaFolha {
  dia: number; data: string; diaSemana: string; isWeekend: boolean;
  registro: { horaEntrada: string; horaSaidaAlmoco: string; horaRetornoAlmoco: string; horaSaidaFinal: string; cargaDiaria: string; status: string; } | null;
  jornada: { horaEntrada: string; horaSaidaFinal: string; } | null;
}

export default function FolhaPontoPage() {
  const [servidores, setServidores] = useState<ServidorItem[]>([]);
  const [servidorSelecionado, setServidorSelecionado] = useState('');
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [folha, setFolha] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingServidores, setLoadingServidores] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  useEffect(() => { fetchServidores(); }, []);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); } }, [toast]);

  async function fetchServidores() {
    try {
      const res = await fetch('/api/folha-ponto');
      if (res.ok) {
        const data = await res.json();
        setServidores(data.servidores || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoadingServidores(false); }
  }

  async function gerarFolha() {
    if (!servidorSelecionado) { setToast({ type: 'error', message: 'Selecione um servidor' }); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/folha-ponto?mes=${mes}&ano=${ano}&servidorId=${servidorSelecionado}`);
      if (!res.ok) throw new Error('Erro ao gerar folha');
      const data = await res.json();
      setFolha(data);
    } catch (e: any) {
      setToast({ type: 'error', message: e.message });
    } finally { setLoading(false); }
  }

  function imprimir() {
    window.print();
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PRESENTE: 'text-green-700 bg-green-50',
      FALTA: 'text-red-700 bg-red-50',
      FALTA_JUSTIFICADA: 'text-yellow-700 bg-yellow-50',
      FERIAS: 'text-blue-700 bg-blue-50',
      LICENCA: 'text-purple-700 bg-purple-50',
      AFASTAMENTO: 'text-orange-700 bg-orange-50',
      PENDENTE: 'text-gray-500 bg-gray-50',
    };
    return colors[status] || 'text-gray-500 bg-gray-50';
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

      {/* Controles - não imprime */}
      <div className="no-print">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Folha de Ponto</h1>
            <p className="text-gray-600 mt-1">Gerar folha de ponto mensal para impressão</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-gray-700">Servidor *</label>
                <select value={servidorSelecionado} onChange={(e) => setServidorSelecionado(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option value="">Selecione o servidor</option>
                  {servidores.map(s => <option key={s.id} value={s.id}>{s.nome} - {s.matricula} ({s.cargo})</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Mês</label>
                <select value={mes} onChange={(e) => setMes(parseInt(e.target.value))} className="mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm">
                  {meses.map((m: string, i: number) => <option key={i + 1} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Ano</label>
                <select value={ano} onChange={(e) => setAno(parseInt(e.target.value))} className="mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm">
                  {[ano - 1, ano, ano + 1].map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <Button onClick={gerarFolha} disabled={loading || loadingServidores}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                Gerar Folha
              </Button>
              {folha && (
                <Button onClick={imprimir} variant="outline">
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Folha de Ponto - imprime */}
      {folha && (
        <div className="bg-white border-2 border-gray-800 p-8 print:border-0 print:p-4" id="folha-ponto">
          {/* Cabeçalho */}
          <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
            <h1 className="text-base font-bold uppercase tracking-wide">Governo do Estado de São Paulo</h1>
            <p className="text-sm font-semibold uppercase">Secretaria de Estado da Educação</p>
            <p className="text-sm font-medium uppercase">Unidade Regional de Ensino de Araraquara</p>
            <p className="text-sm font-bold uppercase mt-1">{folha.unidade || 'Escola'}</p>
            <h2 className="text-lg font-bold mt-4 uppercase border-t border-gray-400 pt-3">Folha de Ponto Mensal</h2>
            <p className="text-xs text-gray-500">Documento: {folha.documento}</p>
          </div>

          {/* Dados do Servidor */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm border-b border-gray-300 pb-4">
            <div>
              <p><strong>Nome:</strong> {folha.servidor?.nome}</p>
              <p><strong>Matrícula:</strong> {folha.servidor?.matricula}</p>
              <p><strong>Cargo:</strong> {folha.cargo}</p>
            </div>
            <div className="text-right">
              <p><strong>Mês/Ano:</strong> {meses[mes - 1]}/{ano}</p>
              <p><strong>Setor:</strong> {folha.setor}</p>
              <p><strong>Unidade:</strong> {folha.unidade}</p>
            </div>
          </div>

          {/* Tabela de Registros */}
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1 text-center">Dia</th>
                  <th className="border border-gray-300 px-2 py-1 text-center">Data</th>
                  <th className="border border-gray-300 px-2 py-1 text-center">Dia Sem.</th>
                  <th className="border border-gray-300 px-2 py-1 text-center">Entrada</th>
                  <th className="border border-gray-300 px-2 py-1 text-center">Saída Almoço</th>
                  <th className="border border-gray-300 px-2 py-1 text-center">Retorno</th>
                  <th className="border border-gray-300 px-2 py-1 text-center">Saída Final</th>
                  <th className="border border-gray-300 px-2 py-1 text-center">Carga (h)</th>
                  <th className="border border-gray-300 px-2 py-1 text-center">Situação</th>
                </tr>
              </thead>
              <tbody>
                {folha.dias.map((d: DiaFolha) => (
                  <tr key={d.dia} className={d.isWeekend ? 'bg-gray-50' : ''}>
                    <td className="border border-gray-300 px-2 py-1 text-center font-bold">{d.dia}</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">
                      {d.data.split('-').reverse().join('/')}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center font-medium">{d.diaSemana}</td>
                    <td className="border border-gray-300 px-2 py-1 text-center font-mono">
                      {d.registro?.horaEntrada || (d.isWeekend ? '-' : '')}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center font-mono">
                      {d.registro?.horaSaidaAlmoco || '-'}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center font-mono">
                      {d.registro?.horaRetornoAlmoco || '-'}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center font-mono">
                      {d.registro?.horaSaidaFinal || (d.isWeekend ? '-' : '')}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center font-mono font-bold">
                      {d.registro?.cargaDiaria || '-'}
                    </td>
                    <td className={cn('border border-gray-300 px-2 py-1 text-center font-medium text-[10px]', getStatusColor(d.registro?.status || (d.isWeekend ? 'FOLGA' : 'PENDENTE')))}>
                      {d.registro?.status || (d.isWeekend ? 'FOLGA' : 'PENDENTE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totais */}
          <div className="grid grid-cols-5 gap-2 mb-6 text-sm border-t border-gray-300 pt-4">
            <div className="text-center">
              <p className="font-bold text-lg">{folha.totais.diasUteis}</p>
              <p className="text-xs text-gray-500">Dias Úteis</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg text-green-600">{folha.totais.diasPresentes}</p>
              <p className="text-xs text-gray-500">Presentes</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg text-red-600">{folha.totais.diasFaltas}</p>
              <p className="text-xs text-gray-500">Faltas</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg text-blue-600">{folha.totais.diasFerias}</p>
              <p className="text-xs text-gray-500">Férias</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg text-purple-600">{folha.totais.diasLicenca}</p>
              <p className="text-xs text-gray-500">Licenças</p>
            </div>
          </div>

          {/* Carga Horária Total */}
          <div className="text-center mb-6 p-3 bg-gray-100 rounded">
            <p className="text-sm">Carga Horária Total no Mês: <strong className="text-lg">{folha.totais.cargaHoras} horas</strong></p>
          </div>

          {/* Assinaturas */}
          <div className="grid grid-cols-2 gap-16 mt-12">
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2">
                <p className="text-sm font-medium">{folha.servidor?.nome}</p>
                <p className="text-xs text-gray-500">Servidor</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2">
                <p className="text-sm font-medium">________________________</p>
                <p className="text-xs text-gray-500">Gestor / Responsável</p>
              </div>
            </div>
          </div>

          {/* Rodapé */}
          <div className="text-center mt-8 text-xs text-gray-400 border-t border-gray-200 pt-4">
            <p>Documento gerado automaticamente pelo Sistema de Ponto Eletrônico</p>
            <p>{folha.documento} | {meses[mes - 1]}/{ano}</p>
          </div>
        </div>
      )}

      {!folha && !loading && (
        <Card>
          <CardContent className="py-16 text-center text-gray-400">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Selecione um servidor e gere a folha de ponto</p>
            <p className="text-sm mt-2">A folha será formatada para impressão em A4</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
