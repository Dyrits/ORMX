export default interface ITransactor<TTransaction> {
  transact<TResult>(callback: (transaction: TTransaction) => Promise<TResult>): Promise<TResult>;
}
