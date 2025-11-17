export default function AdminPage() {
  const { authState } = useAppContext();
  if (authState.user?.role !== "admin") {
    return <p>Nie masz uprawnień.</p>;
  }
  return (
    <div>
      <h1>Panel Administratora</h1>
      <p>Witamy w panelu administratora InfQuizyTor!</p>
      {/* Tutaj można dodać więcej funkcji administracyjnych */}
    </div>
  );
}
