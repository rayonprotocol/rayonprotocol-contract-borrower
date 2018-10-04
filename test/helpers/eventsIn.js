/**
 * extract events(name and args) from tx receipt
 * @param {Promise} txPromise transaction promise
 */
const eventsIn = async txPromise => {
  const { logs } = await txPromise;
  return logs.map(log => ({ name: log.event, args: log.args })); // as Array<{ name: string, args: object }>
};

export default eventsIn;
