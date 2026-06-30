import { NextResponse } from 'next/server';
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

    return NextResponse.json({ usuario: session });
  } catch (error) {
    console.error('Erro ao buscar sessão:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar sessão' },
      { status: 500 }
    );
  }
}
