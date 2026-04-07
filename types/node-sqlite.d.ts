declare module "node:sqlite" {
  type SQLValue = null | string | number | bigint | NodeJS.ArrayBufferView;
  type SQLParameters = Record<string, SQLValue>;

  interface StatementSync {
    run(parameters?: SQLParameters): unknown;
    get<T = Record<string, unknown>>(parameters?: SQLParameters): T | undefined;
    all<T = Record<string, unknown>>(parameters?: SQLParameters): T[];
  }

  interface DatabaseSyncOptions {
    enableForeignKeyConstraints?: boolean;
    open?: boolean;
    readOnly?: boolean;
  }

  class DatabaseSync {
    constructor(location: string, options?: DatabaseSyncOptions);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
