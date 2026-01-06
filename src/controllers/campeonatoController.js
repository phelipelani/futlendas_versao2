// // Arquivo: src/controllers/campeonatoController.js
// import * as CampeonatoModel from '../models/campeonatoModel.js';
// import * as CampeonatoPartidaModel from '../models/campeonatoPartidaModel.js';
// import dbPromise from '../database/db.js';
// import { validationResult } from 'express-validator';
// import { uploadToS3 } from '../utils/s3Client.js';

// function checkValidation(req) {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     const err = new Error('Erro de validação.');
//     err.status = 400;
//     err.errors = errors.array();
//     throw err;
//   }
// }

// export async function getCampeonatos(req, res, next) {
//   try {
//     const campeonatos = await CampeonatoModel.findAll();
//     res.status(200).json(campeonatos);
//   } catch (err) {
//     next(err);
//   }
// }

// /* ==========================================================================
//    CRIAR CAMPEONATO (ATUALIZADO COM NOVAS CONFIGS)
// ========================================================================== */

// export async function createCampeonato(req, res, next) {
//   try {
//     checkValidation(req);
    
//     const {
//       nome,
//       data,
//       formato,
//       num_times,
//       tem_fase_grupos,
//       fase_grupos_ida_volta,
//       tem_repescagem,
//       tem_terceiro_lugar,
//       modo_selecao_times
//     } = req.body;
    
//     const novo = await CampeonatoModel.create({
//       nome,
//       data,
//       formato,
//       num_times,
//       tem_fase_grupos,
//       fase_grupos_ida_volta,
//       tem_repescagem,
//       tem_terceiro_lugar,
//       modo_selecao_times
//     });
    
//     res.status(201).json(novo);
//   } catch (err) {
//     next(err);
//   }
// }

// export async function getClassificacaoCampeonato(req, res, next) {
//   try {
//     checkValidation(req);
//     const { campeonato_id } = req.params;
//     const { rodada } = req.query;

//     const classificacao = await CampeonatoModel.getTabelaClassificacao(campeonato_id, rodada);
//     res.status(200).json(classificacao);
//   } catch (err) {
//     next(err);
//   }
// }

// export async function addVencedoresCampeonato(req, res, next) {
//   try {
//     checkValidation(req);
//     const { campeonato_id } = req.params;
//     const { jogadores_ids } = req.body;
//     await CampeonatoModel.addVencedores(campeonato_id, jogadores_ids);
//     res.status(200).json({ message: 'Vencedores adicionados com sucesso!' });
//   } catch (err) {
//     next(err);
//   }
// }

// export async function getTitulos(req, res, next) {
//   try {
//     const titulos = await CampeonatoModel.getTitulosPorJogador();
//     res.status(200).json(titulos);
//   } catch (err) {
//     next(err);
//   }
// }

// export async function registerTimeNoCampeonato(req, res, next) {
//   try {
//     checkValidation(req);
//     const { campeonato_id } = req.params;
//     const { time_id } = req.body;
//     const resultado = await CampeonatoModel.registerTime(campeonato_id, time_id);
//     res.status(201).json(resultado);
//   } catch (err) {
//     next(err);
//   }
// }

// export async function getTimesDoCampeonato(req, res, next) {
//   try {
//     checkValidation(req);
//     const { campeonato_id } = req.params;
//     const times = await CampeonatoModel.findTimesByCampeonatoId(campeonato_id);
//     res.status(200).json(times);
//   } catch (err) {
//     next(err);
//   }
// }

// export async function updateCampeonatoStatus(req, res, next) {
//   try {
//     checkValidation(req);
//     const { campeonato_id } = req.params;
//     const { formato, fase_atual } = req.body;
//     const resultado = await CampeonatoModel.updateCampeonatoStatus(campeonato_id, formato, fase_atual);
//     res.status(200).json(resultado);
//   } catch (err) {
//     next(err);
//   }
// }

// /* ==========================================================================
//    INICIAR CAMPEONATO (GERA FASE DE GRUPOS OU MATA-MATA DIRETO)
// ========================================================================== */

// export async function iniciarCampeonato(req, res, next) {
//   try {
//     checkValidation(req);
//     const { campeonato_id } = req.params;
//     const resultado = await CampeonatoModel.iniciar(campeonato_id);
//     res.status(200).json(resultado);
//   } catch (err) {
//     next(err);
//   }
// }

// /* ==========================================================================
//    CRIAR TIMES VIA SORTEIO (NOVO)
// ========================================================================== */

