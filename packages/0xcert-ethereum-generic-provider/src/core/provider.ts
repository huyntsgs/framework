import { normalizeAddress } from '@0xcert/ethereum-utils';
import { ProviderBase, ProviderEvent } from '@0xcert/scaffold';
import { EventEmitter } from 'events';
import { parseError } from './errors';
import { RpcResponse, SendOptions, SignMethod } from './types';

/**
 * Configuration interface for generic provider.
 */
export interface GenericProviderOptions {

  /**
   * Default account from which all mutations are made.
   */
  accountId?: string;

  /**
   * RPC client instance (e.g. window.ethereum).
   */
  client?: any;

  /**
   * Type of signature that will be used in making claims etc.
   */
  signMethod?: SignMethod;

  /**
   * List of addresses where normal transfer not safeTransfer smart contract methods will be used.
   */
  unsafeRecipientIds?: string[];

  /**
   * Source where assetLedger compiled smart contract is located.
   */
  assetLedgerSource?: string;

  /**
   * Source where valueLedger compiled smart contract is located.
   */
  valueLedgerSource?: string;

  /**
   * Number of confirmations (blocks in blockchain after mutation is accepted) are necessary to mark a mutation complete.
   */
  requiredConfirmations?: number;

  /**
   * Id (address) of order gateway.
   */
  orderGatewayId?: string;
}

/**
 * Ethereum RPC client.
 */
export class GenericProvider extends EventEmitter implements ProviderBase {

  /**
   * Type of signature that will be used in making claims etc.
   */
  public signMethod: SignMethod;

  /**
   * Source where assetLedger compiled smart contract is located.
   */
  public assetLedgerSource: string;

  /**
   * Source where valueLedger compiled smart contract is located.
   */
  public valueLedgerSource: string;

  /**
   * Number of confirmations (blocks in blockchain after mutation is accepted) are necessary to mark a mutation complete.
   */
  public requiredConfirmations: number;

  /**
   * Id (address) of order gateway.
   */
  protected _orderGatewayId: string;

  /**
   * Default account from which all mutations are made.
   */
  protected _accountId: string;

  /**
   * List of addresses where normal transfer not safeTransfer smart contract methods will be used.
   */
  protected _unsafeRecipientIds: string[];

  /**
   * RPC client instance (e.g. window.ethereum).
   */
  protected _client: any;

  /**
   * Unique request number.
   */
  protected _id = 0;

  /**
   * Class constructor.
   * @param options.client RPC client instance (e.g. window.ethereum).
   * @param options.accountId Coinbase address.
   */
  public constructor(options: GenericProviderOptions) {
    super();
    this.accountId = options.accountId;
    this.orderGatewayId = options.orderGatewayId;
    this.unsafeRecipientIds = options.unsafeRecipientIds;
    this.assetLedgerSource = options.assetLedgerSource || 'https://docs.0xcert.org/xcert-mock.json';
    this.valueLedgerSource = options.valueLedgerSource || 'https://docs.0xcert.org/token-mock.json';
    this.signMethod = typeof options.signMethod !== 'undefined' ? options.signMethod : SignMethod.ETH_SIGN;
    this.requiredConfirmations = typeof options.requiredConfirmations !== 'undefined' ? options.requiredConfirmations : 1;

    this._client = options.client && options.client.currentProvider
      ? options.client.currentProvider
      : options.client;
  }

  /**
   * Returns account ID (address).
   */
  public get accountId() {
    return this._accountId || null;
  }

  /**
   * Sets and normalizes account ID.
   */
  public set accountId(id: string) {
    this.emit(ProviderEvent.ACCOUNT_CHANGE, id); // must be before the new account is set
    this._accountId = normalizeAddress(id);
  }

  /**
   * Returns unsafe recipient IDs (addresses).
   */
  public get unsafeRecipientIds() {
    return this._unsafeRecipientIds || [];
  }

  /**
   * Sets and normalizes unsafe recipient IDs.
   */
  public set unsafeRecipientIds(ids: string[]) {
    this._unsafeRecipientIds = (ids || []).map((id) => normalizeAddress(id));
  }

  /**
   * Returns order gateway ID (address).
   */
  public get orderGatewayId(): string {
    return this._orderGatewayId || null;
  }

