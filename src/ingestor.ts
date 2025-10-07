import { Jetstream, JetstreamOptions } from "@skyware/jetstream";

import fs from "node:fs";

export class Ingestor {
  jetstream: Jetstream;

  constructor(options?: JetstreamOptions) {
    this.jetstream = new Jetstream({ cursor: this.getCursor(), ...options });
  }

  start() {
    this.jetstream.start();
  }

  close() {
    this.saveCursor(this.jetstream.cursor);
    this.jetstream.close();
  }

  private getCursor() {
    if (!fs.existsSync("cursor.txt")) {
      fs.writeFileSync("cursor.txt", String(Date.now()));
    }

    return Number(fs.readFileSync("cursor.txt", "utf8"));
  }

  private saveCursor(cursor: number | undefined) {
    if (cursor) {
      fs.writeFileSync("cursor.txt", String(cursor));
    }
  }
}
