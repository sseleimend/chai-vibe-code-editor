const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-zinc-900">
      {children}
    </main>
  );
};

export default AuthLayout;