  /**
   * Sets and normalizes account ID.
   */
  public set orderGatewayId(id: string) {
    this._orderGatewayId = normalizeAddress(id);
  }

  /**
   * Emits provider event.
   */
  public emit(event: ProviderEvent.ACCOUNT_CHANGE, accountId: string);
  public emit(event: ProviderEvent.NETWORK_CHANGE, networkVersion: string);
  public emit(...args) {
    super.emit.call(this, ...args);
    return this;
  }

  /**
   * Attaches on provider events.
   */
  public on(event: ProviderEvent.ACCOUNT_CHANGE, handler: (accountId: string) => any);
  public on(event: ProviderEvent.NETWORK_CHANGE, handler: (networkVersion: string) => any);
  public on(...args) {
    super.on.call(this, ...args);
    return this;
  }

  /**
   * Once handler.
   */
  public once(event: ProviderEvent.ACCOUNT_CHANGE, handler: (accountId: string) => any);
  public once(event: ProviderEvent.NETWORK_CHANGE, handler: (networkVersion: string) => any);
  public once(...args) {
    super.once.call(this, ...args);
    return this;
  }

  /**
   * Dettaches from provider events.
   */
  public off(event: ProviderEvent.ACCOUNT_CHANGE, handler: (accountId: string) => any);
  public off(event: ProviderEvent.NETWORK_CHANGE, handler: (networkVersion: string) => any);
  public off(event: ProviderEvent);
  public off(event, handler?) {
    if (handler) {
      super.off(event, handler);
    } else {
      super.removeAllListeners(event);
    }
    return this;
  }

  /**
   * Returns current network type (e.g. '3' for ropsten).
   */
  public async getNetworkVersion(): Promise<string> {
    const res = await this.post({
      method: 'net_version',
      params: [],
    });
    return res.result;
  }

  /**
   * Sends a raw request to the JSON RPC serveer.
   * @param options.method RPC procedure name.
   * @param options.params RPC procedure parameters.
   * @param options.id RPC request identifier.
   * @param options.jsonrpc RPC protocol version.
   * @see https://github.com/ethereum/wiki/wiki/JSON-RPC
   */
  public async post(options: SendOptions): Promise<RpcResponse> {
    const payload = { ...options };

    // TODO: test if error throwing works on ropsten or do we need to check if
    // the resulting gas amount is the same as block gas amount => revert.
    if (payload.method === 'eth_sendTransaction' && payload.params.length) {

      if (typeof payload.params[0].gas === 'undefined') {
        const res = await this.request({
          ...payload,
          method: 'eth_estimateGas',
        });
        // estimate gas is sometimes inaccurate (depends on the node). So to be
        // sure we have enough gas, we multiply result with a factor.
        payload.params[0].gas = `0x${Math.ceil(res.result * 1.1).toString(16)}`;
      }

      if (typeof payload.params[0].gasPrice === 'undefined') {
        const res = await this.request({
          ...payload,
          method: 'eth_gasPrice',
          params: [],
        });
        // TODO: get multiplyer from provider settings
        payload.params[0].gasPrice = `0x${Math.ceil(res.result * 1.1).toString(16)}`;
      }
    }

    return this.request(payload);
  }

  /**
   * Sends a raw request to the JSON RPC serveer.
   * @param options.method RPC procedure name.
   * @param options.params RPC procedure parameters.
   * @param options.id RPC request identifier.
   * @param options.jsonrpc RPC protocol version.
   * @see https://github.com/ethereum/wiki/wiki/JSON-RPC
   */
  protected async request(options: SendOptions) {
    const payload = {
      jsonrpc: '2.0',
      id: options.id || this.getNextId(),
      params: [],
      ...options,
    };
    return new Promise<RpcResponse>((resolve, reject) => {
      this._client.send(payload, (err, res) => {
        if (err) { // client error
          return reject(err);
        } else if (res.error) { // RPC error
          return reject(res.error);
        } else if (res.id !== payload.id) { // anomaly
          return reject('Invalid RPC id');
        }
        return resolve(res);
      });
    }).catch((err) => {
      throw parseError(err);
    });
  }

  /**
   * Returns the next unique request number.
   */
  protected getNextId() {
    this._id++;
    return this._id;
  }

}
