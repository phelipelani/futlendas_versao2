// // Arquivo: src/models/partidaManagementModel.js
// import dbPromise from '../database/db.js';

// /* ==========================================================================
//    DELETAR PARTIDA (Rollback Completo)
//    Apaga a partida e todas as estatísticas geradas por ela.
// ========================================================================== */
// export async function deletePartidaCampeonato(partidaId) {
//   const db = await dbPromise;
  
//   try {
//     await db.run('BEGIN TRANSACTION');

//     // 1. Apagar Estatísticas (Gols, Assists, Clean Sheets vinculados a esse jogo)
//     await db.run('DELETE FROM campeonato_estatisticas_partida WHERE partida_id = ?', [partidaId]);

//     // 2. Apagar Eventos (Timeline do jogo)
//     await db.run('DELETE FROM eventos_jogo WHERE campeonato_partida_id = ?', [partidaId]);

//     // 3. Apagar a Partida em si
//     await db.run('DELETE FROM campeonato_partidas WHERE id = ?', [partidaId]);

//     await db.run('COMMIT');
//     return { message: "Partida excluída e estatísticas revertidas com sucesso." };

//   } catch (err) {
//     await db.run('ROLLBACK');
//     throw err;
//   }
// }

// /* ==========================================================================
//    BUSCAR DETALHES PARA EDIÇÃO
//    Traz tudo o que precisa para repopular a tela de "Partida Live" em modo edição
// ========================================================================== */
// export async function getDetalhesPartidaCampeonato(partidaId) {
//     const db = await dbPromise;

//     // Dados da partida
//     const partida = await db.get(`
//         SELECT cp.*, 
//                ta.nome as timeA_nome, ta.logo_url as timeA_logo,
//                tb.nome as timeB_nome, tb.logo_url as timeB_logo
//         FROM campeonato_partidas cp
//         JOIN times ta ON cp.timeA_id = ta.id
//         JOIN times tb ON cp.timeB_id = tb.id
//         WHERE cp.id = ?
//     `, [partidaId]);

//     if (!partida) return null;

//     // Eventos (Gols, Cartões)
//     const eventos = await db.all(`
//         SELECT ej.*, j.nome as nome_jogador
//         FROM eventos_jogo ej
//         LEFT JOIN jogadores j ON ej.jogador_id = j.id
//         WHERE ej.campeonato_partida_id = ?
//         ORDER BY ej.tempo_segundos ASC
//     `, [partidaId]);

//     // Elenco que jogou (Para saber quem estava em campo no Time A e B)
//     // Buscamos via campeonato_rodada_elencos ou estatisticas se a rodada já passou
//     // A melhor forma de saber quem jogou é olhar quem tem estatística registrada (mesmo que 0 gols)
//     // mas se for edição, ideal é pegar o elenco da rodada.
    
//     // Vamos pegar o elenco da RODADA dessa partida
//     const elencoRodada = await db.all(`
//         SELECT cre.*, j.nome, j.foto_url, j.posicao
//         FROM campeonato_rodada_elencos cre
//         JOIN jogadores j ON cre.jogador_id = j.id
//         WHERE cre.rodada_id = ?
//     `, [partida.rodada_id]);

//     return {
//         partida,
//         eventos,
//         elenco: elencoRodada
//     };
// }

// Arquivo: src/models/partidaManagementModel.js
import pool from '../database/db.js';

/* ==========================================================================
   DELETAR PARTIDA (Rollback Completo)
========================================================================== */
export async function deletePartidaCampeonato(partidaId) {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Apagar Estatísticas
    await connection.query('DELETE FROM campeonato_estatisticas_partida WHERE partida_id = ?', [partidaId]);

    // 2. Apagar Eventos
    await connection.query('DELETE FROM eventos_jogo WHERE campeonato_partida_id = ?', [partidaId]);

    // 3. Apagar a Partida
    await connection.query('DELETE FROM campeonato_partidas WHERE id = ?', [partidaId]);

    await connection.commit();
    return { message: "Partida excluída e estatísticas revertidas com sucesso." };

  } catch (err) {
    if (connection) await connection.rollback();
    throw err;
  } finally {
    if (connection) connection.release();
  }
}

/* ==========================================================================
   BUSCAR DETALHES PARA EDIÇÃO
========================================================================== */
export async function getDetalhesPartidaCampeonato(partidaId) {
    // Dados da partida
    const [pRows] = await pool.query(`
        SELECT cp.*, 
               ta.nome as timeA_nome, ta.logo_url as timeA_logo,
               tb.nome as timeB_nome, tb.logo_url as timeB_logo
        FROM campeonato_partidas cp
        JOIN times ta ON cp.timeA_id = ta.id
        JOIN times tb ON cp.timeB_id = tb.id
        WHERE cp.id = ?
    `, [partidaId]);
    
    const partida = pRows[0];
    if (!partida) return null;

    // Eventos
    const [eventos] = await pool.query(`
        SELECT ej.*, j.nome as nome_jogador
        FROM eventos_jogo ej
        LEFT JOIN jogadores j ON ej.jogador_id = j.id
        WHERE ej.campeonato_partida_id = ?
        ORDER BY ej.tempo_segundos ASC
    `, [partidaId]);

    // Elenco
    const [elencoRodada] = await pool.query(`
        SELECT cre.*, j.nome, j.foto_url, j.posicao
        FROM campeonato_rodada_elencos cre
        JOIN jogadores j ON cre.jogador_id = j.id
        WHERE cre.rodada_id = ?
    `, [partida.rodada_id]);

    return {
        partida,
        eventos,
        elenco: elencoRodada
    };
}