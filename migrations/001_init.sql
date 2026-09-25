-- One table: every activation code the admin creates.
CREATE TABLE licenses (
  id               SERIAL PRIMARY KEY,
  license_code     VARCHAR(64)  NOT NULL UNIQUE,  -- code sent to the merchant
  order_id         VARCHAR(40)  NOT NULL,         -- Etsy order number (required)
  email            VARCHAR(255),                  -- buyer email
  theme_id         VARCHAR(60)  NOT NULL,         -- must match THEME_ID in the theme file
  store_id         VARCHAR(255),                  -- myshopify domain, NULL until first use
  status           VARCHAR(20)  NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active', 'revoked')),
  note             TEXT,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  activated_at     TIMESTAMPTZ,
  last_checked_at  TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX licenses_order_idx ON licenses (order_id);
CREATE INDEX licenses_store_idx ON licenses (store_id);
CREATE INDEX licenses_theme_idx ON licenses (theme_id);
