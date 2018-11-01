import eventsIn from './helpers/eventsIn';
const BorrowerApp = artifacts.require('./BorrowerApp.sol');
const Borrower = artifacts.require('./Borrower.sol');
const Auth = artifacts.require('./AuthMock.sol');
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

const contractVersion = 1;

contract('Borrower', function (accounts) {
  const [,
    someBorrowerAppAdress, otherBorrowerAppAdress,
    borrowerAddress, otherBorrowerAddress,
    nonOwner, owner,
  ] = accounts;

  let borrower;

  const someBorrowerApp = {
    id: someBorrowerAppAdress,
    name: 'BORROWERAPP1',
  };

  // this signature is signed by borrowerAddress (m/44'/60'/0'/0/3)
  const someBorrowerSignature = {
    borrowerAppId: someBorrowerAppAdress,
    v: 27,
    r: '0x61c39bfd288c5383d905aba54236e00a2aabfd8e6ee31dc979b50402d0faffaa',
    s: '0x4034998569cef0e5b1dea1636af25df0a78938d37563725d8974b5fc47445630',
  };

  const otherBorrowerApp = {
    id: otherBorrowerAppAdress,
    name: 'BORROWERAPP2',
  };

  // this signature is signed by otherBorrowerAddress (m/44'/60'/0'/0/4)
  const otherBorrowerSignature = {
    borrowerAppId: otherBorrowerApp.id,
    v: 27,
    r: '0xbb10f0904349a499d81ba4afd416e6321f8a88490d1096ca5df75a91572a33f6',
    s: '0x4a93ed5f9cbfae6a103498cdcdac5451843ea62e3aee0ab5650c56a6e45a430d',
  };

  beforeEach(async function () {
    borrower = await Borrower.new(contractVersion, { from: owner });
  });

  describe('Register', async function () {
    let auth;
    let borrowerApp;

    beforeEach(async function () {
      auth = await Auth.new(contractVersion, { from: owner });
      borrowerApp = await BorrowerApp.new(contractVersion, { from: owner });
    });

    context('when both Auth and BorrowerApp contracts are set', async function () {
      beforeEach(async function () {
        await borrower.setAuthContractAddress(auth.address, { from: owner });
        await borrower.setBorrowerAppContractAddress(borrowerApp.address, { from: owner });
      });

      it('adds a borrower verifying signature', async function () {
        // authentication mocking
        await auth.mockSetContainingId(borrowerAddress);
        // borrower app registration
        await borrowerApp.add(someBorrowerApp.id, someBorrowerApp.name, { from: owner });
        const { borrowerAppId, v, r, s } = someBorrowerSignature;
        await borrower.add(borrowerAddress, v, r, s, { from: borrowerAppId }).should.be.fulfilled;
      });

      it('emits an event on adding a borrower', async function () {
        // authentication mocking
        await auth.mockSetContainingId(borrowerAddress);
        // borrower app registration
        await borrowerApp.add(someBorrowerApp.id, someBorrowerApp.name, { from: owner });
        const { borrowerAppId, v, r, s } = someBorrowerSignature;
        const events = await eventsIn(borrower.add(borrowerAddress, v, r, s, { from: borrowerAppId }));

        events.should.deep.include({
          name: 'LogBorrowerAdded',
          args: { id: borrowerAddress },
        });
      });

      it('reverts on adding an registered borrower', async function () {
        // authentication mocking
        await auth.mockSetContainingId(borrowerAddress);
        // borrower app registration
        await borrowerApp.add(someBorrowerApp.id, someBorrowerApp.name, { from: owner });
        const { borrowerAppId, v, r, s } = someBorrowerSignature;
        // borrower registration
        await borrower.add(borrowerAddress, v, r, s, { from: borrowerAppId }).should.be.fulfilled;
        // try borrower registration agin
        await borrower.add(borrowerAddress, v, r, s, { from: borrowerAppId }).should.be.rejectedWith('Borrower is already registered');
      });

      it('reverts on adding an unauthenticated borrower', async function () {
        // borrower app registration
        await borrowerApp.add(someBorrowerApp.id, someBorrowerApp.name, { from: owner });

        const { borrowerAppId, v, r, s } = someBorrowerSignature;
        await borrower.add(borrowerAddress, v, r, s, { from: borrowerAppId }).should.be.rejectedWith('Borrower is not authenticated');
      });

      it('reverts on adding an borrower with unregistred borrower app', async function () {
        // authentication mocking
        await auth.mockSetContainingId(borrowerAddress);

        const { borrowerAppId, v, r, s } = someBorrowerSignature;
        await borrower.add(borrowerAddress, v, r, s, { from: borrowerAppId }).should.be.rejectedWith('msg.sender is not registerd borrower app');
      });

      it('reverts on adding an borrower with invalid signature', async function () {
        // authentication mocking
        await auth.mockSetContainingId(borrowerAddress);
        // borrower app registration
        await borrowerApp.add(someBorrowerApp.id, someBorrowerApp.name, { from: owner });
        await borrowerApp.add(otherBorrowerApp.id, otherBorrowerApp.name, { from: owner });

        const borrowerWithUnmatchtedBorrowerAppArgs = [
          borrowerAddress, someBorrowerSignature.v, someBorrowerSignature.r, someBorrowerSignature.s, { from: otherBorrowerApp.id },
        ];
        const borrowerWithInvalidSignatureArgs = [
          borrowerAddress, otherBorrowerSignature.v, otherBorrowerSignature.r, otherBorrowerSignature.s, { from: someBorrowerApp.id },
        ];

        await borrower.add(...borrowerWithUnmatchtedBorrowerAppArgs).should.be.rejectedWith('Signature can not be verified');
        await borrower.add(...borrowerWithInvalidSignatureArgs).should.be.rejectedWith('Signature can not be verified');
      });
    });

    it('reverts on adding an borrower before Auth contract is set', async function () {
      await borrower.setBorrowerAppContractAddress(borrowerApp.address, { from: owner });
      const { borrowerAppId, v, r, s } = someBorrowerSignature;
      // borrower registration
      await borrower.add(borrowerAddress, v, r, s, { from: borrowerAppId }).should.be.rejectedWith('Auth contract is not set');
    });

    it('reverts on adding an borrower before BorrowerApp contract is set', async function () {
      // auth contract setting
      await borrower.setAuthContractAddress(auth.address, { from: owner });
      const { borrowerAppId, v, r, s } = someBorrowerSignature;
      // borrower registration
      await borrower.add(borrowerAddress, v, r, s, { from: borrowerAppId }).should.be.rejectedWith('BorrowerApp contract is not set');
    });
  });

  describe('Retrieve', async function () {
    context('when a borrower is registered', async function () {
      let auth;
      let borrowerApp;

      beforeEach(async function () {
        auth = await Auth.new(contractVersion, { from: owner });
        borrowerApp = await BorrowerApp.new(contractVersion, { from: owner });

        await borrower.setAuthContractAddress(auth.address, { from: owner });
        await borrower.setBorrowerAppContractAddress(borrowerApp.address, { from: owner });

        await auth.mockSetContainingId(borrowerAddress);

        await borrowerApp.add(someBorrowerApp.id, someBorrowerApp.name, { from: owner });

        const { borrowerAppId, v, r, s } = someBorrowerSignature;
        await borrower.add(borrowerAddress, v, r, s, { from: borrowerAppId });
      });

      it('gets registered borrower for id', async function () {
        const id = await borrower.get(borrowerAddress);
        id.should.be.equal(borrowerAddress);
      });

      it('gets registered borrower with index', async function () {
        const id = await borrower.getByIndex(0, { from: owner });
        id.should.be.equal(borrowerAddress);
      });

      it('gets how many borrowers are registered', async function () {
        (await borrower.size({ from: owner })).should.be.bignumber.equal(1);

        // otherBorrower registration
        await auth.mockSetContainingId(otherBorrowerAddress);
        await borrowerApp.add(otherBorrowerApp.id, otherBorrowerApp.name, { from: owner });
        const { borrowerAppId, v, r, s } = otherBorrowerSignature;
        await borrower.add(otherBorrowerAddress, v, r, s, { from: borrowerAppId });

        (await borrower.size({ from: owner })).should.be.bignumber.equal(2);
      });

      it('gets all registered borrower ids', async function () {
        await borrower.getIds({ from: owner }).should.eventually.have.bignumber.ordered.members([borrowerAddress]);
      });

      it('reverts on getting borrower with index by non owner', async function () {
        await borrower.getByIndex(0, { from: nonOwner }).should.be.rejectedWith('revert');
      });

      it('reverts on getting all borrower ids by non owner', async function () {
        await borrower.getIds({ from: nonOwner }).should.be.rejectedWith('revert');
      });
    });

    it('reverts on getting unregistered borrower', async function () {
      await borrower.get(borrowerAddress, { from: nonOwner }).should.be.rejectedWith('Borrower is not found');
    });

    it('reverts on getting unregistered borrower with index', async function () {
      await borrower.getByIndex(0, { from: nonOwner }).should.be.rejectedWith('revert');
      await borrower.getByIndex(0, { from: owner }).should.be.rejectedWith('Borrower index is out of range');
    });
  });
});
