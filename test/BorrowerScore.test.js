import eventsIn from './helpers/eventsIn';
import { latestTime } from 'openzeppelin-solidity/test/helpers/latestTime';
const BorrowerScore = artifacts.require('./BorrowerScore.sol');
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

const contractVersion = 1;

contract('BorrowerScore', function (accounts) {
  const [,
    someBorrowerAppAdress, otherBorrowerAppAdress,
    borrowerAddress, otherBorrowerAddress,
    nonOwner, owner,
  ] = accounts;

  let borrowerScore;

  const thirtyDayInSeconds = (30 * 60 * 60 * 24);

  beforeEach(async function () {
    borrowerScore = await BorrowerScore.new(contractVersion, { from: owner });
  });

  describe('Add', async function () {
    it('adds score', async function () {
      await borrowerScore.add(someBorrowerAppAdress, borrowerAddress, 200, { from: owner }).should.be.fulfilled;;
      await borrowerScore.add(otherBorrowerAppAdress, otherBorrowerAddress, 100, { from: owner }).should.be.fulfilled;;
      await borrowerScore.add(someBorrowerAppAdress, otherBorrowerAddress, 17, { from: owner }).should.be.fulfilled;;
      await borrowerScore.add(otherBorrowerAppAdress, borrowerAddress, 11, { from: owner }).should.be.fulfilled;;
    });

    it('emits an event on adding score', async function () {
      const score = new BigNumber(29);
      const blockTimestamp = await latestTime();
      const period = new BigNumber(Math.floor(blockTimestamp / thirtyDayInSeconds));
      const events = await eventsIn(
        borrowerScore.add(someBorrowerAppAdress, borrowerAddress, score, { from: owner }),
      );

      events.should.deep.include({
        name: 'LogBorrowerScoreAdded',
        args: {
          borrowerAppId: someBorrowerAppAdress,
          borrowerId: borrowerAddress,
          score,
          period,
        },
      });
    });

    it('reverts on adding score by non owner', async function () {
      await borrowerScore.add(someBorrowerAppAdress, borrowerAddress, 300, { from: nonOwner }).should.be.rejectedWith(/revert/);
    });
  });

  describe('Retrieve', async function () {
    let score, period, blockTimestamp;

    context('when score is added', async function () {
      beforeEach(async function () {
        score = new BigNumber(29);
        blockTimestamp = await latestTime();
        period = new BigNumber(Math.floor(blockTimestamp / (30 * 60 * 60 * 24)));
        await borrowerScore.add(someBorrowerAppAdress, borrowerAddress, score, { from: owner });
      });

      it('gets correct score of periods', async function () {
        (await borrowerScore.get(someBorrowerAppAdress, borrowerAddress, blockTimestamp)).should.be.bignumber.equal(score);

        const prevPeriodTimestamp = blockTimestamp - thirtyDayInSeconds;
        (await borrowerScore.get(someBorrowerAppAdress, borrowerAddress, prevPeriodTimestamp)).should.be.bignumber.equal(0);

        const nextPeriodTimestamp = blockTimestamp + thirtyDayInSeconds;
        (await borrowerScore.get(someBorrowerAppAdress, borrowerAddress, nextPeriodTimestamp)).should.be.bignumber.equal(0);

        await borrowerScore.add(someBorrowerAppAdress, borrowerAddress, score, { from: owner });
        (await borrowerScore.get(someBorrowerAppAdress, borrowerAddress, blockTimestamp)).should.be.bignumber.equal(score.mul(2));
      });
    });
  });
});
