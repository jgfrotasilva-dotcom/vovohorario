import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { setores, auditoria } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { id } = await params;

    const [antes] = await db.select().from(setores).where(eq(setores.id, id)).limit(1);
    if (!antes) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

    await db.delete(setores).where(eq(setores.id, id));

    await db.insert(auditoria).values({
      usuarioId: session.userId,
      acao: 'EXCLUIR',
      tabela: 'setores',
      registroId: id,
      dadosAntes: antes as any,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 });
  }
}
