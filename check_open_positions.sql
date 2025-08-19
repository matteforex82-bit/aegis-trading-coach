SELECT ticketId, symbol, side, volume, openPrice, openTime, pnlGross, swap, commission, closeTime FROM "Trade" WHERE "closeTime" IS NULL ORDER BY "openTime" DESC;
