import { Providers } from "@/components/providers";
import { UserProvider, type UserDto } from "@/components/user-context";
import { ToastProvider } from "@/components/toast";
import { Nav } from "@/components/nav";
import { requireUser, userDto } from "@/lib/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: UserDto | null = null;
  try {
    user = userDto(await requireUser());
  } catch {
    // middleware already guards these pages; treat as signed out
  }

  return (
    <Providers>
      <UserProvider user={user}>
        <ToastProvider>
          <div className="min-h-screen">
            <Nav />
            <main className="mx-auto w-full max-w-2xl px-4 pb-28 pt-4">
              <h1 className="sr-only">Kaja</h1>
              {children}
            </main>
          </div>
        </ToastProvider>
      </UserProvider>
    </Providers>
  );
}
