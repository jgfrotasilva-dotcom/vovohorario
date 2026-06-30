'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Loader2, BarChart3, Clock, Calendar, User, TrendingUp, AlertCircle } from 'lucide-react';

interface Servidor { id: string; nome: string; matricula: string; }

type RelatorioTipo = 'frequencia' | 'banco-horas' | 'ausencias' | 'horas-extras' | 'individual';

const relatorios = [
  { tipo: 'frequencia' as RelatorioTipo, label: 'Frequência', desc: 'Índice de presença dos servidores', icon: BarChart3, cor: 'bg-blue-500' },
  { tipo: 'banco-horas' as RelatorioTipo, label: 'Banco de Horas', desc: 'Saldo de horas por servidor', icon: Clock, cor: 'bg-green-500' },
  { tipo: 'ausencias' as RelatorioTipo, label: 'Ausências', desc: 'Férias, licenças e afastamentos', icon: AlertCircle, cor: 'bg-orange-500' },
  { tipo: 'horas-extras' as RelatorioTipo, label: 'Horas Extras', desc: 'Horas trabalhadas além da jornada', icon: TrendingUp, cor: 'bg-purple-500' },
  { tipo: 'individual' as RelatorioTipo, label: 'Servidor Individual', desc: 'Relatório detalhado por servidor', icon: User, cor: 'bg-pink-500' },
];

