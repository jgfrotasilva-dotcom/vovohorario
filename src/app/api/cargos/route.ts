import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cargos, auditoria } from '@/db/schema';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const result = await db.select().from(cargos);
    return NextResponse.json({ cargos: result });
  } catch (error) {
    console.error('Erro ao buscar cargos:', error);
    return NextResponse.json({ error: 'Erro ao buscar cargos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const data = await request.json();

    const [cargo] = await db.insert(cargos).values({
      nome: data.nome,
      categoria: data.categoria,
      cargaHorariaPadrao: data.cargaHorariaPadrao || 40,
      ativo: true,
    }).returning();

    await db.insert(auditoria).values({
      usuarioId: session.userId,
      acao: 'CRIAR',
      tabela: 'cargos',
      registroId: cargo.id,
      dadosDepois: cargo as any,
    });

    return NextResponse.json({ cargo }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar cargo:', error);
    return NextResponse.json({ error: 'Erro ao criar cargo' }, { status: 500 });
  }
}