// export async function criarTimesSorteio(req, res, next) {
//   try {
//     checkValidation(req);
//     const { campeonato_id } = req.params;
//     const { times, jogadoresPorTime } = req.body;

//     if (!times || !Array.isArray(times) || times.length < 2) {
//       return res.status(400).json({ 
//         message: 'É necessário pelo menos 2 times' 
//       });
//     }

//     const resultado = await CampeonatoModel.criarTimesSorteio(
//       Number(campeonato_id), 
//       times, 
//       jogadoresPorTime
//     );

//     res.status(201).json(resultado);
//   } catch (err) {
//     next(err);
//   }
// }

// /* ==========================================================================
//    AVANÇAR PARA MATA-MATA (APÓS FASE DE GRUPOS)
// ========================================================================== */

// export async function avancarParaMataAMata(req, res, next) {
//   try {
//     checkValidation(req);
//     const { campeonato_id } = req.params;
//     const resultado = await CampeonatoModel.avancarParaMataAMata(campeonato_id);
//     res.status(200).json(resultado);
//   } catch (err) {
//     next(err);
//   }
// }

// /* ==========================================================================
//    AVANÇAR FASE DO MATA-MATA
// ========================================================================== */

// export async function avancarFaseCampeonato(req, res, next) {
//   try {
//     checkValidation(req);
//     const { campeonato_id } = req.params;
//     const resultado = await CampeonatoModel.avancarFase(campeonato_id);
//     res.status(200).json(resultado);
//   } catch (err) {
//     next(err);
//   }
// }

// /* ==========================================================================
//    BUSCAR BRACKET (VISUALIZAÇÃO DO MATA-MATA)
// ========================================================================== */

// export async function getBracket(req, res, next) {
//   try {
//     checkValidation(req);
//     const { campeonato_id } = req.params;
//     const bracket = await CampeonatoModel.getBracket(campeonato_id);
//     res.status(200).json(bracket);
//   } catch (err) {
//     next(err);
//   }
// }

// export async function getEstatisticasJogadores(req, res, next) {
//   try {
//     checkValidation(req);
//     const { campeonato_id } = req.params;
//     const stats = await CampeonatoModel.getEstatisticasJogadores(campeonato_id);
//     res.status(200).json(stats);
//   } catch (err) {
//     next(err);
//   }
// }

// export async function getCampeonatoPremios(req, res, next) {
//   try {
//     checkValidation(req);
//     const { campeonato_id } = req.params;
//     const premios = await CampeonatoModel.getPremiosCampeonato(campeonato_id);
//     res.status(200).json(premios);
//   } catch (err) {
//     next(err);
//   }
// }

// export async function createProximaPartidaCampeonato(req, res, next) {
//   try {
//     checkValidation(req);
//     const { campeonato_id } = req.params;
//     const { timeA_id, timeB_id } = req.body;
//     const db = await dbPromise;
//     const camp = await db.get('SELECT fase_atual FROM campeonatos WHERE id = ?', [campeonato_id]);
    
//     if (!camp) {
//         return res.status(404).json({ error: 'Campeonato não encontrado.' });
//     }

//     const fase = camp.fase_atual === 'em_andamento' ? 'em_andamento' : 'fase_de_pontos';
//     const partida = { campeonato_id, fase: fase, timeA_id, timeB_id };
//     await CampeonatoPartidaModel.createPartidasEmLote([partida], db);
//     res.status(201).json({ message: 'Próxima partida criada com sucesso.' });
//   } catch (err) {
//     next(err);
//   }
// }

// export async function updateCampeonatoDetails(req, res, next) {
//   try {
//     checkValidation(req);
//     const { campeonato_id } = req.params;
//     const { nome, data } = req.body;
//     const resultado = await CampeonatoModel.updateDetails(campeonato_id, { nome, data });
//     res.status(200).json(resultado);
//   } catch (err) {
//     next(err);
//   }
// }

// export async function getCampeonatoById(req, res, next) {
//   try {
//     const { campeonato_id } = req.params;
//     const campeonato = await CampeonatoModel.findById(campeonato_id);
    
//     if (!campeonato) {
//        return res.status(404).json({ error: 'Campeonato não encontrado.' });
//     }
    
//     res.status(200).json(campeonato);
//   } catch (err) {
//     next(err);
//   }
// }

// export async function deleteCampeonato(req, res, next) {
//   try {
//     checkValidation(req);
//     const { campeonato_id } = req.params;
//     const resultado = await CampeonatoModel.remove(campeonato_id);
//     res.status(200).json(resultado);
//   } catch (err) {
//     next(err);
//   }
// }

