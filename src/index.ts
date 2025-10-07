import "dotenv/config";

import { Ingestor } from "./ingestor.js";
import { DB } from "./db.js";
import { createServer } from "./server.js";

const ingestor = new Ingestor({
  wantedCollections: [
    "app.bsky.feed.post",
    "app.bsky.feed.threadgate",
    "app.bsky.feed.postgate",
  ],
});

const db = new DB(process.env.DB_PATH);
const app = createServer(db);
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

ingestor.jetstream.on("commit", (event) => {
  switch (event.commit.collection) {
    case "app.bsky.feed.post":
      if (event.commit.operation === "create") {
        const record = event.commit.record as any;
        if (record?.$type === "app.bsky.feed.post") {
          db.insertPost({
            uri: `at://${event.did}/${event.commit.collection}/${event.commit.rkey}`,
            cid: event.commit.cid,
            author: event.did,
            text: record.text || "",
            createdAt: record.createdAt || new Date().toISOString(),
            isReply: !!record.reply,
            operation: event.commit.operation,
            timestamp: event.time_us,
          });
        }
      }
      break;

    case "app.bsky.feed.threadgate":
      if (event.commit.operation === "create") {
        const record = event.commit.record as any;
        if (record?.$type === "app.bsky.feed.threadgate") {
          const allow = record.allow;
          const hasAllowField = allow !== undefined && allow !== null;
          const hasRules = hasAllowField && allow.length > 0;
          const hasNobodyCanReply = hasAllowField && allow.length === 0;

          const hasMentionRule = hasRules && allow.some(
            (rule: any) =>
              rule.$type === "app.bsky.feed.threadgate#mentionRule",
          );
          const hasFollowingRule = hasRules && allow.some(
            (rule: any) =>
              rule.$type === "app.bsky.feed.threadgate#followingRule",
          );
          const hasFollowerRule = hasRules && allow.some(
            (rule: any) =>
              rule.$type === "app.bsky.feed.threadgate#followerRule",
          );
          const hasListRule = hasRules && allow.some(
            (rule: any) => rule.$type === "app.bsky.feed.threadgate#listRule",
          );

          // Check if only has hiddenReplies and no other rules
          const hasHiddenReplies = record.hiddenReplies && record.hiddenReplies.length > 0;
          const hasHiddenPostsOnly = hasHiddenReplies && !hasRules && !hasNobodyCanReply;

          db.insertThreadGate({
            uri: `at://${event.did}/${event.commit.collection}/${event.commit.rkey}`,
            cid: event.commit.cid,
            author: event.did,
            post: record.post || "",
            hasRules,
            hasNobodyCanReply,
            hasMentionRule,
            hasFollowingRule,
            hasFollowerRule,
            hasListRule,
            hasHiddenPostsOnly,
            operation: event.commit.operation,
            timestamp: event.time_us,
          });
        }
      }
      break;

    case "app.bsky.feed.postgate":
      if (event.commit.operation === "create") {
        const record = event.commit.record as any;
        if (record?.$type === "app.bsky.feed.postgate") {
          db.insertPostGate({
            uri: `at://${event.did}/${event.commit.collection}/${event.commit.rkey}`,
            cid: event.commit.cid,
            author: event.did,
            post: record.post || "",
            operation: event.commit.operation,
            timestamp: event.time_us,
          });
        }
      }
      break;
  }
});

ingestor.start();

process.on("exit", () => {
  ingestor.close();
  db.close();
});
