import { Providers } from "@/components/providers";
import { UserProvider, type UserDto } from "@/components/user-context";
import { Nav } from "@/components/nav";
import { PwaRegister } from "@/components/pwa-register";
import { requireUser, userDto } from "@/lib/utils";

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
        <PwaRegister />
        <div className="min-h-screen">
          <Nav />
          <main className="mx-auto w-full max-w-2xl px-4 pb-28 pt-4">
            {children}
          </main>
        </div>
      </UserProvider>
    </Providers>
  );
}
