import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { servidores, usuarios, jornadas, registrosPonto, ausencias, bancoHoras, folhasPonto, justificativas, auditoria } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

// GET - Buscar servidor com jornada
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { id } = await params;

    const [servidor] = await db.select().from(servidores).where(eq(servidores.id, id)).limit(1);
    if (!servidor) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

    const jornadasLista = await db
      .select()
      .from(jornadas)
      .where(eq(jornadas.servidorId, id));

    return NextResponse.json({ servidor, jornadas: jornadasLista });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao buscar' }, { status: 500 });
  }
}

// PUT - Atualizar servidor + jornada
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { id } = await params;
    const data = await request.json();

    const [antes] = await db.select().from(servidores).where(eq(servidores.id, id)).limit(1);
    if (!antes) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

    // Atualizar servidor
    const updateData: any = {
      nome: data.nome,
      matricula: data.matricula,
      cpf: data.cpf,
      rg: data.rg || null,
      telefone: data.telefone || null,
      email: data.email || null,
      situacao: data.situacao || 'ATIVO',
      dataAdmissao: data.dataAdmissao,
      foto: data.foto || null,
      atualizadoEm: new Date(),
    };

    if (data.cargoId && data.cargoId !== 'none') updateData.cargoId = data.cargoId;
    if (data.unidadeId && data.unidadeId !== 'none') updateData.unidadeId = data.unidadeId;
    if (data.setorId && data.setorId !== 'none' && data.setorId !== '__none__') updateData.setorId = data.setorId;

    const [servidor] = await db.update(servidores).set(updateData).where(eq(servidores.id, id)).returning();

    // Atualizar ou criar jornada
    const [jornadaExistente] = await db
      .select({ id: jornadas.id })
      .from(jornadas)
      .where(eq(jornadas.servidorId, id))
      .limit(1);

    const carga = calcularCargaHoraria(
      data.horaEntrada || '08:00',
      data.horaSaidaAlmoco || null,
      data.horaRetornoAlmoco || null,
      data.horaSaidaFinal || '17:00'
    );

    // Deletar jornadas antigas e recriar
    await db.delete(jornadas).where(eq(jornadas.servidorId, id));

    const diasSelecionados = data.diasSemana && data.diasSemana.length > 0
      ? data.diasSemana
      : [1, 2, 3, 4, 5];

    for (const dia of diasSelecionados) {
      const jornadaDia = data.jornadas?.[dia] || {};
      const hEntrada = jornadaDia.horaEntrada || data.horaEntrada || '08:00';
      const hSaidaAlmoco = jornadaDia.horaSaidaAlmoco || data.horaSaidaAlmoco || null;
      const hRetornoAlmoco = jornadaDia.horaRetornoAlmoco || data.horaRetornoAlmoco || null;
      const hSaidaFinal = jornadaDia.horaSaidaFinal || data.horaSaidaFinal || '17:00';

      await db.insert(jornadas).values({
        servidorId: id,
        diaSemana: dia,
        horaEntrada: hEntrada,
        horaSaidaAlmoco: hSaidaAlmoco,
        horaRetornoAlmoco: hRetornoAlmoco,
        horaSaidaFinal: hSaidaFinal,
        cargaHorariaDiaria: calcularCargaHoraria(hEntrada, hSaidaAlmoco, hRetornoAlmoco, hSaidaFinal),
        dataInicio: data.dataAdmissao,
        ativo: true,
        criadoPor: session.userId,
      });
    }

    await db.insert(auditoria).values({
      usuarioId: session.userId,
      acao: 'ATUALIZAR',
      tabela: 'servidores',
      registroId: id,
      dadosAntes: antes as any,
      dadosDepois: servidor as any,
    });

    return NextResponse.json({ servidor });
  } catch (error: any) {
    console.error('Erro ao atualizar:', error);
    return NextResponse.json({ error: error.message || 'Erro ao atualizar' }, { status: 500 });
  }
}

// PATCH - Ativar/Desativar servidor + sincronizar com usuário
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { id } = await params;
    const data = await request.json();

    const [antes] = await db.select().from(servidores).where(eq(servidores.id, id)).limit(1);
    if (!antes) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

    const novoStatus = data.situacao || (antes.situacao === 'ATIVO' ? 'INATIVO' : 'ATIVO');
    const usuarioAtivo = novoStatus === 'ATIVO';

    // Atualizar servidor
    await db.update(servidores).set({
      situacao: novoStatus,
      atualizadoEm: new Date(),
    }).where(eq(servidores.id, id));

    // Sincronizar com usuário vinculado
    if (antes.usuarioId) {
      await db.update(usuarios).set({ ativo: usuarioAtivo }).where(eq(usuarios.id, antes.usuarioId));
    } else if (antes.cpf) {
      const [usuarioCpf] = await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.cpf, antes.cpf)).limit(1);
      if (usuarioCpf) {
        await db.update(usuarios).set({ ativo: usuarioAtivo }).where(eq(usuarios.id, usuarioCpf.id));
      }
    }

    await db.insert(auditoria).values({
      usuarioId: session.userId,
      acao: usuarioAtivo ? 'REATIVAR' : 'DESATIVAR',
      tabela: 'servidores',
      registroId: id,
      dadosAntes: antes as any,
      dadosDepois: { ...antes, situacao: novoStatus } as any,
    });

    return NextResponse.json({ success: true, situacao: novoStatus });
  } catch (error: any) {
    console.error('Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro ao atualizar' }, { status: 500 });
  }
}

function calcularCargaHoraria(entrada: string, saidaAlmoco: string | null, retornoAlmoco: string | null, saidaFinal: string): string {
  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  if (saidaAlmoco && retornoAlmoco) {
    const manha = timeToMinutes(saidaAlmoco) - timeToMinutes(entrada);
    const tarde = timeToMinutes(saidaFinal) - timeToMinutes(retornoAlmoco);
    return ((manha + tarde) / 60).toFixed(2);
  }

  const total = timeToMinutes(saidaFinal) - timeToMinutes(entrada);
  return (total / 60).toFixed(2);
}
