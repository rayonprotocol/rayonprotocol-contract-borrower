import eventsIn from '../helpers/eventsIn';

const UsesAuth = artifacts.require('./UsesAuthImpl.sol');
const Auth = artifacts.require('./Auth.sol');
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

const contractVersion = 1;

contract('UsesAuth', function (accounts) {
  const [,
    nonOwner, owner,
  ] = accounts;

  let usesAuth;
  let auth;

  beforeEach(async function () {
    usesAuth = await UsesAuth.new({ from: owner });
    auth = await Auth.new(contractVersion, { from: owner });
  });

  describe('Setting Auth', async function () {
    it('sets Auth contract', async function () {
      await usesAuth.setAuthContractAddress(auth.address, { from: owner }).should.be.fulfilled;
    });

    it('emits an event on setting a auth', async function () {
      const events = await eventsIn(usesAuth.setAuthContractAddress(auth.address, { from: owner }));
      events.should.deep.include({
        name: 'LogAuthSet',
        args: { authContractAddress: auth.address },
      });
    });

    it('reverts on setting Auth contract by non owner', async function () {
      await usesAuth.setAuthContractAddress(auth.address, { from: nonOwner }).should.be.rejectedWith('revert');
    });
  });

  describe('Getting Auth', async function () {
    it('gets 0 for Auth contract address as initial value', async function () {
      const authAddress = await usesAuth.getAuthContractAddress({ from: owner });
      authAddress.should.be.bignumber.equal(0);
    });

    it('gets Auth contract address after set', async function () {
      await usesAuth.setAuthContractAddress(auth.address, { from: owner }).should.be.fulfilled;
      const authAddress = await usesAuth.getAuthContractAddress({ from: owner });
      authAddress.should.be.bignumber.equal(auth.address);
    });
  });

  describe('Requiring Auth contract to be set', async function () {
    it('can do somthing when auth contract is set', async function () {
      await usesAuth.setAuthContractAddress(auth.address, { from: owner }).should.be.fulfilled;
      const result = await usesAuth.doSomething({ from: owner }).should.be.fulfilled;
      result.should.be.true;
    });

    it('reverts on doing somthing when Auth contract address is not set', async function () {
      await usesAuth.doSomething({ from: owner }).should.be.rejectedWith('Auth contract is not set');
    });
  });
});
