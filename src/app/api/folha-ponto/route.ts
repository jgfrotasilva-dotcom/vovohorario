import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { servidores, registrosPonto, jornadas, cargos, unidades, setores } from '@/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const sp = request.nextUrl.searchParams;
    const mes = parseInt(sp.get('mes') || String(new Date().getMonth() + 1));
    const ano = parseInt(sp.get('ano') || String(new Date().getFullYear()));
    const servidorId = sp.get('servidorId');

    if (!servidorId) {
      // Listar servidores para seleção
      const lista = await db.select({
        servidor: servidores, cargo: cargos,
      }).from(servidores)
        .leftJoin(cargos, eq(servidores.cargoId, cargos.id))
        .where(eq(servidores.situacao, 'ATIVO'));

      return NextResponse.json({
        servidores: lista.map(({ servidor, cargo }) => ({
          id: servidor.id, nome: servidor.nome, matricula: servidor.matricula,
          cargo: cargo?.nome || '-',
        })),
      });
    }

    // Buscar dados do servidor
    const [serv] = await db.select({
      servidor: servidores, cargo: cargos, unidade: unidades, setor: setores,
    }).from(servidores)
      .leftJoin(cargos, eq(servidores.cargoId, cargos.id))
      .leftJoin(unidades, eq(servidores.unidadeId, unidades.id))
      .leftJoin(setores, eq(servidores.setorId, setores.id))
      .where(eq(servidores.id, servidorId)).limit(1);

    if (!serv) return NextResponse.json({ error: 'Servidor não encontrado' }, { status: 404 });

    // Buscar registros do mês
    const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
    const ultimoDia = new Date(ano, mes, 0).getDate();
    const dataFim = `${ano}-${String(mes).padStart(2, '0')}-${ultimoDia}`;

    const registros = await db.select().from(registrosPonto)
      .where(and(
        eq(registrosPonto.servidorId, servidorId),
        gte(registrosPonto.data, dataInicio),
        lte(registrosPonto.data, dataFim)
      ))
      .orderBy(registrosPonto.data);

    // Buscar jornadas
    const jornadasLista = await db.select().from(jornadas)
      .where(and(eq(jornadas.servidorId, servidorId), eq(jornadas.ativo, true)));

    // Montar dias do mês
    const dias = [];
    for (let d = 1; d <= ultimoDia; d++) {
      const dataStr = `${ano}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dataObj = new Date(dataStr + 'T12:00:00');
      const diaSemana = dataObj.getDay();
      const diaSemanaNomes = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

      const registro = registros.find(r => r.data === dataStr);
      const jornada = jornadasLista.find(j => j.diaSemana === diaSemana);

      dias.push({
        dia: d,
        data: dataStr,
        diaSemana: diaSemanaNomes[diaSemana],
        isWeekend: diaSemana === 0 || diaSemana === 6,
        registro: registro ? {
          horaEntrada: registro.horaEntrada || '-',
          horaSaidaAlmoco: registro.horaSaidaAlmoco || '-',
          horaRetornoAlmoco: registro.horaRetornoAlmoco || '-',
          horaSaidaFinal: registro.horaSaidaFinal || '-',
          cargaDiaria: registro.cargaDiaria || '-',
          status: registro.status,
        } : null,
        jornada: jornada ? {
          horaEntrada: jornada.horaEntrada,
          horaSaidaFinal: jornada.horaSaidaFinal,
        } : null,
      });
    }

    // Calcular totais
    let totalCargaHoras = 0;
    let diasPresentes = 0;
    let diasFaltas = 0;
    let diasFerias = 0;
    let diasLicenca = 0;

    dias.forEach(d => {
      if (d.registro) {
        if (d.registro.cargaDiaria !== '-') totalCargaHoras += parseFloat(d.registro.cargaDiaria);
        if (d.registro.status === 'PRESENTE') diasPresentes++;
        if (d.registro.status === 'FALTA') diasFaltas++;
        if (d.registro.status === 'FERIAS') diasFerias++;
        if (d.registro.status === 'LICENCA') diasLicenca++;
      }
    });

    const numeroDocumento = `FP-${ano}${String(mes).padStart(2, '0')}-${serv.servidor.matricula}`;

    return NextResponse.json({
      documento: numeroDocumento,
      mes, ano,
      servidor: serv.servidor,
      cargo: serv.cargo?.nome || '-',
      unidade: serv.unidade?.nome || '-',
      setor: serv.setor?.nome || '-',
      dias,
      totais: {
        cargaHoras: totalCargaHoras.toFixed(2),
        diasPresentes,
        diasFaltas,
        diasFerias,
        diasLicenca,
        diasUteis: dias.filter(d => !d.isWeekend).length,
      },
    });
  } catch (error: any) {
    console.error('Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro ao gerar folha' }, { status: 500 });
  }
}
