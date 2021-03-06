import { GenericProvider } from '@0xcert/ethereum-generic-provider';
import { OrderGateway } from '@0xcert/ethereum-order-gateway';
import { Protocol } from '@0xcert/ethereum-sandbox';
import { Spec } from '@specron/spec';
import { AssetLedger } from '../../../core/ledger';

const spec = new Spec<{
  provider: GenericProvider;
  ledger: AssetLedger;
  gateway: OrderGateway;
  protocol: Protocol;
  bob: string;
  coinbase: string;
}>();

spec.before(async (stage) => {
  const protocol = new Protocol(stage.web3);
  stage.set('protocol', await protocol.deploy());
});

spec.before(async (stage) => {
  const provider = new GenericProvider({
    client: stage.web3,
    accountId: await stage.web3.eth.getCoinbase(),
  });
  stage.set('provider', provider);
});

spec.before(async (stage) => {
  const accounts = await stage.web3.eth.getAccounts();
  stage.set('coinbase', accounts[0]);
  stage.set('bob', accounts[1]);
});

spec.before(async (stage) => {
  const provider = stage.get('provider');
  const ledgerId = stage.get('protocol').xcert.instance.options.address;
  const orderGatewayId = stage.get('protocol').orderGateway.instance.options.address;
  stage.set('ledger', new AssetLedger(provider, ledgerId));
  stage.set('gateway', new OrderGateway(provider, orderGatewayId));
});

spec.test('approves operator', async (ctx) => {
  const xcert = ctx.get('protocol').xcert;
  const bob = ctx.get('bob');
  const coinbase = ctx.get('coinbase');
  const ledger = ctx.get('ledger');
  await ledger.approveOperator(bob);
  ctx.true(await xcert.instance.methods.isApprovedForAll(coinbase, bob).call());
});

spec.test('approves order gateway proxy as operator', async (ctx) => {
  const xcert = ctx.get('protocol').xcert;
  const ledger = ctx.get('ledger');
  const gateway = ctx.get('gateway');
  const coinbase = ctx.get('coinbase');
  const proxyId = ctx.get('protocol').nftokenSafeTransferProxy.instance.options.address;
  await ledger.approveOperator(gateway);
  ctx.true(await xcert.instance.methods.isApprovedForAll(coinbase, proxyId).call());
});

export default spec;
