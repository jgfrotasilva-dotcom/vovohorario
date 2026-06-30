import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { usuarios, servidores, auditoria } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

// PATCH - Ativar/Desativar usuário + sincronizar com servidor
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { id } = await params;
    const data = await request.json();

    const [antes] = await db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1);
    if (!antes) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const novoAtivo = data.ativo !== undefined ? data.ativo : !antes.ativo;

    await db.update(usuarios).set({ ativo: novoAtivo }).where(eq(usuarios.id, id));

    // Sincronizar com servidor vinculado
    const [serv] = await db.select({ id: servidores.id }).from(servidores).where(eq(servidores.usuarioId, id)).limit(1);
    if (serv) {
      await db.update(servidores).set({
        situacao: novoAtivo ? 'ATIVO' : 'INATIVO',
      }).where(eq(servidores.id, serv.id));
    }

    await db.insert(auditoria).values({
      usuarioId: session.userId,
      acao: novoAtivo ? 'REATIVAR' : 'DESATIVAR',
      tabela: 'usuarios',
      registroId: id,
      dadosAntes: antes as any,
      dadosDepois: { ...antes, ativo: novoAtivo } as any,
    });

    return NextResponse.json({ success: true, ativo: novoAtivo });
  } catch (error: any) {
    console.error('Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro ao atualizar' }, { status: 500 });
  }
}
