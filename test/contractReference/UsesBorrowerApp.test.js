import eventsIn from '../helpers/eventsIn';

const UsesBorrowerApp = artifacts.require('./UsesBorrowerAppImpl.sol');
const BorrowerApp = artifacts.require('./BorrowerApp.sol');
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

const contractVersion = 1;

contract('UsesBorrowerApp', function (accounts) {
  const [,
    nonOwner, owner,
  ] = accounts;

  let usesBorrowerApp;
  let borrowerApp;

  beforeEach(async function () {
    usesBorrowerApp = await UsesBorrowerApp.new({ from: owner });
    borrowerApp = await BorrowerApp.new(contractVersion, { from: owner });
  });

  describe('Setting BorrowerApp', async function () {
    it('sets BorrowerApp contract', async function () {
      await usesBorrowerApp.setBorrowerAppContractAddress(borrowerApp.address, { from: owner }).should.be.fulfilled;
    });

    it('emits an event on setting a borrowerApp', async function () {
      const events = await eventsIn(usesBorrowerApp.setBorrowerAppContractAddress(borrowerApp.address, { from: owner }));
      events.should.deep.include({
        name: 'LogBorrowerAppSet',
        args: { borrowerAppContractAddress: borrowerApp.address },
      });
    });

    it('reverts on setting BorrowerApp contract by non owner', async function () {
      await usesBorrowerApp.setBorrowerAppContractAddress(borrowerApp.address, { from: nonOwner }).should.be.rejectedWith('revert');
    });
  });

  describe('Getting BorrowerApp', async function () {
    it('gets 0 for BorrowerApp contract address as initial value', async function () {
      const borrowerAppAddress = await usesBorrowerApp.getBorrowerAppContractAddress({ from: owner });
      borrowerAppAddress.should.be.bignumber.equal(0);
    });

    it('gets BorrowerApp contract address after set', async function () {
      await usesBorrowerApp.setBorrowerAppContractAddress(borrowerApp.address, { from: owner }).should.be.fulfilled;
      const borrowerAppAddress = await usesBorrowerApp.getBorrowerAppContractAddress({ from: owner });
      borrowerAppAddress.should.be.bignumber.equal(borrowerApp.address);
    });
  });

  describe('Requiring BorrowerApp contract to be set', async function () {
    it('can do somthing when borrowerApp contract is set', async function () {
      await usesBorrowerApp.setBorrowerAppContractAddress(borrowerApp.address, { from: owner }).should.be.fulfilled;
      const result = await usesBorrowerApp.doSomething({ from: owner }).should.be.fulfilled;
      result.should.be.true;
    });

    it('reverts on doing somthing when BorrowerApp contract address is not set', async function () {
      await usesBorrowerApp.doSomething({ from: owner }).should.be.rejectedWith('BorrowerApp contract is not set');
    });
  });
});
