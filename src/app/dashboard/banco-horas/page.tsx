'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';

interface BancoHorasItem {
  servidor: { id: string; nome: string; matricula: string };
  cargo?: { nome: string };
  horasTrabalhadas: string;
  horasEsperadas: string;
  horasPositivas: string;
  horasNegativas: string;
  saldo: string;
  diasComRegistro: number;
  diasSemRegistro: number;
  totalDias: number;
}

export default function BancoHorasPage() {
  const [dados, setDados] = useState<BancoHorasItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());

  useEffect(() => { fetchDados(); }, [mes, ano]);

  async function fetchDados() {
    setLoading(true);
    try {
      const res = await fetch(`/api/banco-horas?mes=${mes}&ano=${ano}`);
      if (res.ok) {
        const data = await res.json();
        setDados(data.resultado || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const totalPositivo = dados.reduce((acc, d) => acc + parseFloat(d.horasPositivas), 0);
  const totalNegativo = dados.reduce((acc, d) => acc + parseFloat(d.horasNegativas), 0);
  const totalSaldo = dados.reduce((acc, d) => acc + parseFloat(d.saldo), 0);

  const getSaldoColor = (saldo: number) => {
    if (saldo > 0) return 'text-green-600';
    if (saldo < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getSaldoIcon = (saldo: number) => {
    if (saldo > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (saldo < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Banco de Horas</h1>
          <p className="text-gray-600 mt-1">Saldo de horas dos servidores</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={mes} onChange={(e) => setMes(parseInt(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
            {meses.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <select value={ano} onChange={(e) => setAno(parseInt(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
            {[ano - 1, ano, ano + 1].map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Horas Positivas</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">+{totalPositivo.toFixed(2)}h</div>
            <p className="text-xs text-gray-500 mt-1">Total acumulado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Horas Negativas</CardTitle>
            <TrendingDown className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">-{totalNegativo.toFixed(2)}h</div>
            <p className="text-xs text-gray-500 mt-1">Total de débitos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Saldo Total</CardTitle>
            {getSaldoIcon(totalSaldo)}
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getSaldoColor(totalSaldo)}`}>
              {totalSaldo > 0 ? '+' : ''}{totalSaldo.toFixed(2)}h
            </div>
            <p className="text-xs text-gray-500 mt-1">Saldo geral do mês</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saldo por Servidor - {meses[mes - 1]}/{ano}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" /></div>
          ) : dados.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="font-medium">Nenhum servidor ativo encontrado</p>
            </div>
          ) : (
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
                  {dados.map((item) => {
                    const saldo = parseFloat(item.saldo);
                    return (
                      <TableRow key={item.servidor.id}>
                        <TableCell className="font-medium">{item.servidor.matricula}</TableCell>
                        <TableCell>{item.servidor.nome}</TableCell>
                        <TableCell>{item.cargo?.nome || '-'}</TableCell>
                        <TableCell className="text-center font-mono">{item.horasTrabalhadas}h</TableCell>
                        <TableCell className="text-center font-mono">{item.horasEsperadas}h</TableCell>
                        <TableCell className="text-center font-mono text-green-600">+{item.horasPositivas}h</TableCell>
                        <TableCell className="text-center font-mono text-red-600">-{item.horasNegativas}h</TableCell>
                        <TableCell className={`text-center font-mono font-bold ${getSaldoColor(saldo)}`}>
                          {saldo > 0 ? '+' : ''}{item.saldo}h
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
