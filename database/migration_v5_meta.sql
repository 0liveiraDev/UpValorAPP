-- UpValor v5 — Vincular conta de anúncios da Meta ao cliente e token isolado por usuário
ALTER TABLE clients ADD COLUMN meta_ad_account_id VARCHAR(40) DEFAULT NULL;
ALTER TABLE users ADD COLUMN meta_access_token TEXT DEFAULT NULL;
