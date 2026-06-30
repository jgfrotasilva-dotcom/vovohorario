import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { servidores, registrosPonto, ausencias, jornadas, cargos, unidades, setores } from '@/db/schema';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const sp = request.nextUrl.searchParams;
    const tipo = sp.get('tipo') || 'frequencia';
    const mes = parseInt(sp.get('mes') || String(new Date().getMonth() + 1));
    const ano = parseInt(sp.get('ano') || String(new Date().getFullYear()));
    const servidorId = sp.get('servidorId');

    const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
    const ultimoDia = new Date(ano, mes, 0).getDate();
    const dataFim = `${ano}-${String(mes).padStart(2, '0')}-${ultimoDia}`;

    switch (tipo) {
      case 'frequencia': return await relatorioFrequencia(dataInicio, dataFim, mes, ano);
      case 'banco-horas': return await relatorioBancoHoras(dataInicio, dataFim, mes, ano);
      case 'ausencias': return await relatorioAusencias(dataInicio, dataFim, mes, ano);
      case 'horas-extras': return await relatorioHorasExtras(dataInicio, dataFim, mes, ano);
      case 'individual': return await relatorioIndividual(dataInicio, dataFim, mes, ano, servidorId);
      default: return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro ao gerar relatório' }, { status: 500 });
  }
}

async function relatorioFrequencia(dataInicio: string, dataFim: string, mes: number, ano: number) {
  const servidoresLista = await db.select({
    servidor: servidores, cargo: cargos, unidade: unidades,
  }).from(servidores)
    .leftJoin(cargos, eq(servidores.cargoId, cargos.id))
    .leftJoin(unidades, eq(servidores.unidadeId, unidades.id))
    .where(eq(servidores.situacao, 'ATIVO'));

  const registros = await db.select().from(registrosPonto)
    .where(and(gte(registrosPonto.data, dataInicio), lte(registrosPonto.data, dataFim)));

  const resultado = servidoresLista.map(({ servidor, cargo, unidade }) => {
    const regs = registros.filter(r => r.servidorId === servidor.id);
    const presentes = regs.filter(r => r.status === 'PRESENTE').length;
    const faltas = regs.filter(r => r.status === 'FALTA').length;
    const ferias = regs.filter(r => r.status === 'FERIAS').length;
    const licencas = regs.filter(r => r.status === 'LICENCA').length;
    const totalRegistros = regs.length;
    const diasUteis = calcularDiasUteis(dataInicio, dataFim);
    const frequencia = diasUteis > 0 ? ((presentes / diasUteis) * 100).toFixed(1) : '0';

    return {
      servidor: { id: servidor.id, nome: servidor.nome, matricula: servidor.matricula },
      cargo: cargo?.nome || '-',
      unidade: unidade?.nome || '-',
      presentes, faltas, ferias, licencas, totalRegistros,
      diasUteis, frequencia,
    };
  });

  return NextResponse.json({ tipo: 'frequencia', mes, ano, resultado });
}

async function relatorioBancoHoras(dataInicio: string, dataFim: string, mes: number, ano: number) {
  const servidoresLista = await db.select({
    servidor: servidores, cargo: cargos,
  }).from(servidores)
    .leftJoin(cargos, eq(servidores.cargoId, cargos.id))
    .where(eq(servidores.situacao, 'ATIVO'));

  const registros = await db.select().from(registrosPonto)
    .where(and(gte(registrosPonto.data, dataInicio), lte(registrosPonto.data, dataFim)));

  const jornadasLista = await db.select().from(jornadas).where(eq(jornadas.ativo, true));

  const resultado = servidoresLista.map(({ servidor, cargo }) => {
    const regs = registros.filter(r => r.servidorId === servidor.id);
    let totalMinutosTrabalhados = 0;
    let totalMinutosEsperados = 0;

    for (const reg of regs) {
      if (reg.horaEntrada && reg.horaSaidaFinal) {
        if (reg.horaSaidaAlmoco && reg.horaRetornoAlmoco) {
          totalMinutosTrabalhados += (timeToMinutes(reg.horaSaidaAlmoco) - timeToMinutes(reg.horaEntrada));
          totalMinutosTrabalhados += (timeToMinutes(reg.horaSaidaFinal) - timeToMinutes(reg.horaRetornoAlmoco));
        } else {
          totalMinutosTrabalhados += (timeToMinutes(reg.horaSaidaFinal) - timeToMinutes(reg.horaEntrada));
        }
      }
    }

    const d = new Date(dataInicio + 'T12:00:00');
    const fim = new Date(dataFim + 'T12:00:00');
    while (d <= fim) {
      const diaSemana = d.getDay();
      if (diaSemana !== 0 && diaSemana !== 6) {
        const j = jornadasLista.find(j => j.servidorId === servidor.id && j.diaSemana === diaSemana);
        totalMinutosEsperados += j ? parseFloat(j.cargaHorariaDiaria) * 60 : 480;
      }
      d.setDate(d.getDate() + 1);
    }

    const saldo = totalMinutosTrabalhados - totalMinutosEsperados;
    return {
      servidor: { id: servidor.id, nome: servidor.nome, matricula: servidor.matricula },
      cargo: cargo?.nome || '-',
      horasTrabalhadas: (totalMinutosTrabalhados / 60).toFixed(2),
      horasEsperadas: (totalMinutosEsperados / 60).toFixed(2),
      horasPositivas: saldo > 0 ? (saldo / 60).toFixed(2) : '0.00',
      horasNegativas: saldo < 0 ? (Math.abs(saldo) / 60).toFixed(2) : '0.00',
      saldo: (saldo / 60).toFixed(2),
    };
  });

  return NextResponse.json({ tipo: 'banco-horas', mes, ano, resultado });
}