export default function RelatoriosPage() {
  const [tipoAtivo, setTipoAtivo] = useState<RelatorioTipo>('frequencia');
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [servidorSelecionado, setServidorSelecionado] = useState('');
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  useEffect(() => { fetchServidores(); }, []);
  useEffect(() => { gerarRelatorio(); }, [tipoAtivo, mes, ano, servidorSelecionado]);

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

  async function gerarRelatorio() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tipo: tipoAtivo, mes: String(mes), ano: String(ano) });
      if (tipoAtivo === 'individual' && servidorSelecionado) {
        params.append('servidorId', servidorSelecionado);
      }
      const res = await fetch(`/api/relatorios?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDados(data);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const formatarData = (d: string) => { if (!d) return '-'; const [y, m, dd] = d.split('-'); return `${dd}/${m}/${y}`; };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-gray-600 mt-1">Gerar relatórios do sistema com dados reais</p>
      </div>

      {/* Tipos de Relatório */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {relatorios.map((r) => {
          const Icon = r.icon;
          const ativo = tipoAtivo === r.tipo;
          return (
            <button key={r.tipo} onClick={() => setTipoAtivo(r.tipo)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${ativo ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
              <div className={`${r.cor} w-10 h-10 rounded-lg flex items-center justify-center mb-2`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className={`font-semibold text-sm ${ativo ? 'text-blue-700' : 'text-gray-900'}`}>{r.label}</p>
              <p className="text-xs text-gray-500 mt-1">{r.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Período:</span>
            <select value={mes} onChange={(e) => setMes(parseInt(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
              {meses.map((m: string, i: number) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
            <select value={ano} onChange={(e) => setAno(parseInt(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
              {[ano - 2, ano - 1, ano, ano + 1].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            {tipoAtivo === 'individual' && (
              <select value={servidorSelecionado} onChange={(e) => setServidorSelecionado(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="">Selecione o servidor</option>
                {servidores.map(s => <option key={s.id} value={s.id}>{s.nome} ({s.matricula})</option>)}
              </select>
            )}
            <Button onClick={gerarRelatorio} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
              Gerar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo do Relatório */}
      {loading ? (
        <Card><CardContent className="py-16 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto text-blue-600" /><p className="text-gray-500 mt-4">Gerando relatório...</p></CardContent></Card>
      ) : !dados ? (
        <Card><CardContent className="py-16 text-center text-gray-400"><FileText className="w-12 h-12 mx-auto mb-4 opacity-30" /><p className="font-medium">Selecione o tipo de relatório e clique em "Gerar"</p></CardContent></Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Relatório de {relatorios.find(r => r.tipo === tipoAtivo)?.label} - {meses[mes - 1]}/{ano}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* FREQUÊNCIA */}
            {tipoAtivo === 'frequencia' && dados.resultado && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead className="text-center">Dias Úteis</TableHead>
                      <TableHead className="text-center">Presentes</TableHead>
                      <TableHead className="text-center">Faltas</TableHead>
                      <TableHead className="text-center">Férias</TableHead>
                      <TableHead className="text-center">Licenças</TableHead>
                      <TableHead className="text-center">Frequência</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dados.resultado.map((r: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{r.servidor.matricula}</TableCell>
                        <TableCell>{r.servidor.nome}</TableCell>
                        <TableCell>{r.cargo}</TableCell>
                        <TableCell className="text-center">{r.diasUteis}</TableCell>
                        <TableCell className="text-center text-green-600 font-bold">{r.presentes}</TableCell>
                        <TableCell className="text-center text-red-600 font-bold">{r.faltas}</TableCell>
                        <TableCell className="text-center text-blue-600">{r.ferias}</TableCell>
                        <TableCell className="text-center text-purple-600">{r.licencas}</TableCell>
                        <TableCell className="text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            parseFloat(r.frequencia) >= 90 ? 'bg-green-100 text-green-800' :
                            parseFloat(r.frequencia) >= 75 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>{r.frequencia}%</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* BANCO DE HORAS */}
            {tipoAtivo === 'banco-horas' && dados.resultado && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead className="text-center">Trabalhadas</TableHead>
                      <TableHead className="text-center">Esperadas</TableHead>
                      <TableHead className="text-center">Positivas</TableHead>
                      <TableHead className="text-center">Negativas</TableHead>
                      <TableHead className="text-center">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dados.resultado.map((r: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{r.servidor.matricula}</TableCell>
                        <TableCell>{r.servidor.nome}</TableCell>
                        <TableCell>{r.cargo}</TableCell>
                        <TableCell className="text-center font-mono">{r.horasTrabalhadas}h</TableCell>
                        <TableCell className="text-center font-mono">{r.horasEsperadas}h</TableCell>
                        <TableCell className="text-center font-mono text-green-600">+{r.horasPositivas}h</TableCell>
                        <TableCell className="text-center font-mono text-red-600">-{r.horasNegativas}h</TableCell>
                        <TableCell className={`text-center font-bold font-mono ${parseFloat(r.saldo) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {parseFloat(r.saldo) >= 0 ? '+' : ''}{r.saldo}h
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* AUSÊNCIAS */}
            {tipoAtivo === 'ausencias' && dados.resultado && (
              <div className="space-y-6">
                {dados.resumoPorTipo && Object.keys(dados.resumoPorTipo).length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(dados.resumoPorTipo).map(([tipo, dias]) => (
                      <div key={tipo} className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-gray-900">{String(dias)} dias</p>
                        <p className="text-xs text-gray-500">{tipo.replace(/_/g, ' ')}</p>
                      </div>
                    ))}
                  </div>
                )}
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dados.resultado.map((r: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{r.servidor.nome}</TableCell>
                          <TableCell>{r.servidor.matricula}</TableCell>
                          <TableCell><span className="text-xs">{r.tipo.replace(/_/g, ' ')}</span></TableCell>
                          <TableCell className="text-sm">{formatarData(r.dataInicio)} a {formatarData(r.dataFim)}</TableCell>
                          <TableCell className="text-center font-bold">{r.dias}</TableCell>
                          <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">{r.motivo}</TableCell>
                          <TableCell>
                            {r.aprovado === true && <span className="text-green-600 text-xs font-medium">✓ Aprovado</span>}
                            {r.aprovado === false && <span className="text-red-600 text-xs font-medium">✗ Rejeitado</span>}
                            {r.aprovado === null && <span className="text-yellow-600 text-xs font-medium">⏳ Pendente</span>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* HORAS EXTRAS */}
            {tipoAtivo === 'horas-extras' && dados.resultado && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead className="text-center">Horas Extras</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dados.resultado.filter((r: any) => parseFloat(r.horasExtras) > 0).length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-400">Nenhuma hora extra registrada no período</TableCell></TableRow>
                    ) : (
                      dados.resultado.filter((r: any) => parseFloat(r.horasExtras) > 0).map((r: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{r.servidor.matricula}</TableCell>
                          <TableCell>{r.servidor.nome}</TableCell>
                          <TableCell>{r.cargo}</TableCell>
                          <TableCell className="text-center font-bold text-green-600">+{r.horasExtras}h</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* INDIVIDUAL */}
            {tipoAtivo === 'individual' && dados.registros && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><p className="text-gray-500">Servidor</p><p className="font-bold">{dados.servidor?.nome}</p></div>
                  <div><p className="text-gray-500">Matrícula</p><p className="font-bold">{dados.servidor?.matricula}</p></div>
                  <div><p className="text-gray-500">Cargo</p><p className="font-bold">{dados.cargo}</p></div>
                  <div><p className="text-gray-500">Unidade</p><p className="font-bold">{dados.unidade}</p></div>
                </div>
                {dados.registros.length === 0 ? (
                  <p className="text-center py-8 text-gray-400">Nenhum registro no período</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead className="text-center">Entrada</TableHead>
                          <TableHead className="text-center">Saída Almoço</TableHead>
                          <TableHead className="text-center">Retorno</TableHead>
                          <TableHead className="text-center">Saída Final</TableHead>
                          <TableHead className="text-center">Carga</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dados.registros.map((r: any) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{formatarData(r.data)}</TableCell>
                            <TableCell className="text-center font-mono">{r.horaEntrada || '-'}</TableCell>
                            <TableCell className="text-center font-mono">{r.horaSaidaAlmoco || '-'}</TableCell>
                            <TableCell className="text-center font-mono">{r.horaRetornoAlmoco || '-'}</TableCell>
                            <TableCell className="text-center font-mono">{r.horaSaidaFinal || '-'}</TableCell>
                            <TableCell className="text-center font-mono">{r.cargaDiaria ? `${r.cargaDiaria}h` : '-'}</TableCell>
                            <TableCell className="text-center">
                              <span className={`text-xs font-medium ${
                                r.status === 'PRESENTE' ? 'text-green-600' :
                                r.status === 'FALTA' ? 'text-red-600' :
                                r.status === 'FERIAS' ? 'text-blue-600' :
                                r.status === 'LICENCA' ? 'text-purple-600' :
                                'text-gray-600'
                              }`}>{r.status}</span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
