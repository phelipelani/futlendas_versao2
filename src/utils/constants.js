// Arquivo: src/utils/constants.js
export const PONTOS = {
  GOLS: 4.0, // Atacante
  ASSISTENCIAS: 3.0, // Garçom
  CLEAN_SHEET: 4.0, // Defensor/Goleiro (Jogo sem sofrer gol)
  VITORIAS: 3.0, // Coletivo
  EMPATES: 1.0,
  DERROTAS: -1.0,
  GOL_CONTRA: -3.0, // Punição
};

// Pontuação para o HALL DA FAMA (Cálculo do G.O.A.T)
// Define quem é a maior lenda da história do app
export const SCORE_LENDARIO = {
  TITULO_PONTOS_CORRIDOS: 100, // Campeão de Liga
  TITULO_MATA_MATA: 150, // Campeão de Copa (Maior peso?)

  MVP_GERAL: 50, // Craque do Campeonato
  MVP_RODADA: 5, // Craque da Semana

  ARTILHEIRO_GERAL: 30, // Prêmio individual final
  GARCOM_GERAL: 30, // Prêmio individual final

  // Acúmulo de estatísticas brutas na carreira
  GOL_HISTORICO: 1,
  ASSIST_HISTORICO: 1,
};
