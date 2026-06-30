'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Clock, CheckCircle, AlertCircle, X, Loader2, Calendar,
  LogIn, Coffee, ArrowRightFromLine, LogOut, Timer, Sun, Moon, Sunrise,
} from 'lucide-react';

interface RegistroPonto {
  id: string;
  data: string;
  horaEntrada: string | null;
  horaSaidaAlmoco: string | null;
  horaRetornoAlmoco: string | null;
  horaSaidaFinal: string | null;
  cargaDiaria: string | null;
  status: string;
}

interface Jornada {
  horaEntrada: string;
  horaSaidaAlmoco: string | null;
  horaRetornoAlmoco: string | null;
  horaSaidaFinal: string;
  cargaHorariaDiaria: string;
}

type TipoRegistro = 'ENTRADA' | 'SAIDA_ALMOCO' | 'RETORNO_ALMOCO' | 'SAIDA_FINAL';

const tipoLabels: Record<TipoRegistro, { label: string; icon: any; color: string; desc: string }> = {
  ENTRADA: { label: 'Entrada', icon: LogIn, color: 'bg-green-600 hover:bg-green-700', desc: 'Registrar início do expediente' },
  SAIDA_ALMOCO: { label: 'Saída Almoço', icon: Coffee, color: 'bg-amber-600 hover:bg-amber-700', desc: 'Registrar saída para almoço' },
  RETORNO_ALMOCO: { label: 'Retorno Almoço', icon: ArrowRightFromLine, color: 'bg-blue-600 hover:bg-blue-700', desc: 'Registrar retorno do almoço' },
  SAIDA_FINAL: { label: 'Saída Final', icon: LogOut, color: 'bg-red-600 hover:bg-red-700', desc: 'Registrar fim do expediente' },
};

