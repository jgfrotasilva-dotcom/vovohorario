import { NextResponse } from 'next/server';
import { db } from '@/db';
import { servidores } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Total de servidores ativos
    const totalServidores = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(servidores)
      .where(eq(servidores.situacao, 'ATIVO'));

    return NextResponse.json({
      totalServidores: Number(totalServidores[0]?.count || 0),
      presentesHoje: 0,
      ausentesHoje: 0,
      emFerias: 0,
      emLicenca: 0,
      registrosPendentes: 0,
      bancoHorasTotal: 0,
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json({
      totalServidores: 0,
      presentesHoje: 0,
      ausentesHoje: 0,
      emFerias: 0,
      emLicenca: 0,
      registrosPendentes: 0,
      bancoHorasTotal: 0,
    });
  }
}
