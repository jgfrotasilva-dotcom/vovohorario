import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { servidores, registrosPonto, jornadas, cargos } from '@/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const mes = parseInt(searchParams.get('mes') || String(new Date().getMonth() + 1));
    const ano = parseInt(searchParams.get('ano') || String(new Date().getFullYear()));

    const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
    const ultimoDia = new Date(ano, mes, 0).getDate();
    const dataFim = `${ano}-${String(mes).padStart(2, '0')}-${ultimoDia}`;

    // Buscar todos os servidores ativos
    const todosServidores = await db
      .select({ servidor: servidores, cargo: cargos })
      .from(servidores)
      .leftJoin(cargos, eq(servidores.cargoId, cargos.id))
      .where(eq(servidores.situacao, 'ATIVO'));

    // Buscar registros do mês
    const registros = await db
      .select()
      .from(registrosPonto)
      .where(and(
        gte(registrosPonto.data, dataInicio),
        lte(registrosPonto.data, dataFim)
      ));

    // Buscar jornadas
    const jornadasLista = await db.select().from(jornadas).where(eq(jornadas.ativo, true));

    // Calcular banco de horas para cada servidor
    const resultado = todosServidores.map(({ servidor, cargo }) => {
      const regsServidor = registros.filter(r => r.servidorId === servidor.id);

      let totalMinutosTrabalhados = 0;
      let totalMinutosEsperados = 0;
      let diasComRegistro = 0;
      let diasSemRegistro = 0;

      for (const reg of regsServidor) {
        if (reg.horaEntrada && reg.horaSaidaFinal) {
          diasComRegistro++;
          let cargaMinutos = 0;

          if (reg.horaSaidaAlmoco && reg.horaRetornoAlmoco) {
            const manha = timeToMinutes(reg.horaSaidaAlmoco) - timeToMinutes(reg.horaEntrada);
            const tarde = timeToMinutes(reg.horaSaidaFinal) - timeToMinutes(reg.horaRetornoAlmoco);
            cargaMinutos = manha + tarde;
          } else {
            cargaMinutos = timeToMinutes(reg.horaSaidaFinal) - timeToMinutes(reg.horaEntrada);
          }

          totalMinutosTrabalhados += cargaMinutos;
        }
      }

      // Calcular carga horária esperada (baseada nas jornadas)
      const d = new Date(dataInicio + 'T12:00:00');
      const fim = new Date(dataFim + 'T12:00:00');
      while (d <= fim) {
        const diaSemana = d.getDay();
        if (diaSemana !== 0 && diaSemana !== 6) {
          const jornadaDia = jornadasLista.find(j => j.servidorId === servidor.id && j.diaSemana === diaSemana);
          if (jornadaDia) {
            const carga = parseFloat(jornadaDia.cargaHorariaDiaria);
            totalMinutosEsperados += carga * 60;
          } else {
            totalMinutosEsperados += 480; // 8h padrão
          }
        }
        d.setDate(d.getDate() + 1);
      }

      const saldoMinutos = totalMinutosTrabalhados - totalMinutosEsperados;
      const horasPositivas = saldoMinutos > 0 ? saldoMinutos / 60 : 0;
      const horasNegativas = saldoMinutos < 0 ? Math.abs(saldoMinutos) / 60 : 0;

      return {
        servidor,
        cargo,
        horasTrabalhadas: (totalMinutosTrabalhados / 60).toFixed(2),
        horasEsperadas: (totalMinutosEsperados / 60).toFixed(2),
        horasPositivas: horasPositivas.toFixed(2),
        horasNegativas: horasNegativas.toFixed(2),
        saldo: (saldoMinutos / 60).toFixed(2),
        diasComRegistro,
        diasSemRegistro,
        totalDias: regsServidor.length,
      };
    });

    return NextResponse.json({ resultado, mes, ano });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ resultado: [] });
  }
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