export default function MeuPontoPage() {
  const [registros, setRegistros] = useState<RegistroPonto[]>([]);
  const [loading, setLoading] = useState(true);
  const [fotoServidor, setFotoServidor] = useState<string | null>(null);
  const [nomeServidor, setNomeServidor] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [horaAtual, setHoraAtual] = useState('');
  const [dataAtual, setDataAtual] = useState('');
  const [diaSemana, setDiaSemana] = useState('');
  const [registroHoje, setRegistroHoje] = useState<RegistroPonto | null>(null);
  const [jornada, setJornada] = useState<Jornada | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ tipo: TipoRegistro; hora: string } | null>(null);
  const [erroApi, setErroApi] = useState<string | null>(null);

  const mesAtual = new Date().getMonth() + 1;
  const anoAtual = new Date().getFullYear();
  const [mes, setMes] = useState(mesAtual);
  const [ano, setAno] = useState(anoAtual);

  useEffect(() => {
    function tick() {
      const a = new Date();
      setHoraAtual(a.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDataAtual(a.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }));
      setDiaSemana(['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][a.getDay()]);
    }
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 6000); return () => clearTimeout(t); }
  }, [toast]);

  const fetchRegistros = useCallback(async () => {
    setErroApi(null);
    try {
      const res = await fetch(`/api/registro-ponto?mes=${mes}&ano=${ano}`);
      const data = await res.json();

      if (!res.ok) {
        setErroApi(data.error || 'Erro ao carregar dados');
        setJornada(null);
        setRegistros([]);
        setRegistroHoje(null);
      } else {
        setRegistros(data.registros || []);
        setJornada(data.jornada || null);
        if (data.foto) setFotoServidor(data.foto);
        if (data.nomeServidor) setNomeServidor(data.nomeServidor);
        const hoje = new Date().toISOString().split('T')[0];
        setRegistroHoje((data.registros || []).find((r: RegistroPonto) => r.data === hoje) || null);
      }
    } catch (e: any) {
      setErroApi('Erro de conexão com o servidor');
      console.error('Erro fetch:', e);
    } finally {
      setLoading(false);
    }
  }, [mes, ano]);

  useEffect(() => { fetchRegistros(); }, [fetchRegistros]);

  function abrirConfirmacao(tipo: TipoRegistro) {
    const a = new Date();
    const h = a.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setConfirmModal({ tipo, hora: h });
  }

  async function confirmarRegistro() {
    if (!confirmModal) return;
    setSaving(true);
    try {
      const a = new Date();
      const hh = String(a.getHours()).padStart(2, '0');
      const mm = String(a.getMinutes()).padStart(2, '0');
      const horaFormatada = `${hh}:${mm}`;
      const dataHoje = a.toISOString().split('T')[0];

      const payload: any = { data: dataHoje };
      if (confirmModal.tipo === 'ENTRADA') payload.horaEntrada = horaFormatada;
      if (confirmModal.tipo === 'SAIDA_ALMOCO') payload.horaSaidaAlmoco = horaFormatada;
      if (confirmModal.tipo === 'RETORNO_ALMOCO') payload.horaRetornoAlmoco = horaFormatada;
      if (confirmModal.tipo === 'SAIDA_FINAL') payload.horaSaidaFinal = horaFormatada;

      const res = await fetch('/api/registro-ponto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao registrar');

      const labels: Record<TipoRegistro, string> = {
        ENTRADA: 'Entrada', SAIDA_ALMOCO: 'Saída Almoço',
        RETORNO_ALMOCO: 'Retorno Almoço', SAIDA_FINAL: 'Saída Final',
      };

      setToast({ type: 'success', message: `${labels[confirmModal.tipo]} registrada às ${horaFormatada} ✓` });
      setConfirmModal(null);

      if (data.registro) {
        setRegistroHoje(data.registro);
        setRegistros(prev => {
          const i = prev.findIndex(r => r.id === data.registro.id);
          if (i >= 0) { const n = [...prev]; n[i] = data.registro; return n; }
          return [...prev, data.registro];
        });
      }
      setTimeout(() => fetchRegistros(), 500);
    } catch (e: any) {
      setToast({ type: 'error', message: e.message });
    } finally { setSaving(false); }
  }

  const podeRegistrar = (tipo: TipoRegistro): boolean => {
    if (!registroHoje) return tipo === 'ENTRADA';
    switch (tipo) {
      case 'ENTRADA': return !registroHoje.horaEntrada;
      case 'SAIDA_ALMOCO': return !!registroHoje.horaEntrada && !registroHoje.horaSaidaAlmoco;
      case 'RETORNO_ALMOCO': return !!registroHoje.horaSaidaAlmoco && !registroHoje.horaRetornoAlmoco;
      case 'SAIDA_FINAL': return !!registroHoje.horaRetornoAlmoco && !registroHoje.horaSaidaFinal;
      default: return false;
    }
  };

  const jaRegistrado = (tipo: TipoRegistro): boolean => {
    if (!registroHoje) return false;
    switch (tipo) {
      case 'ENTRADA': return !!registroHoje.horaEntrada;
      case 'SAIDA_ALMOCO': return !!registroHoje.horaSaidaAlmoco;
      case 'RETORNO_ALMOCO': return !!registroHoje.horaRetornoAlmoco;
      case 'SAIDA_FINAL': return !!registroHoje.horaSaidaFinal;
      default: return false;
    }
  };

  const getHoraRegistrada = (tipo: TipoRegistro): string => {
    if (!registroHoje) return '';
    switch (tipo) {
      case 'ENTRADA': return registroHoje.horaEntrada || '';
      case 'SAIDA_ALMOCO': return registroHoje.horaSaidaAlmoco || '';
      case 'RETORNO_ALMOCO': return registroHoje.horaRetornoAlmoco || '';
      case 'SAIDA_FINAL': return registroHoje.horaSaidaFinal || '';
      default: return '';
    }
  };

  const getStatusBadge = (status: string) => {
    const s: Record<string, { bg: string; text: string; label: string }> = {
      PRESENTE: { bg: 'bg-green-100', text: 'text-green-800', label: '✔ Presente' },
      FALTA: { bg: 'bg-red-100', text: 'text-red-800', label: '❌ Falta' },
      FALTA_JUSTIFICADA: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '🟡 Justificada' },
      FERIAS: { bg: 'bg-blue-100', text: 'text-blue-800', label: '🔵 Férias' },
      LICENCA: { bg: 'bg-purple-100', text: 'text-purple-800', label: '🟣 Licença' },
      PENDENTE: { bg: 'bg-gray-100', text: 'text-gray-800', label: '🔴 Pendente' },
    };
    const st = s[status] || s.PENDENTE;
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${st.bg} ${st.text}`}>{st.label}</span>;
  };

  const formatarData = (d: string) => { const [y, m, dd] = d.split('-'); return `${dd}/${m}/${y}`; };
  const diasSemanaArr = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const getDiaSemana = (d: string) => diasSemanaArr[new Date(d + 'T12:00:00').getDay()];
  const getPeriodoIcon = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return <Sunrise className="w-8 h-8 text-orange-400" />;
    if (h >= 12 && h < 18) return <Sun className="w-8 h-8 text-yellow-500" />;
    return <Moon className="w-8 h-8 text-indigo-400" />;
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

      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
            <div className="mb-4">
              {(() => { const Icon = tipoLabels[confirmModal.tipo].icon; return <Icon className="w-16 h-16 mx-auto text-blue-600" />; })()}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirmar {tipoLabels[confirmModal.tipo].label}</h2>
            <p className="text-gray-600 mb-4">{tipoLabels[confirmModal.tipo].desc}</p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-4">
              <p className="text-sm text-blue-600 mb-1">Horário do sistema:</p>
              <p className="text-4xl font-bold text-blue-900 font-mono">{confirmModal.hora}</p>
            </div>
            {jornada && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-sm text-left">
                <p className="font-medium text-gray-700 mb-1">📋 Sua jornada:</p>
                <p className="text-gray-600">
                  Entrada: {jornada.horaEntrada} | Almoço: {jornada.horaSaidaAlmoco || '-'} ~ {jornada.horaRetornoAlmoco || '-'} | Saída: {jornada.horaSaidaFinal}
                </p>
              </div>
            )}
            <p className="text-sm text-gray-500 mb-6">Horário capturado automaticamente.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmModal(null)} disabled={saving}>Cancelar</Button>
              <Button className={`flex-1 ${tipoLabels[confirmModal.tipo].color}`} onClick={confirmarRegistro} disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registrando...</> : '✓ Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Meu Ponto</h1>
        <p className="text-gray-600 mt-1">Registre seus horários de trabalho</p>
      </div>

      {/* Erro da API */}
      {erroApi && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">{erroApi}</p>
              <button onClick={() => fetchRegistros()} className="text-xs text-red-600 underline mt-1">Tentar novamente</button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Relógio */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {fotoServidor ? (
                <img src={fotoServidor} alt={nomeServidor} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-200 flex items-center justify-center border-4 border-white shadow-lg">
                  <span className="text-2xl font-bold text-blue-600">{nomeServidor ? nomeServidor.charAt(0) : '?'}</span>
                </div>
              )}
              <div className="text-center md:text-left">
                <p className="text-lg font-bold text-gray-900">{nomeServidor}</p>
                <div className="flex items-center gap-2 justify-center md:justify-start mt-1">
                  {getPeriodoIcon()}
                  <p className="text-sm text-blue-800 font-medium">{diaSemana}</p>
                </div>
                <p className="text-sm text-blue-600">{dataAtual}</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-2xl shadow-lg px-8 py-4 border border-blue-100">
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Horário Atual</p>
                <p className="text-5xl font-bold text-gray-900 font-mono tracking-wider">{horaAtual}</p>
              </div>
              <p className="text-xs text-blue-500 mt-2 flex items-center justify-center gap-1">
                <Timer className="w-3 h-3" /> Atualizado em tempo real
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jornada Info */}
      {jornada ? (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-green-800">
              ⏰ Sua jornada: Entrada {jornada.horaEntrada} | Almoço {jornada.horaSaidaAlmoco || '-'} ~ {jornada.horaRetornoAlmoco || '-'} | Saída {jornada.horaSaidaFinal} | Carga: {jornada.cargaHorariaDiaria}h/dia
            </p>
          </CardContent>
        </Card>
      ) : !loading && !erroApi ? (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-yellow-800">
              ⚠️ Jornada não encontrada para hoje. Os registros serão feitos sem validação de horário.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* Botões */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(['ENTRADA', 'SAIDA_ALMOCO', 'RETORNO_ALMOCO', 'SAIDA_FINAL'] as TipoRegistro[]).map((tipo) => {
          const info = tipoLabels[tipo];
          const Icon = info.icon;
          const habilitado = podeRegistrar(tipo);
          const registrado = jaRegistrado(tipo);
          const horaReg = getHoraRegistrada(tipo);

          return (
            <Card key={tipo} className={`transition-all ${registrado ? 'border-green-200 bg-green-50/50' : habilitado ? 'border-blue-200 hover:shadow-lg' : 'opacity-50'}`}>
              <CardContent className="p-6 text-center">
                <div className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center ${registrado ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {registrado ? <CheckCircle className="w-7 h-7 text-green-600" /> : <Icon className={`w-7 h-7 ${habilitado ? 'text-blue-600' : 'text-gray-400'}`} />}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{info.label}</h3>
                {registrado ? (
                  <div>
                    <p className="text-2xl font-bold text-green-600 font-mono">{horaReg}</p>
                    <p className="text-xs text-green-600 mt-1">✓ Registrado</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-500 mb-3">{info.desc}</p>
                    <Button
                      className={`w-full ${info.color}`}
                      disabled={!habilitado || saving}
                      onClick={() => abrirConfirmacao(tipo)}
                    >
                      <Clock className="w-4 h-4 mr-2" /> Registrar Agora
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Resumo */}
      {registroHoje && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Resumo do Dia</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div><p className="text-xs text-gray-500">Entrada</p><p className="text-lg font-bold font-mono">{registroHoje.horaEntrada || '-'}</p></div>
              <div><p className="text-xs text-gray-500">Saída Almoço</p><p className="text-lg font-bold font-mono">{registroHoje.horaSaidaAlmoco || '-'}</p></div>
              <div><p className="text-xs text-gray-500">Retorno</p><p className="text-lg font-bold font-mono">{registroHoje.horaRetornoAlmoco || '-'}</p></div>
              <div><p className="text-xs text-gray-500">Saída Final</p><p className="text-lg font-bold font-mono">{registroHoje.horaSaidaFinal || '-'}</p></div>
              <div><p className="text-xs text-gray-500">Carga Diária</p><p className="text-lg font-bold font-mono text-blue-600">{registroHoje.cargaDiaria ? `${registroHoje.cargaDiaria}h` : '-'}</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" /> Histórico</CardTitle>
            <div className="flex items-center gap-2">
              <select value={mes} onChange={(e) => setMes(parseInt(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2024, i).toLocaleDateString('pt-BR', { month: 'long' })}</option>)}
              </select>
              <select value={ano} onChange={(e) => setAno(parseInt(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                {[anoAtual - 1, anoAtual, anoAtual + 1].map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" /></div>
          ) : registros.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><Clock className="w-12 h-12 mx-auto mb-4 opacity-30" /><p className="font-medium">Nenhum registro neste período</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Data</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-600">Dia</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-600">Entrada</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-600">Saída Almoço</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-600">Retorno</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-600">Saída Final</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-600">Carga</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2 font-medium">{formatarData(r.data)}</td>
                      <td className="py-3 px-2 text-center text-gray-500">{getDiaSemana(r.data)}</td>
                      <td className="py-3 px-2 text-center font-mono">{r.horaEntrada || '-'}</td>
                      <td className="py-3 px-2 text-center font-mono">{r.horaSaidaAlmoco || '-'}</td>
                      <td className="py-3 px-2 text-center font-mono">{r.horaRetornoAlmoco || '-'}</td>
                      <td className="py-3 px-2 text-center font-mono">{r.horaSaidaFinal || '-'}</td>
                      <td className="py-3 px-2 text-center font-mono">{r.cargaDiaria ? `${r.cargaDiaria}h` : '-'}</td>
                      <td className="py-3 px-2 text-center">{getStatusBadge(r.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