// export async function salvarPartidaLive(req, res, next) {
//   try {
//     const { rodada_id } = req.params;
//     const data = req.body;
//     const db = await dbPromise;
    
//     await db.run('BEGIN TRANSACTION;');
//     const sqlCreate = `
//       INSERT INTO campeonato_partidas (
//         campeonato_id, rodada_id, fase, timeA_id, timeB_id, 
//         placar_timeA, placar_timeB, duracao_segundos, 
//         goleiro_timeA_id, goleiro_timeB_id, status
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'finalizada')
//     `;
//     const rodada = await db.get('SELECT campeonato_id FROM rodadas WHERE id = ?', [rodada_id]);
    
//     if(!rodada) {
//        await db.run('ROLLBACK;');
//        return res.status(404).json({ error: 'Rodada não encontrada.' });
//     }

//     const result = await db.run(sqlCreate, [
//       rodada.campeonato_id, rodada_id, 'fase_de_pontos',
//       data.timeA_id, data.timeB_id, data.placar_timeA, data.placar_timeB,
//       data.duracao_segundos, data.goleiro_timeA_id, data.goleiro_timeB_id
//     ]);
//     const partidaId = result.lastID;
    
//     await CampeonatoPartidaModel.updateResultadoComEventos(partidaId, {
//       ...data,
//       timeA_jogadores: data.timeA_jogadores || [],
//       timeB_jogadores: data.timeB_jogadores || []
//     }, db);

//     await db.run('COMMIT;');
//     res.status(201).json({ message: 'Partida salva com sucesso!', partidaId });
//   } catch (err) {
//     const db = await dbPromise;
//     await db.run('ROLLBACK;');
//     next(err);
//   }
// }

// /* ========================================================================== */
// /*                    STATS AVANÇADAS (COM FILTRO POR RODADA)                 */
// /* ========================================================================== */

// export async function getStatsAvancadas(req, res, next) {
//   try {
//     const { campeonato_id } = req.params;
//     const { rodada_id } = req.query;

//     const rodadaIdNum = rodada_id ? parseInt(rodada_id) : null;

//     const [ranking, goleiros, times] = await Promise.all([
//       CampeonatoModel.getRankingPontuacao(campeonato_id, rodadaIdNum),
//       CampeonatoModel.getStatsGoleiros(campeonato_id, rodadaIdNum),
//       CampeonatoModel.getStatsTimes(campeonato_id, rodadaIdNum)
//     ]);
//     res.status(200).json({ jogadores: ranking, goleiros, times });
//   } catch (err) {
//     next(err);
//   }
// }

// export async function getRivalidades(req, res, next) {
//   try {
//     const { campeonato_id } = req.params;
//     const rivalidades = await CampeonatoModel.getRivalidadeCapitaes(campeonato_id);
//     res.status(200).json(rivalidades);
//   } catch (err) {
//     next(err);
//   }
// }

// export async function finalizarCampeonato(req, res, next) {
//   try {
//     const { campeonato_id } = req.params;
//     const resultado = await CampeonatoModel.finalizarCampeonato(campeonato_id);
//     res.status(200).json(resultado);
//   } catch (err) {
//     next(err);
//   }
// }

// export async function uploadChampionPhoto(req, res, next) {
//   try {
//     const { campeonato_id } = req.params;

//     if (!req.file) {
//       return res.status(400).json({ message: "Nenhuma imagem enviada." });
//     }

//     const fotoUrl = await uploadToS3(req.file, `campeonatos/${campeonato_id}`);

//     const resultado = await CampeonatoModel.updateChampionPhoto(
//       campeonato_id,
//       fotoUrl
//     );

//     res.status(200).json(resultado);
//   } catch (error) {
//     next(error);
//   }
// }

// Arquivo: src/controllers/campeonatoController.js
import * as CampeonatoModel from '../models/campeonatoModel.js';
import * as CampeonatoPartidaModel from '../models/campeonatoPartidaModel.js';
import pool from '../database/db.js'; // Usando pool
import { validationResult } from 'express-validator';
import { uploadToS3 } from '../utils/s3Client.js';

function checkValidation(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error('Erro de validação.');
    err.status = 400;
    err.errors = errors.array();
    throw err;
  }
}

export async function getCampeonatos(req, res, next) {
  try {
    const campeonatos = await CampeonatoModel.findAll();
    res.status(200).json(campeonatos);
  } catch (err) {
    next(err);
  }
}

