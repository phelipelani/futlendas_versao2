// Arquivo: src/swagger/swaggerSchemas.js

/**
 * @openapi
 * components:
 *   schemas:
 *     # --- Schemas de Entidades ---
 *     Usuario:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         username:
 *           type: string
 *           example: admin_user
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           example: admin
 *
 *     Jogador:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nome:
 *           type: string
 *           example: "Lionel Messi"
 *         role:
 *           type: string
 *           default: player
 *           example: player
 *         joga_recuado:
 *           type: boolean
 *           default: false
 *           example: false
 *         nivel:
 *           type: integer
 *           default: 1
 *           example: 5
 *         posicao:
 *           type: string
 *           enum: [linha, goleiro]
 *           default: linha
 *           example: linha
 *         foto_url:
 *           type: string
 *           nullable: true
 *           format: url
 *           example: "http://example.com/foto.jpg"
 *
 *     # <<< INÍCIO DA ATUALIZAÇÃO >>>
 *     Liga:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nome:
 *           type: string
 *           example: "Temporada 2025/1"
 *         data_inicio:
 *           type: string
 *           format: date
 *           example: "2025-01-01"
 *         data_fim:
 *           type: string
 *           format: date
 *           example: "2025-06-30"
 *         finalizada_em:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: "Data e hora em que a liga foi efetivamente finalizada. Nulo se ainda estiver ativa."
 *           example: "2025-06-15T10:30:00.000Z"
 *     # <<< FIM DA ATUALIZAÇÃO >>>
 *
 *     Rodada:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         liga_id:
 *           type: integer
 *           example: 1
 *         data:
 *           type: string
 *           format: date
 *           example: "2025-01-15"
 *         status:
 *           type: string
 *           enum: [aberta, finalizada]
 *           example: "aberta"
 *
 *     PartidaLiga:
 *       type: object
 *       description: Schema para partidas da Liga (sorteio )
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         data:
 *           type: string
 *           format: date
 *           example: "2025-01-15"
 *         rodada_id:
 *           type: integer
 *           example: 1
 *         placar_time1:
 *           type: integer
 *           default: 0
 *         placar_time2:
 *           type: integer
 *           default: 0
 *         duracao_segundos:
 *           type: integer
 *           default: 0
 *         time1_numero:
 *           type: integer
 *           nullable: true
 *         time2_numero:
 *           type: integer
 *           nullable: true
 *         goleiro_time1_id:
 *           type: integer
 *           nullable: true
 *         goleiro_time2_id:
 *           type: integer
 *           nullable: true
 *
 *     TimeFixo:
 *       type: object
 *       description: Schema para times fixos (campeonato)
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nome:
 *           type: string
 *           example: "Barcelona"
 *         logo_url:
 *           type: string
 *           format: url
 *           nullable: true
 *
 *     Campeonato:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nome:
 *           type: string
 *           example: "Champions League FutLendas"
 *         data:
 *           type: string
 *           format: date
 *           example: "2025-03-01"
 *         formato:
 *           type: string
 *           nullable: true
 *           example: "repescagem_4_times"
 *         fase_atual:
 *           type: string
 *           default: "inscricao"
 *           example: "inscricao"
 *         time_campeao_id:
 *           type: integer
 *           nullable: true
 *
 *     PartidaCampeonato:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         campeonato_id:
 *           type: integer
 *           example: 1
 *         fase:
 *           type: string
 *           example: "fase_de_pontos"
 *         timeA_id:
 *           type: integer
 *           example: 1
 *         timeB_id:
 *           type: integer
 *           example: 2
 *         nome_timeA:
 *           type: string
 *           example: "Time A"
 *           description: Adicionado via JOIN na query
 *         nome_timeB:
 *           type: string
 *           example: "Time B"
 *           description: Adicionado via JOIN na query
 *         placar_timeA:
 *           type: integer
 *           nullable: true
 *         placar_timeB:
 *           type: integer
 *           nullable: true
 *         placar_penaltis_timeA:
 *           type: integer
 *           nullable: true
 *         placar_penaltis_timeB:
 *           type: integer
 *           nullable: true
 *         duracao_segundos:
 *           type: integer
 *           nullable: true
 *         goleiro_timeA_id:
 *           type: integer
 *           nullable: true
 *         goleiro_timeB_id:
 *           type: integer
 *           nullable: true
 *         status:
 *           type: string
 *           default: "pendente"
 *           example: "pendente"
 *
 *     # --- Schemas de Input ---
 *     AuthLoginInput:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           example: "admin_user"
 *         password:
 *           type: string
 *           format: password
 *           example: "password123"
 *
 *     AuthRegisterInput:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           example: "new_user"
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *           example: "newpass123"
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           default: user
 *           example: "user"
 *
 *     JogadorInput:
 *       type: object
 *       required:
 *         - nome
 *       properties:
 *         nome:
 *           type: string
 *           example: "Neymar Jr"
 *         role:
 *           type: string
 *           default: player
 *         posicao:
 *           type: string
 *           enum: [linha, goleiro]
 *           default: linha
 *         foto_url:
 *           type: string
 *           format: url
 *           nullable: true
 *
 *     JogadorUpdateInput:
 *       type: object
 *       minProperties: 1
 *       properties:
 *         nome:
 *           type: string
 *           example: "Neymar"
 *         nivel:
 *           type: integer
 *           minimum: 1
 *           example: 4
 *         posicao:
 *           type: string
 *           enum: [linha, goleiro]
 *         joga_recuado:
 *           type: boolean
 *         foto_url:
 *           type: string
 *           format: url
 *           nullable: true
 *
 *     LigaInput:
 *       type: object
 *       required:
 *         - nome
 *         - data_inicio
 *         - data_fim
 *       properties:
 *         nome:
 *           type: string
 *           example: "Temporada 2025/2"
 *         data_inicio:
 *           type: string
 *           format: date
 *           example: "2025-07-01"
 *         data_fim:
 *           type: string
 *           format: date
 *           example: "2025-12-31"
 *
 *     LigaUpdateInput:
 *       type: object
 *       minProperties: 1
 *       properties:
 *         nome:
 *           type: string
 *           example: "Temporada 2025/2 - Editada"
 *         data_inicio:
 *           type: string
 *           format: date
 *           example: "2025-07-02"
 *         data_fim:
 *           type: string
 *           format: date
 *           example: "2025-12-30"
 *
 *     RodadaInput:
 *       type: object
 *       required:
 *         - data
 *       properties:
 *         data:
 *           type: string
 *           format: date
 *           example: "2025-07-15"
 *
 *     RodadaUpdateInput:
 *       type: object
 *       required:
 *         - data
 *       properties:
 *         data:
 *           type: string
 *           format: date
 *           example: "2025-07-16"
 *
 *     RodadaSyncJogadoresInput:
 *       type: object
 *       required:
 *         - nomes
 *       properties:
 *         nomes:
 *           type: array
 *           items:
 *             type: string
 *           minItems: 1
 *           example: ["Jogador A", "Jogador B", "Novo Jogador C"]
 *
 *     RodadaSaveTimesInput:
 *       type: object
 *       required:
 *         - times
 *       properties:
 *         times:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 example: "Time Amarelo"
 *               jogadores:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *
 *     # <<< INÍCIO DA ATUALIZAÇÃO >>>
 *     PartidaLigaResultadoInput:
 *       type: object
 *       description: "Corpo da requisição para finalizar e salvar os resultados de uma partida da liga."
 *       required:
 *         - placar1
 *         - placar2
 *         - duracao
 *         - time1
 *         - time2
 *         - eventos
 *         - time1_numero
 *         - time2_numero
 *       properties:
 *         placar1:
 *           type: integer
 *           description: "Número de gols marcados pelo Time 1."
 *           example: 5
 *         placar2:
 *           type: integer
 *           description: "Número de gols marcados pelo Time 2."
 *           example: 3
 *         duracao:
 *           type: integer
 *           description: "Duração total da partida em segundos."
 *           example: 900
 *         time1_numero:
 *           type: integer
 *           description: "Identificador numérico do time 1."
 *           example: 1
 *         time2_numero:
 *           type: integer
 *           description: "Identificador numérico do time 2."
 *           example: 2
 *         goleiro_time1_id:
 *           type: integer
 *           nullable: true
 *           description: "ID do jogador que atuou como goleiro no time 1."
 *           example: 10
 *         goleiro_time2_id:
 *           type: integer
 *           nullable: true
 *           description: "ID do jogador que atuou como goleiro no time 2."
 *           example: 20
 *         time1:
 *           type: array
 *           description: "Lista de jogadores que compuseram o Time 1."
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: "ID do jogador."
 *                 example: 10
 *               joga_recuado:
 *                 type: integer
 *                 description: "Flag (1 para sim, 0 para não) que indica se o jogador atuou em posição defensiva."
 *                 example: 1
 *         time2:
 *           type: array
 *           description: "Lista de jogadores que compuseram o Time 2."
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: "ID do jogador."
 *                 example: 21
 *               joga_recuado:
 *                 type: integer
 *                 description: "Flag (1 para sim, 0 para não) que indica se o jogador atuou em posição defensiva."
 *                 example: 0
 *         eventos:
 *           type: array
 *           description: "Uma lista cronológica de todos os eventos que ocorreram na partida."
 *           items:
 *             type: object
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [gol, gol_contra]
 *                 description: "O tipo de evento."
 *                 example: "gol"
 *               jogador_id:
 *                 type: integer
 *                 description: "ID do jogador que executou o evento (quem fez o gol ou o gol contra)."
 *                 example: 12
 *               assist_por_jogador_id:
 *                 type: integer
 *                 nullable: true
 *                 description: "ID do jogador que deu a assistência (apenas para eventos do tipo 'gol')."
 *                 example: 15
 *               tempo_segundos:
 *                 type: integer
 *                 description: "O momento do jogo em que o evento ocorreu, em segundos."
 *                 example: 450
 *
 *     # PartidaLigaGolContraInput foi removido pois sua lógica foi absorvida por PartidaLigaResultadoInput
 *     # <<< FIM DA ATUALIZAÇÃO >>>
 *
 *     TimeFixoInput:
 *       type: object
 *       required:
 *         - nome
 *       properties:
 *         nome:
 *           type: string
 *           example: "Real Madrid"
 *         logo_url:
 *           type: string
 *           format: url
 *           nullable: true
 *
 *     TimeFixoUpdateInput:
 *       type: object
 *       minProperties: 1
 *       properties:
 *         nome:
 *           type: string
 *           example: "Real Madrid CF"
 *         logo_url:
 *           type: string
 *           format: url
 *           nullable: true
 *
 *     TimeAddJogadoresInput:
 *       type: object
 *       required:
 *         - jogador_ids
 *       properties:
 *         jogador_ids:
 *           type: array
 *           items:
 *             type: integer
 *           minItems: 1
 *           example: [1, 5, 10]
 *
 *     CampeonatoInput:
 *       type: object
 *       required:
 *         - nome
 *         - data
 *       properties:
 *         nome:
 *           type: string
 *           example: "Copa FutLendas 2025"
 *         data:
 *           type: string
 *           format: date
 *           example: "2025-08-01"
 *
 *     CampeonatoUpdateDetailsInput:
 *       type: object
 *       minProperties: 1
 *       properties:
 *         nome:
 *           type: string
 *         data:
 *           type: string
 *           format: date
 *
 *     CampeonatoUpdateStatusInput:
 *       type: object
 *       minProperties: 1
 *       properties:
 *         formato:
 *           type: string
 *           example: "repescagem_4_times"
 *         fase_atual:
 *           type: string
 *           example: "fase_de_pontos"
 *
 *     CampeonatoRegisterTimeInput:
 *       type: object
 *       required:
 *         - time_id
 *       properties:
 *         time_id:
 *           type: integer
 *
 *     CampeonatoAddVencedoresInput:
 *       type: object
 *       required:
 *         - jogadores_ids
 *       properties:
 *         jogadores_ids:
 *           type: array
 *           items:
 *             type: integer
 *           minItems: 1
 *
 *     CampeonatoCreatePartidaInput:
 *       type: object
 *       required:
 *         - timeA_id
 *         - timeB_id
 *       properties:
 *         timeA_id:
 *           type: integer
 *         timeB_id:
 *           type: integer
 *
 *     PartidaCampeonatoResultadoInput:
 *       type: object
 *       required:
 *         - placar_timeA
 *         - placar_timeB
 *       properties:
 *         placar_timeA:
 *           type: integer
 *         placar_timeB:
 *           type: integer
 *         placar_penaltis_timeA:
 *           type: integer
 *           nullable: true
 *         placar_penaltis_timeB:
 *           type: integer
 *           nullable: true
 *         duracao_segundos:
 *           type: integer
 *           nullable: true
 *         goleiro_timeA_id:
 *           type: integer
 *           nullable: true
 *         goleiro_timeB_id:
 *           type: integer
 *           nullable: true
 *         estatisticasJogadores:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - jogador_id
 *               - time_id
 *             properties:
 *               jogador_id:
 *                 type: integer
 *               time_id:
 *                 type: integer
 *               gols:
 *                 type: integer
 *                 default: 0
 *               assistencias:
 *                 type: integer
 *                 default: 0
 *
 *     # --- Schemas de Resposta Genéricos ---
 *     SuccessMessage:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Mensagem de sucesso.
 *           example: "Operação realizada com sucesso."
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Mensagem de erro principal.
 *           example: "Erro de validação."
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *           description: "(Opcional) Detalhes de erros de validação."
 *           example: [{ "type": "field", "value": "", "msg": "O nome é obrigatório.", "path": "nome", "location": "body" }]
 *         error:
 *           type: string
 *           description: "(Opcional) Detalhes do erro interno (apenas em dev)."
 *           example: "SQLITE_CONSTRAINT: UNIQUE constraint failed: ligas.nome"
 */
