declare module "better-sqlite3" {
  interface Statement<Result = unknown> {
    get(...params: unknown[]): Result;
    run(...params: unknown[]): unknown;
  }

  interface Database {
    prepare<Result = unknown>(sql: string): Statement<Result>;
    transaction<T extends (...args: never[]) => unknown>(fn: T): T;
    exec(sql: string): this;
    pragma(source: string): unknown;
    close(): void;
  }

  interface DatabaseConstructor {
    new (filename: string): Database;
  }

  const Database: DatabaseConstructor;
  export default Database;
}
