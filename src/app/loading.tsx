// Loader global desactivado - cada página gere o seu próprio estado de loading internamente.
// Retornar null garante que não aparece nenhum ecrã de carregamento ao clicar nas abas de navegação.
export default function Loading() {
  return null;
}
