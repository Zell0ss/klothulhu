-- Esquema de la memoria larga (fase 7, H1). Solo CREATE ... IF NOT EXISTS: nunca hay DROP.
CREATE TABLE IF NOT EXISTS recuerdos (
  id CHAR(36) PRIMARY KEY,               -- el mismo id que el punto de Qdrant
  texto VARCHAR(400) NOT NULL,
  importancia TINYINT NOT NULL,
  emocion VARCHAR(16) NOT NULL,
  fecha DATE NULL,                       -- el día al que se refiere, no cuándo se escribió
  sesion_id CHAR(36) NOT NULL,
  cliente VARCHAR(32) NOT NULL,
  creado DATETIME NOT NULL,
  creado_dia INT NOT NULL,               -- número de día de uso (D34)
  usos INT NOT NULL DEFAULT 0,           -- H2
  ultimo_uso_dia INT NULL,               -- H2
  indexado BOOLEAN NOT NULL DEFAULT 0,   -- 0 = falta en Qdrant (D35)
  nucleo BOOLEAN NOT NULL DEFAULT 0,     -- enfoque C (sueño); en H1 siempre 0
  origen VARCHAR(16) NOT NULL DEFAULT 'sesion',
  borrado DATETIME NULL                  -- H2 (poda)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dias_uso (dia DATE PRIMARY KEY);

CREATE TABLE IF NOT EXISTS memoria_gasto (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  cuando DATETIME NOT NULL,
  concepto VARCHAR(16) NOT NULL,         -- escritor | embedding (H2: juez)
  modelo VARCHAR(64) NOT NULL,
  tokens_in INT NOT NULL,
  tokens_out INT NOT NULL,
  coste DOUBLE NOT NULL                  -- DOUBLE, no DECIMAL(10,6): un embedding cuesta ~2e-7
);

CREATE TABLE IF NOT EXISTS sesiones (
  id CHAR(36) PRIMARY KEY,
  cliente VARCHAR(32) NOT NULL,
  inicio DATETIME NOT NULL,
  cierre DATETIME NOT NULL,
  motivo VARCHAR(16) NOT NULL,           -- ttl | apagado
  turnos INT NOT NULL,
  recuerdos INT NOT NULL,
  coste DOUBLE NOT NULL
);

-- H2: lo que pasa durante las charlas, para medir la memoria (D44, D45). Nada de esto va a los logs (D42).
CREATE TABLE IF NOT EXISTS memoria_eventos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sesion_id CHAR(36) NOT NULL,
  cuando DATETIME NOT NULL,
  tipo VARCHAR(16) NOT NULL,             -- candidato | F3 | F4 | F5 (F1 y F2 se derivan, D44)
  recuerdo_id CHAR(36) NULL,
  similitud DOUBLE NULL,
  pertinente BOOLEAN NULL,               -- veredicto del juez; NULL = no juzgado
  mensaje VARCHAR(1000) NULL             -- el mensaje del mortal (candidatos); nunca a los logs (D42)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
