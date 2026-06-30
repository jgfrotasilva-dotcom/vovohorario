import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { unidades, auditoria } from '@/db/schema';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const result = await db.select().from(unidades);
    return NextResponse.json({ unidades: result });
  } catch (error) {
    console.error('Erro ao buscar unidades:', error);
    return NextResponse.json({ error: 'Erro ao buscar unidades' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const data = await request.json();

    const [unidade] = await db.insert(unidades).values({
      nome: data.nome,
      codigo: data.codigo,
      endereco: data.endereco,
      telefone: data.telefone,
      email: data.email,
      ativo: true,
    }).returning();

    await db.insert(auditoria).values({
      usuarioId: session.userId,
      acao: 'CRIAR',
      tabela: 'unidades',
      registroId: unidade.id,
      dadosDepois: unidade as any,
    });

    return NextResponse.json({ unidade }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar unidade:', error);
    return NextResponse.json({ error: 'Erro ao criar unidade' }, { status: 500 });
  }
}