export async function createCampeonato(req, res, next) {
  try {
    checkValidation(req);
    const {
      nome, data, formato, num_times, tem_fase_grupos,
      fase_grupos_ida_volta, tem_repescagem, tem_terceiro_lugar, modo_selecao_times
    } = req.body;
    
    const novo = await CampeonatoModel.create({
      nome, data, formato, num_times, tem_fase_grupos,
      fase_grupos_ida_volta, tem_repescagem, tem_terceiro_lugar, modo_selecao_times
    });
    
    res.status(201).json(novo);
  } catch (err) {
    next(err);
  }
}

export async function getClassificacaoCampeonato(req, res, next) {
  try {
    checkValidation(req);
    const { campeonato_id } = req.params;
    const { rodada } = req.query;
    const classificacao = await CampeonatoModel.getTabelaClassificacao(campeonato_id, rodada);
    res.status(200).json(classificacao);
  } catch (err) {
    next(err);
  }
}

export async function addVencedoresCampeonato(req, res, next) {
  try {
    checkValidation(req);
    const { campeonato_id } = req.params;
    const { jogadores_ids } = req.body;
    await CampeonatoModel.addVencedores(campeonato_id, jogadores_ids);
    res.status(200).json({ message: 'Vencedores adicionados com sucesso!' });
  } catch (err) {
    next(err);
  }
}

export async function getTitulos(req, res, next) {
  try {
    const titulos = await CampeonatoModel.getTitulosPorJogador();
    res.status(200).json(titulos);
  } catch (err) {
    next(err);
  }
}

