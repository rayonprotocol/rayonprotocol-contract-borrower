const BorrowerApp = artifacts.require('BorrowerApp.sol');
const Borrower = artifacts.require('Borrower.sol');
const BorrowerMember = artifacts.require('BorrowerMember.sol');

module.exports = function (deployer, network, accounts) {
  const contractVersion = 1;
  return deployer
    .then(() => deployer.deploy(BorrowerApp, contractVersion))
    .then(() => deployer.deploy(Borrower, contractVersion))
    .then(() => deployer.deploy(BorrowerMember, contractVersion))
    .catch(error => console.error({ error }));
};
