import eventsIn from '../helpers/eventsIn';

const UsesBorrower = artifacts.require('./UsesBorrowerImpl.sol');
const Borrower = artifacts.require('./Borrower.sol');
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

const contractVersion = 1;

contract('UsesBorrower', function (accounts) {
  const [,
    nonOwner, owner,
  ] = accounts;

  let usesBorrower;
  let borrower;

  beforeEach(async function () {
    usesBorrower = await UsesBorrower.new({ from: owner });
    borrower = await Borrower.new(contractVersion, { from: owner });
  });

  describe('Setting Borrower', async function () {
    it('sets Borrower contract', async function () {
      await usesBorrower.setBorrowerContractAddress(borrower.address, { from: owner }).should.be.fulfilled;
    });

    it('emits an event on setting a borrower', async function () {
      const events = await eventsIn(usesBorrower.setBorrowerContractAddress(borrower.address, { from: owner }));
      events.should.deep.include({
        name: 'LogBorrowerSet',
        args: { borrowerContractAddress: borrower.address },
      });
    });

    it('reverts on setting Borrower contract by non owner', async function () {
      await usesBorrower.setBorrowerContractAddress(borrower.address, { from: nonOwner }).should.be.rejectedWith('revert');
    });
  });

  describe('Getting Borrower', async function () {
    it('gets 0 for Borrower contract address as initial value', async function () {
      const borrowerAddress = await usesBorrower.getBorrowerContractAddress({ from: owner });
      borrowerAddress.should.be.bignumber.equal(0);
    });

    it('gets Borrower contract address after set', async function () {
      await usesBorrower.setBorrowerContractAddress(borrower.address, { from: owner }).should.be.fulfilled;
      const borrowerAddress = await usesBorrower.getBorrowerContractAddress({ from: owner });
      borrowerAddress.should.be.bignumber.equal(borrower.address);
    });
  });

  describe('Requiring Borrower contract to be set', async function () {
    it('can do somthing when borrower contract is set', async function () {
      await usesBorrower.setBorrowerContractAddress(borrower.address, { from: owner }).should.be.fulfilled;
      const result = await usesBorrower.doSomething({ from: owner }).should.be.fulfilled;
      result.should.be.true;
    });

    it('reverts on doing somthing when Borrower contract address is not set', async function () {
      await usesBorrower.doSomething({ from: owner }).should.be.rejectedWith('Borrower contract is not set');
    });
  });
});