export async function registerTimeNoCampeonato(req, res, next) {
  try {
    checkValidation(req);
    const { campeonato_id } = req.params;
    const { time_id } = req.body;
    const resultado = await CampeonatoModel.registerTime(campeonato_id, time_id);
    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

export async function getTimesDoCampeonato(req, res, next) {
  try {
    checkValidation(req);
    const { campeonato_id } = req.params;
    const times = await CampeonatoModel.findTimesByCampeonatoId(campeonato_id);
    res.status(200).json(times);
  } catch (err) {
    next(err);
  }
}

export async function updateCampeonatoStatus(req, res, next) {
  try {
    checkValidation(req);
    const { campeonato_id } = req.params;
    const { formato, fase_atual } = req.body;
    const resultado = await CampeonatoModel.updateCampeonatoStatus(campeonato_id, formato, fase_atual);
    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

export async function iniciarCampeonato(req, res, next) {
  try {
    checkValidation(req);
    const { campeonato_id } = req.params;
    const resultado = await CampeonatoModel.iniciar(campeonato_id);
    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

export async function criarTimesSorteio(req, res, next) {
  try {
    checkValidation(req);
    const { campeonato_id } = req.params;
    const { times, jogadoresPorTime } = req.body;

    if (!times || !Array.isArray(times) || times.length < 2) {
      return res.status(400).json({ message: 'É necessário pelo menos 2 times' });
    }

    const resultado = await CampeonatoModel.criarTimesSorteio(
      Number(campeonato_id), times, jogadoresPorTime
    );
    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

export async function avancarParaMataAMata(req, res, next) {
  try {
    checkValidation(req);
    const { campeonato_id } = req.params;
    const resultado = await CampeonatoModel.avancarParaMataAMata(campeonato_id);
    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

export async function avancarFaseCampeonato(req, res, next) {
  try {
    checkValidation(req);
    const { campeonato_id } = req.params;
    const resultado = await CampeonatoModel.avancarFase(campeonato_id);
    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

export async function getBracket(req, res, next) {
  try {
    checkValidation(req);
    const { campeonato_id } = req.params;
    const bracket = await CampeonatoModel.getBracket(campeonato_id);
    res.status(200).json(bracket);
  } catch (err) {
    next(err);
  }
}

export async function getEstatisticasJogadores(req, res, next) {
  try {
    checkValidation(req);
    const { campeonato_id } = req.params;
    const stats = await CampeonatoModel.getEstatisticasJogadores(campeonato_id);
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
}

export async function getCampeonatoPremios(req, res, next) {
  try {
    checkValidation(req);
    const { campeonato_id } = req.params;
    const premios = await CampeonatoModel.getPremiosCampeonato(campeonato_id);
    res.status(200).json(premios);
  } catch (err) {
    next(err);
  }
}

export async function createProximaPartidaCampeonato(req, res, next) {
  try {
    checkValidation(req);
    const { campeonato_id } = req.params;
    const { timeA_id, timeB_id } = req.body;
    
    // Check de fase atual com Pool
    const [rows] = await pool.query('SELECT fase_atual FROM campeonatos WHERE id = ?', [campeonato_id]);
    const camp = rows[0];
    
    if (!camp) {
        return res.status(404).json({ error: 'Campeonato não encontrado.' });
    }

    const fase = camp.fase_atual === 'em_andamento' ? 'em_andamento' : 'fase_de_pontos';
    const partida = { campeonato_id, fase: fase, timeA_id, timeB_id };
    
    // IMPORTANTE: Aqui você pode precisar passar o 'pool' se o model espera uma conexão
    await CampeonatoPartidaModel.createPartidasEmLote([partida], pool);
    
    res.status(201).json({ message: 'Próxima partida criada com sucesso.' });
  } catch (err) {
    next(err);
  }
}

export async function updateCampeonatoDetails(req, res, next) {
  try {
    checkValidation(req);
    const { campeonato_id } = req.params;
    const { nome, data } = req.body;
    const resultado = await CampeonatoModel.updateDetails(campeonato_id, { nome, data });
    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

export async function getCampeonatoById(req, res, next) {
  try {
    const { campeonato_id } = req.params;
    const campeonato = await CampeonatoModel.findById(campeonato_id);
    
    if (!campeonato) {
       return res.status(404).json({ error: 'Campeonato não encontrado.' });
    }
    
    res.status(200).json(campeonato);
  } catch (err) {
    next(err);
  }
}

export async function deleteCampeonato(req, res, next) {
  try {
    checkValidation(req);
    const { campeonato_id } = req.params;
    const resultado = await CampeonatoModel.remove(campeonato_id);
    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

export async function salvarPartidaLive(req, res, next) {
  let connection;
  try {
    const { rodada_id } = req.params;
    const data = req.body;
    
    // Obter conexão do pool para transação
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const [rodadaRows] = await connection.query('SELECT campeonato_id FROM rodadas WHERE id = ?', [rodada_id]);
    const rodada = rodadaRows[0];
    
    if(!rodada) {
       await connection.rollback();
       return res.status(404).json({ error: 'Rodada não encontrada.' });
    }

    const sqlCreate = `
      INSERT INTO campeonato_partidas (
        campeonato_id, rodada_id, fase, timeA_id, timeB_id, 
        placar_timeA, placar_timeB, duracao_segundos, 
        goleiro_timeA_id, goleiro_timeB_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'finalizada')
    `;

    const [result] = await connection.query(sqlCreate, [
      rodada.campeonato_id, rodada_id, 'fase_de_pontos',
      data.timeA_id, data.timeB_id, data.placar_timeA, data.placar_timeB,
      data.duracao_segundos, data.goleiro_timeA_id, data.goleiro_timeB_id
    ]);
    const partidaId = result.insertId;
    
    // Passamos a conexão (connection) para garantir que tudo ocorra na mesma transação
    await CampeonatoPartidaModel.updateResultadoComEventos(partidaId, {
      ...data,
      timeA_jogadores: data.timeA_jogadores || [],
      timeB_jogadores: data.timeB_jogadores || []
    }, connection);

    await connection.commit();
    res.status(201).json({ message: 'Partida salva com sucesso!', partidaId });

  } catch (err) {
    if (connection) await connection.rollback();
    next(err);
  } finally {
    if (connection) connection.release();
  }
}

export async function getStatsAvancadas(req, res, next) {
  try {
    const { campeonato_id } = req.params;
    const { rodada_id } = req.query;

    const rodadaIdNum = rodada_id ? parseInt(rodada_id) : null;

    const [ranking, goleiros, times] = await Promise.all([
      CampeonatoModel.getRankingPontuacao(campeonato_id, rodadaIdNum),
      CampeonatoModel.getStatsGoleiros(campeonato_id, rodadaIdNum),
      CampeonatoModel.getStatsTimes(campeonato_id, rodadaIdNum)
    ]);
    res.status(200).json({ jogadores: ranking, goleiros, times });
  } catch (err) {
    next(err);
  }
}

export async function getRivalidades(req, res, next) {
  try {
    const { campeonato_id } = req.params;
    const rivalidades = await CampeonatoModel.getRivalidadeCapitaes(campeonato_id);
    res.status(200).json(rivalidades);
  } catch (err) {
    next(err);
  }
}

export async function finalizarCampeonato(req, res, next) {
  try {
    const { campeonato_id } = req.params;
    const resultado = await CampeonatoModel.finalizarCampeonato(campeonato_id);
    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

export async function uploadChampionPhoto(req, res, next) {
  try {
    const { campeonato_id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "Nenhuma imagem enviada." });
    }

    const fotoUrl = await uploadToS3(req.file, `campeonatos/${campeonato_id}`);
    const resultado = await CampeonatoModel.updateChampionPhoto(
      campeonato_id,
      fotoUrl
    );

    res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
}