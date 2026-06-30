import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { ausencias, servidores, registrosPonto, cargos, auditoria } from '@/db/schema';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

// GET - Listar ausências
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const servidorId = searchParams.get('servidorId');
    const mes = searchParams.get('mes');
    const ano = searchParams.get('ano');
    const status = searchParams.get('status'); // pendente, aprovado, rejeitado

    const conditions = [];

    if (servidorId) {
      conditions.push(eq(ausencias.servidorId, servidorId));
    }

    if (mes && ano) {
      const mesNum = parseInt(mes);
      const anoNum = parseInt(ano);
      const dataInicio = `${anoNum}-${String(mesNum).padStart(2, '0')}-01`;
      const ultimoDia = new Date(anoNum, mesNum, 0).getDate();
      const dataFim = `${anoNum}-${String(mesNum).padStart(2, '0')}-${ultimoDia}`;
      conditions.push(gte(ausencias.dataInicio, dataInicio));
      conditions.push(lte(ausencias.dataFim, dataFim));
    }

    if (status === 'pendente') {
      conditions.push(sql`${ausencias.aprovado} IS NULL`);
    } else if (status === 'aprovado') {
      conditions.push(eq(ausencias.aprovado, true));
    } else if (status === 'rejeitado') {
      conditions.push(eq(ausencias.aprovado, false));
    }

    const result = await db
      .select({
        ausencia: ausencias,
        servidor: servidores,
        cargo: cargos,
      })
      .from(ausencias)
      .leftJoin(servidores, eq(ausencias.servidorId, servidores.id))
      .leftJoin(cargos, eq(servidores.cargoId, cargos.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(ausencias.criadoEm));

    // Calcular dias de cada ausência
    const resultado = result.map((item) => {
      const inicio = new Date(item.ausencia.dataInicio + 'T12:00:00');
      const fim = new Date(item.ausencia.dataFim + 'T12:00:00');
      const diffTime = Math.abs(fim.getTime() - inicio.getTime());
      const diffDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      return {
        ...item,
        dias: diffDias,
      };
    });

    return NextResponse.json({ ausencias: resultado });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ ausencias: [] });
  }
}

// POST - Criar ausência
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    if (!['ADMINISTRADOR', 'RH'].includes(session.perfil)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const data = await request.json();

    if (!data.servidorId || !data.tipo || !data.dataInicio || !data.dataFim) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: servidor, tipo, data início e data fim' },
        { status: 400 }
      );
    }

    // Validar datas
    if (new Date(data.dataFim) < new Date(data.dataInicio)) {
      return NextResponse.json({ error: 'Data fim não pode ser anterior à data início' }, { status: 400 });
    }

    // Verificar se já existe ausência no período
    const [conflito] = await db
      .select({ id: ausencias.id })
      .from(ausencias)
      .where(and(
        eq(ausencias.servidorId, data.servidorId),
        lte(ausencias.dataInicio, data.dataFim),
        gte(ausencias.dataFim, data.dataInicio)
      ))
      .limit(1);

    if (conflito) {
      return NextResponse.json({ error: 'Já existe ausência registrada para este servidor neste período' }, { status: 400 });
    }

    // Criar ausência
    const [ausencia] = await db.insert(ausencias).values({
      servidorId: data.servidorId,
      tipo: data.tipo,
      dataInicio: data.dataInicio,
      dataFim: data.dataFim,
      motivo: data.motivo || null,
      aprovado: true, // Auto-aprova para admin/RH
      aprovadoPor: session.userId,
      aprovadoEm: new Date(),
      criadoPor: session.userId,
    }).returning();

    // Criar registros de ponto para cada dia útil da ausência
    const inicio = new Date(data.dataInicio + 'T12:00:00');
    const fim = new Date(data.dataFim + 'T12:00:00');
    let registrosCriados = 0;

    for (let d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) {
      const diaSemana = d.getDay();
      if (diaSemana === 0 || diaSemana === 6) continue; // Pular fins de semana

      const dataStr = d.toISOString().split('T')[0];

      const [existente] = await db
        .select({ id: registrosPonto.id })
        .from(registrosPonto)
        .where(and(
          eq(registrosPonto.servidorId, data.servidorId),
          eq(registrosPonto.data, dataStr)
        ))
        .limit(1);

      if (!existente) {
        const statusMap: Record<string, string> = {
          FALTA: 'FALTA',
          FALTA_JUSTIFICADA: 'FALTA_JUSTIFICADA',
          ABONO: 'FALTA_JUSTIFICADA',
          FERIAS: 'FERIAS',
          LICENCA_SAUDE: 'LICENCA',
          LICENCA_PREMIO: 'LICENCA',
          LICENCA_GESTANTE: 'LICENCA',
          LICENCA_PATERNIDADE: 'LICENCA',
          LICENCA_NOJO: 'LICENCA',
          LICENCA_GALA: 'LICENCA',
          AFASTAMENTO: 'AFASTAMENTO',
          CURSO: 'LICENCA',
          HOME_OFFICE: 'PRESENTE',
          COMPENSACAO: 'PRESENTE',
          DISPENSA: 'LICENCA',
          RECESSO: 'LICENCA',
          PONTO_FACULTATIVO: 'LICENCA',
          OUTRO: 'FALTA',
        };

        await db.insert(registrosPonto).values({
          servidorId: data.servidorId,
          data: dataStr,
          status: (statusMap[data.tipo] || 'FALTA') as any,
          observacoes: `${data.tipo}: ${data.motivo || 'Sem observação'}`,
        });
        registrosCriados++;
      }
    }

    // Buscar nome do servidor para auditoria
    const [serv] = await db.select({ nome: servidores.nome }).from(servidores).where(eq(servidores.id, data.servidorId)).limit(1);

    await db.insert(auditoria).values({
      usuarioId: session.userId,
      acao: 'CRIAR',
      tabela: 'ausencias',
      registroId: ausencia.id,
      dadosDepois: { ...ausencia, servidorNome: serv?.nome, registrosCriados } as any,
    });

    return NextResponse.json({
      ausencia,
      registrosCriados,
      message: `Ausência registrada para ${serv?.nome || 'servidor'}. ${registrosCriados} registro(s) de ponto criado(s).`,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao criar ausência:', error);
    return NextResponse.json({ error: error.message || 'Erro ao criar ausência' }, { status: 500 });
  }
}
