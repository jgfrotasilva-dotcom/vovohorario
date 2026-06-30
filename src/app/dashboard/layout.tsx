import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const perfilLabel: Record<string, string> = {
    ADMINISTRADOR: 'Administrador',
    RH: 'Recursos Humanos',
    GESTOR: 'Gestor',
    SECRETARIO: 'Secretário',
    SERVIDOR: 'Servidor',
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar perfil={session.perfil} />
      <div className="flex-1 flex flex-col">
        <Header nome={session.nome} perfil={perfilLabel[session.perfil] || session.perfil} />
        <main className="flex-1 p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
