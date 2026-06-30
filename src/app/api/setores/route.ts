import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { setores, auditoria } from '@/db/schema';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const result = await db.select().from(setores);
    return NextResponse.json({ setores: result });
  } catch (error) {
    console.error('Erro ao buscar setores:', error);
    return NextResponse.json({ error: 'Erro ao buscar setores' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const data = await request.json();

    const [setor] = await db.insert(setores).values({
      nome: data.nome,
      unidadeId: data.unidadeId,
      ativo: true,
    }).returning();

    await db.insert(auditoria).values({
      usuarioId: session.userId,
      acao: 'CRIAR',
      tabela: 'setores',
      registroId: setor.id,
      dadosDepois: setor as any,
    });

    return NextResponse.json({ setor }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar setor:', error);
    return NextResponse.json({ error: 'Erro ao criar setor' }, { status: 500 });
  }
}
