-- Applied once to align DB with the API layer
ALTER TABLE admins ALTER COLUMN password TYPE text;
ALTER TABLE menu_items ALTER COLUMN title TYPE text;
ALTER TABLE categories ALTER COLUMN name TYPE text;
ALTER TABLE sections ALTER COLUMN name TYPE text;
