import eventsIn from '../helpers/eventsIn';

const UsesBorrowerScore = artifacts.require('./UsesBorrowerScoreImpl.sol');
const BorrowerScore = artifacts.require('./BorrowerScore.sol');
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

const contractVersion = 1;

contract('UsesBorrowerScore', function (accounts) {
  const [,
    nonOwner, owner,
  ] = accounts;

  let usesBorrowerScore;
  let borrowerScore;

  beforeEach(async function () {
    usesBorrowerScore = await UsesBorrowerScore.new({ from: owner });
    borrowerScore = await BorrowerScore.new(contractVersion, { from: owner });
  });

  describe('Setting BorrowerScore', async function () {
    it('sets BorrowerScore contract', async function () {
      await usesBorrowerScore.setBorrowerScoreContractAddress(borrowerScore.address, { from: owner }).should.be.fulfilled;
    });

    it('emits an event on setting a borrowerScore', async function () {
      const events = await eventsIn(usesBorrowerScore.setBorrowerScoreContractAddress(borrowerScore.address, { from: owner }));
      events.should.deep.include({
        name: 'LogBorrowerScoreSet',
        args: { borrowerScoreContractAddress: borrowerScore.address },
      });
    });

    it('reverts on setting BorrowerScore contract by non owner', async function () {
      await usesBorrowerScore.setBorrowerScoreContractAddress(borrowerScore.address, { from: nonOwner }).should.be.rejectedWith('revert');
    });
  });

  describe('Getting BorrowerScore', async function () {
    it('gets 0 for BorrowerScore contract address as initial value', async function () {
      const borrowerScoreAddress = await usesBorrowerScore.getBorrowerScoreContractAddress({ from: owner });
      borrowerScoreAddress.should.be.bignumber.equal(0);
    });

    it('gets BorrowerScore contract address after set', async function () {
      await usesBorrowerScore.setBorrowerScoreContractAddress(borrowerScore.address, { from: owner }).should.be.fulfilled;
      const borrowerScoreAddress = await usesBorrowerScore.getBorrowerScoreContractAddress({ from: owner });
      borrowerScoreAddress.should.be.bignumber.equal(borrowerScore.address);
    });
  });

  describe('Requiring BorrowerScore contract to be set', async function () {
    it('can do somthing when borrowerScore contract is set', async function () {
      await usesBorrowerScore.setBorrowerScoreContractAddress(borrowerScore.address, { from: owner }).should.be.fulfilled;
      const result = await usesBorrowerScore.doSomething({ from: owner }).should.be.fulfilled;
      result.should.be.true;
    });

    it('reverts on doing somthing when BorrowerScore contract address is not set', async function () {
      await usesBorrowerScore.doSomething({ from: owner }).should.be.rejectedWith('BorrowerScore contract is not set');
    });
  });
});
