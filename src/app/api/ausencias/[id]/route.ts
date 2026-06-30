import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { ausencias, servidores, registrosPonto, auditoria } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

// PATCH - Aprovar/Rejeitar ausência
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    if (!['ADMINISTRADOR', 'RH'].includes(session.perfil)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const { id } = await params;
    const data = await request.json();

    const [antes] = await db.select().from(ausencias).where(eq(ausencias.id, id)).limit(1);
    if (!antes) return NextResponse.json({ error: 'Ausência não encontrada' }, { status: 404 });

    const [ausencia] = await db.update(ausencias).set({
      aprovado: data.aprovado,
      aprovadoPor: session.userId,
      aprovadoEm: new Date(),
    }).where(eq(ausencias.id, id)).returning();

    // Se rejeitou, remover registros de ponto criados
    if (data.aprovado === false) {
      const inicio = new Date(antes.dataInicio + 'T12:00:00');
      const fim = new Date(antes.dataFim + 'T12:00:00');

      for (let d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) {
        const dataStr = d.toISOString().split('T')[0];
        await db.delete(registrosPonto).where(and(
          eq(registrosPonto.servidorId, antes.servidorId),
          eq(registrosPonto.data, dataStr)
        ));
      }
    }

    await db.insert(auditoria).values({
      usuarioId: session.userId,
      acao: data.aprovado ? 'APROVAR' : 'REJEITAR',
      tabela: 'ausencias',
      registroId: id,
      dadosAntes: antes as any,
      dadosDepois: ausencia as any,
    });

    return NextResponse.json({ ausencia });
  } catch (error: any) {
    console.error('Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro ao atualizar' }, { status: 500 });
  }
}

// DELETE - Excluir ausência
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    if (!['ADMINISTRADOR', 'RH'].includes(session.perfil)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const { id } = await params;

    const [antes] = await db.select().from(ausencias).where(eq(ausencias.id, id)).limit(1);
    if (!antes) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 });

    // Remover registros de ponto vinculados
    const inicio = new Date(antes.dataInicio + 'T12:00:00');
    const fim = new Date(antes.dataFim + 'T12:00:00');

    for (let d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) {
      const dataStr = d.toISOString().split('T')[0];
      await db.delete(registrosPonto).where(and(
        eq(registrosPonto.servidorId, antes.servidorId),
        eq(registrosPonto.data, dataStr)
      ));
    }

    await db.delete(ausencias).where(eq(ausencias.id, id));

    await db.insert(auditoria).values({
      usuarioId: session.userId,
      acao: 'EXCLUIR',
      tabela: 'ausencias',
      registroId: id,
      dadosAntes: antes as any,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro ao excluir' }, { status: 500 });
  }
}
