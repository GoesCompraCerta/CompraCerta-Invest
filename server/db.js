import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDirectory = dirname(fileURLToPath(import.meta.url));
const sqlitePath = resolve(serverDirectory, '..', 'data', 'app.db');

export let db;

const migrateSqliteData = async () => {
  const [migrations] = await db.execute(
    'SELECT name FROM schema_migrations WHERE name = ?',
    ['sqlite_to_mysql_v1']
  );
  if (migrations.length > 0) return;

  const [[userCount], [assetCount]] = await Promise.all([
    db.execute('SELECT COUNT(*) AS count FROM users'),
    db.execute('SELECT COUNT(*) AS count FROM assets')
  ]);

  if (Number(userCount[0].count) > 0 || Number(assetCount[0].count) > 0 || !existsSync(sqlitePath)) {
    await db.execute('INSERT INTO schema_migrations (name) VALUES (?)', ['sqlite_to_mysql_v1']);
    return;
  }

  const sqlite = new Database(sqlitePath, { readonly: true });
  try {
    const users = sqlite.prepare(`
      SELECT id, email, password_hash, name, created_at, trial_started_at, plan, plan_expires_at
      FROM users
      ORDER BY id
    `).all();
    const assets = sqlite.prepare(`
      SELECT id, user_id, ticker, type, qty, buy_price, buy_date, created_at
      FROM assets
      ORDER BY id
    `).all();

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      for (const user of users) {
        await connection.execute(`
          INSERT INTO users
            (id, email, password_hash, name, created_at, trial_started_at, plan, plan_expires_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          user.id,
          user.email,
          user.password_hash,
          user.name,
          user.created_at,
          user.trial_started_at,
          user.plan,
          user.plan_expires_at
        ]);
      }

      for (const asset of assets) {
        await connection.execute(`
          INSERT INTO assets (id, user_id, ticker, type, qty, buy_price, buy_date, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          asset.id,
          asset.user_id,
          asset.ticker,
          asset.type,
          asset.qty,
          asset.buy_price,
          asset.buy_date,
          asset.created_at
        ]);
      }

      await connection.execute('INSERT INTO schema_migrations (name) VALUES (?)', ['sqlite_to_mysql_v1']);
      await connection.commit();
      console.log(`Migrated ${users.length} users and ${assets.length} assets from SQLite.`);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } finally {
    sqlite.close();
  }
};

export const initDb = async () => {
  if (!db) {
    db = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      dateStrings: true
    });
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      trial_started_at VARCHAR(40),
      plan VARCHAR(50) DEFAULT 'trial',
      plan_expires_at VARCHAR(40)
    ) ENGINE=InnoDB
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS assets (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      ticker VARCHAR(32) NOT NULL,
      type VARCHAR(64),
      qty DOUBLE,
      buy_price DOUBLE,
      buy_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_assets_user_id FOREIGN KEY (user_id) REFERENCES users(id)
    ) ENGINE=InnoDB
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      token CHAR(64) NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      used TINYINT(1) NOT NULL DEFAULT 0,
      CONSTRAINT fk_password_resets_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(100) NOT NULL PRIMARY KEY,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS mercadopago_webhook_events (
      event_id VARCHAR(255) NOT NULL PRIMARY KEY,
      processed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  await migrateSqliteData();
};

export const getUserByEmail = async (email) => {
  const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
};

export const createUser = async ({ name, email, passwordHash, trialStartedAt, plan = 'trial', planExpiresAt }) => {
  try {
    const [result] = await db.execute(`
      INSERT INTO users (name, email, password_hash, trial_started_at, plan, plan_expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, email, passwordHash, trialStartedAt, plan, planExpiresAt]);
    return getUserById(result.insertId);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') error.code = 'SQLITE_CONSTRAINT_UNIQUE';
    throw error;
  }
};

export const getUserById = async (id) => {
  const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0];
};

export const createPasswordReset = async (userId, tokenHash, expiresAt) => {
  await db.execute(
    'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, tokenHash, expiresAt]
  );
};

export const resetPasswordWithToken = async (tokenHash, passwordHash) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [resetRows] = await connection.execute(`
      SELECT id, user_id
      FROM password_resets
      WHERE token = ? AND used = 0 AND expires_at > ?
      LIMIT 1
      FOR UPDATE
    `, [tokenHash, new Date()]);
    const reset = resetRows[0];
    if (!reset) {
      await connection.rollback();
      return false;
    }

    const [userResult] = await connection.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, reset.user_id]
    );
    if (userResult.affectedRows === 0) {
      await connection.rollback();
      return false;
    }

    const [resetResult] = await connection.execute(
      'UPDATE password_resets SET used = 1 WHERE id = ? AND used = 0',
      [reset.id]
    );
    if (resetResult.affectedRows === 0) {
      await connection.rollback();
      return false;
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const updateUserPlan = async (userId, planExpiresAt) => {
  const [result] = await db.execute(
    'UPDATE users SET plan = ?, plan_expires_at = ? WHERE id = ?',
    ['pro', planExpiresAt, userId]
  );
  return result.affectedRows > 0;
};

export const activateUserPlanFromWebhook = async (eventId, userId, planExpiresAt) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [eventResult] = await connection.execute(
      'INSERT IGNORE INTO mercadopago_webhook_events (event_id) VALUES (?)',
      [eventId]
    );
    if (eventResult.affectedRows === 0) {
      await connection.commit();
      return { duplicate: true, updated: false };
    }

    const [userResult] = await connection.execute(
      'UPDATE users SET plan = ?, plan_expires_at = ? WHERE id = ?',
      ['pro', planExpiresAt, userId]
    );
    if (userResult.affectedRows === 0) {
      await connection.rollback();
      return { duplicate: false, updated: false };
    }

    await connection.commit();
    return { duplicate: false, updated: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const getAssetsByUserId = async (userId) => {
  const [rows] = await db.execute(`
    SELECT id, user_id, ticker, type, qty, buy_price, buy_date, created_at
    FROM assets
    WHERE user_id = ?
    ORDER BY id
  `, [userId]);
  return rows;
};

export const getAssetById = async (assetId) => {
  const [rows] = await db.execute(`
    SELECT id, user_id, ticker, type, qty, buy_price, buy_date, created_at
    FROM assets
    WHERE id = ?
  `, [assetId]);
  return rows[0];
};

export const createAsset = async ({ userId, ticker, type, qty, buyPrice, buyDate }) => {
  const [result] = await db.execute(`
    INSERT INTO assets (user_id, ticker, type, qty, buy_price, buy_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [userId, ticker, type, qty, buyPrice, buyDate]);
  return getAssetById(result.insertId);
};

export const updateAssetById = async (assetId, { ticker, type, qty, buyPrice, buyDate }) => {
  await db.execute(`
    UPDATE assets
    SET ticker = ?, type = ?, qty = ?, buy_price = ?, buy_date = ?
    WHERE id = ?
  `, [ticker, type, qty, buyPrice, buyDate, assetId]);
  return getAssetById(assetId);
};

export const deleteAssetById = async (assetId) => {
  const [result] = await db.execute('DELETE FROM assets WHERE id = ?', [assetId]);
  return result;
};

export const deleteUserAndAssets = async (userId) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('DELETE FROM assets WHERE user_id = ?', [userId]);
    const [userResult] = await connection.execute('DELETE FROM users WHERE id = ?', [userId]);
    await connection.commit();
    return userResult.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};