import Database from "better-sqlite3";

export interface Post {
  uri: string;
  cid: string;
  author: string;
  text: string;
  createdAt: string;
  isReply: boolean;
  operation: string;
  timestamp: number;
}

export interface ThreadGate {
  uri: string;
  cid: string;
  author: string;
  post: string;
  hasRules: boolean;
  hasNobodyCanReply: boolean;
  hasMentionRule: boolean;
  hasFollowingRule: boolean;
  hasFollowerRule: boolean;
  hasListRule: boolean;
  hasHiddenPostsOnly: boolean;
  operation: string;
  timestamp: number;
}

export interface PostGate {
  uri: string;
  cid: string;
  author: string;
  post: string;
  operation: string;
  timestamp: number;
}

export class DB {
  private db: Database.Database;

  constructor(path: string = ":memory:") {
    this.db = new Database(path);
    this.init();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        uri TEXT PRIMARY KEY,
        cid TEXT NOT NULL,
        author TEXT NOT NULL,
        text TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        isReply INTEGER NOT NULL DEFAULT 0,
        operation TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author);
      CREATE INDEX IF NOT EXISTS idx_posts_timestamp ON posts(timestamp);
      CREATE INDEX IF NOT EXISTS idx_posts_isReply ON posts(isReply);

      CREATE TABLE IF NOT EXISTS threadgates (
        uri TEXT PRIMARY KEY,
        cid TEXT NOT NULL,
        author TEXT NOT NULL,
        post TEXT NOT NULL,
        hasRules INTEGER NOT NULL DEFAULT 0,
        hasNobodyCanReply INTEGER NOT NULL DEFAULT 0,
        hasMentionRule INTEGER NOT NULL DEFAULT 0,
        hasFollowingRule INTEGER NOT NULL DEFAULT 0,
        hasFollowerRule INTEGER NOT NULL DEFAULT 0,
        hasListRule INTEGER NOT NULL DEFAULT 0,
        hasHiddenPostsOnly INTEGER NOT NULL DEFAULT 0,
        operation TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_threadgates_post ON threadgates(post);
      CREATE INDEX IF NOT EXISTS idx_threadgates_timestamp ON threadgates(timestamp);

      CREATE TABLE IF NOT EXISTS postgates (
        uri TEXT PRIMARY KEY,
        cid TEXT NOT NULL,
        author TEXT NOT NULL,
        post TEXT NOT NULL,
        operation TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_postgates_post ON postgates(post);
      CREATE INDEX IF NOT EXISTS idx_postgates_timestamp ON postgates(timestamp);
    `);

    // Migration: Add isReply column if it doesn't exist
    const postColumns = this.db.pragma("table_info(posts)") as Array<{
      name: string;
    }>;
    const hasIsReply = postColumns.some((col) => col.name === "isReply");
    if (!hasIsReply) {
      this.db.exec(`
        ALTER TABLE posts ADD COLUMN isReply INTEGER NOT NULL DEFAULT 0;
        CREATE INDEX IF NOT EXISTS idx_posts_isReply ON posts(isReply);
      `);
    }

    // Migration: Add rule columns to threadgates if they don't exist
    const threadgateColumns = this.db.pragma(
      "table_info(threadgates)",
    ) as Array<{ name: string }>;
    const hasRulesColumns = threadgateColumns.some(
      (col) => col.name === "hasRules",
    );
    if (!hasRulesColumns) {
      this.db.exec(`
        ALTER TABLE threadgates ADD COLUMN hasRules INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE threadgates ADD COLUMN hasMentionRule INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE threadgates ADD COLUMN hasFollowingRule INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE threadgates ADD COLUMN hasFollowerRule INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE threadgates ADD COLUMN hasListRule INTEGER NOT NULL DEFAULT 0;
      `);
    }

    // Migration: Add hasHiddenPostsOnly column if it doesn't exist
    const hasHiddenPostsOnly = threadgateColumns.some(
      (col) => col.name === "hasHiddenPostsOnly",
    );
    if (!hasHiddenPostsOnly) {
      this.db.exec(`
        ALTER TABLE threadgates ADD COLUMN hasHiddenPostsOnly INTEGER NOT NULL DEFAULT 0;
      `);
    }

    // Migration: Add hasNobodyCanReply column if it doesn't exist
    const hasNobodyCanReply = threadgateColumns.some(
      (col) => col.name === "hasNobodyCanReply",
    );
    if (!hasNobodyCanReply) {
      this.db.exec(`
        ALTER TABLE threadgates ADD COLUMN hasNobodyCanReply INTEGER NOT NULL DEFAULT 0;
      `);
    }
  }

  insertPost(post: Post) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO posts (uri, cid, author, text, createdAt, isReply, operation, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      post.uri,
      post.cid,
      post.author,
      post.text,
      post.createdAt,
      post.isReply ? 1 : 0,
      post.operation,
      post.timestamp,
    );
  }

  insertThreadGate(threadgate: ThreadGate) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO threadgates (uri, cid, author, post, hasRules, hasNobodyCanReply, hasMentionRule, hasFollowingRule, hasFollowerRule, hasListRule, hasHiddenPostsOnly, operation, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      threadgate.uri,
      threadgate.cid,
      threadgate.author,
      threadgate.post,
      threadgate.hasRules ? 1 : 0,
      threadgate.hasNobodyCanReply ? 1 : 0,
      threadgate.hasMentionRule ? 1 : 0,
      threadgate.hasFollowingRule ? 1 : 0,
      threadgate.hasFollowerRule ? 1 : 0,
      threadgate.hasListRule ? 1 : 0,
      threadgate.hasHiddenPostsOnly ? 1 : 0,
      threadgate.operation,
      threadgate.timestamp,
    );
  }

  insertPostGate(postgate: PostGate) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO postgates (uri, cid, author, post, operation, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      postgate.uri,
      postgate.cid,
      postgate.author,
      postgate.post,
      postgate.operation,
      postgate.timestamp,
    );
  }

  getPostCount(): number {
    const stmt = this.db.prepare(
      `SELECT COUNT(*) as count FROM posts WHERE operation = 'create'`,
    );
    return (stmt.get() as { count: number }).count;
  }

  getThreadGateCount(): number {
    const stmt = this.db.prepare(
      `SELECT COUNT(*) as count FROM threadgates WHERE operation = 'create'`,
    );
    return (stmt.get() as { count: number }).count;
  }

  getPostGateCount(): number {
    const stmt = this.db.prepare(
      `SELECT COUNT(*) as count FROM postgates WHERE operation = 'create'`,
    );
    return (stmt.get() as { count: number }).count;
  }

  getTopLevelPostCount(): number {
    const stmt = this.db.prepare(
      `SELECT COUNT(*) as count FROM posts WHERE operation = 'create' AND isReply = 0`,
    );
    return (stmt.get() as { count: number }).count;
  }

  getTopLevelPostsWithThreadGateCount(): number {
    const stmt = this.db.prepare(`
      SELECT COUNT(DISTINCT p.uri) as count
      FROM posts p
      INNER JOIN threadgates tg ON p.uri = tg.post
      WHERE p.operation = 'create' AND p.isReply = 0 AND tg.operation = 'create' AND tg.hasRules = 1
    `);
    return (stmt.get() as { count: number }).count;
  }

  getThreadGateWithRulesCount(): number {
    const stmt = this.db.prepare(
      `SELECT COUNT(*) as count FROM threadgates WHERE operation = 'create' AND hasRules = 1`,
    );
    return (stmt.get() as { count: number }).count;
  }

  getThreadGateRuleStats(): {
    nobodyCanReply: number;
    mentionRule: number;
    followingRule: number;
    followerRule: number;
    listRule: number;
    hiddenPostsOnly: number;
  } {
    const stmt = this.db.prepare(`
      SELECT
        SUM(hasNobodyCanReply) as nobodyCanReply,
        SUM(hasMentionRule) as mentionRule,
        SUM(hasFollowingRule) as followingRule,
        SUM(hasFollowerRule) as followerRule,
        SUM(hasListRule) as listRule,
        SUM(hasHiddenPostsOnly) as hiddenPostsOnly
      FROM threadgates
      WHERE operation = 'create'
    `);
    return stmt.get() as {
      nobodyCanReply: number;
      mentionRule: number;
      followingRule: number;
      followerRule: number;
      listRule: number;
      hiddenPostsOnly: number;
    };
  }

  getRulesPerThreadGateDistribution(): {
    zero: number;
    one: number;
    two: number;
    three: number;
    four: number;
  } {
    const stmt = this.db.prepare(`
      SELECT
        SUM(CASE WHEN (hasMentionRule + hasFollowingRule + hasFollowerRule + hasListRule) = 0 THEN 1 ELSE 0 END) as zero,
        SUM(CASE WHEN (hasMentionRule + hasFollowingRule + hasFollowerRule + hasListRule) = 1 THEN 1 ELSE 0 END) as one,
        SUM(CASE WHEN (hasMentionRule + hasFollowingRule + hasFollowerRule + hasListRule) = 2 THEN 1 ELSE 0 END) as two,
        SUM(CASE WHEN (hasMentionRule + hasFollowingRule + hasFollowerRule + hasListRule) = 3 THEN 1 ELSE 0 END) as three,
        SUM(CASE WHEN (hasMentionRule + hasFollowingRule + hasFollowerRule + hasListRule) = 4 THEN 1 ELSE 0 END) as four
      FROM threadgates
      WHERE operation = 'create' AND hasNobodyCanReply = 0
    `);
    return stmt.get() as {
      zero: number;
      one: number;
      two: number;
      three: number;
      four: number;
    };
  }

  getTopRuleCombinations(limit: number = 10): Array<{
    combination: string;
    count: number;
  }> {
    const stmt = this.db.prepare(`
      SELECT
        CASE
          WHEN hasNobodyCanReply = 1 THEN 'Nobody Can Reply'
          WHEN hasMentionRule = 0 AND hasFollowingRule = 0 AND hasFollowerRule = 0 AND hasListRule = 0 THEN 'None'
          ELSE
            (CASE WHEN hasMentionRule = 1 THEN 'Mention' ELSE '' END) ||
            (CASE WHEN hasMentionRule = 1 AND (hasFollowingRule = 1 OR hasFollowerRule = 1 OR hasListRule = 1) THEN ' + ' ELSE '' END) ||
            (CASE WHEN hasFollowingRule = 1 THEN 'Following' ELSE '' END) ||
            (CASE WHEN hasFollowingRule = 1 AND (hasFollowerRule = 1 OR hasListRule = 1) THEN ' + ' ELSE '' END) ||
            (CASE WHEN hasFollowerRule = 1 THEN 'Follower' ELSE '' END) ||
            (CASE WHEN hasFollowerRule = 1 AND hasListRule = 1 THEN ' + ' ELSE '' END) ||
            (CASE WHEN hasListRule = 1 THEN 'List' ELSE '' END)
        END as combination,
        COUNT(*) as count
      FROM threadgates
      WHERE operation = 'create'
      GROUP BY combination
      ORDER BY count DESC
      LIMIT ?
    `);
    return stmt.all(limit) as Array<{
      combination: string;
      count: number;
    }>;
  }

  getHistoricalStats(limit: number = 20): Array<{
    timestamp: number;
    posts: number;
    threadgates: number;
    postgates: number;
    topLevelPosts: number;
    topLevelPostsWithThreadGate: number;
  }> {
    // Get timestamps distributed across the data range
    const stmt = this.db.prepare(`
      WITH timestamp_range AS (
        SELECT
          MIN(timestamp) as min_ts,
          MAX(timestamp) as max_ts
        FROM posts
        WHERE operation = 'create'
      ),
      time_buckets AS (
        SELECT
          min_ts + (max_ts - min_ts) * value / ? as bucket_timestamp
        FROM (
          SELECT 0 as value UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL
          SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL
          SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL
          SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL
          SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19
        ), timestamp_range
      )
      SELECT
        tb.bucket_timestamp as timestamp,
        (SELECT COUNT(*) FROM posts WHERE operation = 'create' AND timestamp <= tb.bucket_timestamp) as posts,
        (SELECT COUNT(*) FROM threadgates WHERE operation = 'create' AND timestamp <= tb.bucket_timestamp) as threadgates,
        (SELECT COUNT(*) FROM postgates WHERE operation = 'create' AND timestamp <= tb.bucket_timestamp) as postgates,
        (SELECT COUNT(*) FROM posts WHERE operation = 'create' AND isReply = 0 AND timestamp <= tb.bucket_timestamp) as topLevelPosts,
        (SELECT COUNT(DISTINCT p.uri)
         FROM posts p
         INNER JOIN threadgates tg ON p.uri = tg.post
         WHERE p.operation = 'create' AND p.isReply = 0 AND tg.operation = 'create' AND tg.hasRules = 1
         AND p.timestamp <= tb.bucket_timestamp AND tg.timestamp <= tb.bucket_timestamp) as topLevelPostsWithThreadGate
      FROM time_buckets tb
      ORDER BY timestamp
    `);

    return stmt.all(limit - 1) as Array<{
      timestamp: number;
      posts: number;
      threadgates: number;
      postgates: number;
      topLevelPosts: number;
      topLevelPostsWithThreadGate: number;
    }>;
  }

  close() {
    this.db.close();
  }
}
