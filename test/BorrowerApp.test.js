import eventsIn from './helpers/eventsIn';
const BorrowerApp = artifacts.require('./BorrowerApp.sol');
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

const contractVersion = 1;

contract('BorrowerApp', function (accounts) {
  const [owner, nonOwner, someBorrowerAppAdress, otherBorrowerAppAdress] = accounts;
  let borrowerApp;
  const someBorrowerApp = {
    id: someBorrowerAppAdress,
    name: 'BORROWER1',
  };
  const otherBorrowerApp = {
    id: otherBorrowerAppAdress,
    name: 'BORROWER2',
  };

  beforeEach(async function () {
    borrowerApp = await BorrowerApp.new(contractVersion, { from: owner });
  });

  describe('Register', async function () {
    it('add borrower app', async function () {
      await borrowerApp.add(someBorrowerApp.id, someBorrowerApp.name, { from: owner }).should.be.fulfilled;
    });

    it('emits an event after borrower app is successfuly added', async function () {
      const events = await eventsIn(borrowerApp.add(someBorrowerApp.id, someBorrowerApp.name, { from: owner }));
      events.should.deep.include({
        name: 'LogBorrowerAppAdded',
        args: { id: someBorrowerApp.id },
      });
    });

    it('reverts on adding borrower app with blank name', async function () {
      await borrowerApp.add(someBorrowerApp.id, '').should.be.rejectedWith('borrower app name cannot be null');
    });

    it('reverts on adding borrower app by non owner', async function () {
      await borrowerApp.add(someBorrowerApp.id, someBorrowerApp.name, { from: nonOwner }).should.be.rejectedWith('revert');
    });
  });

  describe('Retrieve', async function () {
    it('gets registered borrower app with id', async function () {
      await borrowerApp.add(someBorrowerApp.id, someBorrowerApp.name).should.be.fulfilled;
      const [someBorrowerAppId, someBorrowerAppName] = await borrowerApp.get(someBorrowerApp.id);
      someBorrowerAppId.should.be.equal(someBorrowerApp.id);
      someBorrowerAppName.should.be.equal(someBorrowerApp.name);
    });

    it('gets registered borrower app with index', async function () {
      await borrowerApp.add(someBorrowerApp.id, someBorrowerApp.name).should.be.fulfilled;
      const [someBorrowerAppId, someBorrowerAppName] = await borrowerApp.getByIndex(0);
      someBorrowerAppId.should.be.equal(someBorrowerApp.id);
      someBorrowerAppName.should.be.equal(someBorrowerApp.name);
    });

    it('gets how many borrower apps are registered', async function () {
      await borrowerApp.size().should.eventually.be.bignumber.equal(0);

      // get size after two borrower apps are registered
      const borrowerApps = [someBorrowerApp, otherBorrowerApp];
      await Promise.all(borrowerApps.map(({ id, name }) => borrowerApp.add(id, name)));
      await borrowerApp.size().should.eventually.be.bignumber.equal(borrowerApps.length);
    });

    it('gets all registered borrower app ids', async function () {
      await borrowerApp.getIds().should.eventually.be.empty;

      // get borrower app ids after two borrower apps are registered
      await borrowerApp.add(someBorrowerApp.id, someBorrowerApp.name);
      await borrowerApp.add(otherBorrowerApp.id, otherBorrowerApp.name);
      await borrowerApp.getIds().should.eventually.have.bignumber.ordered.members([someBorrowerApp.id, otherBorrowerApp.id]);
    });

    it('reverts on getting unregistered borrower app', async function () {
      await borrowerApp.get(someBorrowerApp.id).should.be.rejectedWith('borrower app not found');
      await borrowerApp.getByIndex(0).should.be.rejectedWith('borrower app index out of range');
    });

    it('reverts on getting borrower app by non owner', async function () {
      await borrowerApp.get(someBorrowerApp.id, { from: nonOwner }).should.be.rejectedWith('revert');
      await borrowerApp.getByIndex(0, { from: nonOwner }).should.be.rejectedWith('revert');
    });
  });

  describe('Modify', async function () {
    it('updates name of the registered borrwer app', async function () {
      await borrowerApp.add(someBorrowerApp.id, someBorrowerApp.name).should.be.fulfilled;
      await borrowerApp.update(someBorrowerApp.id, someBorrowerApp.name).should.be.fulfilled;
    });

    it('reverts on updating borrower app with blank name', async function () {
      await borrowerApp.update(someBorrowerApp.id, '').should.be.rejectedWith('borrower app name cannot be null');
    });

    it('reverts on updating unregistered borrower app', async function () {
      await borrowerApp.update(someBorrowerApp.id, someBorrowerApp.name).should.be.rejectedWith('borrower app not found');
    });

    it('reverts on updating borrower app by non owner', async function () {
      await borrowerApp.update(someBorrowerApp.id, someBorrowerApp.name, { from: nonOwner }).should.be.rejectedWith('revert');
    });
  });
});
