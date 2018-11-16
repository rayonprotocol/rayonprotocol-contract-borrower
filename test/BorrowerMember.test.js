import eventsIn from './helpers/eventsIn';
import assertWithinTimeTolerance from './helpers/assertWithinTimeTolerance';
import { latestTime } from 'openzeppelin-solidity/test/helpers/latestTime';

const BorrowerMember = artifacts.require('./BorrowerMember.sol');
const BorrowerApp = artifacts.require('./BorrowerAppMock.sol');
const Borrower = artifacts.require('./BorrowerMock.sol');
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .use(assertWithinTimeTolerance)
  .should();

const contractVersion = 1;

contract('BorrowerMember', function (accounts) {
  const [,
    someBorrowerAppAdress, otherBorrowerAppAdress,
    borrowerAddress, otherBorrowerAddress,
    nonOwner, owner,
  ] = accounts;

  let borrowerMember;

  const someBorrowerApp = {
    id: someBorrowerAppAdress,
    name: 'BORROWERAPP1',
  };

  // this signature is signed by borrowerAddress (m/44'/60'/0'/0/3)
  const someBorrowerSignature = {
    appId: someBorrowerAppAdress,
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
    appId: otherBorrowerApp.id,
    v: 27,
    r: '0xbb10f0904349a499d81ba4afd416e6321f8a88490d1096ca5df75a91572a33f6',
    s: '0x4a93ed5f9cbfae6a103498cdcdac5451843ea62e3aee0ab5650c56a6e45a430d',
  };

  beforeEach(async function () {
    borrowerMember = await BorrowerMember.new(contractVersion, { from: owner });
  });

  describe('Join', async function () {
    let borrower;
    let borrowerApp;

    beforeEach(async function () {
      borrower = await Borrower.new(contractVersion, { from: owner });
      borrowerApp = await BorrowerApp.new(contractVersion, { from: owner });
    });

    context('when both Borrower and BorrowerApp contracts are set', async function () {
      beforeEach(async function () {
        await borrowerMember.setBorrowerContractAddress(borrower.address, { from: owner });
        await borrowerMember.setBorrowerAppContractAddress(borrowerApp.address, { from: owner });
      });

      it('joins borrower app and borrower verifying signature', async function () {
        // borrower registration mocking
        await borrower.mockSetContainingId(borrowerAddress);
        // borrower app registration mocking
        await borrowerApp.mockSetContainingId(someBorrowerAppAdress);
        const { appId, v, r, s } = someBorrowerSignature;
        await borrowerMember.join(borrowerAddress, v, r, s, { from: appId }).should.be.fulfilled;
      });

      it('emits an event on joining', async function () {
        // borrower registration mocking
        await borrower.mockSetContainingId(borrowerAddress);
        // borrower app registration mocking
        await borrowerApp.mockSetContainingId(someBorrowerAppAdress);
        const { appId, v, r, s } = someBorrowerSignature;
        const events = await eventsIn(borrowerMember.join(borrowerAddress, v, r, s, { from: appId }));

        events.should.deep.include({
          name: 'LogBorrowerMemberJoined',
          args: {
            borrowerAppId: someBorrowerAppAdress,
            borrowerId: borrowerAddress,
          },
        });
      });

      it('reverts on joining when the join of borrower app and borrower exists', async function () {
        // borrower registration mocking
        await borrower.mockSetContainingId(borrowerAddress);
        // borrower app registration mocking
        await borrowerApp.mockSetContainingId(someBorrowerAppAdress);
        const { appId, v, r, s } = someBorrowerSignature;
        // borrower registration
        await borrowerMember.join(borrowerAddress, v, r, s, { from: appId }).should.be.fulfilled;
        // try borrower registration agin
        await borrowerMember.join(borrowerAddress, v, r, s, { from: appId }).should.be.rejectedWith('Join of borrowerApp and borrower already exists');
      });

      it('reverts on joining an borrower app and an unregistered borrower', async function () {
        // borrower app registration mocking
        await borrowerApp.mockSetContainingId(someBorrowerAppAdress);

        const { appId, v, r, s } = someBorrowerSignature;
        await borrowerMember.join(borrowerAddress, v, r, s, { from: appId }).should.be.rejectedWith('Borrower is not found');
      });

      it('reverts on joining an unregistred borrower app and an borrower', async function () {
        // borrower registration mocking
        await borrower.mockSetContainingId(borrowerAddress);

        const { appId, v, r, s } = someBorrowerSignature;
        await borrowerMember.join(borrowerAddress, v, r, s, { from: appId }).should.be.rejectedWith('msg.sender is not registerd borrower app');
      });

      it('reverts on joining with invalid signature', async function () {
        // borrower registration mocking
        await borrower.mockSetContainingId(borrowerAddress);
        // borrower app registration mocking
        await borrowerApp.mockSetContainingId(someBorrowerAppAdress);
        await borrowerApp.mockSetContainingId(otherBorrowerAppAdress);

        const borrowerWithUnmatchtedBorrowerAppArgs = [
          borrowerAddress, someBorrowerSignature.v, someBorrowerSignature.r, someBorrowerSignature.s, { from: otherBorrowerApp.id },
        ];
        const borrowerWithInvalidSignatureArgs = [
          borrowerAddress, otherBorrowerSignature.v, otherBorrowerSignature.r, otherBorrowerSignature.s, { from: someBorrowerApp.id },
        ];

        await borrowerMember.join(...borrowerWithUnmatchtedBorrowerAppArgs).should.be.rejectedWith('Signature can not be verified');
        await borrowerMember.join(...borrowerWithInvalidSignatureArgs).should.be.rejectedWith('Signature can not be verified');
      });
    });

    it('reverts on joining before Borrower contract is set', async function () {
      await borrowerMember.setBorrowerAppContractAddress(borrowerApp.address, { from: owner });
      const { appId, v, r, s } = someBorrowerSignature;
      // borrower registration
      await borrowerMember.join(borrowerAddress, v, r, s, { from: appId }).should.be.rejectedWith('Borrower contract is not set');
    });

    it('reverts on joining before BorrowerApp contract is set', async function () {
      // borrower contract setting
      await borrowerMember.setBorrowerContractAddress(borrower.address, { from: owner });
      const { appId, v, r, s } = someBorrowerSignature;
      // borrower registration
      await borrowerMember.join(borrowerAddress, v, r, s, { from: appId }).should.be.rejectedWith('BorrowerApp contract is not set');
    });
  });

  describe('Retrieve', async function () {
    let currentTime;
    let borrower;
    let borrowerApp;

    beforeEach(async function () {
      borrower = await Borrower.new(contractVersion, { from: owner });
      borrowerApp = await BorrowerApp.new(contractVersion, { from: owner });
      await borrowerMember.setBorrowerContractAddress(borrower.address, { from: owner });
      await borrowerMember.setBorrowerAppContractAddress(borrowerApp.address, { from: owner });
      // borrower registration mocking
      await borrower.mockSetContainingId(borrowerAddress);
      // borrower app registration mocking
      await borrowerApp.mockSetContainingId(someBorrowerAppAdress);
      const { appId, v, r, s } = someBorrowerSignature;

      [currentTime] = await Promise.all([
        latestTime(), // current block time
        borrowerMember.join(borrowerAddress, v, r, s, { from: appId }), // borrower registration
      ]);
    });

    it('gets all members by getting count of member list and accessing with index', async function () {
      (await borrowerMember.getJoinedTotalCount({ from: owner })).should.be.bignumber.equal(1);

      // join otherBorrowerAddress
      await borrower.mockSetContainingId(otherBorrowerAddress);
      await borrowerApp.mockSetContainingId(otherBorrowerAppAdress);
      const { v, r, s } = otherBorrowerSignature;
      const [otherBorrowerJoinedTime] = await Promise.all([
        latestTime(),
        borrowerMember.join(otherBorrowerAddress, v, r, s, { from: otherBorrowerAppAdress }),
      ]);

      (await borrowerMember.getJoinedTotalCount({ from: owner })).should.be.bignumber.equal(2);

      const expectedMembers = [
        { borrower: borrowerAddress, borrowerApp: someBorrowerAppAdress, joinedTime: currentTime },
        { borrower: otherBorrowerAddress, borrowerApp: otherBorrowerAppAdress, joinedTime: otherBorrowerJoinedTime },
      ];
      const joinedMembers = await Promise.all([0, 1].map(index => borrowerMember.getBorrowerMemberByIndex(index, { from: owner })));
      joinedMembers.forEach(([borrowerAddress, borrowerApp, joinedTime], correspondingIndex) => {
        const expectedMember = expectedMembers[correspondingIndex];
        borrowerAddress.should.be.equal(expectedMember.borrower);
        borrowerApp.should.be.equal(expectedMember.borrowerApp);
        joinedTime.should.be.withinTimeTolerance(expectedMember.joinedTime);
      });
    });

    it('reverts on getting the total count of joined member', async function () {
      await borrowerMember.getJoinedTotalCount().should.be.rejectedWith('revert');
      await borrowerMember.getJoinedTotalCount({ from: nonOwner }).should.be.rejectedWith('revert');
    });

    it('gets borrower member with borrrower app id and borrower id', async function () {
      const joinedTime = await borrowerMember.getBorrowerMember(someBorrowerAppAdress, borrowerAddress);
      joinedTime.should.be.withinTimeTolerance(currentTime);
    });

    it('gets the count of borrowers joined with borrower app', async function () {
      (await borrowerMember.getJoinedBorrowerCount(someBorrowerAppAdress, { from: owner }))
        .should.be.bignumber.equal(1);
      (await borrowerMember.getJoinedBorrowerCount(otherBorrowerAppAdress, { from: owner }))
        .should.be.bignumber.equal(0);

      await borrower.mockSetContainingId(otherBorrowerAddress);
      await borrowerApp.mockSetContainingId(otherBorrowerAppAdress);
      const { v, r, s } = otherBorrowerSignature;
      await borrowerMember.join(otherBorrowerAddress, v, r, s, { from: otherBorrowerAppAdress });

      (await borrowerMember.getJoinedBorrowerCount(otherBorrowerAppAdress, { from: owner }))
        .should.be.bignumber.equal(1);
    });

    it('gets borrower id at index of joined borrower list for borrower app', async function () {
      const borrowerId = await borrowerMember.getJoinedBorrowerId(someBorrowerAppAdress, 0, { from: owner });
      borrowerId.should.be.equal(borrowerAddress);
    });

    it('gets the count of borrower apps joined with borrower', async function () {
      (await borrowerMember.getJoinedBorrowerAppCount(borrowerAddress, { from: owner }))
        .should.be.bignumber.equal(1);
      (await borrowerMember.getJoinedBorrowerAppCount(otherBorrowerAddress, { from: owner }))
        .should.be.bignumber.equal(0);

      await borrower.mockSetContainingId(otherBorrowerAddress);
      await borrowerApp.mockSetContainingId(otherBorrowerAppAdress);
      const { v, r, s } = otherBorrowerSignature;
      await borrowerMember.join(otherBorrowerAddress, v, r, s, { from: otherBorrowerAppAdress });

      (await borrowerMember.getJoinedBorrowerAppCount(otherBorrowerAddress, { from: owner }))
        .should.be.bignumber.equal(1);
    });

    it('gets borrower app id at index of joined borrower app list for borrower', async function () {
      const borrowerAppId = await borrowerMember.getJoinedBorrowerAppId(borrowerAddress, 0, { from: owner });
      borrowerAppId.should.be.equal(someBorrowerAppAdress);
    });
  });
});