async function relatorioAusencias(dataInicio: string, dataFim: string, mes: number, ano: number) {
  const lista = await db.select({
    ausencia: ausencias, servidor: servidores, cargo: cargos,
  }).from(ausencias)
    .leftJoin(servidores, eq(ausencias.servidorId, servidores.id))
    .leftJoin(cargos, eq(servidores.cargoId, cargos.id))
    .where(and(gte(ausencias.dataInicio, dataInicio), lte(ausencias.dataFim, dataFim)))
    .orderBy(desc(ausencias.dataInicio));

  const resultado = lista.map(item => {
    const inicio = new Date(item.ausencia.dataInicio + 'T12:00:00');
    const fim = new Date(item.ausencia.dataFim + 'T12:00:00');
    const dias = Math.ceil(Math.abs(fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return {
      servidor: { nome: item.servidor?.nome || '-', matricula: item.servidor?.matricula || '-' },
      cargo: item.cargo?.nome || '-',
      tipo: item.ausencia.tipo,
      dataInicio: item.ausencia.dataInicio,
      dataFim: item.ausencia.dataFim,
      dias,
      motivo: item.ausencia.motivo || '-',
      aprovado: item.ausencia.aprovado,
    };
  });

  // Resumo por tipo
  const resumoPorTipo: Record<string, number> = {};
  resultado.forEach(r => { resumoPorTipo[r.tipo] = (resumoPorTipo[r.tipo] || 0) + r.dias; });

  return NextResponse.json({ tipo: 'ausencias', mes, ano, resultado, resumoPorTipo });
}

async function relatorioHorasExtras(dataInicio: string, dataFim: string, mes: number, ano: number) {
  const servidoresLista = await db.select({
    servidor: servidores, cargo: cargos,
  }).from(servidores)
    .leftJoin(cargos, eq(servidores.cargoId, cargos.id))
    .where(eq(servidores.situacao, 'ATIVO'));

  const registros = await db.select().from(registrosPonto)
    .where(and(gte(registrosPonto.data, dataInicio), lte(registrosPonto.data, dataFim)));

  const jornadasLista = await db.select().from(jornadas).where(eq(jornadas.ativo, true));

  const resultado = servidoresLista.map(({ servidor, cargo }) => {
    const regs = registros.filter(r => r.servidorId === servidor.id);
    let totalExtras = 0;

    for (const reg of regs) {
      if (reg.horaEntrada && reg.horaSaidaFinal) {
        let cargaReal = 0;
        if (reg.horaSaidaAlmoco && reg.horaRetornoAlmoco) {
          cargaReal = (timeToMinutes(reg.horaSaidaAlmoco) - timeToMinutes(reg.horaEntrada)) +
            (timeToMinutes(reg.horaSaidaFinal) - timeToMinutes(reg.horaRetornoAlmoco));
        } else {
          cargaReal = timeToMinutes(reg.horaSaidaFinal) - timeToMinutes(reg.horaEntrada);
        }

        const d = new Date(reg.data + 'T12:00:00');
        const j = jornadasLista.find(j => j.servidorId === servidor.id && j.diaSemana === d.getDay());
        const cargaEsperada = j ? parseFloat(j.cargaHorariaDiaria) * 60 : 480;

        if (cargaReal > cargaEsperada) {
          totalExtras += cargaReal - cargaEsperada;
        }
      }
    }

    return {
      servidor: { id: servidor.id, nome: servidor.nome, matricula: servidor.matricula },
      cargo: cargo?.nome || '-',
      horasExtras: (totalExtras / 60).toFixed(2),
    };
  });

  return NextResponse.json({ tipo: 'horas-extras', mes, ano, resultado });
}

async function relatorioIndividual(dataInicio: string, dataFim: string, mes: number, ano: number, servidorId: string | null) {
  if (!servidorId) return NextResponse.json({ error: 'Servidor obrigatório' }, { status: 400 });

  const [serv] = await db.select({
    servidor: servidores, cargo: cargos, unidade: unidades,
  }).from(servidores)
    .leftJoin(cargos, eq(servidores.cargoId, cargos.id))
    .leftJoin(unidades, eq(servidores.unidadeId, unidades.id))
    .where(eq(servidores.id, servidorId)).limit(1);

  if (!serv) return NextResponse.json({ error: 'Servidor não encontrado' }, { status: 404 });

  const registros = await db.select().from(registrosPonto)
    .where(and(
      eq(registrosPonto.servidorId, servidorId),
      gte(registrosPonto.data, dataInicio),
      lte(registrosPonto.data, dataFim)
    ))
    .orderBy(registrosPonto.data);

  const ausenciasLista = await db.select().from(ausencias)
    .where(and(
      eq(ausencias.servidorId, servidorId),
      gte(ausencias.dataInicio, dataInicio),
      lte(ausencias.dataFim, dataFim)
    ));

  const jornadasLista = await db.select().from(jornadas)
    .where(and(eq(jornadas.servidorId, servidorId), eq(jornadas.ativo, true)));

  return NextResponse.json({
    tipo: 'individual', mes, ano,
    servidor: serv.servidor,
    cargo: serv.cargo?.nome || '-',
    unidade: serv.unidade?.nome || '-',
    registros, ausencias: ausenciasLista,
    jornadas: jornadasLista,
  });
}

function calcularDiasUteis(dataInicio: string, dataFim: string): number {
  let count = 0;
  const d = new Date(dataInicio + 'T12:00:00');
  const fim = new Date(dataFim + 'T12:00:00');
  while (d <= fim) {
    const dia = d.getDay();
    if (dia !== 0 && dia !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
