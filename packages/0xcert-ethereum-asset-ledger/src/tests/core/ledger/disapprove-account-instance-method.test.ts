import { Spec } from '@specron/spec';
import { GenericProvider } from '@0xcert/ethereum-generic-provider';
import { OrderGateway } from '@0xcert/ethereum-order-gateway';
import { Protocol } from '@0xcert/ethereum-sandbox';
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
  stage.set('ledger', new AssetLedger(provider, ledgerId));
});

spec.before(async (stage) => {
  const xcert = stage.get('protocol').xcert;
  const coinbase = stage.get('coinbase');
  await xcert.instance.methods.mint(coinbase, '1', '0x973124ffc4a03e66d6a4458e587d5d6146f71fc57f359c8d516e0b12a50ab0d9').send({ from: coinbase });
});

spec.test('disapproves account for token transfer', async (ctx) => {
  const xcert = ctx.get('protocol').xcert;
  const bob = ctx.get('bob');
  const ledger = ctx.get('ledger');
  await xcert.instance.methods.approve(bob, '1').send({  })
  await ledger.disapproveAccount('1');
  ctx.is(await xcert.instance.methods.getApproved('1').call(), '0x0000000000000000000000000000000000000000');
});

export default spec;
