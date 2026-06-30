import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { usuarios } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession, verifyPassword, hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { senhaAtual, novaSenha } = await request.json();

    if (!senhaAtual || !novaSenha) {
      return NextResponse.json({ error: 'Senha atual e nova senha são obrigatórias' }, { status: 400 });
    }

    if (novaSenha.length < 6) {
      return NextResponse.json({ error: 'A nova senha deve ter no mínimo 6 caracteres' }, { status: 400 });
    }

    // Buscar usuário
    const [usuario] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.id, session.userId))
      .limit(1);

    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar senha atual
    const senhaValida = await verifyPassword(senhaAtual, usuario.senha);
    if (!senhaValida) {
      return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 });
    }

    // Atualizar senha
    const novaSenhaHash = await hashPassword(novaSenha);
    await db
      .update(usuarios)
      .set({ senha: novaSenhaHash, atualizadoEm: new Date() })
      .where(eq(usuarios.id, session.userId));

    return NextResponse.json({ success: true, message: 'Senha alterada com sucesso!' });
  } catch (error: any) {
    console.error('Erro ao alterar senha:', error);
    return NextResponse.json({ error: 'Erro ao alterar senha' }, { status: 500 });
  }
}
